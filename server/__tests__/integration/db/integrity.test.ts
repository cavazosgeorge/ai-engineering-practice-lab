import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import {
  setupTestDb,
  teardownTestDb,
  getTestDb,
} from "../../fixtures/test-db";
import {
  seedTestData,
  seedVocabularyData,
  clearTestData,
} from "../../fixtures/helpers";
import {
  MOCK_LESSON,
  MOCK_LESSON_2,
  MOCK_CONCEPT,
  MOCK_CHALLENGE,
  MOCK_TEST_CASE,
  MOCK_TEST_CASE_HIDDEN,
  MOCK_VOCABULARY_TERM,
  MOCK_VOCABULARY_TERM_NO_CONCEPT,
} from "../../fixtures/mock-data";

describe("Database Referential Integrity", () => {
  beforeEach(() => {
    setupTestDb();
  });

  afterEach(() => {
    teardownTestDb();
  });

  describe("Foreign Key Constraints", () => {
    it("should reject concept with non-existent lesson_id", () => {
      const db = getTestDb();

      expect(() => {
        db.run(
          `INSERT INTO concepts (id, lesson_id, title, order_index)
           VALUES (?, ?, ?, ?)`,
          ["concept-orphan", "non-existent-lesson", "Orphan Concept", 1]
        );
      }).toThrow();
    });

    it("should reject challenge with non-existent concept_id", () => {
      const db = getTestDb();

      expect(() => {
        db.run(
          `INSERT INTO challenges (id, concept_id, type, title, description, difficulty, order_index)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            "challenge-orphan",
            "non-existent-concept",
            "implement",
            "Orphan Challenge",
            "Description",
            "beginner",
            1,
          ]
        );
      }).toThrow();
    });

    it("should reject test_case with non-existent challenge_id", () => {
      const db = getTestDb();

      expect(() => {
        db.run(
          `INSERT INTO test_cases (id, challenge_id, input, expected_output, is_hidden, order_index)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            "testcase-orphan",
            "non-existent-challenge",
            '["test"]',
            '["result"]',
            0,
            1,
          ]
        );
      }).toThrow();
    });

    it("should reject user_progress with non-existent challenge_id", () => {
      const db = getTestDb();

      expect(() => {
        db.run(
          `INSERT INTO user_progress (id, session_id, challenge_id, repetitions, ease_factor, interval, mastery_level)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            "progress-orphan",
            "session-abc",
            "non-existent-challenge",
            0,
            2.5,
            0,
            "learning",
          ]
        );
      }).toThrow();
    });

    it("should reject submissions with non-existent challenge_id", () => {
      const db = getTestDb();

      expect(() => {
        db.run(
          `INSERT INTO submissions (id, session_id, challenge_id, code, passed)
           VALUES (?, ?, ?, ?, ?)`,
          [
            "submission-orphan",
            "session-abc",
            "non-existent-challenge",
            "code",
            1,
          ]
        );
      }).toThrow();
    });

    it("should reject vocabulary_terms with non-existent lesson_id", () => {
      const db = getTestDb();

      expect(() => {
        db.run(
          `INSERT INTO vocabulary_terms (id, lesson_id, term, definition, difficulty, order_index)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            "vocab-orphan",
            "non-existent-lesson",
            "Orphan Term",
            "Definition",
            "beginner",
            1,
          ]
        );
      }).toThrow();
    });

    it("should reject vocabulary_progress with non-existent term_id", () => {
      const db = getTestDb();

      expect(() => {
        db.run(
          `INSERT INTO vocabulary_progress (id, session_id, term_id, learning_mode, repetitions, ease_factor, interval, mastery_level)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            "vprogress-orphan",
            "session-abc",
            "non-existent-term",
            "flashcard",
            0,
            2.5,
            0,
            "learning",
          ]
        );
      }).toThrow();
    });

    it("should reject vocabulary_submissions with non-existent term_id", () => {
      const db = getTestDb();

      expect(() => {
        db.run(
          `INSERT INTO vocabulary_submissions (id, session_id, term_id, submission_type, is_correct)
           VALUES (?, ?, ?, ?, ?)`,
          [
            "vsub-orphan",
            "session-abc",
            "non-existent-term",
            "flashcard_review",
            1,
          ]
        );
      }).toThrow();
    });

    it("should allow vocabulary_terms with null concept_id", () => {
      const db = getTestDb();

      // Create parent lesson
      db.run(
        `INSERT INTO lessons (id, title, slug, order_index, is_published) VALUES (?, ?, ?, ?, ?)`,
        ["lesson-1", "Test Lesson", "test-lesson", 1, 1]
      );

      // Insert vocabulary term with null concept_id - should succeed
      expect(() => {
        db.run(
          `INSERT INTO vocabulary_terms (id, lesson_id, concept_id, term, definition, difficulty, order_index)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            "vocab-no-concept",
            "lesson-1",
            null,
            "Test Term",
            "Definition",
            "beginner",
            1,
          ]
        );
      }).not.toThrow();
    });
  });

  describe("Cascade Delete - Core Tables", () => {
    beforeEach(() => {
      seedTestData();
    });

    it("should cascade delete concepts when lesson is deleted", () => {
      const db = getTestDb();

      // Verify concept exists
      const conceptBefore = db
        .query("SELECT id FROM concepts WHERE id = ?")
        .get(MOCK_CONCEPT.id);
      expect(conceptBefore).toBeTruthy();

      // Delete the lesson
      db.run("DELETE FROM lessons WHERE id = ?", [MOCK_LESSON.id]);

      // Concept should be deleted
      const conceptAfter = db
        .query("SELECT id FROM concepts WHERE id = ?")
        .get(MOCK_CONCEPT.id);
      expect(conceptAfter).toBeNull();
    });

    it("should cascade delete challenges when concept is deleted", () => {
      const db = getTestDb();

      // Verify challenge exists
      const challengeBefore = db
        .query("SELECT id FROM challenges WHERE id = ?")
        .get(MOCK_CHALLENGE.id);
      expect(challengeBefore).toBeTruthy();

      // Delete the concept
      db.run("DELETE FROM concepts WHERE id = ?", [MOCK_CONCEPT.id]);

      // Challenge should be deleted
      const challengeAfter = db
        .query("SELECT id FROM challenges WHERE id = ?")
        .get(MOCK_CHALLENGE.id);
      expect(challengeAfter).toBeNull();
    });

    it("should cascade delete test_cases when challenge is deleted", () => {
      const db = getTestDb();

      // Verify test cases exist
      const testCasesBefore = db
        .query("SELECT id FROM test_cases WHERE challenge_id = ?")
        .all(MOCK_CHALLENGE.id);
      expect(testCasesBefore.length).toBe(2);

      // Delete the challenge
      db.run("DELETE FROM challenges WHERE id = ?", [MOCK_CHALLENGE.id]);

      // Test cases should be deleted
      const testCasesAfter = db
        .query("SELECT id FROM test_cases WHERE challenge_id = ?")
        .all(MOCK_CHALLENGE.id);
      expect(testCasesAfter.length).toBe(0);
    });

    it("should cascade delete entire hierarchy when lesson is deleted", () => {
      const db = getTestDb();

      // Verify full hierarchy exists
      expect(
        db.query("SELECT id FROM lessons WHERE id = ?").get(MOCK_LESSON.id)
      ).toBeTruthy();
      expect(
        db.query("SELECT id FROM concepts WHERE id = ?").get(MOCK_CONCEPT.id)
      ).toBeTruthy();
      expect(
        db.query("SELECT id FROM challenges WHERE id = ?").get(MOCK_CHALLENGE.id)
      ).toBeTruthy();
      expect(
        db.query("SELECT id FROM test_cases WHERE id = ?").get(MOCK_TEST_CASE.id)
      ).toBeTruthy();

      // Delete the lesson
      db.run("DELETE FROM lessons WHERE id = ?", [MOCK_LESSON.id]);

      // All dependent records should be deleted
      expect(
        db.query("SELECT id FROM lessons WHERE id = ?").get(MOCK_LESSON.id)
      ).toBeNull();
      expect(
        db.query("SELECT id FROM concepts WHERE id = ?").get(MOCK_CONCEPT.id)
      ).toBeNull();
      expect(
        db.query("SELECT id FROM challenges WHERE id = ?").get(MOCK_CHALLENGE.id)
      ).toBeNull();
      expect(
        db.query("SELECT id FROM test_cases WHERE id = ?").get(MOCK_TEST_CASE.id)
      ).toBeNull();
    });

    it("should cascade delete user_progress when challenge is deleted", () => {
      const db = getTestDb();

      // Add user progress
      db.run(
        `INSERT INTO user_progress (id, session_id, challenge_id, repetitions, ease_factor, interval, mastery_level)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          "progress-1",
          "session-abc",
          MOCK_CHALLENGE.id,
          2,
          2.5,
          5,
          "reviewing",
        ]
      );

      // Verify progress exists
      const progressBefore = db
        .query("SELECT id FROM user_progress WHERE id = ?")
        .get("progress-1");
      expect(progressBefore).toBeTruthy();

      // Delete the challenge
      db.run("DELETE FROM challenges WHERE id = ?", [MOCK_CHALLENGE.id]);

      // Progress should be deleted
      const progressAfter = db
        .query("SELECT id FROM user_progress WHERE id = ?")
        .get("progress-1");
      expect(progressAfter).toBeNull();
    });

    it("should cascade delete submissions when challenge is deleted", () => {
      const db = getTestDb();

      // Add submission
      db.run(
        `INSERT INTO submissions (id, session_id, challenge_id, code, passed)
         VALUES (?, ?, ?, ?, ?)`,
        [
          "submission-1",
          "session-abc",
          MOCK_CHALLENGE.id,
          "function test() {}",
          1,
        ]
      );

      // Verify submission exists
      const submissionBefore = db
        .query("SELECT id FROM submissions WHERE id = ?")
        .get("submission-1");
      expect(submissionBefore).toBeTruthy();

      // Delete the challenge
      db.run("DELETE FROM challenges WHERE id = ?", [MOCK_CHALLENGE.id]);

      // Submission should be deleted
      const submissionAfter = db
        .query("SELECT id FROM submissions WHERE id = ?")
        .get("submission-1");
      expect(submissionAfter).toBeNull();
    });
  });

  describe("Cascade Delete - Vocabulary Tables", () => {
    beforeEach(() => {
      seedTestData();
      seedVocabularyData();
    });

    it("should cascade delete vocabulary_terms when lesson is deleted", () => {
      const db = getTestDb();

      // Verify terms exist
      const termsBefore = db
        .query("SELECT id FROM vocabulary_terms WHERE lesson_id = ?")
        .all(MOCK_LESSON.id);
      expect(termsBefore.length).toBe(2);

      // Delete the lesson
      db.run("DELETE FROM lessons WHERE id = ?", [MOCK_LESSON.id]);

      // Terms should be deleted
      const termsAfter = db
        .query("SELECT id FROM vocabulary_terms WHERE lesson_id = ?")
        .all(MOCK_LESSON.id);
      expect(termsAfter.length).toBe(0);
    });

    it("should SET NULL on vocabulary_terms.concept_id when concept is deleted", () => {
      const db = getTestDb();

      // Verify term has concept_id
      const termBefore = db
        .query("SELECT concept_id FROM vocabulary_terms WHERE id = ?")
        .get(MOCK_VOCABULARY_TERM.id) as { concept_id: string | null };
      expect(termBefore.concept_id).toBe(MOCK_CONCEPT.id);

      // Delete the concept
      db.run("DELETE FROM concepts WHERE id = ?", [MOCK_CONCEPT.id]);

      // Term should still exist but concept_id should be null
      const termAfter = db
        .query("SELECT concept_id FROM vocabulary_terms WHERE id = ?")
        .get(MOCK_VOCABULARY_TERM.id) as { concept_id: string | null };
      expect(termAfter).toBeTruthy();
      expect(termAfter.concept_id).toBeNull();
    });

    it("should cascade delete vocabulary_progress when term is deleted", () => {
      const db = getTestDb();

      // Add vocabulary progress
      db.run(
        `INSERT INTO vocabulary_progress (id, session_id, term_id, learning_mode, repetitions, ease_factor, interval, mastery_level)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "vprogress-1",
          "session-abc",
          MOCK_VOCABULARY_TERM.id,
          "flashcard",
          2,
          2.5,
          5,
          "reviewing",
        ]
      );

      // Verify progress exists
      const progressBefore = db
        .query("SELECT id FROM vocabulary_progress WHERE id = ?")
        .get("vprogress-1");
      expect(progressBefore).toBeTruthy();

      // Delete the term
      db.run("DELETE FROM vocabulary_terms WHERE id = ?", [
        MOCK_VOCABULARY_TERM.id,
      ]);

      // Progress should be deleted
      const progressAfter = db
        .query("SELECT id FROM vocabulary_progress WHERE id = ?")
        .get("vprogress-1");
      expect(progressAfter).toBeNull();
    });

    it("should cascade delete vocabulary_submissions when term is deleted", () => {
      const db = getTestDb();

      // Add vocabulary submission
      db.run(
        `INSERT INTO vocabulary_submissions (id, session_id, term_id, submission_type, is_correct)
         VALUES (?, ?, ?, ?, ?)`,
        [
          "vsub-1",
          "session-abc",
          MOCK_VOCABULARY_TERM.id,
          "flashcard_review",
          1,
        ]
      );

      // Verify submission exists
      const submissionBefore = db
        .query("SELECT id FROM vocabulary_submissions WHERE id = ?")
        .get("vsub-1");
      expect(submissionBefore).toBeTruthy();

      // Delete the term
      db.run("DELETE FROM vocabulary_terms WHERE id = ?", [
        MOCK_VOCABULARY_TERM.id,
      ]);

      // Submission should be deleted
      const submissionAfter = db
        .query("SELECT id FROM vocabulary_submissions WHERE id = ?")
        .get("vsub-1");
      expect(submissionAfter).toBeNull();
    });

    it("should cascade delete vocabulary data when lesson is deleted", () => {
      const db = getTestDb();

      // Add progress and submission for term
      db.run(
        `INSERT INTO vocabulary_progress (id, session_id, term_id, learning_mode, repetitions, ease_factor, interval, mastery_level)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "vprogress-1",
          "session-abc",
          MOCK_VOCABULARY_TERM.id,
          "flashcard",
          2,
          2.5,
          5,
          "reviewing",
        ]
      );
      db.run(
        `INSERT INTO vocabulary_submissions (id, session_id, term_id, submission_type, is_correct)
         VALUES (?, ?, ?, ?, ?)`,
        [
          "vsub-1",
          "session-abc",
          MOCK_VOCABULARY_TERM.id,
          "flashcard_review",
          1,
        ]
      );

      // Verify all exist
      expect(
        db
          .query("SELECT id FROM vocabulary_terms WHERE lesson_id = ?")
          .all(MOCK_LESSON.id).length
      ).toBe(2);
      expect(
        db.query("SELECT id FROM vocabulary_progress WHERE id = ?").get("vprogress-1")
      ).toBeTruthy();
      expect(
        db.query("SELECT id FROM vocabulary_submissions WHERE id = ?").get("vsub-1")
      ).toBeTruthy();

      // Delete the lesson
      db.run("DELETE FROM lessons WHERE id = ?", [MOCK_LESSON.id]);

      // All vocabulary data should be deleted
      expect(
        db
          .query("SELECT id FROM vocabulary_terms WHERE lesson_id = ?")
          .all(MOCK_LESSON.id).length
      ).toBe(0);
      expect(
        db.query("SELECT id FROM vocabulary_progress WHERE id = ?").get("vprogress-1")
      ).toBeNull();
      expect(
        db.query("SELECT id FROM vocabulary_submissions WHERE id = ?").get("vsub-1")
      ).toBeNull();
    });
  });

  describe("Data Consistency", () => {
    it("should have all seeded records after seedTestData()", () => {
      seedTestData();
      const db = getTestDb();

      // Check lessons
      const lessons = db.query("SELECT id FROM lessons").all();
      expect(lessons.length).toBe(2);

      // Check concepts
      const concepts = db.query("SELECT id FROM concepts").all();
      expect(concepts.length).toBe(1);

      // Check challenges
      const challenges = db.query("SELECT id FROM challenges").all();
      expect(challenges.length).toBe(1);

      // Check test cases
      const testCases = db.query("SELECT id FROM test_cases").all();
      expect(testCases.length).toBe(2);
    });

    it("should have all vocabulary records after seedVocabularyData()", () => {
      seedTestData();
      seedVocabularyData();
      const db = getTestDb();

      // Check vocabulary terms
      const terms = db.query("SELECT id FROM vocabulary_terms").all();
      expect(terms.length).toBe(2);
    });

    it("should have empty tables after clearTestData()", () => {
      seedTestData();
      seedVocabularyData();
      clearTestData();
      const db = getTestDb();

      // Check all tables are empty
      expect(db.query("SELECT COUNT(*) as count FROM lessons").get()).toEqual({
        count: 0,
      });
      expect(db.query("SELECT COUNT(*) as count FROM concepts").get()).toEqual({
        count: 0,
      });
      expect(db.query("SELECT COUNT(*) as count FROM challenges").get()).toEqual({
        count: 0,
      });
      expect(db.query("SELECT COUNT(*) as count FROM test_cases").get()).toEqual({
        count: 0,
      });
      expect(db.query("SELECT COUNT(*) as count FROM user_progress").get()).toEqual({
        count: 0,
      });
      expect(db.query("SELECT COUNT(*) as count FROM submissions").get()).toEqual({
        count: 0,
      });
      expect(
        db.query("SELECT COUNT(*) as count FROM vocabulary_terms").get()
      ).toEqual({ count: 0 });
      expect(
        db.query("SELECT COUNT(*) as count FROM vocabulary_progress").get()
      ).toEqual({ count: 0 });
      expect(
        db.query("SELECT COUNT(*) as count FROM vocabulary_submissions").get()
      ).toEqual({ count: 0 });
    });

    it("should have fresh data after clear and re-seed", () => {
      // First seed
      seedTestData();
      seedVocabularyData();

      // Clear
      clearTestData();

      // Re-seed
      seedTestData();
      seedVocabularyData();

      const db = getTestDb();

      // Verify data exists
      expect(
        db.query("SELECT id FROM lessons WHERE id = ?").get(MOCK_LESSON.id)
      ).toBeTruthy();
      expect(
        db.query("SELECT id FROM concepts WHERE id = ?").get(MOCK_CONCEPT.id)
      ).toBeTruthy();
      expect(
        db.query("SELECT id FROM challenges WHERE id = ?").get(MOCK_CHALLENGE.id)
      ).toBeTruthy();
      expect(
        db
          .query("SELECT id FROM vocabulary_terms WHERE id = ?")
          .get(MOCK_VOCABULARY_TERM.id)
      ).toBeTruthy();
    });

    it("should maintain referential integrity after operations", () => {
      seedTestData();
      seedVocabularyData();
      const db = getTestDb();

      // Add user progress
      db.run(
        `INSERT INTO user_progress (id, session_id, challenge_id, repetitions, ease_factor, interval, mastery_level)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ["progress-1", "session-abc", MOCK_CHALLENGE.id, 0, 2.5, 0, "learning"]
      );

      // Add submission
      db.run(
        `INSERT INTO submissions (id, session_id, challenge_id, code, passed)
         VALUES (?, ?, ?, ?, ?)`,
        ["submission-1", "session-abc", MOCK_CHALLENGE.id, "code", 1]
      );

      // Add vocabulary progress
      db.run(
        `INSERT INTO vocabulary_progress (id, session_id, term_id, learning_mode, repetitions, ease_factor, interval, mastery_level)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "vprogress-1",
          "session-abc",
          MOCK_VOCABULARY_TERM.id,
          "flashcard",
          0,
          2.5,
          0,
          "learning",
        ]
      );

      // Verify all references are valid
      const progress = db
        .query(
          `SELECT up.id, c.id as challenge_id
           FROM user_progress up
           JOIN challenges c ON up.challenge_id = c.id
           WHERE up.id = ?`
        )
        .get("progress-1") as { id: string; challenge_id: string };
      expect(progress).toBeTruthy();
      expect(progress.challenge_id).toBe(MOCK_CHALLENGE.id);

      const submission = db
        .query(
          `SELECT s.id, c.id as challenge_id
           FROM submissions s
           JOIN challenges c ON s.challenge_id = c.id
           WHERE s.id = ?`
        )
        .get("submission-1") as { id: string; challenge_id: string };
      expect(submission).toBeTruthy();
      expect(submission.challenge_id).toBe(MOCK_CHALLENGE.id);

      const vocabProgress = db
        .query(
          `SELECT vp.id, vt.id as term_id
           FROM vocabulary_progress vp
           JOIN vocabulary_terms vt ON vp.term_id = vt.id
           WHERE vp.id = ?`
        )
        .get("vprogress-1") as { id: string; term_id: string };
      expect(vocabProgress).toBeTruthy();
      expect(vocabProgress.term_id).toBe(MOCK_VOCABULARY_TERM.id);
    });

    it("should isolate data between different lessons", () => {
      seedTestData();
      const db = getTestDb();

      // Verify lesson 2 has no concepts
      const lesson2Concepts = db
        .query("SELECT id FROM concepts WHERE lesson_id = ?")
        .all(MOCK_LESSON_2.id);
      expect(lesson2Concepts.length).toBe(0);

      // Verify lesson 1 has concepts
      const lesson1Concepts = db
        .query("SELECT id FROM concepts WHERE lesson_id = ?")
        .all(MOCK_LESSON.id);
      expect(lesson1Concepts.length).toBe(1);

      // Delete lesson 2 should not affect lesson 1 data
      db.run("DELETE FROM lessons WHERE id = ?", [MOCK_LESSON_2.id]);

      // Lesson 1 data should still exist
      expect(
        db.query("SELECT id FROM lessons WHERE id = ?").get(MOCK_LESSON.id)
      ).toBeTruthy();
      expect(
        db.query("SELECT id FROM concepts WHERE id = ?").get(MOCK_CONCEPT.id)
      ).toBeTruthy();
      expect(
        db.query("SELECT id FROM challenges WHERE id = ?").get(MOCK_CHALLENGE.id)
      ).toBeTruthy();
    });
  });
});
