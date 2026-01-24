import { describe, it, expect } from "bun:test";
import {
  calculateNextReview,
  qualityFromPassed,
  type ProgressUpdate,
} from "../../services/spaced-repetition";

describe("Spaced Repetition Edge Cases - Boundary Conditions", () => {
  describe("Quality Boundaries", () => {
    it("quality = 0 (minimum valid) - complete blackout", () => {
      const result = calculateNextReview(3, 2.5, 10, 0);

      // Quality < 3 resets repetitions
      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
      expect(result.masteryLevel).toBe("learning");
      // Ease factor decreases but stays >= 1.3
      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
      expect(result.easeFactor).toBeLessThan(2.5);
    });

    it("quality = 5 (maximum valid) - perfect recall", () => {
      const result = calculateNextReview(0, 2.5, 0, 5);

      expect(result.repetitions).toBe(1);
      expect(result.interval).toBeGreaterThan(0);
      // Ease factor should increase with perfect recall
      expect(result.easeFactor).toBeGreaterThanOrEqual(2.5);
    });

    it("quality = 2 (boundary for reset) - should reset repetitions", () => {
      // Build up some progress first
      let result = calculateNextReview(0, 2.5, 0, 4);
      result = calculateNextReview(result.repetitions, result.easeFactor, result.interval, 4);
      result = calculateNextReview(result.repetitions, result.easeFactor, result.interval, 4);

      // Now fail with quality 2
      const failResult = calculateNextReview(
        result.repetitions,
        result.easeFactor,
        result.interval,
        2
      );

      expect(failResult.repetitions).toBe(0);
      expect(failResult.interval).toBe(1);
      expect(failResult.masteryLevel).toBe("learning");
    });

    it("quality = 3 (boundary for not reset) - should NOT reset repetitions", () => {
      // Build up some progress first
      let result = calculateNextReview(0, 2.5, 0, 4);
      result = calculateNextReview(result.repetitions, result.easeFactor, result.interval, 4);
      result = calculateNextReview(result.repetitions, result.easeFactor, result.interval, 4);

      const initialReps = result.repetitions;

      // Quality 3 should not reset
      const borderlineResult = calculateNextReview(
        result.repetitions,
        result.easeFactor,
        result.interval,
        3
      );

      // Repetitions should continue, not reset
      expect(borderlineResult.repetitions).toBe(initialReps + 1);
      expect(borderlineResult.interval).toBeGreaterThan(0);
    });
  });

  describe("Ease Factor Boundaries", () => {
    it("multiple consecutive failures (quality 0) - ease stays >= 1.3", () => {
      let repetitions = 5;
      let easeFactor = 2.5;
      let interval = 30;
      let result: ProgressUpdate;

      // Simulate 20 consecutive complete failures
      for (let i = 0; i < 20; i++) {
        result = calculateNextReview(repetitions, easeFactor, interval, 0);
        repetitions = result.repetitions;
        easeFactor = result.easeFactor;
        interval = result.interval;
      }

      // SM-2 algorithm minimum ease factor is 1.3
      expect(result!.easeFactor).toBeGreaterThanOrEqual(1.3);
      expect(result!.easeFactor).toBeLessThanOrEqual(1.31); // Should be at minimum
    });

    it("multiple consecutive failures (quality 1) - ease stays >= 1.3", () => {
      let repetitions = 5;
      let easeFactor = 2.5;
      let interval = 30;
      let result: ProgressUpdate;

      // Simulate many failures with quality 1
      for (let i = 0; i < 20; i++) {
        result = calculateNextReview(repetitions, easeFactor, interval, 1);
        repetitions = result.repetitions;
        easeFactor = result.easeFactor;
        interval = result.interval;
      }

      expect(result!.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it("multiple consecutive perfect scores (quality 5) - ease increases appropriately", () => {
      let repetitions = 0;
      let easeFactor = 2.5;
      let interval = 0;
      let result: ProgressUpdate;

      const initialEase = easeFactor;

      // Simulate many perfect recalls
      for (let i = 0; i < 10; i++) {
        result = calculateNextReview(repetitions, easeFactor, interval, 5);
        repetitions = result.repetitions;
        easeFactor = result.easeFactor;
        interval = result.interval;
      }

      // Ease factor should have increased
      expect(result!.easeFactor).toBeGreaterThan(initialEase);
    });

    it("high ease factor with failure - decreases but stays reasonable", () => {
      // Start with a very high ease factor
      let easeFactor = 3.5;
      let repetitions = 10;
      let interval = 60;

      const result = calculateNextReview(repetitions, easeFactor, interval, 0);

      // Should decrease significantly but stay above minimum
      expect(result.easeFactor).toBeLessThan(3.5);
      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it("minimum ease factor (1.3) with success - should not go below 1.3", () => {
      let repetitions = 0;
      let easeFactor = 1.3;
      let interval = 1;

      // Even with mediocre quality, ease should stay at minimum
      const result = calculateNextReview(repetitions, easeFactor, interval, 3);

      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
    });
  });

  describe("Interval Calculations", () => {
    it("first review - interval should be 1", () => {
      const result = calculateNextReview(0, 2.5, 0, 4);

      expect(result.repetitions).toBe(1);
      expect(result.interval).toBe(1);
    });

    it("second successful review - interval should be 6", () => {
      // First review
      const first = calculateNextReview(0, 2.5, 0, 4);
      expect(first.interval).toBe(1);

      // Second review
      const second = calculateNextReview(
        first.repetitions,
        first.easeFactor,
        first.interval,
        4
      );

      expect(second.repetitions).toBe(2);
      expect(second.interval).toBe(6);
    });

    it("third+ successful reviews - interval multiplied by ease", () => {
      // Build up to third review
      let result = calculateNextReview(0, 2.5, 0, 4); // rep 1, interval 1
      result = calculateNextReview(
        result.repetitions,
        result.easeFactor,
        result.interval,
        4
      ); // rep 2, interval 6

      const secondInterval = result.interval;
      const currentEase = result.easeFactor;

      // Third review
      result = calculateNextReview(
        result.repetitions,
        result.easeFactor,
        result.interval,
        4
      );

      // Interval should be approximately previous * ease factor
      const expectedInterval = Math.round(secondInterval * currentEase);
      expect(result.interval).toBeCloseTo(expectedInterval, 0);
      expect(result.repetitions).toBe(3);
    });

    it("failure resets interval to 1", () => {
      // Build up progress
      let result = calculateNextReview(0, 2.5, 0, 4);
      result = calculateNextReview(
        result.repetitions,
        result.easeFactor,
        result.interval,
        4
      );
      result = calculateNextReview(
        result.repetitions,
        result.easeFactor,
        result.interval,
        4
      );

      expect(result.interval).toBeGreaterThan(6);

      // Fail
      const failResult = calculateNextReview(
        result.repetitions,
        result.easeFactor,
        result.interval,
        0
      );

      expect(failResult.interval).toBe(1);
    });

    it("interval grows exponentially with consistent success", () => {
      let repetitions = 0;
      let easeFactor = 2.5;
      let interval = 0;
      const intervals: number[] = [];

      // Track intervals over multiple reviews
      for (let i = 0; i < 6; i++) {
        const result = calculateNextReview(repetitions, easeFactor, interval, 4);
        intervals.push(result.interval);
        repetitions = result.repetitions;
        easeFactor = result.easeFactor;
        interval = result.interval;
      }

      // Verify intervals are increasing (after the first two fixed intervals)
      expect(intervals[0]).toBe(1);
      expect(intervals[1]).toBe(6);
      for (let i = 3; i < intervals.length; i++) {
        expect(intervals[i]).toBeGreaterThan(intervals[i - 1]);
      }
    });
  });

  describe("Mastery Level Transitions", () => {
    it("0-1 reps - mastery level should be 'learning'", () => {
      const result0 = calculateNextReview(0, 2.5, 0, 4);
      expect(result0.masteryLevel).toBe("learning");
      expect(result0.repetitions).toBe(1);
    });

    it("2-4 reps - mastery level should be 'reviewing'", () => {
      let repetitions = 0;
      let easeFactor = 2.5;
      let interval = 0;
      let result: ProgressUpdate;

      // Build up to 2 repetitions
      for (let i = 0; i < 2; i++) {
        result = calculateNextReview(repetitions, easeFactor, interval, 4);
        repetitions = result.repetitions;
        easeFactor = result.easeFactor;
        interval = result.interval;
      }

      expect(result!.repetitions).toBe(2);
      expect(result!.masteryLevel).toBe("reviewing");

      // Continue to 4 repetitions - still reviewing
      for (let i = 0; i < 2; i++) {
        result = calculateNextReview(repetitions, easeFactor, interval, 4);
        repetitions = result.repetitions;
        easeFactor = result.easeFactor;
        interval = result.interval;
      }

      expect(result!.repetitions).toBe(4);
      expect(result!.masteryLevel).toBe("reviewing");
    });

    it("5+ reps with ease >= 2.3 - mastery level should be 'mastered'", () => {
      let repetitions = 0;
      let easeFactor = 2.5;
      let interval = 0;
      let result: ProgressUpdate;

      // Build up to 5+ repetitions with high ease
      for (let i = 0; i < 6; i++) {
        result = calculateNextReview(repetitions, easeFactor, interval, 4);
        repetitions = result.repetitions;
        easeFactor = result.easeFactor;
        interval = result.interval;
      }

      expect(result!.repetitions).toBeGreaterThanOrEqual(5);
      expect(result!.easeFactor).toBeGreaterThanOrEqual(2.3);
      expect(result!.masteryLevel).toBe("mastered");
    });

    it("5+ reps but ease < 2.3 - should be 'reviewing' not 'mastered'", () => {
      let repetitions = 0;
      let easeFactor = 2.5;
      let interval = 0;
      let result: ProgressUpdate;

      // Build up repetitions with quality 3 (lowers ease factor)
      for (let i = 0; i < 8; i++) {
        result = calculateNextReview(repetitions, easeFactor, interval, 3);
        repetitions = result.repetitions;
        easeFactor = result.easeFactor;
        interval = result.interval;
      }

      expect(result!.repetitions).toBeGreaterThanOrEqual(5);

      // If ease dropped below 2.3, should still be reviewing
      if (result!.easeFactor < 2.3) {
        expect(result!.masteryLevel).toBe("reviewing");
      }
    });

    it("mastered status lost on failure - transitions back to learning", () => {
      let repetitions = 0;
      let easeFactor = 2.5;
      let interval = 0;
      let result: ProgressUpdate;

      // Achieve mastered status
      for (let i = 0; i < 6; i++) {
        result = calculateNextReview(repetitions, easeFactor, interval, 5);
        repetitions = result.repetitions;
        easeFactor = result.easeFactor;
        interval = result.interval;
      }

      expect(result!.masteryLevel).toBe("mastered");

      // Fail (quality < 3)
      result = calculateNextReview(
        result!.repetitions,
        result!.easeFactor,
        result!.interval,
        0
      );

      expect(result.repetitions).toBe(0);
      expect(result.masteryLevel).toBe("learning");
    });
  });

  describe("Next Review Date", () => {
    it("returns valid Date for all quality levels", () => {
      for (let quality = 0; quality <= 5; quality++) {
        const result = calculateNextReview(
          0,
          2.5,
          0,
          quality as 0 | 1 | 2 | 3 | 4 | 5
        );
        expect(result.nextReviewDate).toBeInstanceOf(Date);
        expect(result.nextReviewDate.getTime()).toBeGreaterThan(
          Date.now() - 1000
        );
      }
    });

    it("next review date advances by interval days", () => {
      const now = Date.now();
      const result = calculateNextReview(0, 2.5, 0, 4);

      // Should be approximately 1 day from now
      const expectedTime = now + result.interval * 24 * 60 * 60 * 1000;
      const actualTime = result.nextReviewDate.getTime();

      // Allow 1 minute tolerance for test execution time
      expect(actualTime).toBeGreaterThan(expectedTime - 60000);
      expect(actualTime).toBeLessThan(expectedTime + 60000);
    });
  });

  describe("qualityFromPassed Edge Cases", () => {
    it("all combinations produce valid SM-2 quality grades (0-5)", () => {
      const combinations: [boolean, boolean][] = [
        [false, false],
        [false, true],
        [true, false],
        [true, true],
      ];

      for (const [passed, hintUsed] of combinations) {
        const quality = qualityFromPassed(passed, hintUsed);
        expect(quality).toBeGreaterThanOrEqual(0);
        expect(quality).toBeLessThanOrEqual(5);
      }
    });

    it("failed attempts always return quality 2 regardless of hints", () => {
      expect(qualityFromPassed(false, false)).toBe(2);
      expect(qualityFromPassed(false, true)).toBe(2);
    });

    it("hint usage reduces quality from 4 to 3 on success", () => {
      const withoutHint = qualityFromPassed(true, false);
      const withHint = qualityFromPassed(true, true);

      expect(withoutHint).toBe(4);
      expect(withHint).toBe(3);
      expect(withoutHint).toBeGreaterThan(withHint);
    });
  });
});
