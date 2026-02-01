import { nanoid } from "nanoid";
import {
  db,
  type VocabularyTermRow,
  type VocabularyProgressRow,
  type LessonRow,
} from "../db";
import { calculateNextReview } from "./spaced-repetition";
import type { SuperMemoGrade } from "supermemo";

export interface TermWithProgress extends VocabularyTermRow {
  progress: {
    flashcard: VocabularyProgressRow | null;
    quiz: VocabularyProgressRow | null;
  };
}

export interface QuizQuestion {
  termId: string;
  term: string;
  options: Array<{
    id: string;
    definition: string;
    isCorrect: boolean;
  }>;
}

export interface VocabularyStats {
  total: number;
  learning: number;
  reviewing: number;
  mastered: number;
  flashcard: {
    total: number;
    learning: number;
    reviewing: number;
    mastered: number;
  };
  quiz: {
    total: number;
    learning: number;
    reviewing: number;
    mastered: number;
  };
}

/**
 * Get all vocabulary terms for a lesson
 */
export function getTermsByLesson(lessonId: string): VocabularyTermRow[] {
  return db
    .query<VocabularyTermRow, [string]>(
      `SELECT * FROM vocabulary_terms WHERE lesson_id = ? ORDER BY order_index ASC`
    )
    .all(lessonId);
}

/**
 * Get vocabulary terms with progress data for a session
 */
export function getTermsWithProgress(
  lessonId: string,
  sessionId: string
): TermWithProgress[] {
  const terms = getTermsByLesson(lessonId);

  if (terms.length === 0) return [];

  const termIds = terms.map((t) => t.id);
  const placeholders = termIds.map(() => "?").join(",");

  const progress = db
    .query<VocabularyProgressRow, string[]>(
      `SELECT * FROM vocabulary_progress
       WHERE session_id = ? AND term_id IN (${placeholders})`
    )
    .all(sessionId, ...termIds);

  return terms.map((term) => ({
    ...term,
    progress: {
      flashcard:
        progress.find(
          (p) => p.term_id === term.id && p.learning_mode === "flashcard"
        ) || null,
      quiz:
        progress.find(
          (p) => p.term_id === term.id && p.learning_mode === "quiz"
        ) || null,
    },
  }));
}

/**
 * Get a single term by ID
 */
export function getTermById(termId: string): VocabularyTermRow | undefined {
  return db
    .query<VocabularyTermRow, [string]>(
      `SELECT * FROM vocabulary_terms WHERE id = ?`
    )
    .get(termId);
}

/**
 * Record a flashcard review using SM-2 algorithm
 */
