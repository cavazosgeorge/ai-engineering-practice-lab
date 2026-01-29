import { Hono } from "hono";
import { requireAdmin } from "../middleware/auth";
import {
  getAdminDashboardStats,
  getAllLessonsAdmin,
  getVocabularyTermsAdmin,
  getVocabularyTermById,
  createVocabularyTerm,
  updateVocabularyTerm,
  deleteVocabularyTerm,
  type CreateVocabularyTermInput,
  type UpdateVocabularyTermInput,
} from "../services/admin-service";

const app = new Hono();

// Apply admin middleware to all routes
app.use("*", requireAdmin);

/**
 * GET /api/admin/stats
 * Dashboard aggregate stats
 */
app.get("/stats", (c) => {
  const stats = getAdminDashboardStats();
  return c.json(stats);
});

/**
 * GET /api/admin/lessons
 * All lessons (including unpublished) with term counts
 */
app.get("/lessons", (c) => {
  const lessons = getAllLessonsAdmin();
  return c.json(
    lessons.map((l) => ({
      id: l.id,
      title: l.title,
      slug: l.slug,
      description: l.description,
      orderIndex: l.order_index,
      isPublished: l.is_published === 1,
      termCount: l.termCount,
      createdAt: l.created_at,
      updatedAt: l.updated_at,
    }))
  );
});

/**
 * GET /api/admin/vocabulary/terms
 * All vocabulary terms with lesson info
 */
app.get("/vocabulary/terms", (c) => {
  const terms = getVocabularyTermsAdmin();
  return c.json(
    terms.map((t) => ({
      id: t.id,
      lesson_id: t.lesson_id,
      lesson_title: t.lessonTitle,
      lesson_slug: t.lessonSlug,
      term: t.term,
      definition: t.definition,
      context: t.context,
      difficulty: t.difficulty,
      order_index: t.order_index,
    }))
  );
});

/**
 * GET /api/admin/vocabulary/terms/:id
 * Single term detail
 */
app.get("/vocabulary/terms/:id", (c) => {
  const id = c.req.param("id");
  const term = getVocabularyTermById(id);

  if (!term) {
    return c.json({ error: "Term not found" }, 404);
  }

  return c.json({
    id: term.id,
    lesson_id: term.lesson_id,
    lesson_title: term.lessonTitle,
    lesson_slug: term.lessonSlug,
    term: term.term,
    definition: term.definition,
    context: term.context,
    difficulty: term.difficulty,
    order_index: term.order_index,
  });
});

/**
 * POST /api/admin/vocabulary/terms
 * Create a new term
 */
app.post("/vocabulary/terms", async (c) => {
  const body = await c.req.json<CreateVocabularyTermInput>();

  // Validate required fields
  if (!body.lessonId || !body.term || !body.definition || !body.difficulty) {
    return c.json(
      { error: "Missing required fields: lessonId, term, definition, difficulty" },
      400
    );
  }

  // Validate difficulty value
  const validDifficulties = ["beginner", "intermediate", "advanced"];
  if (!validDifficulties.includes(body.difficulty)) {
    return c.json(
      { error: "Invalid difficulty. Must be: beginner, intermediate, or advanced" },
      400
    );
  }

  const term = createVocabularyTerm(body);

  return c.json(
    {
      id: term.id,
      lessonId: term.lesson_id,
      conceptId: term.concept_id,
      term: term.term,
      definition: term.definition,
      context: term.context,
      difficulty: term.difficulty,
      orderIndex: term.order_index,
      createdAt: term.created_at,
    },
    201
  );
});

/**
 * PATCH /api/admin/vocabulary/terms/:id
 * Update a term (partial)
 */
app.patch("/vocabulary/terms/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<UpdateVocabularyTermInput>();

  // Validate difficulty if provided
  if (body.difficulty) {
    const validDifficulties = ["beginner", "intermediate", "advanced"];
    if (!validDifficulties.includes(body.difficulty)) {
      return c.json(
        { error: "Invalid difficulty. Must be: beginner, intermediate, or advanced" },
        400
      );
    }
  }

  const term = updateVocabularyTerm(id, body);

  if (!term) {
    return c.json({ error: "Term not found" }, 404);
  }

  return c.json({
    id: term.id,
    lessonId: term.lesson_id,
    conceptId: term.concept_id,
    term: term.term,
    definition: term.definition,
    context: term.context,
    difficulty: term.difficulty,
    orderIndex: term.order_index,
    createdAt: term.created_at,
  });
});

/**
 * DELETE /api/admin/vocabulary/terms/:id
 * Delete a term
 */
app.delete("/vocabulary/terms/:id", (c) => {
  const id = c.req.param("id");
  const deleted = deleteVocabularyTerm(id);

  if (!deleted) {
    return c.json({ error: "Term not found" }, 404);
  }

  return c.json({ success: true });
});

export default app;
