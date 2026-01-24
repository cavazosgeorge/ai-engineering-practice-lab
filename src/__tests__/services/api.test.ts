import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import {
  createMockLocalStorage,
  createMockFetch,
  createMockCrypto,
  setupGlobalMocks,
  jsonResponse,
  errorResponse,
} from "../setup/test-utils";

// We need to import the API functions dynamically after setting up mocks
// to ensure they use our mocked globals

describe("API Client", () => {
  let mockStorage: Storage;
  let mockFetchSetup: ReturnType<typeof createMockFetch>;
  let mockCrypto: ReturnType<typeof createMockCrypto>;
  let cleanup: () => void;

  beforeEach(() => {
    mockStorage = createMockLocalStorage();
    mockFetchSetup = createMockFetch();
    mockCrypto = createMockCrypto("test-uuid-12345");

    cleanup = setupGlobalMocks({
      localStorage: mockStorage,
      fetch: mockFetchSetup.mockFetch,
      crypto: mockCrypto,
    });
  });

  afterEach(() => {
    cleanup();
    mockFetchSetup.reset();
  });

  describe("getSessionId", () => {
    it("returns existing sessionId from localStorage if present", async () => {
      // Pre-set a session ID in localStorage
      mockStorage.setItem("sessionId", "existing-session-id");

      // Dynamically import to get fresh module with our mocks
      const { getSessionId } = await import("../../services/api");

      const result = getSessionId();
      expect(result).toBe("existing-session-id");
    });

    it("creates and stores new UUID if not present", async () => {
      // Ensure localStorage is empty
      expect(mockStorage.getItem("sessionId")).toBeNull();

      const { getSessionId } = await import("../../services/api");

      const result = getSessionId();

      // Should create a new UUID
      expect(result).toBe("test-uuid-12345");
      // Should store it in localStorage
      expect(mockStorage.getItem("sessionId")).toBe("test-uuid-12345");
    });

    it("returns same ID on subsequent calls", async () => {
      const { getSessionId } = await import("../../services/api");

      const firstCall = getSessionId();
      const secondCall = getSessionId();

      expect(firstCall).toBe(secondCall);
    });
  });

  describe("fetchLessons", () => {
    it("returns array of lessons on success", async () => {
      const mockLessons = [
        {
          id: "lesson-1",
          title: "Tokenization",
          slug: "tokenization",
          description: "Learn about tokenization",
          orderIndex: 0,
          concepts: [],
        },
        {
          id: "lesson-2",
          title: "Language Models",
          slug: "language-models",
          description: "Learn about LMs",
          orderIndex: 1,
          concepts: [],
        },
      ];

      mockFetchSetup.setResponse(jsonResponse(mockLessons));

      const { fetchLessons } = await import("../../services/api");

      const result = await fetchLessons();

      expect(result).toEqual(mockLessons);
      expect(mockFetchSetup.calls.length).toBe(1);
      expect(mockFetchSetup.calls[0].url).toBe("/api/lessons");
    });

    it("handles API errors appropriately", async () => {
      mockFetchSetup.setResponse(errorResponse(500, "Server Error"));

      const { fetchLessons } = await import("../../services/api");

      await expect(fetchLessons()).rejects.toThrow("Failed to fetch lessons");
    });
  });

  describe("fetchChallenge", () => {
    it("returns challenge with test cases on success", async () => {
      // Set up session ID first
      mockStorage.setItem("sessionId", "my-session-123");

      const mockChallenge = {
        id: "challenge-1",
        conceptId: "concept-1",
        type: "implement",
        title: "Implement BPE Tokenizer",
        description: "Implement a basic BPE tokenizer",
        starterCode: "def tokenize(text):\n    pass",
        hints: ["Think about splitting text first"],
        difficulty: "beginner",
        orderIndex: 0,
        testCases: [
          {
            id: "test-1",
            input: "hello world",
            expectedOutput: ["hello", "world"],
            description: "Basic tokenization",
          },
        ],
      };

      mockFetchSetup.setResponse(jsonResponse(mockChallenge));

      const { fetchChallenge } = await import("../../services/api");

      const result = await fetchChallenge("challenge-1");

      expect(result).toEqual(mockChallenge);
      expect(mockFetchSetup.calls.length).toBe(1);
      expect(mockFetchSetup.calls[0].url).toBe(
        "/api/challenges/challenge-1?sessionId=my-session-123"
      );
    });

    it("appends sessionId to query params", async () => {
      mockStorage.setItem("sessionId", "session-abc-xyz");
      mockFetchSetup.setResponse(jsonResponse({ id: "test" }));

      const { fetchChallenge } = await import("../../services/api");

      await fetchChallenge("test-challenge");

      expect(mockFetchSetup.calls[0].url).toContain("sessionId=session-abc-xyz");
    });

    it("handles 404 errors", async () => {
      mockStorage.setItem("sessionId", "test-session");
      mockFetchSetup.setResponse(errorResponse(404, "Challenge not found"));

      const { fetchChallenge } = await import("../../services/api");

      await expect(fetchChallenge("nonexistent")).rejects.toThrow(
        "Failed to fetch challenge"
      );
    });
  });

  describe("fetchProgress", () => {
    it("fetches progress with sessionId in URL", async () => {
      mockStorage.setItem("sessionId", "progress-session");

      const mockProgress = {
        progress: [
          {
            id: "progress-1",
            challengeId: "challenge-1",
            masteryLevel: "learning",
            nextReviewDate: null,
            repetitions: 0,
            challenge: { id: "challenge-1", title: "Test Challenge" },
          },
        ],
        stats: {
          total: 10,
          mastered: 3,
          reviewing: 2,
          learning: 5,
        },
      };

      mockFetchSetup.setResponse(jsonResponse(mockProgress));

      const { fetchProgress } = await import("../../services/api");

      const result = await fetchProgress();

      expect(result).toEqual(mockProgress);
      expect(mockFetchSetup.calls[0].url).toBe("/api/progress/progress-session");
    });
  });

  describe("recordSubmission", () => {
    it("sends POST request with correct payload", async () => {
      mockStorage.setItem("sessionId", "submit-session");
      mockFetchSetup.setResponse(jsonResponse({ success: true }));

      const { recordSubmission } = await import("../../services/api");

      await recordSubmission("challenge-1", "def solution():\n    pass", true, false);

      expect(mockFetchSetup.calls.length).toBe(1);
      expect(mockFetchSetup.calls[0].url).toBe("/api/challenges/challenge-1/record");
      expect(mockFetchSetup.calls[0].init?.method).toBe("POST");
      expect(mockFetchSetup.calls[0].init?.headers).toEqual({
        "Content-Type": "application/json",
      });

      const body = JSON.parse(mockFetchSetup.calls[0].init?.body as string);
      expect(body).toEqual({
        code: "def solution():\n    pass",
        passed: true,
        sessionId: "submit-session",
        hintUsed: false,
      });
    });

    it("handles submission errors", async () => {
      mockStorage.setItem("sessionId", "test-session");
      mockFetchSetup.setResponse(errorResponse(500, "Server error"));

      const { recordSubmission } = await import("../../services/api");

      await expect(
        recordSubmission("challenge-1", "code", false, false)
      ).rejects.toThrow("Failed to record submission");
    });
  });

  describe("fetchReviewQueue", () => {
    it("fetches review queue with sessionId", async () => {
      mockStorage.setItem("sessionId", "review-session");

      const mockQueue = [
        {
          id: "progress-1",
          challengeId: "challenge-1",
          masteryLevel: "reviewing",
          nextReviewDate: "2024-01-15T10:00:00Z",
          repetitions: 2,
          challenge: { id: "challenge-1", title: "Due for Review" },
        },
      ];

      mockFetchSetup.setResponse(jsonResponse(mockQueue));

      const { fetchReviewQueue } = await import("../../services/api");

      const result = await fetchReviewQueue();

      expect(result).toEqual(mockQueue);
      expect(mockFetchSetup.calls[0].url).toBe(
        "/api/progress/review-session/review-queue"
      );
    });
  });

  describe("resetChallengeProgress", () => {
    it("sends DELETE request with correct URL", async () => {
      mockStorage.setItem("sessionId", "reset-session");
      mockFetchSetup.setResponse(jsonResponse({ success: true }));

      const { resetChallengeProgress } = await import("../../services/api");

      await resetChallengeProgress("challenge-to-reset");

      expect(mockFetchSetup.calls.length).toBe(1);
      expect(mockFetchSetup.calls[0].url).toBe(
        "/api/challenges/challenge-to-reset/progress?sessionId=reset-session"
      );
      expect(mockFetchSetup.calls[0].init?.method).toBe("DELETE");
    });
  });
});
