import { supermemo, SuperMemoGrade } from "supermemo";
import { addDays } from "date-fns";

export interface ReviewResult {
  quality: SuperMemoGrade; // 0-5 rating
}

export interface ProgressUpdate {
  repetitions: number;
  easeFactor: number;
  interval: number;
  nextReviewDate: Date;
  masteryLevel: "learning" | "reviewing" | "mastered";
}

export function calculateNextReview(
  currentRepetitions: number,
  currentEaseFactor: number,
  currentInterval: number,
  quality: SuperMemoGrade
): ProgressUpdate {
  const result = supermemo(
    {
      repetition: currentRepetitions,
      efactor: currentEaseFactor,
      interval: currentInterval,
    },
    quality
  );

  const nextReviewDate = addDays(new Date(), result.interval);

  // Determine mastery level based on repetitions and ease factor
  let masteryLevel: "learning" | "reviewing" | "mastered" = "learning";
  if (result.repetition >= 5 && result.efactor >= 2.3) {
    masteryLevel = "mastered";
  } else if (result.repetition >= 2) {
    masteryLevel = "reviewing";
  }

  return {
    repetitions: result.repetition,
    easeFactor: result.efactor,
    interval: result.interval,
    nextReviewDate,
    masteryLevel,
  };
}

export function qualityFromPassed(passed: boolean, hintUsed: boolean): SuperMemoGrade {
  if (!passed) return 2; // Failed but remembered something
  if (hintUsed) return 3; // Passed with difficulty
  return 4; // Passed with some hesitation (5 = perfect recall)
}
