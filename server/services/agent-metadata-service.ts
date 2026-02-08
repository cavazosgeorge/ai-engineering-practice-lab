import { nanoid } from "nanoid";
import {
  db,
  type AgentConversationRow,
  type AgentMessageRow,
} from "../db";

export interface CreateConversationInput {
  sessionId: string;
  weekId?: string;
  title?: string;
}

export interface CreateMessageInput {
  conversationId: string;
  role: "user" | "assistant" | "system" | "tool";
  content?: string;
  toolCalls?: string;
  toolCallId?: string;
  tokenCount?: number;
  retrievedChunks?: string;
  latencyMs?: number;
}

// ============================================
// Conversations
// ============================================

export function createConversation(
  input: CreateConversationInput
): AgentConversationRow {
  const id = nanoid();
  const now = new Date().toISOString();

  db.run(
    `INSERT INTO agent_conversations (id, session_id, week_id, title, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, input.sessionId, input.weekId ?? null, input.title ?? null, now, now]
  );

  return db
    .query<AgentConversationRow, [string]>(
      `SELECT * FROM agent_conversations WHERE id = ?`
    )
    .get(id)!;
}

export function getConversation(id: string): AgentConversationRow | null {
  return (
    db
      .query<AgentConversationRow, [string]>(
        `SELECT * FROM agent_conversations WHERE id = ?`
      )
      .get(id) ?? null
  );
}

export function getConversationsBySession(
  sessionId: string
): AgentConversationRow[] {
  return db
    .query<AgentConversationRow, [string]>(
      `SELECT * FROM agent_conversations
       WHERE session_id = ? AND is_archived = 0
       ORDER BY updated_at DESC`
    )
    .all(sessionId);
}

export function updateConversationTitle(
  id: string,
  title: string
): void {
  const now = new Date().toISOString();
  db.run(
    `UPDATE agent_conversations SET title = ?, updated_at = ? WHERE id = ?`,
    [title, now, id]
  );
}

export function deleteConversation(id: string): boolean {
  const result = db.run(
    `DELETE FROM agent_conversations WHERE id = ?`,
    [id]
  );
  return result.changes > 0;
}

// ============================================
// Messages
// ============================================

export function createMessage(input: CreateMessageInput): AgentMessageRow {
  const id = nanoid();
  const now = new Date().toISOString();

  db.run(
    `INSERT INTO agent_messages (id, conversation_id, role, content, tool_calls, tool_call_id, token_count, retrieved_chunks, latency_ms, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.conversationId,
      input.role,
      input.content ?? null,
      input.toolCalls ?? null,
      input.toolCallId ?? null,
      input.tokenCount ?? null,
      input.retrievedChunks ?? null,
      input.latencyMs ?? null,
      now,
    ]
  );

  // Update conversation message count and updated_at
  db.run(
    `UPDATE agent_conversations
     SET message_count = message_count + 1, updated_at = ?
     WHERE id = ?`,
    [now, input.conversationId]
  );

  return db
    .query<AgentMessageRow, [string]>(
      `SELECT * FROM agent_messages WHERE id = ?`
    )
    .get(id)!;
}

export function getMessagesByConversation(
  conversationId: string
): AgentMessageRow[] {
  return db
    .query<AgentMessageRow, [string]>(
      `SELECT * FROM agent_messages
       WHERE conversation_id = ?
       ORDER BY created_at ASC`
    )
    .all(conversationId);
}
