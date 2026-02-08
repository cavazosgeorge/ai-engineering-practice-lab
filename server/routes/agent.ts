import { Hono } from "hono";
import { stream } from "hono/streaming";
import { db } from "../db";
import {
  createConversation,
  getConversation,
  getConversationsBySession,
  getMessagesByConversation,
  createMessage,
  updateConversationTitle,
  deleteConversation,
} from "../services/agent-metadata-service";
import {
  forwardSSERequest,
  PythonServiceError,
} from "../services/python-service-client";

const app = new Hono();

// Session ID is passed as a header or query param (existing auth pattern)
function getSessionId(c: any): string {
  return (
    c.req.header("x-session-id") ||
    c.req.query("sessionId") ||
    "anonymous"
  );
}

/**
 * POST /api/agent/conversations
 * Create a new conversation
 */
app.post("/conversations", async (c) => {
  const sessionId = getSessionId(c);
  const body = await c.req.json<{
    weekId?: string;
    title?: string;
  }>();

  const conversation = createConversation({
    sessionId,
    weekId: body.weekId,
    title: body.title,
  });

  return c.json(formatConversation(conversation));
});

/**
 * GET /api/agent/conversations
 * List conversations for the current session
 */
app.get("/conversations", (c) => {
  const sessionId = getSessionId(c);
  const conversations = getConversationsBySession(sessionId);
  return c.json(conversations.map(formatConversation));
});

/**
 * GET /api/agent/conversations/:id
 * Get a conversation with its messages
 */
app.get("/conversations/:id", (c) => {
  const id = c.req.param("id");
  const conversation = getConversation(id);

  if (!conversation) {
    return c.json({ error: "Conversation not found" }, 404);
  }

  const messages = getMessagesByConversation(id);

  return c.json({
    ...formatConversation(conversation),
    messages: messages.map(formatMessage),
  });
});

/**
 * DELETE /api/agent/conversations/:id
 * Delete a conversation
 */
app.delete("/conversations/:id", (c) => {
  const id = c.req.param("id");
  const deleted = deleteConversation(id);
  if (!deleted) {
    return c.json({ error: "Conversation not found" }, 404);
  }
  return c.json({ deleted: true });
});

/**
 * POST /api/agent/conversations/:id/messages
 * Send a message and stream the agent response via SSE
 */
