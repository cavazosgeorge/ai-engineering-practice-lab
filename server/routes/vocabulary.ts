import { Hono } from "hono";
import type { SuperMemoGrade } from "supermemo";
import {
  getTermsByLesson,
  getTermsWithProgress,
  getTermById,
  recordFlashcardReview,
  generateQuizQuestion,
  submitQuizAnswer,
  getReviewQueue,
  getVocabularyStats,
  getLessonForTerm,
  resolveLessonId,
} from "../services/vocabulary-service";

const app = new Hono();

/**
 * GET /api/vocabulary/:lessonIdOrSlug/terms
 * Get all vocabulary terms for a lesson (by ID or slug)
 * Optional ?sessionId to include progress data
 */
app.get("/:lessonIdOrSlug/terms", (c) => {
  const lessonIdOrSlug = c.req.param("lessonIdOrSlug");
  const sessionId = c.req.query("sessionId");

  const lessonId = resolveLessonId(lessonIdOrSlug);
  if (!lessonId) {
    return c.json({ error: "Lesson not found", terms: [] }, 200);
  }

  if (sessionId) {
    const termsWithProgress = getTermsWithProgress(lessonId, sessionId);
    return c.json({
      terms: termsWithProgress.map((t) => ({
        id: t.id,
        lessonId: t.lesson_id,
        conceptId: t.concept_id,
        term: t.term,
        definition: t.definition,
        context: t.context,
        difficulty: t.difficulty,
        orderIndex: t.order_index,
        flashcardProgress: t.progress.flashcard
          ? {
              termId: t.progress.flashcard.term_id,
              learningMode: t.progress.flashcard.learning_mode,
              masteryLevel: t.progress.flashcard.mastery_level,
              nextReviewDate: t.progress.flashcard.next_review_date,
              repetitions: t.progress.flashcard.repetitions,
            }
          : null,
        quizProgress: t.progress.quiz
          ? {
              termId: t.progress.quiz.term_id,
              learningMode: t.progress.quiz.learning_mode,
              masteryLevel: t.progress.quiz.mastery_level,
              nextReviewDate: t.progress.quiz.next_review_date,
              repetitions: t.progress.quiz.repetitions,
            }
          : null,
      })),
    });
  }

  const terms = getTermsByLesson(lessonId);
  return c.json({
    terms: terms.map((t) => ({
      id: t.id,
      lessonId: t.lesson_id,
      conceptId: t.concept_id,
      term: t.term,
      definition: t.definition,
      context: t.context,
      difficulty: t.difficulty,
      orderIndex: t.order_index,
    })),
  });
});

/**
 * GET /api/vocabulary/:lessonIdOrSlug/stats
 * Get vocabulary stats for a specific lesson
 */
app.get("/:lessonIdOrSlug/stats", (c) => {
  const lessonIdOrSlug = c.req.param("lessonIdOrSlug");
  const sessionId = c.req.query("sessionId");

  if (!sessionId) {
    return c.json({ error: "Missing sessionId" }, 400);
  }

  const lessonId = resolveLessonId(lessonIdOrSlug);
  if (!lessonId) {
    return c.json({ error: "Lesson not found" }, 404);
  }

  const stats = getVocabularyStats(sessionId, lessonId);
  return c.json(stats);
});

/**
 * GET /api/vocabulary/term/:termId
 * Get a single term detail
 */
app.get("/term/:termId", (c) => {
  const termId = c.req.param("termId");
  const term = getTermById(termId);

  if (!term) {
    return c.json({ error: "Term not found" }, 404);
  }

  const lesson = getLessonForTerm(termId);

  return c.json({
    id: term.id,
    lessonId: term.lesson_id,
    conceptId: term.concept_id,
    term: term.term,
    definition: term.definition,
    context: term.context,
    difficulty: term.difficulty,
    orderIndex: term.order_index,
    lesson: lesson
      ? {
          id: lesson.id,
          title: lesson.title,
          slug: lesson.slug,
        }
      : null,
  });
});

/**
 * POST /api/vocabulary/flashcard/:termId/review
 * Submit a flashcard review
 * Body: { sessionId: string, quality: number (0-5) }
 */
app.post("/flashcard/:termId/review", async (c) => {
  const termId = c.req.param("termId");
  const body = await c.req.json<{ sessionId: string; quality: number }>();
  const { sessionId, quality } = body;

  if (!sessionId) {
    return c.json({ error: "Missing sessionId" }, 400);
  }

  if (quality === undefined || typeof quality !== "number" || isNaN(quality) || quality < 0 || quality > 5) {
    return c.json({ error: "Quality must be a number between 0 and 5" }, 400);
  }

  const term = getTermById(termId);
  if (!term) {
    return c.json({ error: "Term not found" }, 404);
  }

  const progress = recordFlashcardReview(
    sessionId,
    termId,
    quality as SuperMemoGrade
  );

  return c.json({
    termId: progress.term_id,
    learningMode: progress.learning_mode,
    masteryLevel: progress.mastery_level,
    nextReviewDate: progress.next_review_date,
    repetitions: progress.repetitions,
  });
});

