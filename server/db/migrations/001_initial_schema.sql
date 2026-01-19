-- Lessons - top-level topic containers
CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_published INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Concepts - sub-topics within lessons
CREATE TABLE IF NOT EXISTS concepts (
  id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  explanation TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Challenges - practice problems
CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY,
  concept_id TEXT NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('implement', 'explain', 'compare', 'multiple_choice')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  starter_code TEXT,
  solution_code TEXT,
  hints TEXT, -- JSON array of hint strings
  difficulty TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Test cases for challenges
CREATE TABLE IF NOT EXISTS test_cases (
  id TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  input TEXT NOT NULL, -- JSON serialized
  expected_output TEXT NOT NULL, -- JSON serialized
  description TEXT,
  is_hidden INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- User progress with SM-2 spaced repetition
CREATE TABLE IF NOT EXISTS user_progress (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  repetitions INTEGER NOT NULL DEFAULT 0,
  ease_factor REAL NOT NULL DEFAULT 2.5,
  interval INTEGER NOT NULL DEFAULT 0,
  next_review_date TEXT,
  last_review_date TEXT,
  last_quality INTEGER,
  mastery_level TEXT NOT NULL DEFAULT 'learning' CHECK (mastery_level IN ('learning', 'reviewing', 'mastered')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, challenge_id)
);

-- Submissions - audit trail
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  passed INTEGER NOT NULL,
  test_results TEXT, -- JSON array
  execution_time_ms INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_concepts_lesson ON concepts(lesson_id);
CREATE INDEX IF NOT EXISTS idx_challenges_concept ON challenges(concept_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_challenge ON test_cases(challenge_id);
CREATE INDEX IF NOT EXISTS idx_progress_session ON user_progress(session_id);
CREATE INDEX IF NOT EXISTS idx_progress_challenge ON user_progress(challenge_id);
CREATE INDEX IF NOT EXISTS idx_submissions_session ON submissions(session_id);
CREATE INDEX IF NOT EXISTS idx_submissions_challenge ON submissions(challenge_id);
