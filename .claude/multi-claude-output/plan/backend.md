Now let me synthesize the findings from all three subagents into a unified backend implementation plan.

---

## BACKEND IMPLEMENTATION PLAN: Lesson-to-Week Assignment

### Key Finding

All three subagents converge on the same conclusion: **the database schema and core service logic already exist.** The `lessons` table already has a `week_id` FK to `weeks`, and `week-service.ts` already has `updateWeek()` with `lessonIds` support. The main work is extending the API surface and service layer for more granular operations that the admin UI needs.

---

### Current State (Already Implemented)

| Component | File | What Exists |
|-----------|------|-------------|
| Schema | `server/db/migrations/004_weeks_and_rag_schema.sql` | `lessons.week_id REFERENCES weeks(id) ON DELETE SET NULL` |
| Types | `server/db/index.ts` | `LessonRow.week_id`, `WeekRow` interfaces |
| Service | `server/services/week-service.ts` | `updateWeek(id, { lessonIds })`, `getWeekLessons()`, `getAllWeeksAdmin()` |
| Route | `server/routes/admin.ts` | `PATCH /api/admin/weeks/:id` accepts `lessonIds` |

---

### What Needs to Be Built

#### Phase 1: New Service Functions

**File: `server/services/week-service.ts`**

```typescript
// 1. Get unassigned lessons (for the assignment UI dropdown/list)
export function getUnassignedLessons(): LessonRow[]
// SQL: SELECT * FROM lessons WHERE week_id IS NULL ORDER BY order_index ASC

// 2. Get all lessons with their week info (for the full assignment overview)
export function getAllLessonsWithWeekInfo(): (LessonRow & { weekTitle: string | null; weekNumber: number | null })[]
// SQL: SELECT l.*, w.title as week_title, w.week_number FROM lessons l LEFT JOIN weeks w ON l.week_id = w.id ORDER BY w.order_index ASC, l.order_index ASC

// 3. Assign single lesson to a week
export function assignLessonToWeek(weekId: string, lessonId: string): LessonRow | null
// SQL: UPDATE lessons SET week_id = ?, updated_at = ? WHERE id = ?

// 4. Unassign single lesson from its week
export function unassignLessonFromWeek(lessonId: string): LessonRow | null
// SQL: UPDATE lessons SET week_id = NULL, updated_at = ? WHERE id = ?
```

#### Phase 2: New API Routes

**File: `server/routes/admin.ts`** (add to existing file)

| Method | Path | Service Function | Purpose |
|--------|------|------------------|---------|
| `GET` | `/api/admin/lessons/unassigned` | `getUnassignedLessons()` | List lessons not assigned to any week |
| `GET` | `/api/admin/weeks/:weekId/lessons` | `getWeekLessonsDetailed()` | List lessons in a specific week |
| `POST` | `/api/admin/weeks/:weekId/lessons/:lessonId` | `assignLessonToWeek()` | Assign one lesson to a week |
| `DELETE` | `/api/admin/weeks/:weekId/lessons/:lessonId` | `unassignLessonFromWeek()` | Remove a lesson from a week |

The existing `PATCH /api/admin/weeks/:id` with `lessonIds` array handles bulk assignment already.

#### Phase 3: No New Migrations Needed

The schema is ready. `lessons.week_id` is nullable, foreign-keyed, and has `ON DELETE SET NULL`. No new columns or tables required for Phase 1.

---

### Implementation Order

1. **Add service functions** to `server/services/week-service.ts` (~4 new functions)
2. **Add API routes** to `server/routes/admin.ts` (~4 new endpoints)
3. **Verify** with manual API testing that endpoints work correctly

---

### Business Rules to Enforce

- A lesson can belong to **zero or one** week (nullable FK)
- Reassigning a lesson from week A to week B is allowed — just update `week_id`
- Unassigning sets `week_id = NULL`; the lesson continues to exist
- Deleting a week sets all its lessons' `week_id` to NULL (existing cascade)
- Ordering within a week uses the existing `order_index` column
- The `lessonIds` array order in bulk assignment determines display order
- Validation: check week/lesson existence before mutation; return 404 if not found

---

### Error Handling

| Scenario | HTTP Status | Response |
|----------|-------------|----------|
| Week not found | 404 | `{ error: "Week not found" }` |
| Lesson not found | 404 | `{ error: "Lesson not found" }` |
| Invalid ID format | 400 | `{ error: "Invalid ID" }` |
| Lesson already in target week | 200 | Idempotent — no error, just confirm |

---

### Key Files to Modify

| File | Changes |
|------|---------|
| `server/services/week-service.ts` | Add `getUnassignedLessons()`, `getAllLessonsWithWeekInfo()`, `assignLessonToWeek()`, `unassignLessonFromWeek()` |
| `server/routes/admin.ts` | Add 4 new route handlers consuming the new service functions |

No new files needed. No migrations needed. The backend work is scoped and minimal because the foundation is already in place.
