import { Hono } from "hono";
import {
  db,
  type UserProgressRow,
  type ChallengeRow,
  type ConceptRow,
  type LessonRow,
  type SubmissionRow,
} from "../db";

const app = new Hono();

// Helper to enrich progress with challenge details
function enrichProgress(progress: UserProgressRow[]) {
  if (progress.length === 0) return [];

  const challengeIds = [...new Set(progress.map((p) => p.challenge_id))];
  const challenges = db
    .query<ChallengeRow, []>(
      `SELECT * FROM challenges WHERE id IN (${challengeIds.map(() => "?").join(",")})`
    )
    .all(...challengeIds);

  const conceptIds = [...new Set(challenges.map((c) => c.concept_id))];
  const concepts =
    conceptIds.length > 0
      ? db
          .query<ConceptRow, []>(
            `SELECT * FROM concepts WHERE id IN (${conceptIds.map(() => "?").join(",")})`
          )
          .all(...conceptIds)
      : [];

  const lessonIds = [...new Set(concepts.map((c) => c.lesson_id))];
  const lessons =
    lessonIds.length > 0
      ? db
          .query<LessonRow, []>(
            `SELECT * FROM lessons WHERE id IN (${lessonIds.map(() => "?").join(",")})`
          )
          .all(...lessonIds)
      : [];

  return progress.map((p) => {
    const challenge = challenges.find((c) => c.id === p.challenge_id);
    const concept = challenge
      ? concepts.find((c) => c.id === challenge.concept_id)
      : null;
    const lesson = concept
      ? lessons.find((l) => l.id === concept.lesson_id)
      : null;

    return {
      id: p.id,
      sessionId: p.session_id,
      challengeId: p.challenge_id,
      repetitions: p.repetitions,
      easeFactor: p.ease_factor,
      interval: p.interval,
      nextReviewDate: p.next_review_date,
      lastReviewDate: p.last_review_date,
      lastQuality: p.last_quality,
      masteryLevel: p.mastery_level,
      challenge: challenge
        ? {
            id: challenge.id,
            title: challenge.title,
            type: challenge.type,
            difficulty: challenge.difficulty,
            concept: concept
              ? {
                  id: concept.id,
                  title: concept.title,
                  lesson: lesson
                    ? {
                        id: lesson.id,
                        title: lesson.title,
                        slug: lesson.slug,
                      }
                    : null,
                }
              : null,
          }
        : null,
    };
  });
}

// Get progress for a session
app.get("/:sessionId", (c) => {
  const sessionId = c.req.param("sessionId");

  const progress = db
    .query<UserProgressRow, [string]>(
      `SELECT * FROM user_progress WHERE session_id = ?`
    )
    .all(sessionId);

  const enriched = enrichProgress(progress);

  // Calculate stats
  const total = progress.length;
  const mastered = progress.filter((p) => p.mastery_level === "mastered").length;
  const reviewing = progress.filter(
    (p) => p.mastery_level === "reviewing"
  ).length;
  const learning = progress.filter((p) => p.mastery_level === "learning").length;

  return c.json({
    progress: enriched,
    stats: {
      total,
      mastered,
      reviewing,
      learning,
    },
  });
});

// Get review queue (challenges due for review)
app.get("/:sessionId/review-queue", (c) => {
  const sessionId = c.req.param("sessionId");
  const now = new Date().toISOString();

  const dueForReview = db
    .query<UserProgressRow, [string, string]>(
      `SELECT * FROM user_progress
       WHERE session_id = ? AND next_review_date <= ?
       ORDER BY next_review_date DESC`
    )
    .all(sessionId, now);

  return c.json(enrichProgress(dueForReview));
});

// Get submission history for a challenge
app.get("/:sessionId/challenge/:challengeId/history", (c) => {
  const sessionId = c.req.param("sessionId");
  const challengeId = c.req.param("challengeId");

  const submissions = db
    .query<SubmissionRow, [string, string]>(
      `SELECT * FROM submissions
       WHERE session_id = ? AND challenge_id = ?
       ORDER BY created_at DESC
       LIMIT 10`
    )
    .all(sessionId, challengeId);

  return c.json(
    submissions.map((s) => ({
      id: s.id,
      sessionId: s.session_id,
      challengeId: s.challenge_id,
      code: s.code,
      passed: Boolean(s.passed),
      testResults: s.test_results ? JSON.parse(s.test_results) : null,
      executionTimeMs: s.execution_time_ms,
      createdAt: s.created_at,
    }))
  );
});

export default app;
