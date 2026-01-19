import { Hono } from "hono";
import { nanoid } from "nanoid";
import {
  db,
  type ChallengeRow,
  type TestCaseRow,
  type ConceptRow,
  type LessonRow,
  type UserProgressRow,
} from "../db";
import { validateCode } from "../services/code-validator";
import {
  calculateNextReview,
  qualityFromPassed,
} from "../services/spaced-repetition";

const app = new Hono();

// Submission row type
interface SubmissionRow {
  id: string;
  session_id: string;
  challenge_id: string;
  code: string;
  passed: number;
  test_results: string;
  execution_time_ms: number;
  created_at: string;
}

// Get a single challenge with test cases (non-hidden only)
app.get("/:id", (c) => {
  const id = c.req.param("id");
  const sessionId = c.req.query("sessionId");

  const challenge = db
    .query<ChallengeRow, [string]>(`SELECT * FROM challenges WHERE id = ?`)
    .get(id);

  if (!challenge) {
    return c.json({ error: "Challenge not found" }, 404);
  }

  const testCases = db
    .query<TestCaseRow, [string]>(
      `SELECT * FROM test_cases WHERE challenge_id = ? AND is_hidden = 0 ORDER BY order_index ASC`
    )
    .all(id);

  // Get concept and lesson
  const concept = db
    .query<ConceptRow, [string]>(`SELECT * FROM concepts WHERE id = ?`)
    .get(challenge.concept_id);

  const lesson = concept
    ? db
        .query<LessonRow, [string]>(`SELECT * FROM lessons WHERE id = ?`)
        .get(concept.lesson_id)
    : null;

  // Get user's last submission if sessionId provided
  let lastSubmission: { code: string; passed: boolean } | null = null;
  if (sessionId) {
    const submission = db
      .query<SubmissionRow, [string, string]>(
        `SELECT code, passed FROM submissions
         WHERE session_id = ? AND challenge_id = ?
         ORDER BY created_at DESC LIMIT 1`
      )
      .get(sessionId, id);
    if (submission) {
      lastSubmission = {
        code: submission.code,
        passed: submission.passed === 1,
      };
    }
  }

  // Build response (exclude solution_code)
  return c.json({
    id: challenge.id,
    conceptId: challenge.concept_id,
    type: challenge.type,
    title: challenge.title,
    description: challenge.description,
    starterCode: challenge.starter_code,
    hints: challenge.hints ? JSON.parse(challenge.hints) : null,
    difficulty: challenge.difficulty,
    orderIndex: challenge.order_index,
    testCases: testCases.map((tc) => ({
      id: tc.id,
      input: JSON.parse(tc.input),
      expectedOutput: JSON.parse(tc.expected_output),
      description: tc.description,
    })),
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
    lastSubmission,
  });
});

// Record a submission result (code executed client-side via Pyodide)
app.post("/:id/record", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{
    code: string;
    passed: boolean;
    sessionId: string;
    hintUsed?: boolean;
  }>();
  const { code, passed, sessionId, hintUsed = false } = body;

  if (!code || !sessionId || passed === undefined) {
    return c.json({ error: "Missing code, passed, or sessionId" }, 400);
  }

  // Get challenge
  const challenge = db
    .query<ChallengeRow, [string]>(`SELECT * FROM challenges WHERE id = ?`)
    .get(id);

  if (!challenge) {
    return c.json({ error: "Challenge not found" }, 404);
  }

  // Save submission
  db.run(
    `INSERT INTO submissions (id, session_id, challenge_id, code, passed, test_results, execution_time_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [nanoid(), sessionId, id, code, passed ? 1 : 0, "[]", 0]
  );

  // Update progress if passed
  if (passed) {
    const existing = db
      .query<UserProgressRow, [string, string]>(
        `SELECT * FROM user_progress WHERE session_id = ? AND challenge_id = ?`
      )
      .get(sessionId, id);

    const quality = qualityFromPassed(passed, hintUsed);
    const now = new Date().toISOString();

    if (existing) {
      const update = calculateNextReview(
        existing.repetitions,
        existing.ease_factor,
        existing.interval,
        quality
      );

      db.run(
        `UPDATE user_progress SET
          repetitions = ?,
          ease_factor = ?,
          interval = ?,
          next_review_date = ?,
          last_review_date = ?,
          last_quality = ?,
          mastery_level = ?,
          updated_at = ?
         WHERE id = ?`,
        [
          update.repetitions,
          update.easeFactor,
          update.interval,
          update.nextReviewDate.toISOString(),
          now,
          quality,
          update.masteryLevel,
          now,
          existing.id,
        ]
      );
    } else {
      const update = calculateNextReview(0, 2.5, 0, quality);

      db.run(
        `INSERT INTO user_progress (id, session_id, challenge_id, repetitions, ease_factor, interval, next_review_date, last_review_date, last_quality, mastery_level)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nanoid(),
          sessionId,
          id,
          update.repetitions,
          update.easeFactor,
          update.interval,
          update.nextReviewDate.toISOString(),
          now,
          quality,
          update.masteryLevel,
        ]
      );
    }
  }

  return c.json({ success: true });
});

// Reset progress for a challenge (clears submissions and progress)
app.delete("/:id/progress", async (c) => {
  const id = c.req.param("id");
  const sessionId = c.req.query("sessionId");

  if (!sessionId) {
    return c.json({ error: "Missing sessionId" }, 400);
  }

  // Delete submissions for this challenge
  db.run(
    `DELETE FROM submissions WHERE session_id = ? AND challenge_id = ?`,
    [sessionId, id]
  );

  // Delete progress for this challenge
  db.run(
    `DELETE FROM user_progress WHERE session_id = ? AND challenge_id = ?`,
    [sessionId, id]
  );

  return c.json({ success: true });
});

export default app;
