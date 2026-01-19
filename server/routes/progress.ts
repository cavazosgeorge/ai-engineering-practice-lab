import { Hono } from "hono";
import { eq, and, lte, desc } from "drizzle-orm";
import { db, schema } from "../db";

const app = new Hono();

// Get progress for a session
app.get("/:sessionId", async (c) => {
  const sessionId = c.req.param("sessionId");

  const progress = await db.query.userProgress.findMany({
    where: eq(schema.userProgress.sessionId, sessionId),
    with: {
      challenge: {
        with: {
          concept: {
            with: {
              lesson: true,
            },
          },
        },
      },
    },
  });

  // Calculate stats
  const total = progress.length;
  const mastered = progress.filter((p) => p.masteryLevel === "mastered").length;
  const reviewing = progress.filter((p) => p.masteryLevel === "reviewing").length;
  const learning = progress.filter((p) => p.masteryLevel === "learning").length;

  return c.json({
    progress,
    stats: {
      total,
      mastered,
      reviewing,
      learning,
    },
  });
});

// Get review queue (challenges due for review)
app.get("/:sessionId/review-queue", async (c) => {
  const sessionId = c.req.param("sessionId");
  const now = new Date();

  const dueForReview = await db.query.userProgress.findMany({
    where: and(
      eq(schema.userProgress.sessionId, sessionId),
      lte(schema.userProgress.nextReviewDate, now)
    ),
    with: {
      challenge: {
        with: {
          concept: {
            with: {
              lesson: true,
            },
          },
        },
      },
    },
    orderBy: [desc(schema.userProgress.nextReviewDate)],
  });

  return c.json(dueForReview);
});

// Get submission history for a challenge
app.get("/:sessionId/challenge/:challengeId/history", async (c) => {
  const sessionId = c.req.param("sessionId");
  const challengeId = c.req.param("challengeId");

  const submissions = await db.query.submissions.findMany({
    where: and(
      eq(schema.submissions.sessionId, sessionId),
      eq(schema.submissions.challengeId, challengeId)
    ),
    orderBy: [desc(schema.submissions.createdAt)],
    limit: 10,
  });

  return c.json(submissions);
});

export default app;
