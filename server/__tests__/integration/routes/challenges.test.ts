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
  MOCK_TEST_CASE,
  MOCK_TEST_CASE_HIDDEN,
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

describe("Challenges API", () => {
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
    const challengesRoutes = require("../../../routes/challenges").default;
    app = new Hono();
    app.route("/api/challenges", challengesRoutes);
  });

  afterEach(() => {
    teardownTestDb();
  });

  describe("GET /api/challenges/:id", () => {
    it("should return challenge with test cases for valid ID", async () => {
      const res = await app.request(`/api/challenges/${MOCK_CHALLENGE.id}`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.id).toBe(MOCK_CHALLENGE.id);
      expect(data.title).toBe(MOCK_CHALLENGE.title);
      expect(data.description).toBe(MOCK_CHALLENGE.description);
      expect(data.type).toBe(MOCK_CHALLENGE.type);
      expect(data.difficulty).toBe(MOCK_CHALLENGE.difficulty);
      expect(data.starterCode).toBe(MOCK_CHALLENGE.starter_code);
    });

    it("should filter out hidden test cases", async () => {
      const res = await app.request(`/api/challenges/${MOCK_CHALLENGE.id}`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.testCases).toBeDefined();
      expect(Array.isArray(data.testCases)).toBe(true);
      // Only non-hidden test case should be returned
      expect(data.testCases.length).toBe(1);
      expect(data.testCases[0].id).toBe(MOCK_TEST_CASE.id);

      // Hidden test case should not be present
      const hiddenCase = data.testCases.find(
        (tc: { id: string }) => tc.id === MOCK_TEST_CASE_HIDDEN.id
      );
      expect(hiddenCase).toBeUndefined();
    });

    it("should return 404 for invalid ID", async () => {
      const res = await app.request("/api/challenges/nonexistent-id");
      expect(res.status).toBe(404);

      const data = await res.json();
      expect(data.error).toBe("Challenge not found");
    });

    it("should include concept and lesson information", async () => {
      const res = await app.request(`/api/challenges/${MOCK_CHALLENGE.id}`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.concept).toBeDefined();
      expect(data.concept.id).toBe(MOCK_CONCEPT.id);
      expect(data.concept.title).toBe(MOCK_CONCEPT.title);
      expect(data.concept.lesson).toBeDefined();
      expect(data.concept.lesson.id).toBe(MOCK_LESSON.id);
      expect(data.concept.lesson.title).toBe(MOCK_LESSON.title);
      expect(data.concept.lesson.slug).toBe(MOCK_LESSON.slug);
    });

    it("should include lastSubmission when sessionId provided", async () => {
      const db = getTestDb();
      const sessionId = "test-session-123";

      // Create a submission
      db.run(
        `INSERT INTO submissions (id, session_id, challenge_id, code, passed, test_results, execution_time_ms)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          "submission-1",
          sessionId,
          MOCK_CHALLENGE.id,
          "function test() { return true; }",
          1,
          "[]",
          100,
        ]
      );

      const res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}?sessionId=${sessionId}`
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.lastSubmission).toBeDefined();
      expect(data.lastSubmission.code).toBe("function test() { return true; }");
      expect(data.lastSubmission.passed).toBe(true);
    });

    it("should return null lastSubmission when no sessionId provided", async () => {
      const res = await app.request(`/api/challenges/${MOCK_CHALLENGE.id}`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.lastSubmission).toBeNull();
    });

    it("should return null lastSubmission when session has no submissions", async () => {
      const res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}?sessionId=new-session`
      );
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.lastSubmission).toBeNull();
    });
  });

  describe("POST /api/challenges/:id/record", () => {
    it("should record submission successfully", async () => {
      const sessionId = "test-session-record";
      const res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}/record`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: "function solution() {}",
            passed: true,
            sessionId,
          }),
        }
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      // Verify submission was created
      const db = getTestDb();
      const submission = db
        .query(
          "SELECT * FROM submissions WHERE session_id = ? AND challenge_id = ?"
        )
        .get(sessionId, MOCK_CHALLENGE.id);
      expect(submission).toBeTruthy();
    });

    it("should create user_progress when passed", async () => {
      const sessionId = "test-session-progress";
      const res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}/record`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: "function solution() {}",
            passed: true,
            sessionId,
          }),
        }
      );

      expect(res.status).toBe(200);

      // Verify progress was created
      const db = getTestDb();
      const progress = db
        .query(
          "SELECT * FROM user_progress WHERE session_id = ? AND challenge_id = ?"
        )
        .get(sessionId, MOCK_CHALLENGE.id);
      expect(progress).toBeTruthy();
    });

    it("should update existing user_progress on subsequent submissions", async () => {
      const sessionId = "test-session-update";
      const db = getTestDb();

      // Create initial progress
      db.run(
        `INSERT INTO user_progress (id, session_id, challenge_id, repetitions, ease_factor, interval, mastery_level)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          "progress-update-1",
          sessionId,
          MOCK_CHALLENGE.id,
          1,
          2.5,
          1,
          "learning",
        ]
      );

      const res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}/record`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: "function solution() {}",
            passed: true,
            sessionId,
          }),
        }
      );

      expect(res.status).toBe(200);

      // Verify progress was updated (not duplicated)
      const progressCount = db
        .query(
          "SELECT COUNT(*) as count FROM user_progress WHERE session_id = ? AND challenge_id = ?"
        )
        .get(sessionId, MOCK_CHALLENGE.id) as { count: number };
      expect(progressCount.count).toBe(1);
    });

    it("should return 400 for missing required fields", async () => {
      // Missing code
      let res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}/record`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            passed: true,
            sessionId: "test",
          }),
        }
      );
      expect(res.status).toBe(400);

      // Missing sessionId
      res = await app.request(`/api/challenges/${MOCK_CHALLENGE.id}/record`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "test",
          passed: true,
        }),
      });
      expect(res.status).toBe(400);

      // Missing passed
      res = await app.request(`/api/challenges/${MOCK_CHALLENGE.id}/record`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "test",
          sessionId: "test",
        }),
      });
      expect(res.status).toBe(400);
    });

    it("should return 404 for invalid challenge ID", async () => {
      const res = await app.request("/api/challenges/invalid-id/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "test",
          passed: true,
          sessionId: "test",
        }),
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe("Challenge not found");
    });

    it("should not create progress when submission fails", async () => {
      const sessionId = "test-session-fail";
      const res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}/record`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: "function broken() {}",
            passed: false,
            sessionId,
          }),
        }
      );

      expect(res.status).toBe(200);

      // Verify submission was created but no progress
      const db = getTestDb();
      const submission = db
        .query(
          "SELECT * FROM submissions WHERE session_id = ? AND challenge_id = ?"
        )
        .get(sessionId, MOCK_CHALLENGE.id);
      expect(submission).toBeTruthy();

      const progress = db
        .query(
          "SELECT * FROM user_progress WHERE session_id = ? AND challenge_id = ?"
        )
        .get(sessionId, MOCK_CHALLENGE.id);
      expect(progress).toBeNull();
    });
  });

  describe("DELETE /api/challenges/:id/progress", () => {
    it("should clear submissions and progress for session", async () => {
      const sessionId = "test-session-delete";
      const db = getTestDb();

      // Create submission and progress
      db.run(
        `INSERT INTO submissions (id, session_id, challenge_id, code, passed)
         VALUES (?, ?, ?, ?, ?)`,
        ["submission-del", sessionId, MOCK_CHALLENGE.id, "code", 1]
      );
      db.run(
        `INSERT INTO user_progress (id, session_id, challenge_id, repetitions, ease_factor, interval, mastery_level)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ["progress-del", sessionId, MOCK_CHALLENGE.id, 1, 2.5, 1, "learning"]
      );

      const res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}/progress?sessionId=${sessionId}`,
        { method: "DELETE" }
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);

      // Verify data was deleted
      const submission = db
        .query(
          "SELECT * FROM submissions WHERE session_id = ? AND challenge_id = ?"
        )
        .get(sessionId, MOCK_CHALLENGE.id);
      expect(submission).toBeNull();

      const progress = db
        .query(
          "SELECT * FROM user_progress WHERE session_id = ? AND challenge_id = ?"
        )
        .get(sessionId, MOCK_CHALLENGE.id);
      expect(progress).toBeNull();
    });

    it("should return success even if no data existed", async () => {
      const res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}/progress?sessionId=nonexistent-session`,
        { method: "DELETE" }
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it("should return 400 for missing sessionId", async () => {
      const res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}/progress`,
        { method: "DELETE" }
      );

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Missing sessionId");
    });
  });
});
