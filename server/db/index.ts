import { Database } from "bun:sqlite";
import { readdirSync, readFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";

const dbPath = process.env.DB_PATH || "./data/app.db";

// Ensure data directory exists
mkdirSync(dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

// Migration runner
export function runMigrations() {
  // Create migrations tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const migrationsDir = join(dirname(import.meta.path), "migrations");

  if (!existsSync(migrationsDir)) {
    console.log("No migrations directory found");
    return;
  }

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const applied = db
    .query<{ name: string }, []>("SELECT name FROM _migrations")
    .all()
    .map((r) => r.name);

  for (const file of files) {
    if (applied.includes(file)) {
      continue;
    }

    console.log(`Running migration: ${file}`);
    const sql = readFileSync(join(migrationsDir, file), "utf-8");

    db.transaction(() => {
      db.exec(sql);
      db.run("INSERT INTO _migrations (name) VALUES (?)", [file]);
    })();

    console.log(`Applied: ${file}`);
  }
}

// Type definitions for query results
export interface LessonRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  order_index: number;
  is_published: number;
  week_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConceptRow {
  id: string;
  lesson_id: string;
  title: string;
  explanation: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface ChallengeRow {
  id: string;
  concept_id: string;
  type: "implement" | "explain" | "compare" | "multiple_choice";
  title: string;
  description: string;
  starter_code: string | null;
  solution_code: string | null;
  hints: string | null;
  difficulty: "beginner" | "intermediate" | "advanced";
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface TestCaseRow {
  id: string;
  challenge_id: string;
  input: string;
  expected_output: string;
  description: string | null;
  is_hidden: number;
  order_index: number;
  created_at: string;
}

export interface UserProgressRow {
  id: string;
  session_id: string;
  challenge_id: string;
  repetitions: number;
  ease_factor: number;
  interval: number;
  next_review_date: string | null;
  last_review_date: string | null;
  last_quality: number | null;
  mastery_level: "learning" | "reviewing" | "mastered";
  created_at: string;
  updated_at: string;
}

export interface SubmissionRow {
  id: string;
  session_id: string;
  challenge_id: string;
  code: string;
  passed: number;
  test_results: string | null;
  execution_time_ms: number | null;
  created_at: string;
}

export interface VocabularyTermRow {
  id: string;
  lesson_id: string;
  concept_id: string | null;
  term: string;
  definition: string;
  context: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  order_index: number;
  created_at: string;
}

export interface VocabularyProgressRow {
  id: string;
  session_id: string;
  term_id: string;
  learning_mode: 'flashcard' | 'quiz';
  repetitions: number;
  ease_factor: number;
  interval: number;
  next_review_date: string | null;
  last_review_date: string | null;
  mastery_level: 'learning' | 'reviewing' | 'mastered';
  created_at: string;
  updated_at: string;
}

export interface VocabularySubmissionRow {
  id: string;
  session_id: string;
  term_id: string;
  submission_type: 'flashcard_review' | 'quiz_answer';
  quality: number | null;
  is_correct: number | null;
  time_spent_ms: number | null;
  created_at: string;
}

// Capstone: Week-based organization
export interface WeekRow {
  id: string;
  week_number: number;
  slug: string;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_published: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// Capstone: Data source records for RAG pipeline
export interface DataSourceRow {
  id: string;
  week_id: string;
  source_type: 'pdf' | 'url' | 'text';
  title: string;
  url: string | null;
  file_path: string | null;
  raw_content: string | null;
  content_hash: string | null;
  status: 'pending' | 'processing' | 'processed' | 'error';
  error_message: string | null;
  chunk_count: number;
  metadata: string;
  created_at: string;
  updated_at: string;
}

// Capstone: Text chunks from processed data sources
export interface ChunkRow {
  id: string;
  data_source_id: string;
  chunk_index: number;
  content: string;
  token_count: number;
  metadata: string;
  created_at: string;
}

// Capstone: AI content generation jobs
export interface GenerationJobRow {
  id: string;
  week_id: string;
  created_by: string | null;
  job_type: 'vocabulary' | 'quiz' | 'challenge';
  status: 'pending' | 'running' | 'completed' | 'failed';
  prompt: string | null;
  result: string | null;
  model_name: string | null;
  input_token_count: number | null;
  output_token_count: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// Capstone: Agent chat sessions
export interface AgentConversationRow {
  id: string;
  session_id: string;
  week_id: string | null;
  title: string | null;
  model_name: string | null;
  system_prompt: string | null;
  message_count: number;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

// Capstone: Individual messages in agent conversations
export interface AgentMessageRow {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | null;
  tool_calls: string | null;
  tool_call_id: string | null;
  token_count: number | null;
  retrieved_chunks: string | null;
  latency_ms: number | null;
  created_at: string;
}
