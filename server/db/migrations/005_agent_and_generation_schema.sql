-- Migration 005: Agent and generation schema
-- Adds AI content generation job tracking and agent conversation storage

-- Generation jobs: AI content generation job tracking
CREATE TABLE IF NOT EXISTS generation_jobs (
    id TEXT PRIMARY KEY,
    week_id TEXT NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
    created_by TEXT REFERENCES user(id) ON DELETE SET NULL,
    job_type TEXT NOT NULL CHECK (job_type IN ('vocabulary', 'quiz', 'challenge')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    prompt TEXT,
    result TEXT,
    model_name TEXT,
    input_token_count INTEGER,
    output_token_count INTEGER,
    error_message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_generation_jobs_week ON generation_jobs(week_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_type ON generation_jobs(job_type);

-- Agent conversations: chat sessions with the AI study agent
CREATE TABLE IF NOT EXISTS agent_conversations (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    week_id TEXT REFERENCES weeks(id) ON DELETE SET NULL,
    title TEXT,
    model_name TEXT,
    system_prompt TEXT,
    message_count INTEGER NOT NULL DEFAULT 0,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_agent_conversations_session ON agent_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_week ON agent_conversations(week_id);

-- Agent messages: individual messages in agent conversations
CREATE TABLE IF NOT EXISTS agent_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES agent_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
    content TEXT,
    tool_calls TEXT,
    tool_call_id TEXT,
    token_count INTEGER,
    retrieved_chunks TEXT,
    latency_ms INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_agent_messages_conversation ON agent_messages(conversation_id);
