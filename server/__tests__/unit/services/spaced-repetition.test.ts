import { describe, it, expect } from "bun:test";
import {
  calculateNextReview,
  qualityFromPassed,
  type ProgressUpdate,
} from "../../../services/spaced-repetition";

describe("spaced-repetition", () => {
  describe("qualityFromPassed", () => {
    it("returns 2 when failed (passed=false)", () => {
      expect(qualityFromPassed(false, false)).toBe(2);
      expect(qualityFromPassed(false, true)).toBe(2);
    });

    it("returns 3 when passed with hint (passed=true, hintUsed=true)", () => {
      expect(qualityFromPassed(true, true)).toBe(3);
    });

    it("returns 4 when passed without hint (passed=true, hintUsed=false)", () => {
      expect(qualityFromPassed(true, false)).toBe(4);
    });
  });

  describe("calculateNextReview", () => {
    it("first review with quality 4 returns repetitions=1, interval>0, masteryLevel='learning'", () => {
      const result = calculateNextReview(0, 2.5, 0, 4);

      expect(result.repetitions).toBe(1);
      expect(result.interval).toBeGreaterThan(0);
      expect(result.masteryLevel).toBe("learning");
    });

    it("quality < 3 resets repetitions to 0", () => {
      // Start with some repetitions built up
      const initialResult = calculateNextReview(3, 2.5, 10, 4);
      expect(initialResult.repetitions).toBeGreaterThan(0);

      // Now fail with quality 2
      const failResult = calculateNextReview(
        initialResult.repetitions,
        initialResult.easeFactor,
        initialResult.interval,
        2
      );

      expect(failResult.repetitions).toBe(0);
    });

    it("after 5+ successful reviews with good ease factor, masteryLevel transitions to 'mastered'", () => {
      // Simulate multiple successful reviews
      let repetitions = 0;
      let easeFactor = 2.5;
      let interval = 0;
      let result: ProgressUpdate;

      // Do 6 successful reviews with quality 4
      for (let i = 0; i < 6; i++) {
        result = calculateNextReview(repetitions, easeFactor, interval, 4);
        repetitions = result.repetitions;
        easeFactor = result.easeFactor;
        interval = result.interval;
      }

      // After 5+ repetitions with ease factor >= 2.3, should be mastered
      expect(result!.repetitions).toBeGreaterThanOrEqual(5);
      expect(result!.easeFactor).toBeGreaterThanOrEqual(2.3);
      expect(result!.masteryLevel).toBe("mastered");
    });

    it("after 2+ successful reviews, masteryLevel transitions to 'reviewing'", () => {
      let repetitions = 0;
      let easeFactor = 2.5;
      let interval = 0;
      let result: ProgressUpdate;

      // Do 2 successful reviews with quality 4
      for (let i = 0; i < 2; i++) {
        result = calculateNextReview(repetitions, easeFactor, interval, 4);
        repetitions = result.repetitions;
        easeFactor = result.easeFactor;
        interval = result.interval;
      }

      expect(result!.repetitions).toBeGreaterThanOrEqual(2);
      expect(result!.masteryLevel).toBe("reviewing");
    });

    it("ease factor stays >= 1.3 even after many failures", () => {
      let repetitions = 5;
      let easeFactor = 2.5;
      let interval = 30;
      let result: ProgressUpdate;

      // Simulate many failures with quality 0
      for (let i = 0; i < 10; i++) {
        result = calculateNextReview(repetitions, easeFactor, interval, 0);
        repetitions = result.repetitions;
        easeFactor = result.easeFactor;
        interval = result.interval;
      }

      // SM-2 algorithm should keep ease factor at minimum 1.3
      expect(result!.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it("returns valid Date for nextReviewDate", () => {
      const result = calculateNextReview(0, 2.5, 0, 4);

      expect(result.nextReviewDate).toBeInstanceOf(Date);
      expect(result.nextReviewDate.getTime()).toBeGreaterThan(Date.now() - 1000); // Should be in the future (allow 1s tolerance)
    });
  });
});