/**
 * GET /api/vocabulary/quiz/:termId/question
 * Get a quiz question for a term
 */
app.get("/quiz/:termId/question", (c) => {
  const termId = c.req.param("termId");
  const term = getTermById(termId);

  if (!term) {
    return c.json({ error: "Term not found" }, 404);
  }

  const question = generateQuizQuestion(termId, term.lesson_id);

  if (!question) {
    return c.json({ error: "Could not generate quiz question" }, 500);
  }

  return c.json({
    termId: question.termId,
    questionText: `What is the definition of "${question.term}"?`,
    options: question.options.map((opt) => ({
      id: opt.id,
      text: opt.definition,
    })),
    // Note: correctOptionId is NOT sent - client submits and server validates
  });
});

/**
 * POST /api/vocabulary/quiz/:termId/answer
 * Submit a quiz answer
 * Body: { sessionId: string, selectedOptionId: string, timeSpentMs: number }
 */
app.post("/quiz/:termId/answer", async (c) => {
  const termId = c.req.param("termId");
  const body = await c.req.json<{
    sessionId: string;
    selectedOptionId: string;
    timeSpentMs: number;
  }>();
  const { sessionId, selectedOptionId, timeSpentMs } = body;

  if (!sessionId) {
    return c.json({ error: "Missing sessionId" }, 400);
  }

  if (!selectedOptionId) {
    return c.json({ error: "Missing selectedOptionId" }, 400);
  }

  const term = getTermById(termId);
  if (!term) {
    return c.json({ error: "Term not found" }, 404);
  }

  // Check if selected option matches the correct term
  const isCorrect = selectedOptionId === termId;

  const progress = submitQuizAnswer(
    sessionId,
    termId,
    isCorrect,
    Math.max(0, timeSpentMs || 0)
  );

  return c.json({
    correct: isCorrect,
    correctOptionId: termId,
    progress: {
      termId: progress.term_id,
      learningMode: progress.learning_mode,
      masteryLevel: progress.mastery_level,
      nextReviewDate: progress.next_review_date,
      repetitions: progress.repetitions,
    },
  });
});

/**
 * GET /api/vocabulary/review-queue
 * Get vocabulary terms due for review
 * Query: ?sessionId (required), ?lessonId (optional - can be ID or slug)
 */
app.get("/review-queue", (c) => {
  const sessionId = c.req.query("sessionId");
  const lessonIdOrSlug = c.req.query("lessonId");

  if (!sessionId) {
    return c.json({ error: "Missing sessionId" }, 400);
  }

  let lessonId: string | undefined;
  if (lessonIdOrSlug) {
    const resolved = resolveLessonId(lessonIdOrSlug);
    if (!resolved) {
      return c.json({ error: "Lesson not found", queue: [] }, 200);
    }
    lessonId = resolved;
  }

  const queue = getReviewQueue(sessionId, lessonId);

  return c.json({
    queue: queue.map((item) => ({
      id: item.id,
      lessonId: item.lesson_id,
      conceptId: item.concept_id,
      term: item.term,
      definition: item.definition,
      context: item.context,
      difficulty: item.difficulty,
      orderIndex: item.order_index,
      flashcardProgress: item.progress.learning_mode === "flashcard"
        ? {
            termId: item.progress.term_id,
            learningMode: item.progress.learning_mode,
            masteryLevel: item.progress.mastery_level,
            nextReviewDate: item.progress.next_review_date,
            repetitions: item.progress.repetitions,
          }
        : null,
      quizProgress: item.progress.learning_mode === "quiz"
        ? {
            termId: item.progress.term_id,
            learningMode: item.progress.learning_mode,
            masteryLevel: item.progress.mastery_level,
            nextReviewDate: item.progress.next_review_date,
            repetitions: item.progress.repetitions,
          }
        : null,
    })),
  });
});

/**
 * GET /api/vocabulary/stats
 * Get overall vocabulary statistics
 * Query: ?sessionId (required)
 */
app.get("/stats", (c) => {
  const sessionId = c.req.query("sessionId");

  if (!sessionId) {
    return c.json({ error: "Missing sessionId" }, 400);
  }

  const stats = getVocabularyStats(sessionId);

  return c.json(stats);
});

export default app;
