import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db, schema } from "../db";

const app = new Hono();

// Get all published lessons with their concepts
app.get("/", async (c) => {
  const allLessons = await db.query.lessons.findMany({
    where: eq(schema.lessons.isPublished, true),
    with: {
      concepts: {
        with: {
          challenges: {
            columns: {
              id: true,
              title: true,
              type: true,
              difficulty: true,
            },
          },
        },
        orderBy: (concepts, { asc }) => [asc(concepts.orderIndex)],
      },
    },
    orderBy: (lessons, { asc }) => [asc(lessons.orderIndex)],
  });

  return c.json(allLessons);
});

// Get a single lesson by slug
app.get("/:slug", async (c) => {
  const slug = c.req.param("slug");

  const lesson = await db.query.lessons.findFirst({
    where: eq(schema.lessons.slug, slug),
    with: {
      concepts: {
        with: {
          challenges: true,
        },
        orderBy: (concepts, { asc }) => [asc(concepts.orderIndex)],
      },
    },
  });

  if (!lesson) {
    return c.json({ error: "Lesson not found" }, 404);
  }

  return c.json(lesson);
});

export default app;
