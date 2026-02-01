const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// ============================================================================
// Types
// ============================================================================

export interface AgentConversation {
  id: string;
  sessionId: string;
  weekId: string | null;
  title: string | null;
  modelName: string | null;
  messageCount: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ToolCallInfo {
  toolName: string;
  arguments: Record<string, unknown>;
  result: string | null;
}

export interface AgentMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string | null;
  toolCalls: ToolCallInfo[] | null;
  toolCallId: string | null;
  tokenCount: number | null;
  retrievedChunks: unknown[] | null;
  latencyMs: number | null;
  createdAt: string;
}

export interface ConversationWithMessages extends AgentConversation {
  messages: AgentMessage[];
}

export interface SSEEvent {
  type: "tool_call" | "tool_result" | "content" | "done" | "error";
  token?: string;
  tool_name?: string;
  arguments?: Record<string, unknown>;
  result?: string;
  message?: string;
  model?: string;
  tool_calls?: ToolCallInfo[];
  input_tokens?: number;
  output_tokens?: number;
}

// ============================================================================
// API Functions
// ============================================================================

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function createConversation(input: {
  weekId?: string;
  title?: string;
}): Promise<AgentConversation> {
  const res = await fetch(`${API_URL}/api/agent/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  return handleResponse<AgentConversation>(res);
}

export async function fetchConversations(): Promise<AgentConversation[]> {
  const res = await fetch(`${API_URL}/api/agent/conversations`, {
    credentials: "include",
  });
  return handleResponse<AgentConversation[]>(res);
}

export async function fetchConversation(
  id: string,
): Promise<ConversationWithMessages> {
  const res = await fetch(`${API_URL}/api/agent/conversations/${id}`, {
    credentials: "include",
  });
  return handleResponse<ConversationWithMessages>(res);
}

export async function deleteConversation(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/agent/conversations/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Delete failed" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }
}

/**
 * Send a message and receive SSE stream.
 * Returns a ReadableStream that yields parsed SSE events.
 */
export async function sendMessage(
  conversationId: string,
  message: string,
  weekSlug?: string,
): Promise<ReadableStream<SSEEvent>> {
  const res = await fetch(
    `${API_URL}/api/agent/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ message, weekSlug }),
    },
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Send failed" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  if (!res.body) {
    throw new Error("No response body");
  }

  // Transform raw SSE text stream into parsed SSEEvent objects
  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream<SSEEvent>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }

      const text = decoder.decode(value, { stream: true });
      const lines = text.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const event = JSON.parse(line.slice(6)) as SSEEvent;
          controller.enqueue(event);
        } catch {
          // Skip malformed JSON
        }
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}
