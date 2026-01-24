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
