# AI Engineering Practice Lab - Handoff

## What Was Done

### Session: Comprehensive Test Suite Implementation

Implemented full test coverage across all application layers using Bun's built-in testing module (`bun:test`).

**Test Infrastructure:**
- `server/__tests__/fixtures/` - Test database setup, mock data, seeding helpers
- `src/__tests__/setup/` - React testing utilities, DOM setup, mock utilities
- `bunfig.toml` - Bun test configuration with DOM preload

**Backend Tests (197 tests):**
- Unit tests for SM-2 spaced repetition algorithm and code validator
- Database integration tests for migrations, schema constraints, cascade deletes
- API route integration tests for all endpoints (lessons, challenges, progress, vocabulary)
- Edge case tests for boundary conditions and input validation

**Frontend Tests (140 tests):**
- Service tests for API client and Python validator helpers
- React component tests for VocabularyFlashcard, VocabularyQuiz, TestResults
- Uses @testing-library/react with happy-dom

**Test Scripts Added:**
```bash
bun test              # All tests (337 total)
bun test:backend      # Backend only (197)
bun test:frontend     # Frontend only (140)
bun test:unit         # Unit tests
bun test:integration  # Integration tests
bun test:components   # React components
bun test:edge         # Edge cases
bun test:coverage     # With coverage
bun test:watch        # Watch mode
```

**Dependencies Added:**
- @testing-library/react, @testing-library/user-event, @testing-library/jest-dom
- happy-dom, @happy-dom/global-registrator

**Files Modified:**
- `src/services/pythonValidator.ts` - Exported helper functions (deepEqual, pythonToJS, jsToPythonLiteral) for testing

### Session: Routing Fix & Repository Setup

**Vocabulary Routing Fix:**
- Fixed breadcrumb navigation not working in vocabulary flashcards/quiz modes
- Changed from hybrid state/props mode detection to URL-derived mode
- Mode now derived from `location.pathname` (reactive to route changes)
- Removed `userMode` state that was persisting across navigations

**Repository Configuration:**
- Made repository public (enables branch protection on free plan)
- Enabled branch protection on `main`:
  - Requires pull requests (no direct pushes)
  - Force pushes blocked
  - Branch deletion blocked

**Git Workflow:**
- `main` - Protected production branch
- `development` - Integration branch, kept in sync with main
- Feature branches created from `development`
- PRs merge to `main`, then sync back to `development`

### Session: Delayed Skeletons & Query Parallelization

Applied delayed skeleton pattern and fixed cascading query dependencies for optimal loading UX.

**Delayed Skeleton Pattern (all pages):**
- Replaced loading spinners with skeleton loaders that have 200ms CSS animation delay
- Prevents skeleton "flash" on fast loads - only appears if data takes >200ms
- Applied to: Dashboard, Lessons, LessonDetail, ChallengePage, VocabularyPage, Progress, Review
- Pattern: `opacity={0}` + `animation="fadeIn 0.2s ease-in 0.2s forwards"`

**Dashboard Prefetching:**
- Added prefetch on "AI Practice Lab" header link hover
- Warms cache for lessons and progress data before navigation
- Eliminates loading state when navigating back to dashboard

**Cascading Query Fix (VocabularyPage):**
- Changed `useVocabularyTerms(lesson?.id)` to `useVocabularyTerms(lessonSlug)`
- Updated hook and API function to accept `lessonIdOrSlug`
- All three queries (lesson, terms, stats) now run in parallel instead of waterfall

**react-performance Skill Updates:**
- Added "Delayed Skeleton Pattern" section to data-fetching.md
- Added skeleton flash anti-pattern to SKILL.md Pattern Selection Guide
- Added to Quick Wins Checklist

### Session: React Performance Optimization & UI Polish

Applied comprehensive React performance patterns across the application, eliminating loading spinner flicker and improving perceived performance.

**Performance Fixes:**
- Converted all pages from `useEffect` data fetching to TanStack Query hooks
- Changed loading states from `if (isLoading)` to `if (!data && isLoading)` pattern (spinner only on initial load)
- Added `prefetchChallenge`, `prefetchLesson`, `prefetchVocabulary` helper functions
- Implemented hover prefetching on:
  - Lesson cards (Dashboard, Lessons pages)
  - Study Vocabulary card (LessonDetail)
  - Challenge links (LessonDetail)
- Added `startTransition` for mode changes in VocabularyPage
- Prefetch next quiz question while user views current

**Component Optimizations:**
- `ExecutionVisualizer.tsx` - Added `useMemo` for `detectCodePatterns()`
- `TestResults.tsx` - Wrapped `toggleTest` in `useCallback`
- `SoftmaxOperation.tsx` - Added `useMemo` for `calculateSoftmaxSteps()`
- `VocabularyFlashcardDeck.tsx` - Reduced dependency array by using `reviewedCards.size`

