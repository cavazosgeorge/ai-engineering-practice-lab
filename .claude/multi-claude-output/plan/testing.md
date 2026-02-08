Now let me synthesize all three subagent findings into a unified testing strategy.

---

# Testing Strategy: Admin Dashboard Week-Lesson Assignment

## Executive Summary

The testing strategy covers **3 layers** (unit, integration, edge cases) across the full stack (SQLite DB, Hono API, React UI). Three subagents analyzed the codebase in parallel and identified **~80 specific test cases** plus **10 confirmed bugs** in the existing implementation that tests should validate.

---

## 1. Confirmed Bugs Found During Analysis

These should be fixed as part of the implementation and verified by tests:

| # | Severity | Bug | Location |
|---|----------|-----|----------|
| 1 | **Critical** | `lessonIds: null` crashes server after clearing all assignments (non-iterable) | `week-service.ts:250-257` |
| 2 | **High** | Non-atomic clear+set -- server crash mid-operation leaves orphaned lessons (no transaction) | `week-service.ts:250-257` |
| 3 | **Medium** | `weekNumber: 0` falsiness bug (`!0 === true`) rejects valid input | `admin.ts:235` |
| 4 | **Medium** | Error message extraction uses `error.message` but server returns `{ error: "..." }` | `admin-api.ts:47` |
| 5 | **Medium** | Unpublished weeks accessible via direct slug in public API (`getWeekDetail` lacks `is_published` filter) | `week-service.ts:62-64` |
| 6 | **Low** | `updated_at` not updated when only `lessonIds` changes | `week-service.ts:238-247` |
| 7 | **Low** | No index on `lessons.week_id` | migration `004` |
| 8 | **Low** | Silent lesson "stealing" across weeks with no audit trail | `week-service.ts:254-256` |
| 9 | **Low** | Malformed JSON body causes 500 instead of 400 | `admin.ts:275` |
| 10 | **Low** | Missing cache invalidation for `stats` and `lessons` queries on week update | `useAdmin.ts:127-136` |

---

## 2. Test File Organization

```
server/__tests__/
  fixtures/
    mock-data.ts               # Add MOCK_WEEK, MOCK_WEEK_2, MOCK_WEEK_UNPUBLISHED
    helpers.ts                 # Add seedWeekData(), seedWeekLessonAssignments()
  integration/
    db/
      week-lesson-assignments.test.ts    # Schema & FK integrity (7 tests)
    routes/
      admin-weeks.test.ts               # Admin CRUD + assignment flows (43 tests)
      admin-weeks-auth.test.ts          # Auth rejection tests (4 tests)
      weeks.test.ts                     # Public week routes (7 tests)
  unit/
    services/
      week-service.test.ts              # Service function tests (13 tests)

src/__tests__/
  services/
    admin-api-weeks.test.ts             # API client tests (8 tests)
  hooks/
    useAdminWeeks.test.tsx              # Hook tests (9 tests)
  components/
    admin/
      WeekLessonAssignment.test.tsx     # Component tests (11 tests)
```

---

## 3. Unit Tests (30 tests)

### 3A. Service Layer (`week-service.test.ts`) -- 13 tests

