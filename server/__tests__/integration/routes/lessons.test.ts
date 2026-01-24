import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { Hono } from "hono";
import {
  setupTestDb,
  teardownTestDb,
  getTestDb,
} from "../../fixtures/test-db";
import { seedTestData } from "../../fixtures/helpers";
import {
  MOCK_LESSON,
  MOCK_LESSON_2,
  MOCK_CONCEPT,
  MOCK_CHALLENGE,
  MOCK_LESSON_UNPUBLISHED,
} from "../../fixtures/mock-data";

// We need to mock the db module before importing routes
// The routes import db directly, so we mock it at the module level
const mockDb = {
  query: () => ({
    all: () => [],
    get: () => null,
  }),
  run: () => {},
  exec: () => {},
};

// Mock the db module
mock.module("../../../db", () => ({
  db: mockDb,
}));

describe("Lessons API", () => {
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
    const lessonsRoutes = require("../../../routes/lessons").default;
    app = new Hono();
    app.route("/api/lessons", lessonsRoutes);
  });

  afterEach(() => {
    teardownTestDb();
  });

  describe("GET /api/lessons", () => {
    it("should return array of published lessons", async () => {
      const res = await app.request("/api/lessons");
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2); // MOCK_LESSON and MOCK_LESSON_2 are published
    });

    it("should include nested concepts and challenges", async () => {
      const res = await app.request("/api/lessons");
      expect(res.status).toBe(200);

      const data = await res.json();
      const lesson = data.find((l: { id: string }) => l.id === MOCK_LESSON.id);

      expect(lesson).toBeDefined();
      expect(lesson.concepts).toBeDefined();
      expect(Array.isArray(lesson.concepts)).toBe(true);
      expect(lesson.concepts.length).toBe(1);

      const concept = lesson.concepts[0];
      expect(concept.id).toBe(MOCK_CONCEPT.id);
      expect(concept.challenges).toBeDefined();
      expect(Array.isArray(concept.challenges)).toBe(true);
      expect(concept.challenges.length).toBe(1);
      expect(concept.challenges[0].id).toBe(MOCK_CHALLENGE.id);
    });

    it("should filter out unpublished lessons", async () => {
      // Add an unpublished lesson
      const db = getTestDb();
      db.run(
        `INSERT INTO lessons (id, title, slug, description, order_index, is_published)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          MOCK_LESSON_UNPUBLISHED.id,
          MOCK_LESSON_UNPUBLISHED.title,
          MOCK_LESSON_UNPUBLISHED.slug,
          MOCK_LESSON_UNPUBLISHED.description,
          MOCK_LESSON_UNPUBLISHED.order_index,
          MOCK_LESSON_UNPUBLISHED.is_published,
        ]
      );

      const res = await app.request("/api/lessons");
      expect(res.status).toBe(200);

      const data = await res.json();
      const unpublished = data.find(
        (l: { id: string }) => l.id === MOCK_LESSON_UNPUBLISHED.id
      );
      expect(unpublished).toBeUndefined();
    });

    it("should return lessons ordered by order_index", async () => {
      const res = await app.request("/api/lessons");
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data[0].orderIndex).toBeLessThan(data[1].orderIndex);
    });
  });

  describe("GET /api/lessons/:slug", () => {
    it("should return lesson details for valid slug", async () => {
      const res = await app.request(`/api/lessons/${MOCK_LESSON.slug}`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.id).toBe(MOCK_LESSON.id);
      expect(data.title).toBe(MOCK_LESSON.title);
      expect(data.slug).toBe(MOCK_LESSON.slug);
      expect(data.description).toBe(MOCK_LESSON.description);
    });

    it("should return 404 for invalid slug", async () => {
      const res = await app.request("/api/lessons/nonexistent-slug");
      expect(res.status).toBe(404);

      const data = await res.json();
      expect(data.error).toBe("Lesson not found");
    });

    it("should include concepts with challenges", async () => {
      const res = await app.request(`/api/lessons/${MOCK_LESSON.slug}`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.concepts).toBeDefined();
      expect(data.concepts.length).toBe(1);

      const concept = data.concepts[0];
      expect(concept.id).toBe(MOCK_CONCEPT.id);
      expect(concept.title).toBe(MOCK_CONCEPT.title);
      expect(concept.explanation).toBe(MOCK_CONCEPT.explanation);
      expect(concept.challenges).toBeDefined();
      expect(concept.challenges.length).toBe(1);

      const challenge = concept.challenges[0];
      expect(challenge.id).toBe(MOCK_CHALLENGE.id);
      expect(challenge.title).toBe(MOCK_CHALLENGE.title);
      expect(challenge.type).toBe(MOCK_CHALLENGE.type);
      expect(challenge.difficulty).toBe(MOCK_CHALLENGE.difficulty);
    });

    it("should return empty concepts array for lesson without concepts", async () => {
      const res = await app.request(`/api/lessons/${MOCK_LESSON_2.slug}`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.id).toBe(MOCK_LESSON_2.id);
      expect(data.concepts).toBeDefined();
      expect(data.concepts.length).toBe(0);
    });
  });
});
