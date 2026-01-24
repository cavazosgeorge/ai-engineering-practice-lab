import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import {
  setupTestDb,
  teardownTestDb,
  getTestDb,
} from "../../fixtures/test-db";
import { MOCK_LESSON } from "../../fixtures/mock-data";

describe("Database Migrations", () => {
  beforeEach(() => {
    setupTestDb();
  });

  afterEach(() => {
    teardownTestDb();
  });

  describe("Schema Creation", () => {
    it("should create all required core tables", () => {
      const db = getTestDb();
      const tables = db
        .query(
          `SELECT name FROM sqlite_master
           WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_migrations'
           ORDER BY name`
        )
        .all() as { name: string }[];

      const tableNames = tables.map((t) => t.name);

      // Core tables from 001_initial_schema.sql
      expect(tableNames).toContain("lessons");
      expect(tableNames).toContain("concepts");
      expect(tableNames).toContain("challenges");
      expect(tableNames).toContain("test_cases");
      expect(tableNames).toContain("user_progress");
      expect(tableNames).toContain("submissions");
    });

    it("should create all required vocabulary tables", () => {
      const db = getTestDb();
      const tables = db
        .query(
          `SELECT name FROM sqlite_master
           WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_migrations'
           ORDER BY name`
        )
        .all() as { name: string }[];

      const tableNames = tables.map((t) => t.name);

      // Vocabulary tables from 002_vocabulary_schema.sql
      expect(tableNames).toContain("vocabulary_terms");
      expect(tableNames).toContain("vocabulary_progress");
      expect(tableNames).toContain("vocabulary_submissions");
    });

    it("should create lessons table with correct columns", () => {
      const db = getTestDb();
      const columns = db.query("PRAGMA table_info(lessons)").all() as {
        name: string;
        type: string;
        notnull: number;
        pk: number;
      }[];

      const columnNames = columns.map((c) => c.name);

      expect(columnNames).toContain("id");
      expect(columnNames).toContain("title");
      expect(columnNames).toContain("slug");
      expect(columnNames).toContain("description");
      expect(columnNames).toContain("order_index");
      expect(columnNames).toContain("is_published");
      expect(columnNames).toContain("created_at");
      expect(columnNames).toContain("updated_at");

      // Verify primary key
      const idCol = columns.find((c) => c.name === "id");
      expect(idCol?.pk).toBe(1);
    });

    it("should create concepts table with correct columns", () => {
      const db = getTestDb();
      const columns = db.query("PRAGMA table_info(concepts)").all() as {
        name: string;
      }[];

      const columnNames = columns.map((c) => c.name);

      expect(columnNames).toContain("id");
      expect(columnNames).toContain("lesson_id");
      expect(columnNames).toContain("title");
      expect(columnNames).toContain("explanation");
      expect(columnNames).toContain("order_index");
    });

    it("should create challenges table with correct columns", () => {
      const db = getTestDb();
      const columns = db.query("PRAGMA table_info(challenges)").all() as {
        name: string;
      }[];

      const columnNames = columns.map((c) => c.name);

      expect(columnNames).toContain("id");
      expect(columnNames).toContain("concept_id");
      expect(columnNames).toContain("type");
      expect(columnNames).toContain("title");
      expect(columnNames).toContain("description");
      expect(columnNames).toContain("starter_code");
      expect(columnNames).toContain("solution_code");
      expect(columnNames).toContain("hints");
      expect(columnNames).toContain("difficulty");
    });

    it("should create test_cases table with correct columns", () => {
      const db = getTestDb();
      const columns = db.query("PRAGMA table_info(test_cases)").all() as {
        name: string;
      }[];

      const columnNames = columns.map((c) => c.name);

      expect(columnNames).toContain("id");
      expect(columnNames).toContain("challenge_id");
      expect(columnNames).toContain("input");
      expect(columnNames).toContain("expected_output");
      expect(columnNames).toContain("description");
      expect(columnNames).toContain("is_hidden");
    });

    it("should create user_progress table with correct columns", () => {
      const db = getTestDb();
      const columns = db.query("PRAGMA table_info(user_progress)").all() as {
        name: string;
      }[];

      const columnNames = columns.map((c) => c.name);

      expect(columnNames).toContain("id");
      expect(columnNames).toContain("session_id");
      expect(columnNames).toContain("challenge_id");
      expect(columnNames).toContain("repetitions");
      expect(columnNames).toContain("ease_factor");
      expect(columnNames).toContain("interval");
      expect(columnNames).toContain("next_review_date");
      expect(columnNames).toContain("mastery_level");
    });

    it("should create vocabulary_terms table with correct columns", () => {
      const db = getTestDb();
      const columns = db.query("PRAGMA table_info(vocabulary_terms)").all() as {
        name: string;
      }[];

      const columnNames = columns.map((c) => c.name);

      expect(columnNames).toContain("id");
      expect(columnNames).toContain("lesson_id");
      expect(columnNames).toContain("concept_id");
      expect(columnNames).toContain("term");
      expect(columnNames).toContain("definition");
      expect(columnNames).toContain("context");
      expect(columnNames).toContain("difficulty");
    });

    it("should create vocabulary_progress table with correct columns", () => {
      const db = getTestDb();
      const columns = db
        .query("PRAGMA table_info(vocabulary_progress)")
        .all() as {
        name: string;
      }[];

      const columnNames = columns.map((c) => c.name);

      expect(columnNames).toContain("id");
      expect(columnNames).toContain("session_id");
      expect(columnNames).toContain("term_id");
      expect(columnNames).toContain("learning_mode");
      expect(columnNames).toContain("repetitions");
      expect(columnNames).toContain("ease_factor");
      expect(columnNames).toContain("mastery_level");
    });
  });

  describe("Unique Constraints", () => {
    it("should enforce UNIQUE constraint on lessons.slug", () => {
      const db = getTestDb();

      // Insert first lesson
      db.run(
        `INSERT INTO lessons (id, title, slug, description, order_index, is_published)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          MOCK_LESSON.id,
          MOCK_LESSON.title,
          MOCK_LESSON.slug,
          MOCK_LESSON.description,
          MOCK_LESSON.order_index,
          MOCK_LESSON.is_published,
        ]
      );

      // Attempt to insert with duplicate slug should throw
      expect(() => {
        db.run(
          `INSERT INTO lessons (id, title, slug, description, order_index, is_published)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            "different-id",
            "Different Title",
            MOCK_LESSON.slug, // Same slug
            "Different description",
            2,
            1,
          ]
        );
      }).toThrow();
    });

    it("should enforce UNIQUE(session_id, challenge_id) on user_progress", () => {
      const db = getTestDb();

      // First, create the necessary parent records
      db.run(
        `INSERT INTO lessons (id, title, slug, order_index, is_published) VALUES (?, ?, ?, ?, ?)`,
        ["lesson-1", "Test Lesson", "test-lesson", 1, 1]
      );
      db.run(
        `INSERT INTO concepts (id, lesson_id, title, order_index) VALUES (?, ?, ?, ?)`,
        ["concept-1", "lesson-1", "Test Concept", 1]
      );
      db.run(
        `INSERT INTO challenges (id, concept_id, type, title, description, difficulty, order_index)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          "challenge-1",
          "concept-1",
          "implement",
          "Test Challenge",
          "Description",
          "beginner",
          1,
        ]
      );

      // Insert first progress record
      db.run(
        `INSERT INTO user_progress (id, session_id, challenge_id, repetitions, ease_factor, interval, mastery_level)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ["progress-1", "session-abc", "challenge-1", 0, 2.5, 0, "learning"]
      );

      // Attempt to insert duplicate (same session_id + challenge_id) should throw
      expect(() => {
        db.run(
          `INSERT INTO user_progress (id, session_id, challenge_id, repetitions, ease_factor, interval, mastery_level)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ["progress-2", "session-abc", "challenge-1", 1, 2.6, 1, "reviewing"]
        );
      }).toThrow();
    });

    it("should enforce UNIQUE(session_id, term_id, learning_mode) on vocabulary_progress", () => {
      const db = getTestDb();

      // Create parent records
      db.run(
        `INSERT INTO lessons (id, title, slug, order_index, is_published) VALUES (?, ?, ?, ?, ?)`,
        ["lesson-1", "Test Lesson", "test-lesson", 1, 1]
      );
      db.run(
        `INSERT INTO vocabulary_terms (id, lesson_id, term, definition, difficulty, order_index)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ["term-1", "lesson-1", "Token", "A unit of text", "beginner", 1]
      );

      // Insert first progress record
      db.run(
        `INSERT INTO vocabulary_progress (id, session_id, term_id, learning_mode, repetitions, ease_factor, interval, mastery_level)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "vprogress-1",
          "session-abc",
          "term-1",
          "flashcard",
          0,
          2.5,
          0,
          "learning",
        ]
      );

      // Attempt to insert duplicate (same session_id + term_id + learning_mode) should throw
      expect(() => {
        db.run(
          `INSERT INTO vocabulary_progress (id, session_id, term_id, learning_mode, repetitions, ease_factor, interval, mastery_level)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            "vprogress-2",
            "session-abc",
            "term-1",
            "flashcard",
            1,
            2.6,
            1,
            "reviewing",
          ]
        );
      }).toThrow();
    });

    it("should allow same session_id + term_id with different learning_mode", () => {
      const db = getTestDb();

      // Create parent records
      db.run(
        `INSERT INTO lessons (id, title, slug, order_index, is_published) VALUES (?, ?, ?, ?, ?)`,
        ["lesson-1", "Test Lesson", "test-lesson", 1, 1]
      );
      db.run(
        `INSERT INTO vocabulary_terms (id, lesson_id, term, definition, difficulty, order_index)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ["term-1", "lesson-1", "Token", "A unit of text", "beginner", 1]
      );

      // Insert flashcard progress
      db.run(
        `INSERT INTO vocabulary_progress (id, session_id, term_id, learning_mode, repetitions, ease_factor, interval, mastery_level)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "vprogress-1",
          "session-abc",
          "term-1",
          "flashcard",
          0,
          2.5,
          0,
          "learning",
        ]
      );

      // Insert quiz progress (different learning_mode) - should succeed
      expect(() => {
        db.run(
          `INSERT INTO vocabulary_progress (id, session_id, term_id, learning_mode, repetitions, ease_factor, interval, mastery_level)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            "vprogress-2",
            "session-abc",
            "term-1",
            "quiz",
            0,
            2.5,
            0,
            "learning",
          ]
        );
      }).not.toThrow();
    });

    it("should enforce UNIQUE(lesson_id, term) on vocabulary_terms", () => {
      const db = getTestDb();

      // Create lesson
      db.run(
        `INSERT INTO lessons (id, title, slug, order_index, is_published) VALUES (?, ?, ?, ?, ?)`,
        ["lesson-1", "Test Lesson", "test-lesson", 1, 1]
      );

      // Insert first term
      db.run(
        `INSERT INTO vocabulary_terms (id, lesson_id, term, definition, difficulty, order_index)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ["term-1", "lesson-1", "Token", "A unit of text", "beginner", 1]
      );

      // Attempt to insert same term in same lesson should throw
      expect(() => {
        db.run(
          `INSERT INTO vocabulary_terms (id, lesson_id, term, definition, difficulty, order_index)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            "term-2",
            "lesson-1",
            "Token",
            "Different definition",
            "intermediate",
            2,
          ]
        );
      }).toThrow();
    });
  });

  describe("Indexes", () => {
    it("should create core table indexes", () => {
      const db = getTestDb();
      const indexes = db
        .query(
          `SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'`
        )
        .all() as { name: string }[];

      const indexNames = indexes.map((i) => i.name);

      // Core indexes from 001_initial_schema.sql
      expect(indexNames).toContain("idx_concepts_lesson");
      expect(indexNames).toContain("idx_challenges_concept");
      expect(indexNames).toContain("idx_test_cases_challenge");
      expect(indexNames).toContain("idx_progress_session");
      expect(indexNames).toContain("idx_progress_challenge");
      expect(indexNames).toContain("idx_submissions_session");
      expect(indexNames).toContain("idx_submissions_challenge");
    });

    it("should create vocabulary table indexes", () => {
      const db = getTestDb();
      const indexes = db
        .query(
          `SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_vocab%'`
        )
        .all() as { name: string }[];

      const indexNames = indexes.map((i) => i.name);

      // Vocabulary indexes from 002_vocabulary_schema.sql
      expect(indexNames).toContain("idx_vocab_terms_lesson");
      expect(indexNames).toContain("idx_vocab_progress_session");
      expect(indexNames).toContain("idx_vocab_progress_next_review");
    });
  });

  describe("CHECK Constraints", () => {
    it("should enforce valid challenge type", () => {
      const db = getTestDb();

      // Create parent records
      db.run(
        `INSERT INTO lessons (id, title, slug, order_index, is_published) VALUES (?, ?, ?, ?, ?)`,
        ["lesson-1", "Test Lesson", "test-lesson", 1, 1]
      );
      db.run(
        `INSERT INTO concepts (id, lesson_id, title, order_index) VALUES (?, ?, ?, ?)`,
        ["concept-1", "lesson-1", "Test Concept", 1]
      );

      // Invalid type should throw
      expect(() => {
        db.run(
          `INSERT INTO challenges (id, concept_id, type, title, description, difficulty, order_index)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            "challenge-1",
            "concept-1",
            "invalid_type",
            "Test Challenge",
            "Description",
            "beginner",
            1,
          ]
        );
      }).toThrow();
    });

    it("should enforce valid difficulty level", () => {
      const db = getTestDb();

      // Create parent records
      db.run(
        `INSERT INTO lessons (id, title, slug, order_index, is_published) VALUES (?, ?, ?, ?, ?)`,
        ["lesson-1", "Test Lesson", "test-lesson", 1, 1]
      );
      db.run(
        `INSERT INTO concepts (id, lesson_id, title, order_index) VALUES (?, ?, ?, ?)`,
        ["concept-1", "lesson-1", "Test Concept", 1]
      );

      // Invalid difficulty should throw
      expect(() => {
        db.run(
          `INSERT INTO challenges (id, concept_id, type, title, description, difficulty, order_index)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            "challenge-1",
            "concept-1",
            "implement",
            "Test Challenge",
            "Description",
            "expert",
            1,
          ]
        );
      }).toThrow();
    });

    it("should enforce valid mastery_level in user_progress", () => {
      const db = getTestDb();

      // Create parent records
      db.run(
        `INSERT INTO lessons (id, title, slug, order_index, is_published) VALUES (?, ?, ?, ?, ?)`,
        ["lesson-1", "Test Lesson", "test-lesson", 1, 1]
      );
      db.run(
        `INSERT INTO concepts (id, lesson_id, title, order_index) VALUES (?, ?, ?, ?)`,
        ["concept-1", "lesson-1", "Test Concept", 1]
      );
      db.run(
        `INSERT INTO challenges (id, concept_id, type, title, description, difficulty, order_index)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          "challenge-1",
          "concept-1",
          "implement",
          "Test Challenge",
          "Description",
          "beginner",
          1,
        ]
      );

      // Invalid mastery_level should throw
      expect(() => {
        db.run(
          `INSERT INTO user_progress (id, session_id, challenge_id, repetitions, ease_factor, interval, mastery_level)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ["progress-1", "session-abc", "challenge-1", 0, 2.5, 0, "expert"]
        );
      }).toThrow();
    });

    it("should enforce valid learning_mode in vocabulary_progress", () => {
      const db = getTestDb();

      // Create parent records
      db.run(
        `INSERT INTO lessons (id, title, slug, order_index, is_published) VALUES (?, ?, ?, ?, ?)`,
        ["lesson-1", "Test Lesson", "test-lesson", 1, 1]
      );
      db.run(
        `INSERT INTO vocabulary_terms (id, lesson_id, term, definition, difficulty, order_index)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ["term-1", "lesson-1", "Token", "A unit of text", "beginner", 1]
      );

      // Invalid learning_mode should throw
      expect(() => {
        db.run(
          `INSERT INTO vocabulary_progress (id, session_id, term_id, learning_mode, repetitions, ease_factor, interval, mastery_level)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            "vprogress-1",
            "session-abc",
            "term-1",
            "invalid_mode",
            0,
            2.5,
            0,
            "learning",
          ]
        );
      }).toThrow();
    });
  });

  describe("Migration Tracking", () => {
    it("should record all applied migrations", () => {
      const db = getTestDb();
      const migrations = db
        .query("SELECT name FROM _migrations ORDER BY name")
        .all() as { name: string }[];

      const migrationNames = migrations.map((m) => m.name);

      expect(migrationNames).toContain("001_initial_schema.sql");
      expect(migrationNames).toContain("002_vocabulary_schema.sql");
    });

    it("should have timestamps for applied migrations", () => {
      const db = getTestDb();
      const migrations = db.query("SELECT * FROM _migrations").all() as {
        id: number;
        name: string;
        applied_at: string;
      }[];

      for (const migration of migrations) {
        expect(migration.id).toBeDefined();
        expect(migration.name).toBeDefined();
        expect(migration.applied_at).toBeDefined();
      }
    });
  });
});