app.post("/conversations/:id/messages", async (c) => {
  const conversationId = c.req.param("id");
  const sessionId = getSessionId(c);

  const conversation = getConversation(conversationId);
  if (!conversation) {
    return c.json({ error: "Conversation not found" }, 404);
  }

  const body = await c.req.json<{
    message: string;
    weekSlug?: string;
  }>();

  const message = body.message?.trim();
  if (!message || message.length > 5000) {
    return c.json(
      { error: "Message must be between 1 and 5000 characters" },
      400
    );
  }

  // Save user message
  const startTime = Date.now();
  createMessage({
    conversationId,
    role: "user",
    content: message,
  });

  // Build history from saved messages
  // NOTE: tool_calls field is not included here. The Python service's _build_messages()
  // would need to reconstruct LangChain AIMessage with tool_calls for full fidelity.
  // For now, the assistant's text content already references tool results, which is
  // sufficient for multi-turn context.
  const messages = getMessagesByConversation(conversationId);
  const history = messages
    .filter((m) => m.role !== "system")
    .slice(-20)
    .map((m) => ({
      role: m.role,
      content: m.content || "",
      tool_call_id: m.tool_call_id || undefined,
    }));

  // Auto-title on first message
  if (conversation.message_count <= 1 && !conversation.title) {
    const title = message.length > 50 ? message.slice(0, 47) + "..." : message;
    updateConversationTitle(conversationId, title);
  }

  // Determine week slug — use request body, or fall back to conversation's week
  let weekSlug = body.weekSlug || null;
  if (!weekSlug && conversation.week_id) {
    const weekRow = db
      .query<{ slug: string }, [string]>(`SELECT slug FROM weeks WHERE id = ?`)
      .get(conversation.week_id);
    if (weekRow) weekSlug = weekRow.slug;
  }

  try {
    // Forward to Python agent service
    const { response: pythonResponse, cleanup } = await forwardSSERequest("/agent/chat", {
      message,
      conversation_id: conversationId,
      week_slug: weekSlug,
      session_id: sessionId,
      history: history.slice(0, -1), // Exclude the current message (it's in 'message')
    });

    // Stream SSE response back to the browser
    return stream(c, async (streamWriter) => {
      const reader = pythonResponse.body?.getReader();
      if (!reader) {
        cleanup();
        await streamWriter.write(
          `data: ${JSON.stringify({ type: "error", message: "No response stream" })}\n\n`
        );
        return;
      }

      const decoder = new TextDecoder();
      let fullContent = "";
      let toolCalls: string | null = null;
      let inputTokens: number | null = null;
      let outputTokens: number | null = null;
      let sseBuffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });

          // Forward raw SSE chunk to browser
          await streamWriter.write(chunk);

          // Buffer-based parsing for metadata collection
          sseBuffer += chunk;
          const sseEvents = sseBuffer.split("\n\n");
          sseBuffer = sseEvents.pop() || "";

          for (const eventBlock of sseEvents) {
            const lines = eventBlock.split("\n");
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === "content" && data.token) {
                  fullContent += data.token;
                } else if (data.type === "done") {
                  toolCalls = data.tool_calls
                    ? JSON.stringify(data.tool_calls)
                    : null;
                  inputTokens = data.input_tokens ?? null;
                  outputTokens = data.output_tokens ?? null;
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }
      } finally {
        cleanup();
        reader.releaseLock();
      }

      // Save assistant message to SQLite
      const latencyMs = Date.now() - startTime;
      if (fullContent) {
        createMessage({
          conversationId,
          role: "assistant",
          content: fullContent,
          toolCalls,
          tokenCount: (inputTokens ?? 0) + (outputTokens ?? 0) || undefined,
          latencyMs,
        });
      }
    });
  } catch (error) {
    const message =
      error instanceof PythonServiceError
        ? error.message
        : error instanceof Error
        ? error.message
        : "Agent chat failed";

    const statusCode =
      error instanceof PythonServiceError ? error.statusCode : 500;

    return c.json({ error: message }, statusCode as 500);
  }
});

// ============================================
// Helpers
// ============================================

function formatConversation(conv: {
  id: string;
  session_id: string;
  week_id: string | null;
  title: string | null;
  model_name: string | null;
  message_count: number;
  is_archived: number;
  created_at: string;
  updated_at: string;
}) {
  return {
    id: conv.id,
    sessionId: conv.session_id,
    weekId: conv.week_id,
    title: conv.title,
    modelName: conv.model_name,
    messageCount: conv.message_count,
    isArchived: !!conv.is_archived,
    createdAt: conv.created_at,
    updatedAt: conv.updated_at,
  };
}

function formatMessage(msg: {
  id: string;
  conversation_id: string;
  role: string;
  content: string | null;
  tool_calls: string | null;
  tool_call_id: string | null;
  token_count: number | null;
  retrieved_chunks: string | null;
  latency_ms: number | null;
  created_at: string;
}) {
  return {
    id: msg.id,
    conversationId: msg.conversation_id,
    role: msg.role,
    content: msg.content,
    toolCalls: msg.tool_calls
      ? JSON.parse(msg.tool_calls).map((tc: Record<string, unknown>) => ({
          toolName: tc.tool_name ?? tc.toolName ?? "",
          arguments: tc.arguments ?? {},
          result: tc.result ?? null,
        }))
      : null,
    toolCallId: msg.tool_call_id,
    tokenCount: msg.token_count,
    retrievedChunks: msg.retrieved_chunks
      ? JSON.parse(msg.retrieved_chunks)
      : null,
    latencyMs: msg.latency_ms,
    createdAt: msg.created_at,
  };
}

export default app;