**Layout Shift Fix:**
- Added framer-motion staggered entrance animations to LessonDetail page
- Sections (breadcrumb → header → vocab card → concepts) animate in sequence
- Masks timing differences from cascading query dependencies (vocabStats depends on lesson.id)

**UI Polish:**
- Removed redundant checkmark from completed challenges (kept green right border only)

**react-performance Skill Updates:**
- Added "Loading State Optimization" checklist for eliminating spinners
- Added "Cascading Query Dependencies (Layout Shift)" section with solutions:
  1. Entrance animations (recommended)
  2. Reserve space with skeletons
  3. Restructure API to avoid dependency
- Updated Pattern Selection Guide and Anti-Pattern Detection

### Session: Vocabulary Challenge Feature (feature/vocabulary-challenges branch)

Implemented a complete vocabulary challenge system with flashcard-style learning and multiple choice quizzes for AI/ML terminology.

**Backend (server/):**
- `db/migrations/002_vocabulary_schema.sql` - New tables: vocabulary_terms, vocabulary_progress, vocabulary_submissions
- `services/vocabulary-service.ts` - Core business logic with SM-2 spaced repetition
- `routes/vocabulary.ts` - REST API endpoints for terms, flashcards, quizzes, stats
- `scripts/seed-vocabulary.ts` - Seeds 42 vocabulary terms across 5 lessons

**Frontend (src/):**
- `components/vocabulary/` - 6 new components:
  - `VocabularyFlashcard.tsx` - 3D flip animation flashcard
  - `VocabularyFlashcardDeck.tsx` - Session manager with keyboard controls
  - `VocabularyQuiz.tsx` - Multiple choice with immediate feedback
  - `VocabularyQuizSession.tsx` - Quiz session with scoring
  - `VocabularyDashboard.tsx` - Lesson vocabulary overview with stats
- `hooks/useVocabulary.ts` - TanStack Query hooks for data fetching
- `pages/VocabularyPage.tsx` - Main vocabulary page with mode switching

**API Endpoints:**
- `GET /api/vocabulary/:lessonSlug/terms` - Get terms (supports ID or slug)
- `GET /api/vocabulary/:lessonSlug/stats` - Get progress stats
- `POST /api/vocabulary/flashcard/:termId/review` - Submit flashcard review
- `GET /api/vocabulary/quiz/:termId/question` - Get quiz question
- `POST /api/vocabulary/quiz/:termId/answer` - Submit quiz answer
- `GET /api/vocabulary/review-queue` - Get due vocabulary items

**Routes Added:**
- `/vocabulary/:lessonSlug` - Dashboard
- `/vocabulary/:lessonSlug/flashcards` - Flashcard mode
- `/vocabulary/:lessonSlug/quiz` - Quiz mode

**Seed Command:** `bun run db:seed-vocabulary`

### Session: Code Execution Visualization
- Added animated step-by-step visualization for passed challenges
- Created visualization components:
  - `ExecutionVisualizer.tsx` - Main container with playback controls (play/pause, step forward/back, speed control)
  - `MatrixOperation.tsx` - Linear layer (y = Wx + b) visualization
  - `ArrayTransform.tsx` - Generic array transformation visualization
  - `SoftmaxOperation.tsx` - Softmax function step-by-step visualization
  - `EncodeOperation.tsx` - Word-level tokenization encode visualization
  - `DecodeOperation.tsx` - Word-level tokenization decode visualization
  - `UnkEncodeOperation.tsx` - Handle out-of-vocabulary words with [UNK]
  - `BuildVocabOperation.tsx` - Build character vocabulary visualization
  - `GreedySelectOperation.tsx` - Greedy token selection visualization
  - `TopKOperation.tsx` - Top-k filtering visualization
  - `TopPOperation.tsx` - Top-p (nucleus) sampling visualization
  - `TemperatureOperation.tsx` - Temperature scaling visualization
  - `ChatMLOperation.tsx` - ChatML template formatting visualization
  - `GenerateStepOperation.tsx` - Full generation pipeline visualization
  - `StepCard.tsx` - Reusable step display component
- Fixed: Temperature visualization had black/unreadable text due to broken color token replacement
- Features:
  - "See How It Works" button appears after passing all tests
  - Full-screen modal with keyboard controls (Space: play/pause, ←→: step, Esc: close)
  - Challenge-specific visualizations with tailored animations
  - Code pattern detection (only shows explanations for patterns used in the solution)
  - Speed control (0.5x, 1x, 2x)
  - Progress slider to jump between steps

#### Process for Creating New Visualizations

When adding a visualization for a new challenge type, follow this process:

1. **Solve the problem yourself** - Work through the challenge step-by-step, documenting each operation:
   - What are the inputs?
   - What intermediate values are computed?
   - What is the final output?