| Test | Expected Behavior |
|------|-------------------|
| `updateWeek with lessonIds should clear existing and assign new` | Old lessons get `week_id=NULL`, new ones get assigned |
| `updateWeek with empty lessonIds should unassign all` | All lessons for that week get `week_id=NULL` |
| `updateWeek with multiple lessonIds should assign all` | All listed lessons get `week_id=weekId` |
| `updateWeek with lessonIds should be idempotent` | Calling twice produces identical DB state |
| `updateWeek without lessonIds key should not affect assignments` | Lesson associations unchanged |
| `updateWeek with lessonIds: null should not crash` | Graceful handling (fix bug #1) |
| `getWeekLessons should return lessons ordered by order_index` | Sorted ascending |
| `getWeekLessons should return empty array for week with no lessons` | Returns `[]` |
| `getAllWeeksAdmin should include correct lessonCount` | Aggregate counts match |
| `getWeekDetail should include lesson details with nested counts` | `conceptCount`, `challengeCount`, `vocabularyCount` |
| `getPublishedWeeks should only count published lessons` | Unpublished lessons excluded from count |
| `deleteWeek should SET NULL on all assigned lessons` | FK cascade works |
| `createWeek should auto-increment order_index` | Sequential 0, 1, 2... |

### 3B. Frontend API Client (`admin-api-weeks.test.ts`) -- 8 tests

Tests for `fetchAdminWeeks`, `createWeek`, `updateWeek`, `deleteWeek` covering correct URL, method, credentials, body serialization, and error handling.

### 3C. Frontend Hooks (`useAdminWeeks.test.tsx`) -- 9 tests

Tests for `useAdminWeeks`, `useAdminLessons`, `useCreateWeek`, `useUpdateWeek`, `useDeleteWeek` covering query behavior, cache invalidation, and optimistic update rollback.

---

## 4. Integration Tests (56 tests)

### 4A. Admin CRUD Routes (`admin-weeks.test.ts`) -- 43 tests

**GET /api/admin/weeks** (5 tests): Returns all weeks including unpublished, with correct counts, ordering, and camelCase field names.

**POST /api/admin/weeks** (9 tests): Creates weeks, validates required fields, handles 409 on duplicate `weekNumber`/`slug`, auto-assigns `order_index`, defaults `isPublished` to false.

**PATCH /api/admin/weeks/:id** (15 tests combined):
- Field updates: title, isPublished, multiple fields, 404 for missing, 409 for duplicates
- Lesson assignment (core feature):
  - `should assign lessons to a week`
  - `should clear previous assignments when reassigning`
  - `should unassign all lessons with empty array`
  - `should not affect lessons in other weeks`
  - `should allow a lesson to move between weeks`
  - `should combine field updates with lesson assignment`
  - `should verify assignment via public API after admin update`
  - `should handle nonexistent lesson IDs gracefully`

**DELETE /api/admin/weeks/:id** (5 tests): Deletes, returns 404 for missing, verifies SET NULL on lessons, cascades data_sources/generation_jobs.

**Multi-Step Workflows** (3 tests):
- Full lifecycle: create -> assign -> publish -> verify public
- Reassignment flow: assign -> verify -> reassign -> verify
- Create-then-delete: verify no orphaned data

**Data Integrity** (6 tests): FK constraints, UNIQUE constraints, cross-table count consistency.

### 4B. Auth Tests (`admin-weeks-auth.test.ts`) -- 4 tests

401 for unauthenticated requests, 403 for non-admin users (separate file due to `mock.module` hoisting).

### 4C. Public Routes (`weeks.test.ts`) -- 7 tests

Published weeks only, correct `lessonCount`, slug detail with lessons, 404 for missing slug, unpublished lessons excluded, nested counts.

### 4D. Schema Tests (`week-lesson-assignments.test.ts`) -- 7 tests

Table structure verification, UNIQUE constraints, FK behavior (NULL allowed, invalid FK rejected, ON DELETE SET NULL).

---

## 5. Edge Case & Failure Mode Tests

### Critical Path Tests

| Edge Case | Test Name | What Could Go Wrong |
|-----------|-----------|-------------------|
| `lessonIds: null` | `patch-week-lessonIds-null-should-not-crash` | Server crashes after clearing assignments (Bug #1) |
| Non-atomic operation | `partial-assignment-on-crash-should-use-transaction` | Data inconsistency if server crashes mid-operation (Bug #2) |
| `weekNumber: 0` | `create-week-zero-should-be-accepted` | Falsiness rejects valid input (Bug #3) |
| Unpublished week slug | `public-api-should-not-expose-unpublished-weeks` | Data exposure via direct slug access (Bug #5) |

### Data Boundary Tests

| Edge Case | Test Name | Expected |
|-----------|-----------|----------|
| Duplicate lesson IDs in array | `duplicate-lessonIds-handled-idempotently` | Single assignment, no error |
| Non-existent lesson IDs | `nonexistent-lessonIds-silently-skipped` | Valid IDs assigned, invalid ignored |
| Very large lessonIds array | `10000-lessonIds-does-not-crash` | Processes (slowly) or rejects gracefully |
| Invalid types in lessonIds | `non-string-lessonIds-handled-safely` | No SQL injection, no crash |
| Empty string slug | `empty-slug-should-be-rejected` | 400 error (currently passes validation) |
| Date range: start > end | `invalid-date-range-should-be-rejected` | 400 error (currently not validated) |

### Concurrency Tests

| Edge Case | Test Name | Expected |
|-----------|-----------|----------|
| Two admins assigning same week | `concurrent-assignment-last-write-wins` | One set of assignments survives |
| Assign during delete | `assignment-during-week-deletion` | Either 404 or FK constraint prevents orphan |
| Rapid double-save | `rapid-double-save-is-idempotent` | Same end state regardless |

### UI Resilience Tests

| Edge Case | Test Name | Expected |
|-----------|-----------|----------|
| Network failure during save | `network-failure-shows-error` | Error message displayed, state preserved |
| Empty lesson list | `no-lessons-shows-empty-state` | Friendly message, no crash |
| 100+ lessons in picker | `large-lesson-list-renders-performantly` | No UI jank |
| Stale cache after external change | `stale-data-refreshes-after-staleTime` | Updates within 30s |

---

## 6. Mock Requirements

| Layer | What to Mock | Pattern |
|-------|-------------|---------|
| **DB (backend)** | `mock.module("../../../db", ...)` with in-memory SQLite | Existing pattern in `test-db.ts` |
| **Auth (backend)** | `mock.module("../../../auth", ...)` returning admin session | New -- needed for all admin route tests |
| **Fetch (frontend API)** | `createMockFetch()` from `test-utils.ts` | Existing pattern |
| **Admin API (hooks)** | `mock.module("../../services/admin-api", ...)` | Existing pattern |
| **Admin hooks (components)** | `mock.module("../../../hooks/useAdmin", ...)` | Existing pattern |

---

## 7. Test Data Fixtures

Add to `mock-data.ts`:
- `MOCK_WEEK` -- published, week_number 1, with dates
- `MOCK_WEEK_2` -- published, week_number 2, with dates
- `MOCK_WEEK_UNPUBLISHED` -- unpublished, week_number 3, no dates

Add to `helpers.ts`:
- `seedWeekData()` -- inserts 3 weeks, pre-assigns `MOCK_LESSON` to `MOCK_WEEK`
- Update `clearTestData()` to include `DELETE FROM weeks` in correct FK order

---

## 8. Priority Order for Test Implementation

1. **Service layer unit tests** -- validates the core assignment logic and catches bugs #1, #2, #6
2. **Admin route integration tests** -- validates the full API contract including validation bugs #3, #9
3. **Schema/integrity tests** -- validates FK constraints and ON DELETE behavior
4. **Edge case tests for critical bugs** -- `null` crash, non-atomic operation, unpublished exposure
5. **Frontend hook tests** -- validates cache invalidation (bug #10)
6. **Public route tests** -- validates published-only filtering (bug #5)
7. **Component tests** -- validates UI behavior (depends on actual component implementation)
8. **Auth tests** -- validates 401/403 (separate file)
