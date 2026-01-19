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

// Get a single challenge with test cases (non-hidden only)
app.get("/:id", (c) => {
  const id = c.req.param("id");

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
  });
});

// Submit a solution
app.post("/:id/submit", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{
    code: string;
    sessionId: string;
    hintUsed?: boolean;
  }>();
  const { code, sessionId, hintUsed = false } = body;

  if (!code || !sessionId) {
    return c.json({ error: "Missing code or sessionId" }, 400);
  }

  // Get challenge
  const challenge = db
    .query<ChallengeRow, [string]>(`SELECT * FROM challenges WHERE id = ?`)
    .get(id);

  if (!challenge) {
    return c.json({ error: "Challenge not found" }, 404);
  }

  // Get all test cases (including hidden)
  const testCases = db
    .query<TestCaseRow, [string]>(
      `SELECT * FROM test_cases WHERE challenge_id = ? ORDER BY order_index ASC`
    )
    .all(id);

  // Extract function name from starter code or use default
  const functionMatch = challenge.starter_code?.match(/function\s+(\w+)/);
  const functionName = functionMatch ? functionMatch[1] : "solution";

  // Validate the code
  const testCasesForValidation = testCases.map((tc) => ({
    id: tc.id,
    input: JSON.parse(tc.input),
    expectedOutput: JSON.parse(tc.expected_output),
    description: tc.description ?? undefined,
  }));

  const validation = await validateCode(
    code,
    functionName,
    testCasesForValidation
  );

  // Save submission
  db.run(
    `INSERT INTO submissions (id, session_id, challenge_id, code, passed, test_results, execution_time_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      nanoid(),
      sessionId,
      id,
      code,
      validation.passed ? 1 : 0,
      JSON.stringify(validation.results),
      Math.round(validation.executionTimeMs),
    ]
  );

  // Update progress if passed
  if (validation.passed) {
    const existing = db
      .query<UserProgressRow, [string, string]>(
        `SELECT * FROM user_progress WHERE session_id = ? AND challenge_id = ?`
      )
      .get(sessionId, id);

    const quality = qualityFromPassed(validation.passed, hintUsed);
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

  // Return results (filter out hidden test details for non-passed hidden tests)
  const filteredResults = validation.results.map((r) => {
    const testCase = testCases.find((tc) => tc.id === r.testId);
    if (testCase?.is_hidden && !r.passed) {
      return { testId: r.testId, passed: false, error: "Hidden test failed" };
    }
    return r;
  });

  return c.json({
    passed: validation.passed,
    results: filteredResults,
    executionTimeMs: validation.executionTimeMs,
  });
});

export default app;
