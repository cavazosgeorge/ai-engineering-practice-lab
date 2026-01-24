import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { Hono } from "hono";
import {
  setupTestDb,
  teardownTestDb,
  getTestDb,
} from "../../fixtures/test-db";
import { seedTestData } from "../../fixtures/helpers";
import {
  MOCK_CHALLENGE,
  MOCK_CONCEPT,
  MOCK_LESSON,
} from "../../fixtures/mock-data";

// Mock the db module before importing routes
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

describe("Progress API", () => {
  let app: Hono;

  beforeEach(() => {
    setupTestDb();
    seedTestData();

    // Update the mock to use the test database
    const testDb = getTestDb();
    mockDb.query = testDb.query.bind(testDb);
    mockDb.run = testDb.run.bind(testDb);
    mockDb.exec = testDb.exec.bind(testDb);

    // Dynamically import to get fresh module with mocked db
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const progressRoutes = require("../../../routes/progress").default;
    app = new Hono();
    app.route("/api/progress", progressRoutes);
  });

  afterEach(() => {
    teardownTestDb();
  });

  describe("GET /api/progress/:sessionId", () => {
    it("should return progress array for session", async () => {
      const sessionId = "test-session-progress";
      const db = getTestDb();

      // Create progress records
      db.run(
        `INSERT INTO user_progress (id, session_id, challenge_id, repetitions, ease_factor, interval, mastery_level, next_review_date, last_review_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "progress-1",
          sessionId,
          MOCK_CHALLENGE.id,
          2,
          2.5,
          5,
          "reviewing",
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      );

      const res = await app.request(`/api/progress/${sessionId}`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.progress).toBeDefined();
      expect(Array.isArray(data.progress)).toBe(true);
      expect(data.progress.length).toBe(1);
      expect(data.progress[0].challengeId).toBe(MOCK_CHALLENGE.id);
      expect(data.progress[0].masteryLevel).toBe("reviewing");
    });

    it("should return empty array for new session", async () => {
      const res = await app.request("/api/progress/brand-new-session");
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.progress).toBeDefined();
      expect(Array.isArray(data.progress)).toBe(true);
      expect(data.progress.length).toBe(0);
    });

    it("should include stats (total, mastered, reviewing, learning)", async () => {
      const sessionId = "test-session-stats";
      const db = getTestDb();

      // Create progress records with different mastery levels
      // First, add more challenges to have multiple progress records
      db.run(
        `INSERT INTO challenges (id, concept_id, type, title, description, difficulty, order_index)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          "challenge-stats-1",
          MOCK_CONCEPT.id,
          "implement",
          "Stats Challenge 1",
          "Desc",
          "beginner",
          2,
        ]
      );
      db.run(
        `INSERT INTO challenges (id, concept_id, type, title, description, difficulty, order_index)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          "challenge-stats-2",
          MOCK_CONCEPT.id,
          "implement",
          "Stats Challenge 2",
          "Desc",
          "beginner",
          3,
        ]
      );
      db.run(
        `INSERT INTO challenges (id, concept_id, type, title, description, difficulty, order_index)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          "challenge-stats-3",
          MOCK_CONCEPT.id,
          "implement",
          "Stats Challenge 3",
          "Desc",
          "beginner",
          4,
        ]
      );

      // learning
      db.run(
        `INSERT INTO user_progress (id, session_id, challenge_id, repetitions, ease_factor, interval, mastery_level)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ["progress-stats-1", sessionId, MOCK_CHALLENGE.id, 1, 2.5, 1, "learning"]
      );
      // reviewing
      db.run(
        `INSERT INTO user_progress (id, session_id, challenge_id, repetitions, ease_factor, interval, mastery_level)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          "progress-stats-2",
          sessionId,
          "challenge-stats-1",
          3,
          2.5,
          7,
          "reviewing",
        ]
      );
      // mastered
      db.run(
        `INSERT INTO user_progress (id, session_id, challenge_id, repetitions, ease_factor, interval, mastery_level)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          "progress-stats-3",
          sessionId,
          "challenge-stats-2",
          5,
          2.5,
          30,
          "mastered",
        ]
      );

      const res = await app.request(`/api/progress/${sessionId}`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.stats).toBeDefined();
      expect(data.stats.total).toBe(3);
      expect(data.stats.learning).toBe(1);
      expect(data.stats.reviewing).toBe(1);
      expect(data.stats.mastered).toBe(1);
    });

    it("should include enriched challenge details in progress", async () => {
      const sessionId = "test-session-enriched";
      const db = getTestDb();

      db.run(
        `INSERT INTO user_progress (id, session_id, challenge_id, repetitions, ease_factor, interval, mastery_level)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          "progress-enriched",
          sessionId,
          MOCK_CHALLENGE.id,
          1,
          2.5,
          1,
          "learning",
        ]
      );

      const res = await app.request(`/api/progress/${sessionId}`);
      expect(res.status).toBe(200);

      const data = await res.json();
      const progress = data.progress[0];

      expect(progress.challenge).toBeDefined();
      expect(progress.challenge.id).toBe(MOCK_CHALLENGE.id);
      expect(progress.challenge.title).toBe(MOCK_CHALLENGE.title);
      expect(progress.challenge.type).toBe(MOCK_CHALLENGE.type);
      expect(progress.challenge.difficulty).toBe(MOCK_CHALLENGE.difficulty);

      expect(progress.challenge.concept).toBeDefined();
      expect(progress.challenge.concept.id).toBe(MOCK_CONCEPT.id);
      expect(progress.challenge.concept.title).toBe(MOCK_CONCEPT.title);

      expect(progress.challenge.concept.lesson).toBeDefined();
      expect(progress.challenge.concept.lesson.id).toBe(MOCK_LESSON.id);
      expect(progress.challenge.concept.lesson.title).toBe(MOCK_LESSON.title);
    });
  });

  describe("GET /api/progress/:sessionId/review-queue", () => {
    it("should return items due for review", async () => {
      const sessionId = "test-session-review";
      const db = getTestDb();

      // Create a progress record with past next_review_date
      const pastDate = new Date(Date.now() - 86400000).toISOString(); // yesterday
      db.run(
        `INSERT INTO user_progress (id, session_id, challenge_id, repetitions, ease_factor, interval, mastery_level, next_review_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "progress-due",
          sessionId,
          MOCK_CHALLENGE.id,
          2,
          2.5,
          5,
          "reviewing",
          pastDate,
        ]
      );

      const res = await app.request(
        `/api/progress/${sessionId}/review-queue`
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
      expect(data[0].challengeId).toBe(MOCK_CHALLENGE.id);
    });

    it("should return empty array if nothing due", async () => {
      const sessionId = "test-session-not-due";
      const db = getTestDb();

      // Create a progress record with future next_review_date
      const futureDate = new Date(Date.now() + 86400000 * 30).toISOString(); // 30 days from now
      db.run(
        `INSERT INTO user_progress (id, session_id, challenge_id, repetitions, ease_factor, interval, mastery_level, next_review_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "progress-not-due",
          sessionId,
          MOCK_CHALLENGE.id,
          5,
          2.5,
          30,
          "mastered",
          futureDate,
        ]
      );

      const res = await app.request(
        `/api/progress/${sessionId}/review-queue`
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });

    it("should return empty array for session with no progress", async () => {
      const res = await app.request(
        "/api/progress/new-session/review-queue"
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });

    it("should order by next_review_date descending", async () => {
      const sessionId = "test-session-order";
      const db = getTestDb();

      // Add another challenge
      db.run(
        `INSERT INTO challenges (id, concept_id, type, title, description, difficulty, order_index)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          "challenge-order-2",
          MOCK_CONCEPT.id,
          "implement",
          "Order Challenge",
          "Desc",
          "beginner",
          2,
        ]
      );

      // Create progress records with different past dates
      const olderDate = new Date(Date.now() - 86400000 * 2).toISOString(); // 2 days ago
      const recentDate = new Date(Date.now() - 86400000).toISOString(); // yesterday

      db.run(
        `INSERT INTO user_progress (id, session_id, challenge_id, repetitions, ease_factor, interval, mastery_level, next_review_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "progress-older",
          sessionId,
          MOCK_CHALLENGE.id,
          2,
          2.5,
          5,
          "reviewing",
          olderDate,
        ]
      );
      db.run(
        `INSERT INTO user_progress (id, session_id, challenge_id, repetitions, ease_factor, interval, mastery_level, next_review_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "progress-recent",
          sessionId,
          "challenge-order-2",
          2,
          2.5,
          5,
          "reviewing",
          recentDate,
        ]
      );

      const res = await app.request(
        `/api/progress/${sessionId}/review-queue`
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.length).toBe(2);
      // Most recent first (ORDER BY next_review_date DESC)
      expect(data[0].challengeId).toBe("challenge-order-2");
      expect(data[1].challengeId).toBe(MOCK_CHALLENGE.id);
    });
  });

  describe("GET /api/progress/:sessionId/challenge/:challengeId/history", () => {
    it("should return submission history for challenge", async () => {
      const sessionId = "test-session-history";
      const db = getTestDb();

      // Create submissions
      db.run(
        `INSERT INTO submissions (id, session_id, challenge_id, code, passed, test_results, execution_time_ms, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "sub-1",
          sessionId,
          MOCK_CHALLENGE.id,
          "code v1",
          0,
          "[]",
          100,
          new Date(Date.now() - 3600000).toISOString(),
        ]
      );
      db.run(
        `INSERT INTO submissions (id, session_id, challenge_id, code, passed, test_results, execution_time_ms, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "sub-2",
          sessionId,
          MOCK_CHALLENGE.id,
          "code v2",
          1,
          "[]",
          50,
          new Date().toISOString(),
        ]
      );

      const res = await app.request(
        `/api/progress/${sessionId}/challenge/${MOCK_CHALLENGE.id}/history`
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);

      // Most recent first
      expect(data[0].code).toBe("code v2");
      expect(data[0].passed).toBe(true);
      expect(data[1].code).toBe("code v1");
      expect(data[1].passed).toBe(false);
    });

    it("should return empty array for no submissions", async () => {
      const res = await app.request(
        `/api/progress/new-session/challenge/${MOCK_CHALLENGE.id}/history`
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });

    it("should limit to 10 submissions", async () => {
      const sessionId = "test-session-limit";
      const db = getTestDb();

      // Create 15 submissions
      for (let i = 0; i < 15; i++) {
        db.run(
          `INSERT INTO submissions (id, session_id, challenge_id, code, passed, test_results, execution_time_ms, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `sub-limit-${i}`,
            sessionId,
            MOCK_CHALLENGE.id,
            `code v${i}`,
            i % 2,
            "[]",
            100,
            new Date(Date.now() - i * 60000).toISOString(),
          ]
        );
      }

      const res = await app.request(
        `/api/progress/${sessionId}/challenge/${MOCK_CHALLENGE.id}/history`
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.length).toBe(10);
    });

    it("should include formatted submission data", async () => {
      const sessionId = "test-session-format";
      const db = getTestDb();

      const createdAt = new Date().toISOString();
      db.run(
        `INSERT INTO submissions (id, session_id, challenge_id, code, passed, test_results, execution_time_ms, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          "sub-format",
          sessionId,
          MOCK_CHALLENGE.id,
          "function test() {}",
          1,
          '[{"passed": true}]',
          150,
          createdAt,
        ]
      );

      const res = await app.request(
        `/api/progress/${sessionId}/challenge/${MOCK_CHALLENGE.id}/history`
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data[0]).toMatchObject({
        id: "sub-format",
        sessionId,
        challengeId: MOCK_CHALLENGE.id,
        code: "function test() {}",
        passed: true,
        executionTimeMs: 150,
      });
      expect(data[0].testResults).toBeDefined();
      expect(data[0].createdAt).toBeDefined();
    });
  });
});
