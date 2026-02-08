import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { Hono } from "hono";
import {
  setupTestDb,
  teardownTestDb,
  getTestDb,
} from "../../fixtures/test-db";
import { seedTestData, seedVocabularyData } from "../../fixtures/helpers";
import {
  MOCK_LESSON,
  MOCK_VOCABULARY_TERM,
  MOCK_VOCABULARY_TERM_NO_CONCEPT,
} from "../../fixtures/mock-data";

// Mock the db module before importing routes
// This is needed for both the routes and the vocabulary-service
const mockDb = {
  query: () => ({
    all: () => [],
    get: () => null,
  }),
  run: () => {},
  exec: () => {},
};

mock.module("../../../db", () => ({
  db: mockDb,
}));

describe("Vocabulary API", () => {
  let app: Hono;

  beforeEach(() => {
    setupTestDb();
    seedTestData();
    seedVocabularyData();

    // Update the mock to use the test database
    const testDb = getTestDb();
    mockDb.query = testDb.query.bind(testDb);
    mockDb.run = testDb.run.bind(testDb);
    mockDb.exec = testDb.exec.bind(testDb);

    // Dynamically import to get fresh module with mocked db
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const vocabularyRoutes = require("../../../routes/vocabulary").default;
    app = new Hono();
    app.route("/api/vocabulary", vocabularyRoutes);
  });

  afterEach(() => {
    teardownTestDb();
  });

  describe("GET /api/vocabulary/:lessonIdOrSlug/terms", () => {
    it("should return terms for valid lesson by ID", async () => {
      const res = await app.request(`/api/vocabulary/${MOCK_LESSON.id}/terms`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.terms).toBeDefined();
      expect(Array.isArray(data.terms)).toBe(true);
      expect(data.terms.length).toBe(2);
    });

    it("should return terms for valid lesson by slug", async () => {
      const res = await app.request(
        `/api/vocabulary/${MOCK_LESSON.slug}/terms`
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.terms).toBeDefined();
      expect(data.terms.length).toBe(2);
    });

    it("should return empty terms array for non-existent lesson", async () => {
      const res = await app.request("/api/vocabulary/nonexistent/terms");
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.error).toBe("Lesson not found");
      expect(data.terms).toEqual([]);
    });

    it("should include term details", async () => {
      const res = await app.request(`/api/vocabulary/${MOCK_LESSON.id}/terms`);
      expect(res.status).toBe(200);

      const data = await res.json();
      const term = data.terms.find(
        (t: { id: string }) => t.id === MOCK_VOCABULARY_TERM.id
      );

      expect(term).toBeDefined();
      expect(term.term).toBe(MOCK_VOCABULARY_TERM.term);
      expect(term.definition).toBe(MOCK_VOCABULARY_TERM.definition);
      expect(term.context).toBe(MOCK_VOCABULARY_TERM.context);
      expect(term.difficulty).toBe(MOCK_VOCABULARY_TERM.difficulty);
    });

    it("should include progress when sessionId provided", async () => {
      const sessionId = "test-vocab-session";
      const db = getTestDb();

      // Create vocabulary progress
      db.run(
        `INSERT INTO vocabulary_progress (id, session_id, term_id, learning_mode, repetitions, ease_factor, interval, mastery_level, next_review_date, last_review_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "vprog-1",
          sessionId,
          MOCK_VOCABULARY_TERM.id,
          "flashcard",
          3,
          2.5,
          7,
          "reviewing",
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      );

      const res = await app.request(
        `/api/vocabulary/${MOCK_LESSON.id}/terms?sessionId=${sessionId}`
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      const term = data.terms.find(
        (t: { id: string }) => t.id === MOCK_VOCABULARY_TERM.id
      );

      expect(term.flashcardProgress).toBeDefined();
      expect(term.flashcardProgress.masteryLevel).toBe("reviewing");
      expect(term.flashcardProgress.repetitions).toBe(3);
    });

    it("should return null progress for terms without progress data", async () => {
      const res = await app.request(
        `/api/vocabulary/${MOCK_LESSON.id}/terms?sessionId=new-session`
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      const term = data.terms.find(
        (t: { id: string }) => t.id === MOCK_VOCABULARY_TERM.id
      );

      expect(term.flashcardProgress).toBeNull();
      expect(term.quizProgress).toBeNull();
    });
  });

  describe("GET /api/vocabulary/:lessonIdOrSlug/stats", () => {
    it("should return vocabulary statistics", async () => {
      const sessionId = "test-stats-session";
      const res = await app.request(
        `/api/vocabulary/${MOCK_LESSON.id}/stats?sessionId=${sessionId}`
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.total).toBeDefined();
      expect(data.flashcard).toBeDefined();
      expect(data.quiz).toBeDefined();
    });

    it("should return 400 for missing sessionId", async () => {
      const res = await app.request(`/api/vocabulary/${MOCK_LESSON.id}/stats`);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error).toBe("Missing sessionId");
    });

    it("should return 404 for non-existent lesson", async () => {
      const res = await app.request(
        "/api/vocabulary/nonexistent/stats?sessionId=test"
      );
      expect(res.status).toBe(404);

      const data = await res.json();
      expect(data.error).toBe("Lesson not found");
    });

    it("should include progress counts by mastery level", async () => {
      const sessionId = "test-stats-counts";
      const db = getTestDb();

      // Create flashcard progress records
      db.run(
        `INSERT INTO vocabulary_progress (id, session_id, term_id, learning_mode, repetitions, ease_factor, interval, mastery_level)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "vprog-learning",
          sessionId,
          MOCK_VOCABULARY_TERM.id,
          "flashcard",
          1,
          2.5,
          1,
          "learning",
        ]
      );
      db.run(
        `INSERT INTO vocabulary_progress (id, session_id, term_id, learning_mode, repetitions, ease_factor, interval, mastery_level)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "vprog-reviewing",
          sessionId,
          MOCK_VOCABULARY_TERM_NO_CONCEPT.id,
          "flashcard",
          3,
          2.5,
          7,
          "reviewing",
        ]
      );

      const res = await app.request(
        `/api/vocabulary/${MOCK_LESSON.id}/stats?sessionId=${sessionId}`
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.total).toBe(2); // total terms
      expect(data.flashcard.learning).toBe(1);
      expect(data.flashcard.reviewing).toBe(1);
    });
  });

  describe("POST /api/vocabulary/flashcard/:termId/review", () => {
    it("should record flashcard review", async () => {
      const sessionId = "test-flashcard-review";
      const res = await app.request(
        `/api/vocabulary/flashcard/${MOCK_VOCABULARY_TERM.id}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            quality: 4, // Good recall
          }),
        }
      );

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.termId).toBe(MOCK_VOCABULARY_TERM.id);
      expect(data.learningMode).toBe("flashcard");
      expect(data.repetitions).toBeGreaterThan(0);
    });

    it("should update progress with SM-2 algorithm", async () => {
      const sessionId = "test-sm2-update";
      const db = getTestDb();

      // Create initial progress
      db.run(
        `INSERT INTO vocabulary_progress (id, session_id, term_id, learning_mode, repetitions, ease_factor, interval, mastery_level)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "vprog-sm2",
          sessionId,
          MOCK_VOCABULARY_TERM.id,
          "flashcard",
          2,
          2.5,
          6,
          "reviewing",
        ]
      );

      const res = await app.request(
        `/api/vocabulary/flashcard/${MOCK_VOCABULARY_TERM.id}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            quality: 5, // Perfect recall
          }),
        }
      );

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.repetitions).toBe(3);
      // Ease factor should increase with quality 5
      expect(parseFloat(data.masteryLevel)).not.toBeNaN;
    });

    it("should return 400 for missing sessionId", async () => {
      const res = await app.request(
        `/api/vocabulary/flashcard/${MOCK_VOCABULARY_TERM.id}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quality: 4,
          }),
        }
      );

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Missing sessionId");
    });

    it("should return 400 for invalid quality", async () => {
      const res = await app.request(
        `/api/vocabulary/flashcard/${MOCK_VOCABULARY_TERM.id}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: "test",
            quality: 6, // Invalid - must be 0-5
          }),
        }
      );

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Quality must be a number between 0 and 5");
    });

    it("should return 404 for non-existent term", async () => {
      const res = await app.request(
        "/api/vocabulary/flashcard/nonexistent-term/review",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: "test",
            quality: 4,
          }),
        }
      );

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe("Term not found");
    });
  });

  describe("GET /api/vocabulary/quiz/:termId/question", () => {
    it("should return quiz question with 4 options", async () => {
      const res = await app.request(
        `/api/vocabulary/quiz/${MOCK_VOCABULARY_TERM.id}/question`
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.termId).toBe(MOCK_VOCABULARY_TERM.id);
      expect(data.questionText).toContain(MOCK_VOCABULARY_TERM.term);
      expect(data.options).toBeDefined();
      expect(Array.isArray(data.options)).toBe(true);
      // May have fewer than 4 if not enough terms in lesson
      expect(data.options.length).toBeGreaterThanOrEqual(1);
    });

    it("should have exactly one correct option (the term itself)", async () => {
      const res = await app.request(
        `/api/vocabulary/quiz/${MOCK_VOCABULARY_TERM.id}/question`
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      // The correct option should be the term itself (id matches termId)
      const correctOption = data.options.find(
        (opt: { id: string }) => opt.id === MOCK_VOCABULARY_TERM.id
      );
      expect(correctOption).toBeDefined();
      expect(correctOption.text).toBe(MOCK_VOCABULARY_TERM.definition);
    });

    it("should return 404 for non-existent term", async () => {
      const res = await app.request(
        "/api/vocabulary/quiz/nonexistent-term/question"
      );
      expect(res.status).toBe(404);

      const data = await res.json();
      expect(data.error).toBe("Term not found");
    });

    it("should not include correctOptionId in response", async () => {
      const res = await app.request(
        `/api/vocabulary/quiz/${MOCK_VOCABULARY_TERM.id}/question`
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      // Security check - correctOptionId should not be exposed
      expect(data.correctOptionId).toBeUndefined();
    });
  });

  describe("POST /api/vocabulary/quiz/:termId/answer", () => {
    it("should return correct: true for correct answer", async () => {
      const sessionId = "test-quiz-correct";
      const res = await app.request(
        `/api/vocabulary/quiz/${MOCK_VOCABULARY_TERM.id}/answer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            selectedOptionId: MOCK_VOCABULARY_TERM.id, // Correct answer
            timeSpentMs: 5000,
          }),
        }
      );

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.correct).toBe(true);
      expect(data.correctOptionId).toBe(MOCK_VOCABULARY_TERM.id);
    });

    it("should return correct: false for incorrect answer", async () => {
      const sessionId = "test-quiz-incorrect";
      const res = await app.request(
        `/api/vocabulary/quiz/${MOCK_VOCABULARY_TERM.id}/answer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            selectedOptionId: MOCK_VOCABULARY_TERM_NO_CONCEPT.id, // Wrong answer
            timeSpentMs: 5000,
          }),
        }
      );

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.correct).toBe(false);
      expect(data.correctOptionId).toBe(MOCK_VOCABULARY_TERM.id);
    });

    it("should update progress", async () => {
      const sessionId = "test-quiz-progress";
      const res = await app.request(
        `/api/vocabulary/quiz/${MOCK_VOCABULARY_TERM.id}/answer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            selectedOptionId: MOCK_VOCABULARY_TERM.id,
            timeSpentMs: 3000,
          }),
        }
      );

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.progress).toBeDefined();
      expect(data.progress.termId).toBe(MOCK_VOCABULARY_TERM.id);
      expect(data.progress.learningMode).toBe("quiz");
    });

    it("should return 400 for missing sessionId", async () => {
      const res = await app.request(
        `/api/vocabulary/quiz/${MOCK_VOCABULARY_TERM.id}/answer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selectedOptionId: MOCK_VOCABULARY_TERM.id,
            timeSpentMs: 5000,
          }),
        }
      );

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Missing sessionId");
    });

    it("should return 400 for missing selectedOptionId", async () => {
      const res = await app.request(
        `/api/vocabulary/quiz/${MOCK_VOCABULARY_TERM.id}/answer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: "test",
            timeSpentMs: 5000,
          }),
        }
      );

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Missing selectedOptionId");
    });

    it("should return 404 for non-existent term", async () => {
      const res = await app.request(
        "/api/vocabulary/quiz/nonexistent-term/answer",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: "test",
            selectedOptionId: "some-id",
            timeSpentMs: 5000,
          }),
        }
      );

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe("Term not found");
    });
  });

  describe("GET /api/vocabulary/review-queue", () => {
    it("should return terms due for review", async () => {
      const sessionId = "test-review-queue";
      const db = getTestDb();

      // Create progress with past review date
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      db.run(
        `INSERT INTO vocabulary_progress (id, session_id, term_id, learning_mode, repetitions, ease_factor, interval, mastery_level, next_review_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "vprog-due",
          sessionId,
          MOCK_VOCABULARY_TERM.id,
          "flashcard",
          2,
          2.5,
          5,
          "reviewing",
          pastDate,
        ]
      );

      const res = await app.request(
        `/api/vocabulary/review-queue?sessionId=${sessionId}`
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.queue).toBeDefined();
      expect(Array.isArray(data.queue)).toBe(true);
      expect(data.queue.length).toBe(1);
      expect(data.queue[0].id).toBe(MOCK_VOCABULARY_TERM.id);
    });

    it("should return 400 for missing sessionId", async () => {
      const res = await app.request("/api/vocabulary/review-queue");
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error).toBe("Missing sessionId");
    });

    it("should return empty queue for new session", async () => {
      const res = await app.request(
        "/api/vocabulary/review-queue?sessionId=brand-new-session"
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.queue).toEqual([]);
    });

    it("should filter by lessonId when provided", async () => {
      const sessionId = "test-queue-filter";
      const db = getTestDb();

      const pastDate = new Date(Date.now() - 86400000).toISOString();
      db.run(
        `INSERT INTO vocabulary_progress (id, session_id, term_id, learning_mode, repetitions, ease_factor, interval, mastery_level, next_review_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "vprog-filter",
          sessionId,
          MOCK_VOCABULARY_TERM.id,
          "flashcard",
          2,
          2.5,
          5,
          "reviewing",
          pastDate,
        ]
      );

      // With matching lesson
      let res = await app.request(
        `/api/vocabulary/review-queue?sessionId=${sessionId}&lessonId=${MOCK_LESSON.id}`
      );
      let data = await res.json();
      expect(data.queue.length).toBe(1);

      // With non-matching lesson
      res = await app.request(
        `/api/vocabulary/review-queue?sessionId=${sessionId}&lessonId=other-lesson`
      );
      data = await res.json();
      expect(data.queue).toEqual([]);
    });
  });

  describe("GET /api/vocabulary/stats", () => {
    it("should return overall vocabulary statistics", async () => {
      const sessionId = "test-overall-stats";
      const res = await app.request(
        `/api/vocabulary/stats?sessionId=${sessionId}`
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.total).toBeDefined();
      expect(data.flashcard).toBeDefined();
      expect(data.quiz).toBeDefined();
    });

    it("should return 400 for missing sessionId", async () => {
      const res = await app.request("/api/vocabulary/stats");
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error).toBe("Missing sessionId");
    });
  });

  describe("GET /api/vocabulary/term/:termId", () => {
    it("should return single term details", async () => {
      const res = await app.request(
        `/api/vocabulary/term/${MOCK_VOCABULARY_TERM.id}`
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.id).toBe(MOCK_VOCABULARY_TERM.id);
      expect(data.term).toBe(MOCK_VOCABULARY_TERM.term);
      expect(data.definition).toBe(MOCK_VOCABULARY_TERM.definition);
    });

    it("should include lesson information", async () => {
      const res = await app.request(
        `/api/vocabulary/term/${MOCK_VOCABULARY_TERM.id}`
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.lesson).toBeDefined();
      expect(data.lesson.id).toBe(MOCK_LESSON.id);
      expect(data.lesson.title).toBe(MOCK_LESSON.title);
      expect(data.lesson.slug).toBe(MOCK_LESSON.slug);
    });

    it("should return 404 for non-existent term", async () => {
      const res = await app.request("/api/vocabulary/term/nonexistent-term");
      expect(res.status).toBe(404);

      const data = await res.json();
      expect(data.error).toBe("Term not found");
    });
  });
});
