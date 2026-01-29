import { nanoid } from "nanoid";
import {
  db,
  type LessonRow,
  type VocabularyTermRow,
} from "../db";

// ============================================
// Dashboard Stats
// ============================================

export interface AdminDashboardStats {
  lessonCount: number;
  vocabularyCount: number;
  challengeCount: number;
}

export function getAdminDashboardStats(): AdminDashboardStats {
  const lessonCount = db
    .query<{ count: number }, []>("SELECT COUNT(*) as count FROM lessons")
    .get()?.count ?? 0;

  const vocabularyCount = db
    .query<{ count: number }, []>("SELECT COUNT(*) as count FROM vocabulary_terms")
    .get()?.count ?? 0;

  const challengeCount = db
    .query<{ count: number }, []>("SELECT COUNT(*) as count FROM challenges")
    .get()?.count ?? 0;

  return {
    lessonCount,
    vocabularyCount,
    challengeCount,
  };
}

// ============================================
// Lessons (Admin)
// ============================================

export interface AdminLessonWithTermCount extends LessonRow {
  termCount: number;
}

export function getAllLessonsAdmin(): AdminLessonWithTermCount[] {
  const lessons = db
    .query<LessonRow, []>(
      `SELECT * FROM lessons ORDER BY order_index ASC`
    )
    .all();

  return lessons.map((lesson) => {
    const termCount = db
      .query<{ count: number }, [string]>(
        `SELECT COUNT(*) as count FROM vocabulary_terms WHERE lesson_id = ?`
      )
      .get(lesson.id)?.count ?? 0;

    return {
      ...lesson,
      termCount,
    };
  });
}

// ============================================
// Vocabulary Terms (Admin)
// ============================================

export interface VocabularyTermWithLesson extends VocabularyTermRow {
  lessonTitle: string;
  lessonSlug: string;
}

export function getVocabularyTermsAdmin(): VocabularyTermWithLesson[] {
  interface JoinedRow extends VocabularyTermRow {
    lesson_title: string;
    lesson_slug: string;
  }

  const rows = db
    .query<JoinedRow, []>(
      `SELECT vt.*, l.title as lesson_title, l.slug as lesson_slug
       FROM vocabulary_terms vt
       INNER JOIN lessons l ON vt.lesson_id = l.id
       ORDER BY l.order_index ASC, vt.order_index ASC`
    )
    .all();

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
    lessonTitle: row.lesson_title,
    lessonSlug: row.lesson_slug,
  }));
}

export function getVocabularyTermById(id: string): VocabularyTermWithLesson | null {
  interface JoinedRow extends VocabularyTermRow {
    lesson_title: string;
    lesson_slug: string;
  }

  const row = db
    .query<JoinedRow, [string]>(
      `SELECT vt.*, l.title as lesson_title, l.slug as lesson_slug
       FROM vocabulary_terms vt
       INNER JOIN lessons l ON vt.lesson_id = l.id
       WHERE vt.id = ?`
    )
    .get(id);

  if (!row) return null;

  return {
    id: row.id,
    lesson_id: row.lesson_id,
    concept_id: row.concept_id,
    term: row.term,
    definition: row.definition,
    context: row.context,
    difficulty: row.difficulty,
    order_index: row.order_index,
    created_at: row.created_at,
    lessonTitle: row.lesson_title,
    lessonSlug: row.lesson_slug,
  };
}

export interface CreateVocabularyTermInput {
  lessonId: string;
  conceptId?: string | null;
  term: string;
  definition: string;
  context?: string | null;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export function createVocabularyTerm(input: CreateVocabularyTermInput): VocabularyTermRow {
  const id = nanoid();
  const now = new Date().toISOString();

  // Get next order_index for this lesson
  const maxOrder = db
    .query<{ max_order: number | null }, [string]>(
      `SELECT MAX(order_index) as max_order FROM vocabulary_terms WHERE lesson_id = ?`
    )
    .get(input.lessonId)?.max_order ?? -1;

  const orderIndex = maxOrder + 1;

  db.run(
    `INSERT INTO vocabulary_terms (id, lesson_id, concept_id, term, definition, context, difficulty, order_index, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.lessonId,
      input.conceptId ?? null,
      input.term,
      input.definition,
      input.context ?? null,
      input.difficulty,
      orderIndex,
      now,
    ]
  );

  return {
    id,
    lesson_id: input.lessonId,
    concept_id: input.conceptId ?? null,
    term: input.term,
    definition: input.definition,
    context: input.context ?? null,
    difficulty: input.difficulty,
    order_index: orderIndex,
    created_at: now,
  };
}

export interface UpdateVocabularyTermInput {
  lessonId?: string;
  conceptId?: string | null;
  term?: string;
  definition?: string;
  context?: string | null;
  difficulty?: "beginner" | "intermediate" | "advanced";
  orderIndex?: number;
}

export function updateVocabularyTerm(
  id: string,
  input: UpdateVocabularyTermInput
): VocabularyTermRow | null {
  // Check if term exists
  const existing = db
    .query<VocabularyTermRow, [string]>(
      `SELECT * FROM vocabulary_terms WHERE id = ?`
    )
    .get(id);

  if (!existing) return null;

  // Build dynamic SET clause
  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (input.lessonId !== undefined) {
    updates.push("lesson_id = ?");
    values.push(input.lessonId);
  }
  if (input.conceptId !== undefined) {
    updates.push("concept_id = ?");
    values.push(input.conceptId);
  }
  if (input.term !== undefined) {
    updates.push("term = ?");
    values.push(input.term);
  }
  if (input.definition !== undefined) {
    updates.push("definition = ?");
    values.push(input.definition);
  }
  if (input.context !== undefined) {
    updates.push("context = ?");
    values.push(input.context);
  }
  if (input.difficulty !== undefined) {
    updates.push("difficulty = ?");
    values.push(input.difficulty);
  }
  if (input.orderIndex !== undefined) {
    updates.push("order_index = ?");
    values.push(input.orderIndex);
  }

  if (updates.length === 0) {
    return existing;
  }

  values.push(id);

  db.run(
    `UPDATE vocabulary_terms SET ${updates.join(", ")} WHERE id = ?`,
    values
  );

  // Return updated record
  return db
    .query<VocabularyTermRow, [string]>(
      `SELECT * FROM vocabulary_terms WHERE id = ?`
    )
    .get(id) ?? null;
}

export function deleteVocabularyTerm(id: string): boolean {
  const result = db.run(
    `DELETE FROM vocabulary_terms WHERE id = ?`,
    [id]
  );

  return result.changes > 0;
}
