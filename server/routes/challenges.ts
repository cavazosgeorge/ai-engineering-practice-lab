import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, schema } from "../db";
import { validateCode } from "../services/code-validator";
import { calculateNextReview, qualityFromPassed } from "../services/spaced-repetition";

const app = new Hono();

// Get a single challenge with test cases (non-hidden only)
app.get("/:id", async (c) => {
  const id = c.req.param("id");

  const challenge = await db.query.challenges.findFirst({
    where: eq(schema.challenges.id, id),
    with: {
      testCases: {
        where: eq(schema.testCases.isHidden, false),
        orderBy: (testCases, { asc }) => [asc(testCases.orderIndex)],
      },
      concept: {
        with: {
          lesson: true,
        },
      },
    },
  });

  if (!challenge) {
    return c.json({ error: "Challenge not found" }, 404);
  }

  // Don't expose solution code
  const { solutionCode, ...challengeData } = challenge;

  return c.json(challengeData);
});

// Submit a solution
app.post("/:id/submit", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ code: string; sessionId: string; hintUsed?: boolean }>();
  const { code, sessionId, hintUsed = false } = body;

  if (!code || !sessionId) {
    return c.json({ error: "Missing code or sessionId" }, 400);
  }

  // Get challenge with all test cases (including hidden)
  const challenge = await db.query.challenges.findFirst({
    where: eq(schema.challenges.id, id),
    with: {
      testCases: {
        orderBy: (testCases, { asc }) => [asc(testCases.orderIndex)],
      },
    },
  });

  if (!challenge) {
    return c.json({ error: "Challenge not found" }, 404);
  }

  // Extract function name from starter code or use default
  const functionMatch = challenge.starterCode?.match(/function\s+(\w+)/);
  const functionName = functionMatch ? functionMatch[1] : "solution";

  // Validate the code
  const testCases = challenge.testCases.map((tc) => ({
    id: tc.id,
    input: tc.input,
    expectedOutput: tc.expectedOutput,
    description: tc.description ?? undefined,
  }));

  const validation = await validateCode(code, functionName, testCases);

  // Save submission
  await db.insert(schema.submissions).values({
    id: nanoid(),
    sessionId,
    challengeId: id,
    code,
    passed: validation.passed,
    testResults: validation.results,
    executionTimeMs: Math.round(validation.executionTimeMs),
  });

  // Update progress if passed
  if (validation.passed) {
    const existing = await db.query.userProgress.findFirst({
      where: and(
        eq(schema.userProgress.sessionId, sessionId),
        eq(schema.userProgress.challengeId, id)
      ),
    });

    const quality = qualityFromPassed(validation.passed, hintUsed);

    if (existing) {
      const update = calculateNextReview(
        existing.repetitions,
        existing.easeFactor,
        existing.interval,
        quality
      );

      await db
        .update(schema.userProgress)
        .set({
          repetitions: update.repetitions,
          easeFactor: update.easeFactor,
          interval: update.interval,
          nextReviewDate: update.nextReviewDate,
          lastReviewDate: new Date(),
          lastQuality: quality,
          masteryLevel: update.masteryLevel,
          updatedAt: new Date(),
        })
        .where(eq(schema.userProgress.id, existing.id));
    } else {
      const update = calculateNextReview(0, 2.5, 0, quality);

      await db.insert(schema.userProgress).values({
        id: nanoid(),
        sessionId,
        challengeId: id,
        repetitions: update.repetitions,
        easeFactor: update.easeFactor,
        interval: update.interval,
        nextReviewDate: update.nextReviewDate,
        lastReviewDate: new Date(),
        lastQuality: quality,
        masteryLevel: update.masteryLevel,
      });
    }
  }

  // Return results (filter out hidden test details for non-passed hidden tests)
  const filteredResults = validation.results.map((r) => {
    const testCase = challenge.testCases.find((tc) => tc.id === r.testId);
    if (testCase?.isHidden && !r.passed) {
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
