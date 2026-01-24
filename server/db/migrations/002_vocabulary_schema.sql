-- Core vocabulary terms
CREATE TABLE IF NOT EXISTS vocabulary_terms (
  id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  concept_id TEXT REFERENCES concepts(id) ON DELETE SET NULL,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  context TEXT,
  difficulty TEXT NOT NULL DEFAULT 'beginner'
    CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(lesson_id, term)
);

-- SM-2 progress tracking (per learning mode)
CREATE TABLE IF NOT EXISTS vocabulary_progress (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  term_id TEXT NOT NULL REFERENCES vocabulary_terms(id) ON DELETE CASCADE,
  learning_mode TEXT NOT NULL DEFAULT 'flashcard'
    CHECK (learning_mode IN ('flashcard', 'quiz')),
  repetitions INTEGER NOT NULL DEFAULT 0,
  ease_factor REAL NOT NULL DEFAULT 2.5,
  interval INTEGER NOT NULL DEFAULT 0,
  next_review_date TEXT,
  last_review_date TEXT,
  mastery_level TEXT NOT NULL DEFAULT 'learning'
    CHECK (mastery_level IN ('learning', 'reviewing', 'mastered')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, term_id, learning_mode)
);

-- Submission audit trail
CREATE TABLE IF NOT EXISTS vocabulary_submissions (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  term_id TEXT NOT NULL REFERENCES vocabulary_terms(id) ON DELETE CASCADE,
  submission_type TEXT NOT NULL
    CHECK (submission_type IN ('flashcard_review', 'quiz_answer')),
  quality INTEGER,
  is_correct INTEGER,
  time_spent_ms INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vocab_terms_lesson ON vocabulary_terms(lesson_id);
CREATE INDEX IF NOT EXISTS idx_vocab_progress_session ON vocabulary_progress(session_id);
CREATE INDEX IF NOT EXISTS idx_vocab_progress_next_review ON vocabulary_progress(next_review_date);
