The `.claude` directory requires permission. Let me present the synthesized plan directly.

---

# Unified Implementation Plan: Week-Lesson Assignment Feature

## Current State

| Layer | Status | Notes |
|-------|--------|-------|
| DB Schema | **Done** | `lessons.week_id` FK exists (migration 004) |
| Backend Service | **Done** | `updateWeek(id, { lessonIds })` clears + reassigns |
| Backend Route | **Done** | `PATCH /api/admin/weeks/:id` accepts `lessonIds` |
| Frontend Hook | **Done** | `useUpdateWeek()` calls the endpoint |
| Frontend API Types | **Partial** | `UpdateWeekInput.lessonIds` exists; `AdminLesson.weekId` missing |
| Frontend UI | **Not Started** | No assignment interface exists |

**This is ~80% frontend, ~15% backend hardening, ~5% testing.**

---

## Bugs to Fix (In Scope)

| # | Severity | Bug | File |
|---|----------|-----|------|
| 1 | **Critical** | `lessonIds: null` crashes server (non-iterable) | `week-service.ts:250-257` |
| 2 | **High** | Non-atomic clear+set (no transaction) | `week-service.ts:250-257` |
| 3 | **Medium** | `weekNumber: 0` rejected (`!0 === true`) | `admin.ts:235` |
| 6 | **Low** | `updated_at` not set when only `lessonIds` changes | `week-service.ts:238-247` |

---

## 5 Phases, 10 Steps

### Phase 1: Backend Hardening (Steps 1-3)

**Step 1** — Fix bugs #1, #2, #6 in `server/services/week-service.ts`:
- Guard `lessonIds` with `Array.isArray()` check (bug #1)
- Wrap clear+set in `db.transaction()` (bug #2)
- Update `updated_at` when lessonIds changes (bug #6)

**Step 2** — Fix bug #3 in `server/routes/admin.ts`:
- Replace `!weekNumber` with `weekNumber === undefined || weekNumber === null`

**Step 3** — Add unassigned lessons endpoint:
- New service function `getUnassignedLessons()` in `week-service.ts`
- New route `GET /api/admin/lessons/unassigned` in `admin.ts`
- Verify lesson responses include `weekId` in camelCase mapping

### Phase 2: Frontend Types & Hooks (Step 4)

**Step 4** — Wire data layer:
- Add `weekId: string | null` to `AdminLesson` interface in `admin-api.ts`
- Add `fetchUnassignedLessons()` function in `admin-api.ts`
- Add `useUnassignedLessons()` hook + query key in `useAdmin.ts`
- Update `useUpdateWeek` cache invalidation to include `unassignedLessons`

### Phase 3: Frontend UI Components (Steps 5-8)

**Step 5** — `LessonAssignmentRow.tsx`: Checkbox row, click-to-toggle, accessible
**Step 6** — `AssignmentPanel.tsx`: Dual-list (available | assigned), action bar (Save/Cancel)
**Step 7** — `WeekSelector.tsx`: Week card list with selection highlight
**Step 8** — `WeekAssignmentTab.tsx`: Container managing state, save/cancel flow

### Phase 4: Integration (Step 9)

**Step 9** — Add "Week Assignments" tab to `AdminDashboardPage.tsx`

### Phase 5: Testing & Verification (Step 10)

**Step 10** — Backend service + route tests, manual verification checklist

---

## Key Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| UI pattern | New tab (not modal/page) | Matches existing admin tabs pattern |
| Assignment UX | Dual-list with checkboxes | Simpler, accessible, no library deps |
| Update strategy | Pessimistic (wait for server) | Matches codebase patterns |
| API approach | Reuse existing `PATCH` with `lessonIds[]` | Already implemented, atomic |

---

## Files Modified vs Created

**Modified (6):**
- `server/services/week-service.ts` — bug fixes + new function
- `server/routes/admin.ts` — bug fix + new route
- `src/services/admin-api.ts` — type extension + new fetch
- `src/hooks/useAdmin.ts` — new hook + cache invalidation
- `src/pages/admin/AdminDashboardPage.tsx` — new tab

**Created (4 components + test files):**
- `src/components/admin/weeks/LessonAssignmentRow.tsx`
- `src/components/admin/weeks/AssignmentPanel.tsx`
- `src/components/admin/weeks/WeekSelector.tsx`
- `src/components/admin/weeks/WeekAssignmentTab.tsx`

---

## Out of Scope

Bugs #5 (unpublished slug exposure), #7 (missing index), #8 (silent stealing), #9 (malformed JSON 500). Lesson reordering within weeks. Bulk cross-week operations.