2. **Document the steps** - Write out the algorithm as discrete, visual steps. Example for decode:
   ```
   Step 1: Start with input token IDs [0, 1]
   Step 2: Build reverse vocabulary (ID → word)
   Step 3: Look up each ID to get word
   Step 4: Join words with spaces → "hello world"
   ```

3. **Create the visualization component** - In `src/components/challenges/visualizations/`:
   - Create `{Operation}Operation.tsx` file
   - Implement step-by-step AnimatePresence sections for each step
   - Use consistent styling (gray.800 bg, cyan/green/yellow color coding)
   - Add active highlighting for current element being processed
   - Export detection function: `is{Operation}TestCase(input, challengeTitle)`
   - Export step count function: `get{Operation}TotalSteps(input)`

4. **Integrate into ExecutionVisualizer.tsx**:
   - Import the new component and helper functions
   - Add detection logic to `getTotalSteps()` function
   - Add rendering logic to `renderVisualization()` function

5. **Test the visualization** - Run the app, solve the challenge, click "See How It Works"

This approach ensures visualizations are educationally valuable by mapping directly to how the algorithm actually works.

### Session: Explain Challenge UI & Console Output
- Added console output capture for Python `print()` statements
- Implemented self-assessment UI for "explain" type challenges:
  - Text area for users to write their explanations
  - "Reveal Model Answer" button (requires writing something first)
  - Self-assessment buttons ("Got it!" / "Need to Review")
  - Progress tracking via existing submission system
  - State persistence (loads saved explanation on return)
- Model answers stored in `solution_code` field and returned via API for explain challenges

### Previous Sessions
- Migrated code challenges from JavaScript to Python (Pyodide)
- Added expandable test results (click to see passed test details)
- Added solution persistence (code saved and restored on page return)
- Added completion indicators (green checkmark + border) on lesson page
- Added reset functionality (clears code and server-side progress)

## Current State

The app has three challenge types:
1. **implement** - Fully functional with Pyodide Python execution, test validation
2. **explain** - Now has self-assessment UI with model answer reveal
3. **compare** / **multiple_choice** - Not yet implemented

**Vocabulary System:**
- Flashcard and quiz modes with spaced repetition (SM-2)
- 42 AI/ML vocabulary terms seeded across 5 lessons
- Keyboard navigation (Space to flip, 1-4 for options, Arrow keys)
- Progress tracking per learning mode (flashcard vs quiz)
- Integrated with lesson detail pages ("Study Vocabulary" button)

**Performance:**
- All pages use TanStack Query with `!data && isLoading` pattern
- Delayed skeleton loaders (200ms CSS delay) prevent flash on fast loads
- Hover prefetching on navigation elements for instant page transitions
- Dashboard prefetching on header link hover
- VocabularyPage queries run in parallel (no cascading dependency)
- Entrance animations on LessonDetail to mask any remaining timing gaps
- No loading spinner flicker on cached data or background refetches

## What's Next

### High Priority
- [ ] Add model answers to explain challenges in seed data (`solution_code` field)
- [ ] Implement "compare" challenge type UI
- [ ] Implement "multiple_choice" challenge type UI
- [ ] Add vocabulary terms to remaining lessons if needed

### Future Enhancements
- [ ] **AI-Graded Explanations (Option 3)**: Use an LLM to evaluate user explanations against key points. Would provide:
  - Automated feedback on what concepts were covered/missed
  - More objective grading than self-assessment
  - Fits the AI engineering theme of the app
  - Implementation: Backend endpoint that sends user answer + rubric to LLM, returns structured feedback

## Don't Break

- Test suite: 337 tests must pass (`bun test`) - run before committing
- Git workflow: `development` → `feature/xyz` → PR → `main` (protected)
- Pyodide Python execution (runs in browser)
- Session-based progress tracking (localStorage sessionId)
- Spaced repetition system for mastery tracking
- Test case validation for implement challenges
- Execution visualization for passed tests (uses framer-motion animations)
- Vocabulary system with flashcard/quiz modes and SM-2 tracking
- Vocabulary seed script (`bun run db:seed-vocabulary`)
- Performance patterns:
  - `!data && isLoading` for loading states (not just `isLoading`)
  - Delayed skeleton pattern: `opacity={0}` + `animation="fadeIn 0.2s ease-in 0.2s forwards"`
  - Hover prefetch functions in hooks files
  - Dashboard prefetch on header link (AppShell.tsx)
  - VocabularyPage uses slug for all queries (parallel, no waterfall)
  - VocabularyPage derives mode from URL path (no state, reactive to navigation)
  - Entrance animations in LessonDetail (framer-motion)
  - TanStack Query for all data fetching (no useEffect fetching)
