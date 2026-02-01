-- Migration 004: Weeks and RAG schema
-- Adds week-based course organization and data source tracking for RAG pipeline

-- Weeks: top-level course week containers
CREATE TABLE IF NOT EXISTS weeks (
    id TEXT PRIMARY KEY,
    week_number INTEGER NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    start_date TEXT,
    end_date TEXT,
    is_published INTEGER NOT NULL DEFAULT 0,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Link lessons to weeks (nullable - existing lessons keep working without a week)
ALTER TABLE lessons ADD COLUMN week_id TEXT REFERENCES weeks(id) ON DELETE SET NULL;

-- Data sources: course material records (PDF/URL/text) per week
CREATE TABLE IF NOT EXISTS data_sources (
    id TEXT PRIMARY KEY,
    week_id TEXT NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN ('pdf', 'url', 'text')),
    title TEXT NOT NULL,
    url TEXT,
    file_path TEXT,
    raw_content TEXT,
    content_hash TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'error')),
    error_message TEXT,
    chunk_count INTEGER NOT NULL DEFAULT 0,
    metadata TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_data_sources_week ON data_sources(week_id);
CREATE INDEX IF NOT EXISTS idx_data_sources_status ON data_sources(status);
CREATE INDEX IF NOT EXISTS idx_data_sources_content_hash ON data_sources(content_hash);

-- Chunks: text segments from processed data sources (stored for display/reference)
CREATE TABLE IF NOT EXISTS chunks (
    id TEXT PRIMARY KEY,
    data_source_id TEXT NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    token_count INTEGER NOT NULL DEFAULT 0,
    metadata TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_chunks_source_index ON chunks(data_source_id, chunk_index);
CREATE INDEX IF NOT EXISTS idx_chunks_data_source ON chunks(data_source_id);
