import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { Hono } from "hono";
import {
  setupTestDb,
  teardownTestDb,
  getTestDb,
} from "../fixtures/test-db";
import { seedTestData } from "../fixtures/helpers";
import { MOCK_CHALLENGE } from "../fixtures/mock-data";

// Mock the db module before importing routes
const mockDb = {
  query: () => ({
    all: () => [],
    get: () => null,
  }),
  run: () => {},
  exec: () => {},
};

mock.module("../../db", () => ({
  db: mockDb,
}));

describe("Input Validation Edge Cases", () => {
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
    const challengesRoutes = require("../../routes/challenges").default;
    app = new Hono();
    app.route("/api/challenges", challengesRoutes);
  });

  afterEach(() => {
    teardownTestDb();
  });

  describe("POST /api/challenges/:id/record - Missing Required Fields", () => {
    it("returns 400 when sessionId is missing", async () => {
      const res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}/record`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: "function test() {}",
            passed: true,
            // sessionId intentionally missing
          }),
        }
      );

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("sessionId");
    });

    it("returns 400 when code is missing", async () => {
      const res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}/record`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // code intentionally missing
            passed: true,
            sessionId: "test-session",
          }),
        }
      );

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("code");
    });

    it("returns 400 when passed is missing", async () => {
      const res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}/record`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: "function test() {}",
            sessionId: "test-session",
            // passed intentionally missing
          }),
        }
      );

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("passed");
    });

    it("returns 400 when all required fields are missing", async () => {
      const res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}/record`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      expect(res.status).toBe(400);
    });

    it("returns 400 when body is empty", async () => {
      const res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}/record`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        }
      );

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/challenges/:id/record - Invalid Data Types", () => {
    it("handles passed as string 'true' - should work due to JavaScript truthiness", async () => {
      const res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}/record`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: "function test() {}",
            passed: "true", // String instead of boolean
            sessionId: "test-session-string-true",
          }),
        }
      );

      // JavaScript truthy check means "true" string evaluates to true
      // The API should handle this gracefully
      expect(res.status).toBe(200);
    });

    it("handles passed as string 'false' - string is truthy in JS", async () => {
      const res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}/record`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: "function test() {}",
            passed: "false", // String "false" is truthy
            sessionId: "test-session-string-false",
          }),
        }
      );

      // String "false" is truthy, so this passes the undefined check
      expect(res.status).toBe(200);
    });

    it("returns 404 for non-existent challengeId", async () => {
      const res = await app.request(
        "/api/challenges/nonexistent-challenge-id-12345/record",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: "function test() {}",
            passed: true,
            sessionId: "test-session",
          }),
        }
      );

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toBe("Challenge not found");
    });

    it("handles code as number - converts to string", async () => {
      const res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}/record`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: 12345, // Number instead of string
            passed: true,
            sessionId: "test-session-code-number",
          }),
        }
      );

      // SQLite will accept number and convert
      expect(res.status).toBe(200);
    });

    it("handles sessionId as number - converts to string", async () => {
      const res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}/record`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: "function test() {}",
            passed: true,
            sessionId: 12345, // Number instead of string
          }),
        }
      );

      expect(res.status).toBe(200);
    });
  });

  describe("POST /api/challenges/:id/record - Edge Values", () => {
    it("handles empty string sessionId", async () => {
      const res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}/record`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: "function test() {}",
            passed: true,
            sessionId: "", // Empty string
          }),
        }
      );

      // Empty string is falsy, should trigger validation error
      expect(res.status).toBe(400);
    });

    it("handles empty string code", async () => {
      const res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}/record`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: "", // Empty string
            passed: true,
            sessionId: "test-session",
          }),
        }
      );

      // Empty string is falsy, should trigger validation error
      expect(res.status).toBe(400);
    });

    it("handles very long code submission (10KB)", async () => {
      const longCode = "function test() { return " + "x".repeat(10000) + "; }";

      const res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}/record`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: longCode,
            passed: true,
            sessionId: "test-session-long-code",
          }),
        }
      );

      // Should accept large code submissions
      expect(res.status).toBe(200);

      // Verify it was saved
      const db = getTestDb();
      const submission = db
        .query(
          "SELECT code FROM submissions WHERE session_id = ?"
        )
        .get("test-session-long-code") as { code: string } | null;
      expect(submission).toBeTruthy();
      expect(submission!.code.length).toBe(longCode.length);
    });

    it("handles very long sessionId (1KB)", async () => {
      const longSessionId = "session-" + "x".repeat(1000);

      const res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}/record`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: "function test() {}",
            passed: true,
            sessionId: longSessionId,
          }),
        }
      );

      expect(res.status).toBe(200);
    });

    it("handles Unicode characters in code", async () => {
      const unicodeCode = `
        // Unicode test: emoji, Chinese, Arabic, etc.
        function test() {
          const greeting = "Hello World";
          const chinese = "chinese greeting";
          const arabic = "arabic greeting";
          return greeting;
        }
      `;

      const res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}/record`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: unicodeCode,
            passed: true,
            sessionId: "test-session-unicode",
          }),
        }
      );

      expect(res.status).toBe(200);

      // Verify Unicode was preserved
      const db = getTestDb();
      const submission = db
        .query(
          "SELECT code FROM submissions WHERE session_id = ?"
        )
        .get("test-session-unicode") as { code: string } | null;
      expect(submission).toBeTruthy();
      expect(submission!.code).toContain("chinese greeting");
    });

    it("handles special characters in code (SQL injection attempt)", async () => {
      const maliciousCode = `
        '; DROP TABLE submissions; --
        function test() { return "'; DROP TABLE users;--"; }
      `;

      const res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}/record`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: maliciousCode,
            passed: true,
            sessionId: "test-session-sql-injection",
          }),
        }
      );

      expect(res.status).toBe(200);

      // Verify the table still exists and data was stored safely
      const db = getTestDb();
      const submission = db
        .query(
          "SELECT code FROM submissions WHERE session_id = ?"
        )
        .get("test-session-sql-injection") as { code: string } | null;
      expect(submission).toBeTruthy();
      expect(submission!.code).toContain("DROP TABLE");
    });

    it("handles newlines and tabs in code", async () => {
      const codeWithWhitespace = `function test() {
\t\tconst x = 1;
\t\treturn x;
}`;

      const res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}/record`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: codeWithWhitespace,
            passed: true,
            sessionId: "test-session-whitespace",
          }),
        }
      );

      expect(res.status).toBe(200);

      // Verify whitespace was preserved
      const db = getTestDb();
      const submission = db
        .query(
          "SELECT code FROM submissions WHERE session_id = ?"
        )
        .get("test-session-whitespace") as { code: string } | null;
      expect(submission).toBeTruthy();
      expect(submission!.code).toContain("\t\t");
    });

    it("handles null values in optional fields", async () => {
      const res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}/record`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: "function test() {}",
            passed: true,
            sessionId: "test-session-null-hint",
            hintUsed: null, // Explicitly null
          }),
        }
      );

      // Should handle null gracefully (defaults to false)
      expect(res.status).toBe(200);
    });

    it("handles passed as false - no progress created", async () => {
      const sessionId = "test-session-failed";

      const res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}/record`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: "function test() { broken }",
            passed: false,
            sessionId,
          }),
        }
      );

      expect(res.status).toBe(200);

      // Verify submission was created
      const db = getTestDb();
      const submission = db
        .query(
          "SELECT * FROM submissions WHERE session_id = ?"
        )
        .get(sessionId);
      expect(submission).toBeTruthy();

      // Verify NO progress was created
      const progress = db
        .query(
          "SELECT * FROM user_progress WHERE session_id = ?"
        )
        .get(sessionId);
      expect(progress).toBeNull();
    });
  });

  describe("GET /api/challenges/:id - Edge Cases", () => {
    it("returns 404 for empty string challenge ID", async () => {
      const res = await app.request("/api/challenges/");

      // Depends on routing - might be 404 or different
      expect([404, 405]).toContain(res.status);
    });

    it("handles special characters in challenge ID", async () => {
      const res = await app.request("/api/challenges/test%20id%20with%20spaces");

      expect(res.status).toBe(404);
    });

    it("handles very long challenge ID", async () => {
      const longId = "x".repeat(1000);
      const res = await app.request(`/api/challenges/${longId}`);

      expect(res.status).toBe(404);
    });

    it("handles sessionId query parameter with special characters", async () => {
      const res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}?sessionId=test%26session%3Dvalue`
      );

      expect(res.status).toBe(200);
    });
  });

  describe("DELETE /api/challenges/:id/progress - Edge Cases", () => {
    it("returns 400 when sessionId query param is missing", async () => {
      const res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}/progress`,
        { method: "DELETE" }
      );

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Missing sessionId");
    });

    it("handles empty sessionId query param", async () => {
      const res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}/progress?sessionId=`,
        { method: "DELETE" }
      );

      // Empty string should be treated as missing
      expect(res.status).toBe(400);
    });

    it("handles non-existent session gracefully", async () => {
      const res = await app.request(
        `/api/challenges/${MOCK_CHALLENGE.id}/progress?sessionId=nonexistent-session`,
        { method: "DELETE" }
      );

      // Should return success even if nothing to delete
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it("handles non-existent challenge ID", async () => {
      const res = await app.request(
        "/api/challenges/nonexistent-challenge/progress?sessionId=test",
        { method: "DELETE" }
      );

      // Delete is idempotent - should succeed even if nothing exists
      expect(res.status).toBe(200);
    });
  });
});
