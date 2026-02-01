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
import {
  getAllWeeksAdmin,
  createWeek,
  updateWeek,
  deleteWeek,
  type CreateWeekInput,
  type UpdateWeekInput,
} from "../services/week-service";

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

// ============================================
// Weeks Management
// ============================================

/**
 * GET /api/admin/weeks
 * All weeks (including unpublished) with counts
 */
app.get("/weeks", (c) => {
  const weeks = getAllWeeksAdmin();
  return c.json(
    weeks.map((w) => ({
      id: w.id,
      weekNumber: w.week_number,
      slug: w.slug,
      title: w.title,
      description: w.description,
      startDate: w.start_date,
      endDate: w.end_date,
      isPublished: w.is_published === 1,
      orderIndex: w.order_index,
      lessonCount: w.lessonCount,
      vocabularyCount: w.vocabularyCount,
      createdAt: w.created_at,
      updatedAt: w.updated_at,
    }))
  );
});

/**
 * POST /api/admin/weeks
 * Create a new week
 */
app.post("/weeks", async (c) => {
  const body = await c.req.json<CreateWeekInput>();

  if (!body.weekNumber || !body.title || !body.slug) {
    return c.json(
      { error: "Missing required fields: weekNumber, title, slug" },
      400
    );
  }

  try {
    const week = createWeek(body);
    return c.json(
      {
        id: week.id,
        weekNumber: week.week_number,
        slug: week.slug,
        title: week.title,
        description: week.description,
        startDate: week.start_date,
        endDate: week.end_date,
        isPublished: week.is_published === 1,
        orderIndex: week.order_index,
        createdAt: week.created_at,
        updatedAt: week.updated_at,
      },
      201
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("UNIQUE constraint")) {
      return c.json({ error: "Week number or slug already exists" }, 409);
    }
    throw error;
  }
});

/**
 * PATCH /api/admin/weeks/:id
 * Update a week (partial)
 */
app.patch("/weeks/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<UpdateWeekInput>();

  try {
    const week = updateWeek(id, body);

    if (!week) {
      return c.json({ error: "Week not found" }, 404);
    }

    return c.json({
      id: week.id,
      weekNumber: week.week_number,
      slug: week.slug,
      title: week.title,
      description: week.description,
      startDate: week.start_date,
      endDate: week.end_date,
      isPublished: week.is_published === 1,
      orderIndex: week.order_index,
      createdAt: week.created_at,
      updatedAt: week.updated_at,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("UNIQUE constraint")) {
      return c.json({ error: "Week number or slug already exists" }, 409);
    }
    throw error;
  }
});

/**
 * DELETE /api/admin/weeks/:id
 * Delete a week (cascades to data_sources, generation_jobs)
 */
app.delete("/weeks/:id", (c) => {
  const id = c.req.param("id");
  const deleted = deleteWeek(id);

  if (!deleted) {
    return c.json({ error: "Week not found" }, 404);
  }

  return c.json({ success: true });
});

export default app;
