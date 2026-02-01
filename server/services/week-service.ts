import { nanoid } from "nanoid";
import { db, type WeekRow, type LessonRow } from "../db";

// ============================================
// Public Queries
// ============================================

export interface WeekWithCounts extends WeekRow {
  lessonCount: number;
  vocabularyCount: number;
}

export function getPublishedWeeks(): WeekWithCounts[] {
  const weeks = db
    .query<WeekRow, []>(
      `SELECT * FROM weeks WHERE is_published = 1 ORDER BY order_index ASC`
    )
    .all();

  return weeks.map((week) => {
    const lessonCount =
      db
        .query<{ count: number }, [string]>(
          `SELECT COUNT(*) as count FROM lessons WHERE week_id = ? AND is_published = 1`
        )
        .get(week.id)?.count ?? 0;

    const vocabularyCount =
      db
        .query<{ count: number }, [string]>(
          `SELECT COUNT(*) as count FROM vocabulary_terms vt
           INNER JOIN lessons l ON vt.lesson_id = l.id
           WHERE l.week_id = ?`
        )
        .get(week.id)?.count ?? 0;

    return { ...week, lessonCount, vocabularyCount };
  });
}

export function getWeekBySlug(slug: string): WeekRow | null {
  return (
    db
      .query<WeekRow, [string]>(`SELECT * FROM weeks WHERE slug = ?`)
      .get(slug) ?? null
  );
}

export interface WeekDetail extends WeekRow {
  lessons: Array<{
    id: string;
    title: string;
    slug: string;
    description: string | null;
    orderIndex: number;
    conceptCount: number;
    challengeCount: number;
    vocabularyCount: number;
  }>;
}

export function getWeekDetail(slug: string): WeekDetail | null {
  const week = getWeekBySlug(slug);
  if (!week) return null;

  const lessons = db
    .query<LessonRow, [string]>(
      `SELECT * FROM lessons WHERE week_id = ? AND is_published = 1 ORDER BY order_index ASC`
    )
    .all(week.id);

  const lessonDetails = lessons.map((lesson) => {
    const conceptCount =
      db
        .query<{ count: number }, [string]>(
          `SELECT COUNT(*) as count FROM concepts WHERE lesson_id = ?`
        )
        .get(lesson.id)?.count ?? 0;

    const challengeCount =
      db
        .query<{ count: number }, [string]>(
          `SELECT COUNT(*) as count FROM challenges c
           INNER JOIN concepts co ON c.concept_id = co.id
           WHERE co.lesson_id = ?`
        )
        .get(lesson.id)?.count ?? 0;

    const vocabularyCount =
      db
        .query<{ count: number }, [string]>(
          `SELECT COUNT(*) as count FROM vocabulary_terms WHERE lesson_id = ?`
        )
        .get(lesson.id)?.count ?? 0;

    return {
      id: lesson.id,
      title: lesson.title,
      slug: lesson.slug,
      description: lesson.description,
      orderIndex: lesson.order_index,
      conceptCount,
      challengeCount,
      vocabularyCount,
    };
  });

  return { ...week, lessons: lessonDetails };
}

// ============================================
// Admin CRUD
// ============================================

export function getAllWeeksAdmin(): WeekWithCounts[] {
  const weeks = db
    .query<WeekRow, []>(`SELECT * FROM weeks ORDER BY order_index ASC`)
    .all();

  return weeks.map((week) => {
    const lessonCount =
      db
        .query<{ count: number }, [string]>(
          `SELECT COUNT(*) as count FROM lessons WHERE week_id = ?`
        )
        .get(week.id)?.count ?? 0;

    const vocabularyCount =
      db
        .query<{ count: number }, [string]>(
          `SELECT COUNT(*) as count FROM vocabulary_terms vt
           INNER JOIN lessons l ON vt.lesson_id = l.id
           WHERE l.week_id = ?`
        )
        .get(week.id)?.count ?? 0;

    return { ...week, lessonCount, vocabularyCount };
  });
}

export interface CreateWeekInput {
  weekNumber: number;
  title: string;
  slug: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isPublished?: boolean;
}

export function createWeek(input: CreateWeekInput): WeekRow {
  const id = nanoid();
  const now = new Date().toISOString();

  const maxOrder =
    db
      .query<{ max_order: number | null }, []>(
        `SELECT MAX(order_index) as max_order FROM weeks`
      )
      .get()?.max_order ?? -1;

  db.run(
    `INSERT INTO weeks (id, week_number, slug, title, description, start_date, end_date, is_published, order_index, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.weekNumber,
      input.slug,
      input.title,
      input.description ?? null,
      input.startDate ?? null,
      input.endDate ?? null,
      input.isPublished ? 1 : 0,
      maxOrder + 1,
      now,
      now,
    ]
  );

  return db.query<WeekRow, [string]>(`SELECT * FROM weeks WHERE id = ?`).get(id)!;
}

export interface UpdateWeekInput {
  weekNumber?: number;
  title?: string;
  slug?: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isPublished?: boolean;
  orderIndex?: number;
  lessonIds?: string[];
}

export function updateWeek(id: string, input: UpdateWeekInput): WeekRow | null {
  const existing = db
    .query<WeekRow, [string]>(`SELECT * FROM weeks WHERE id = ?`)
    .get(id);

  if (!existing) return null;

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (input.weekNumber !== undefined) {
    updates.push("week_number = ?");
    values.push(input.weekNumber);
  }
  if (input.title !== undefined) {
    updates.push("title = ?");
    values.push(input.title);
  }
  if (input.slug !== undefined) {
    updates.push("slug = ?");
    values.push(input.slug);
  }
  if (input.description !== undefined) {
    updates.push("description = ?");
    values.push(input.description);
  }
  if (input.startDate !== undefined) {
    updates.push("start_date = ?");
    values.push(input.startDate);
  }
  if (input.endDate !== undefined) {
    updates.push("end_date = ?");
    values.push(input.endDate);
  }
  if (input.isPublished !== undefined) {
    updates.push("is_published = ?");
    values.push(input.isPublished ? 1 : 0);
  }
  if (input.orderIndex !== undefined) {
    updates.push("order_index = ?");
    values.push(input.orderIndex);
  }

  if (updates.length > 0) {
    updates.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(id);

    db.run(
      `UPDATE weeks SET ${updates.join(", ")} WHERE id = ?`,
      values
    );
  }

  // Handle lesson associations
  if (input.lessonIds !== undefined) {
    // Clear existing associations
    db.run(`UPDATE lessons SET week_id = NULL WHERE week_id = ?`, [id]);
    // Set new associations
    for (const lessonId of input.lessonIds) {
      db.run(`UPDATE lessons SET week_id = ? WHERE id = ?`, [id, lessonId]);
    }
  }

  return (
    db.query<WeekRow, [string]>(`SELECT * FROM weeks WHERE id = ?`).get(id) ??
    null
  );
}

export function deleteWeek(id: string): boolean {
  const result = db.run(`DELETE FROM weeks WHERE id = ?`, [id]);
  return result.changes > 0;
}

export function getWeekLessons(weekId: string): LessonRow[] {
  return db
    .query<LessonRow, [string]>(
      `SELECT * FROM lessons WHERE week_id = ? ORDER BY order_index ASC`
    )
    .all(weekId);
}
