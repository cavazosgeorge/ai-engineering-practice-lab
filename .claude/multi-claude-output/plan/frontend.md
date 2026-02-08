All three subagents have completed their analysis. Let me synthesize the findings into a unified frontend implementation plan.

---

## FRONTEND IMPLEMENTATION PLAN: Week-Lesson Assignment Feature

### Key Discovery

The backend already supports lesson assignment via `PATCH /api/admin/weeks/:id` with `{ lessonIds: string[] }`. The `week-service.ts` clears existing assignments and sets new ones. **This is primarily a frontend task.**

---

### Architecture Decision: Tab Integration vs Modal

**Recommendation: Inline Tab** (not modal or separate page)

Add a **"Week Assignments"** tab to the existing `AdminDashboardPage.tsx` alongside Dashboard, Vocabulary, and Weeks tabs. This keeps the experience consistent and avoids context-switching via modals.

---

### Component Hierarchy

```
AdminDashboardPage (existing)
└── Tabs.Root
    └── Tabs.Content value="assignments"  ← NEW TAB
        └── WeekAssignmentTab
            ├── WeekSelector (left/top panel)
            │   └── WeekCard (per week, shows lesson count)
            └── AssignmentPanel (right/bottom panel, shown when week selected)
                ├── Column: Available Lessons (unassigned)
                │   └── LessonAssignmentRow (checkbox item)
                ├── Column: Assigned Lessons (to selected week)
                │   └── LessonAssignmentRow (checkbox item)
                └── ActionBar (Save / Cancel / dirty indicator)
```

---

### New Files

| File | Purpose |
|------|---------|
| `src/components/admin/weeks/WeekAssignmentTab.tsx` | Container: fetches data, manages state, orchestrates layout |
| `src/components/admin/weeks/WeekSelector.tsx` | Week list with selection highlighting |
| `src/components/admin/weeks/AssignmentPanel.tsx` | Dual-list assignment UI for selected week |
| `src/components/admin/weeks/LessonAssignmentRow.tsx` | Single lesson with custom checkbox (matches existing admin patterns) |

---

### Modified Files

| File | Changes |
|------|---------|
| `src/pages/admin/AdminDashboardPage.tsx` | Add "Week Assignments" tab trigger + content |
| `src/hooks/useAdmin.ts` | Add `adminKeys.weekLessons()`, `useAssignLessonsToWeek()` mutation |
| `src/services/admin-api.ts` | Extend `AdminLesson` interface to include `weekId: string \| null` |
| `server/routes/admin.ts` | (Optional) Add `GET /api/admin/lessons/unassigned` endpoint |

---

### State Management Strategy

**Server state** via TanStack Query:
- `useAdminWeeks()` — existing, fetches all weeks with `lessonCount`
- `useAdminLessons()` — existing, but needs `weekId` added to response
- `useAssignLessonsToWeek()` — new mutation calling `updateWeek(id, { lessonIds })`

**Local component state** in `WeekAssignmentTab`:
- `selectedWeekId: string | null` — which week is being edited
- `pendingLessonIds: Set<string>` — working copy of assigned lesson IDs
- `isDirty: boolean` — derived from comparing pending vs current server state

**Cache invalidation** on save (not optimistic updates — simpler, aligns with codebase patterns):
- Invalidate `adminKeys.weeks()` (refreshes lesson counts)
- Invalidate `adminKeys.stats()`

---

### Query Key Additions

```typescript
export const adminKeys = {
  // ... existing
  weekLessons: (weekId: string) => [...adminKeys.all, "week-lessons", weekId] as const,
};
```

---

### User Flow

1. Admin clicks **"Week Assignments"** tab
2. Left panel shows list of weeks with lesson counts
3. Admin clicks a week → right panel shows dual-list:
   - **Available Lessons** (unassigned or assigned to other weeks)
   - **Assigned Lessons** (currently in this week)
4. Admin toggles lessons via checkbox clicks (entire row is click target)
5. "Save" button enabled only when `isDirty === true`
6. On save: mutation fires, toast confirms, counts update
7. On cancel: `pendingLessonIds` resets to server state

---

### Visual Design (follows existing admin patterns)

- **Dark theme**: `bg="gray.950"` page, `bg="gray.900"` cards
- **Week cards**: cyan left border on hover, cyan border when selected
- **Lesson rows**: custom checkbox (cyan fill when checked), `bg="gray.800"` when assigned
- **Buttons**: Primary `bg="cyan.600"`, Ghost for cancel
- **Font**: JetBrains Mono for data labels
- **Chakra v3 two-layer rule**: All `_hover` paired with `_highlighted`, all `_focus` paired with `_focusVisible={{ outline: "none", boxShadow: "none" }}`

---

### Accessibility

- Lesson rows use `role="checkbox"` + `aria-checked` + `aria-label`
- Keyboard: Space/Enter to toggle, Tab to navigate between items
- Column headings serve as section labels
- `aria-live="polite"` region announces selection count changes
- Focus returns to week list when assignment panel closes

---

### Responsive Layout

- **Desktop**: Side-by-side (week list left, assignment panel right)
- **Mobile (<768px)**: Stacked vertically, week selector on top, assignment panel below
- **Touch targets**: Minimum 44px height on lesson rows
- **Scrollable columns**: Independent scroll with `overflowY="auto"` and `maxH` constraint

---

### Implementation Order

1. **Extend `AdminLesson` type** to include `weekId` in `admin-api.ts`
2. **Update server response** to return `week_id` for lessons (if not already)
3. **Add mutation hook** `useAssignLessonsToWeek()` in `useAdmin.ts`
4. **Build `LessonAssignmentRow`** — atomic checkbox component
5. **Build `AssignmentPanel`** — dual-list with available/assigned columns
6. **Build `WeekSelector`** — week list with selection state
7. **Build `WeekAssignmentTab`** — container wiring it all together
8. **Integrate tab** into `AdminDashboardPage.tsx`
9. **Test**: 0 weeks, 0 lessons, bulk assignment, save/cancel flow

---

### Edge Cases to Handle

| Scenario | Behavior |
|----------|----------|
| No weeks exist | Show empty state: "No weeks configured yet" |
| No lessons exist | Show empty state: "No lessons available" |
| Lesson assigned to different week | Show which week it belongs to; toggling reassigns it |
| Save with no changes | Save button disabled (`isDirty === false`) |
| API error on save | Error toast, keep pending state so user can retry |
| Navigate away with unsaved changes | (Optional) Browser `beforeunload` warning |