export function recordFlashcardReview(
  sessionId: string,
  termId: string,
  quality: SuperMemoGrade
): VocabularyProgressRow {
  const now = new Date().toISOString();

  // Get existing progress
  const existing = db
    .query<VocabularyProgressRow, [string, string, string]>(
      `SELECT * FROM vocabulary_progress
       WHERE session_id = ? AND term_id = ? AND learning_mode = ?`
    )
    .get(sessionId, termId, "flashcard");

  // Calculate next review
  const currentRepetitions = existing?.repetitions ?? 0;
  const currentEaseFactor = existing?.ease_factor ?? 2.5;
  const currentInterval = existing?.interval ?? 0;

  const update = calculateNextReview(
    currentRepetitions,
    currentEaseFactor,
    currentInterval,
    quality
  );

  // Record submission
  db.run(
    `INSERT INTO vocabulary_submissions (id, session_id, term_id, submission_type, quality, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [nanoid(), sessionId, termId, "flashcard_review", quality, now]
  );

  if (existing) {
    // Update existing progress
    db.run(
      `UPDATE vocabulary_progress SET
        repetitions = ?,
        ease_factor = ?,
        interval = ?,
        next_review_date = ?,
        last_review_date = ?,
        mastery_level = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        update.repetitions,
        update.easeFactor,
        update.interval,
        update.nextReviewDate.toISOString(),
        now,
        update.masteryLevel,
        now,
        existing.id,
      ]
    );

    return {
      ...existing,
      repetitions: update.repetitions,
      ease_factor: update.easeFactor,
      interval: update.interval,
      next_review_date: update.nextReviewDate.toISOString(),
      last_review_date: now,
      mastery_level: update.masteryLevel,
      updated_at: now,
    };
  } else {
    // Create new progress
    const id = nanoid();
    db.run(
      `INSERT INTO vocabulary_progress
        (id, session_id, term_id, learning_mode, repetitions, ease_factor, interval, next_review_date, last_review_date, mastery_level, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        sessionId,
        termId,
        "flashcard",
        update.repetitions,
        update.easeFactor,
        update.interval,
        update.nextReviewDate.toISOString(),
        now,
        update.masteryLevel,
        now,
        now,
      ]
    );

    return {
      id,
      session_id: sessionId,
      term_id: termId,
      learning_mode: "flashcard",
      repetitions: update.repetitions,
      ease_factor: update.easeFactor,
      interval: update.interval,
      next_review_date: update.nextReviewDate.toISOString(),
      last_review_date: now,
      mastery_level: update.masteryLevel,
      created_at: now,
      updated_at: now,
    };
  }
}

/**
 * Generate a quiz question with 4 options (1 correct, 3 distractors)
 */
export function generateQuizQuestion(
  termId: string,
  lessonId: string
): QuizQuestion | null {
  const term = getTermById(termId);
  if (!term) return null;

  // Get other terms from the same lesson for distractors
  const otherTerms = db
    .query<VocabularyTermRow, [string, string]>(
      `SELECT * FROM vocabulary_terms
       WHERE lesson_id = ? AND id != ?
       ORDER BY RANDOM()
       LIMIT 3`
    )
    .all(lessonId, termId);

  // Need at least 1 distractor for a meaningful quiz
  if (otherTerms.length < 1) {
    return null;
  }

  // Build options array
  const options = [
    {
      id: term.id,
      definition: term.definition,
      isCorrect: true,
    },
    ...otherTerms.map((t) => ({
      id: t.id,
      definition: t.definition,
      isCorrect: false,
    })),
  ];

  // Shuffle options
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return {
    termId: term.id,
    term: term.term,
    options,
  };
}

/**
 * Submit a quiz answer and update progress
 */
export function submitQuizAnswer(
  sessionId: string,
  termId: string,
  isCorrect: boolean,
  timeSpentMs: number
): VocabularyProgressRow {
  const now = new Date().toISOString();

  // Convert isCorrect to SM-2 quality grade
  // Correct answer = 4 (good recall), Incorrect = 2 (barely remembered)
  const quality: SuperMemoGrade = isCorrect ? 4 : 2;

  // Get existing progress
  const existing = db
    .query<VocabularyProgressRow, [string, string, string]>(
      `SELECT * FROM vocabulary_progress
       WHERE session_id = ? AND term_id = ? AND learning_mode = ?`
    )
    .get(sessionId, termId, "quiz");

  // Calculate next review
  const currentRepetitions = existing?.repetitions ?? 0;
  const currentEaseFactor = existing?.ease_factor ?? 2.5;
  const currentInterval = existing?.interval ?? 0;

  const update = calculateNextReview(
    currentRepetitions,
    currentEaseFactor,
    currentInterval,
    quality
  );

  // Record submission
  db.run(
    `INSERT INTO vocabulary_submissions (id, session_id, term_id, submission_type, is_correct, time_spent_ms, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [nanoid(), sessionId, termId, "quiz_answer", isCorrect ? 1 : 0, timeSpentMs, now]
  );

  if (existing) {
    // Update existing progress
    db.run(
      `UPDATE vocabulary_progress SET
        repetitions = ?,
        ease_factor = ?,
        interval = ?,
        next_review_date = ?,
        last_review_date = ?,
        mastery_level = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        update.repetitions,
        update.easeFactor,
        update.interval,
        update.nextReviewDate.toISOString(),
        now,
        update.masteryLevel,
        now,
        existing.id,
      ]
    );

    return {
      ...existing,
      repetitions: update.repetitions,
      ease_factor: update.easeFactor,
      interval: update.interval,
      next_review_date: update.nextReviewDate.toISOString(),
      last_review_date: now,
      mastery_level: update.masteryLevel,
      updated_at: now,
    };
  } else {
    // Create new progress
    const id = nanoid();
    db.run(
      `INSERT INTO vocabulary_progress
        (id, session_id, term_id, learning_mode, repetitions, ease_factor, interval, next_review_date, last_review_date, mastery_level, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        sessionId,
        termId,
        "quiz",
        update.repetitions,
        update.easeFactor,
        update.interval,
        update.nextReviewDate.toISOString(),
        now,
        update.masteryLevel,
        now,
        now,
      ]
    );

    return {
      id,
      session_id: sessionId,
      term_id: termId,
      learning_mode: "quiz",
      repetitions: update.repetitions,
      ease_factor: update.easeFactor,
      interval: update.interval,
      next_review_date: update.nextReviewDate.toISOString(),
      last_review_date: now,
      mastery_level: update.masteryLevel,
      created_at: now,
      updated_at: now,
    };
  }
}

/**
 * Get vocabulary terms due for review
 */
export function getReviewQueue(
  sessionId: string,
  lessonId?: string
): Array<VocabularyTermRow & { progress: VocabularyProgressRow }> {
  const now = new Date().toISOString();

  let query = `
    SELECT vt.*, vp.id as progress_id, vp.session_id, vp.term_id, vp.learning_mode,
           vp.repetitions, vp.ease_factor, vp.interval, vp.next_review_date,
           vp.last_review_date, vp.mastery_level, vp.created_at as progress_created_at,
           vp.updated_at
    FROM vocabulary_terms vt
    INNER JOIN vocabulary_progress vp ON vt.id = vp.term_id
    WHERE vp.session_id = ? AND vp.next_review_date <= ?
  `;

  const params: string[] = [sessionId, now];

  if (lessonId) {
    query += ` AND vt.lesson_id = ?`;
    params.push(lessonId);
  }

  query += ` ORDER BY vp.next_review_date ASC`;

  interface JoinedRow extends VocabularyTermRow {
    progress_id: string;
    term_id: string;
    learning_mode: "flashcard" | "quiz";
    repetitions: number;
    ease_factor: number;
    interval: number;
    next_review_date: string | null;
    last_review_date: string | null;
    mastery_level: "learning" | "reviewing" | "mastered";
    progress_created_at: string;
    updated_at: string;
  }

  const rows = db.query<JoinedRow, string[]>(query).all(...params);

  return rows.map((row) => ({
    id: row.id,
    lesson_id: row.lesson_id,
    concept_id: row.concept_id,
    term: row.term,
    definition: row.definition,
    context: row.context,
    difficulty: row.difficulty,
    order_index: row.order_index,
    created_at: row.created_at,
    progress: {
      id: row.progress_id,
      session_id: sessionId,
      term_id: row.term_id,
      learning_mode: row.learning_mode,
      repetitions: row.repetitions,
      ease_factor: row.ease_factor,
      interval: row.interval,
      next_review_date: row.next_review_date,
      last_review_date: row.last_review_date,
      mastery_level: row.mastery_level,
      created_at: row.progress_created_at,
      updated_at: row.updated_at,
    },
  }));
}

/**
 * Get vocabulary statistics
 */
export function getVocabularyStats(
  sessionId: string,
  lessonId?: string
): VocabularyStats {
  // Get total terms count
  let totalQuery = `SELECT COUNT(*) as count FROM vocabulary_terms`;
  const totalParams: string[] = [];

  if (lessonId) {
    totalQuery += ` WHERE lesson_id = ?`;
    totalParams.push(lessonId);
  }

  const totalResult = db
    .query<{ count: number }, string[]>(totalQuery)
    .get(...totalParams);
  const total = totalResult?.count ?? 0;

  // Get progress by mode
  let progressQuery = `
    SELECT
      vp.learning_mode,
      vp.mastery_level,
      COUNT(*) as count
    FROM vocabulary_progress vp
  `;

  const progressParams: string[] = [sessionId];

  if (lessonId) {
    progressQuery += `
      INNER JOIN vocabulary_terms vt ON vp.term_id = vt.id
      WHERE vp.session_id = ? AND vt.lesson_id = ?
    `;
    progressParams.push(lessonId);
  } else {
    progressQuery += ` WHERE vp.session_id = ?`;
  }

  progressQuery += ` GROUP BY vp.learning_mode, vp.mastery_level`;

  const progressRows = db
    .query<
      { learning_mode: string; mastery_level: string; count: number },
      string[]
    >(progressQuery)
    .all(...progressParams);

  // Initialize stats
  const stats: VocabularyStats = {
    total,
    learning: 0,
    reviewing: 0,
    mastered: 0,
    flashcard: {
      total: 0,
      learning: 0,
      reviewing: 0,
      mastered: 0,
    },
    quiz: {
      total: 0,
      learning: 0,
      reviewing: 0,
      mastered: 0,
    },
  };

  // Populate stats from query results
  for (const row of progressRows) {
    const mode = row.learning_mode as "flashcard" | "quiz";
    const level = row.mastery_level as "learning" | "reviewing" | "mastered";

    stats[mode][level] = row.count;
    stats[mode].total += row.count;
  }

  // Calculate overall stats (use highest mastery level from either mode per term)
  // For simplicity, we'll use the flashcard progress as the primary indicator
  stats.learning = stats.flashcard.learning;
  stats.reviewing = stats.flashcard.reviewing;
  stats.mastered = stats.flashcard.mastered;

  return stats;
}

/**
 * Get lesson info for a term
 */
export function getLessonForTerm(termId: string): LessonRow | undefined {
  const term = getTermById(termId);
  if (!term) return undefined;

  return db
    .query<LessonRow, [string]>(`SELECT * FROM lessons WHERE id = ?`)
    .get(term.lesson_id);
}

/**
 * Get lesson ID by slug (for URL parameter handling)
 */
export function getLessonIdBySlug(slug: string): string | null {
  const lesson = db
    .query<{ id: string }, [string]>(`SELECT id FROM lessons WHERE slug = ?`)
    .get(slug);
  return lesson?.id ?? null;
}

/**
 * Resolve lesson identifier (could be ID or slug) to actual ID
 */
export function resolveLessonId(lessonIdOrSlug: string): string | null {
  // First try to find by ID
  const byId = db
    .query<{ id: string }, [string]>(`SELECT id FROM lessons WHERE id = ?`)
    .get(lessonIdOrSlug);
  if (byId) return byId.id;

  // Then try by slug
  return getLessonIdBySlug(lessonIdOrSlug);
}
