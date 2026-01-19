import { Hono } from "hono";
import { db, type LessonRow, type ConceptRow, type ChallengeRow } from "../db";

const app = new Hono();

// Get all published lessons with their concepts and challenges
app.get("/", (c) => {
  const lessons = db
    .query<LessonRow, []>(
      `SELECT * FROM lessons WHERE is_published = 1 ORDER BY order_index ASC`
    )
    .all();

  const concepts = db
    .query<ConceptRow, []>(`SELECT * FROM concepts ORDER BY order_index ASC`)
    .all();

  const challenges = db
    .query<ChallengeRow, []>(
      `SELECT id, concept_id, title, type, difficulty FROM challenges ORDER BY order_index ASC`
    )
    .all();

  // Build nested structure
  const result = lessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    slug: lesson.slug,
    description: lesson.description,
    orderIndex: lesson.order_index,
    concepts: concepts
      .filter((c) => c.lesson_id === lesson.id)
      .map((concept) => ({
        id: concept.id,
        lessonId: concept.lesson_id,
        title: concept.title,
        explanation: concept.explanation,
        orderIndex: concept.order_index,
        challenges: challenges
          .filter((ch) => ch.concept_id === concept.id)
          .map((ch) => ({
            id: ch.id,
            title: ch.title,
            type: ch.type,
            difficulty: ch.difficulty,
          })),
      })),
  }));

  return c.json(result);
});

// Get a single lesson by slug
app.get("/:slug", (c) => {
  const slug = c.req.param("slug");

  const lesson = db
    .query<LessonRow, [string]>(`SELECT * FROM lessons WHERE slug = ?`)
    .get(slug);

  if (!lesson) {
    return c.json({ error: "Lesson not found" }, 404);
  }

  const concepts = db
    .query<ConceptRow, [string]>(
      `SELECT * FROM concepts WHERE lesson_id = ? ORDER BY order_index ASC`
    )
    .all(lesson.id);

  const conceptIds = concepts.map((c) => c.id);

  const challenges =
    conceptIds.length > 0
      ? db
          .query<ChallengeRow, []>(
            `SELECT * FROM challenges WHERE concept_id IN (${conceptIds.map(() => "?").join(",")}) ORDER BY order_index ASC`
          )
          .all(...conceptIds)
      : [];

  // Build nested structure
  const result = {
    id: lesson.id,
    title: lesson.title,
    slug: lesson.slug,
    description: lesson.description,
    orderIndex: lesson.order_index,
    concepts: concepts.map((concept) => ({
      id: concept.id,
      lessonId: concept.lesson_id,
      title: concept.title,
      explanation: concept.explanation,
      orderIndex: concept.order_index,
      challenges: challenges
        .filter((ch) => ch.concept_id === concept.id)
        .map((ch) => ({
          id: ch.id,
          conceptId: ch.concept_id,
          type: ch.type,
          title: ch.title,
          description: ch.description,
          starterCode: ch.starter_code,
          hints: ch.hints ? JSON.parse(ch.hints) : null,
          difficulty: ch.difficulty,
          orderIndex: ch.order_index,
        })),
    })),
  };

  return c.json(result);
});

export default app;
