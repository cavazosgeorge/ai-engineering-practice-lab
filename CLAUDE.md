# AI Engineering Practice Lab

A learning application for practicing AI/ML engineering fundamentals, designed to reinforce concepts from the AI Engineering cohort and prepare for technical interviews.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Chakra UI v3 + CodeMirror
- **Backend**: Bun + Hono
- **Database**: SQLite (bun:sqlite) with raw SQL + auto-migrations
- **State**: TanStack Query for server state

## Commands

- `bun dev` - Start both client and server in development
- `bun run build` - Production build
- `bun run start` - Run production server
- `bun run lint` - Run ESLint
- `bun test` - Run tests
- `bun run db:seed` - Seed lesson content (clears and reseeds)

## Architecture

```
src/                    # Frontend
├── components/         # React components
│   ├── layout/         # AppShell, Header, Sidebar
│   ├── challenges/     # CodeEditor, TestRunner, OutputDiff
│   └── progress/       # MasteryMeter, ReviewQueue
├── hooks/              # Custom hooks
├── lib/                # Business logic
├── services/           # API client
└── pages/              # Route pages
    ├── Dashboard       # Overview, due reviews, streak
    ├── Lessons         # Topic tree by lesson
    ├── Challenge       # Code editor + tests
    ├── Review          # Spaced repetition queue
    └── Admin           # Content management

server/                 # Backend
├── index.ts            # Hono app entry
├── routes/             # API route handlers
│   ├── lessons.ts      # Lesson retrieval
│   ├── challenges.ts   # Challenge retrieval + submission
│   └── progress.ts     # User progress + spaced repetition
├── services/           # Business logic
│   ├── code-validator.ts    # Test runner
│   └── spaced-repetition.ts # SM-2 algorithm
├── db/                 # Database
│   ├── index.ts        # Connection + migration runner
│   └── migrations/     # SQL migration files
└── scripts/
    └── seed-lessons.ts # Lesson content (edit to add new lessons)
```

## Core Features

1. **Concept Library**: Organized by lesson (Tokenization, LMs, Decoding, RAG, Agents)
2. **Practice Challenges**: Implement functions from scratch with test validation
3. **Code Validation**: Run user code against test cases
4. **Spaced Repetition**: SM-2 algorithm tracks mastery and schedules reviews
5. **Admin Interface**: Add new lessons/challenges as cohort progresses

## Conventions

- Use Chakra UI v3 syntax (NOT v2)
- All API routes prefixed with `/api/`
- SQLite with WAL mode enabled
- Challenge types: `implement`, `explain`, `compare`, `multiple_choice`

### Chakra UI v3 / Ark UI Two-Layer Styling Rule

**Every Chakra v3 component has a recipe. Every recipe has default interactive styles.** If you customize ANY visual property that an interactive state also touches, you must suppress the recipe's version of that state too -- or the recipe default will flash briefly during transitions.

This applies to ALL Chakra v3 components: compound components (Menu, Select, Tabs, Accordion, Popover, Dialog, Combobox), form elements (Input, Textarea, NativeSelect, NumberInput, PinInput), and any component with a recipe-based variant.

**The Universal Rule:** Whenever you put `_hover`, `_focus`, `_selected`, `borderColor`, `bg`, or `color` on ANY Chakra v3 component, check: does the recipe have a parallel mechanism for the same state?

| If you set... | Also set... | Why |
|---------------|-------------|-----|
| `_hover` | `_highlighted` | Ark UI's `[data-highlighted]` has its own default bg |
| `_focus` | `_focusVisible={{ outline: "none", boxShadow: "none" }}` | Recipes use `focusVisibleRing: "inside"` which targets `:focus-visible` separately |
| `_selected` | `_checked` | `[data-selected]` has recipe defaults |
| Custom `borderColor`/`bg` | Explicit base values | Recipe base styles will flash if not explicitly overridden |

**The Three Rules:**

1. **Set explicit base styles** -- `bg="transparent"`, `borderColor="gray.700"`, etc. Never rely on "no default." The recipe always has one.

2. **Override interactive pseudo-props in pairs** -- If you set one side, set the other:
   - `_hover` + `_highlighted` (items in compound components)
   - `_focus` + `_focusVisible` (ALL focusable components -- Input, Textarea, NativeSelect, triggers, etc.)
   - `_selected` + `_checked` (selection states)

3. **For purely visual sub-components, use plain Box** -- Separators, arrows, indicators carry recipe defaults. Replace with a styled `Box`.

**Common Traps:**

- **Form elements (Input, Textarea, NativeSelect):** These aren't compound/Ark UI components, but their recipes use `focusVisibleRing: "inside"` which generates `:focus-visible` styles (outline + border). If you only set `_focus={{ borderColor: "cyan.500" }}`, the recipe's `:focus-visible` ring still fires with its default colors. Always pair with `_focusVisible={{ outline: "none", boxShadow: "none" }}`.
- **Compound component items (MenuItem, SelectItem, etc.):** These have Ark UI `data-highlighted` with default hover bg. If you only set `_hover`, the `[data-highlighted]` default flashes between items.
- **Triggers (MenuTrigger, SelectTrigger, etc.):** Ark UI returns focus to the trigger when a menu closes. If the action navigates away, the focus ring is briefly visible on the old page. Suppress with `_focusVisible`.

```tsx
// ❌ Input: recipe's focusVisibleRing competes with your _focus border
<Input borderColor="gray.700" _focus={{ borderColor: "cyan.500", boxShadow: "none" }} />
// ✅ Suppress the recipe's :focus-visible ring
<Input
  borderColor="gray.700"
  _focus={{ borderColor: "cyan.500", boxShadow: "none" }}
  _focusVisible={{ outline: "none", boxShadow: "none" }}
/>

// ❌ NativeSelect: recipe has focusVisibleRing you're not overriding
<NativeSelect.Field borderColor="gray.700" color="white" />
// ✅ Override the focus ring with your own style
<NativeSelect.Field
  borderColor="gray.700"
  color="white"
  _focusVisible={{ outline: "none", boxShadow: "none", borderColor: "cyan.500" }}
/>

// ❌ MenuItem: only overrides :hover, not [data-highlighted]
<MenuItem _hover={{ bg: "gray.800" }}>Item</MenuItem>
// ✅ Explicit base + both layers
<MenuItem
  bg="transparent"
  _hover={{ bg: "gray.800", color: "white" }}
  _highlighted={{ bg: "gray.800", color: "white" }}
>Item</MenuItem>

// ❌ Recipe separator flashes default light border
<MenuSeparator borderColor="gray.700" />
// ✅ Plain Box
<Box borderBottom="1px solid" borderColor="gray.700" />

// ❌ Focus ring flashes during route transitions
<MenuTrigger asChild><Box as="button">Menu</Box></MenuTrigger>
// ✅ Suppress focus ring
<MenuTrigger asChild>
  <Box as="button" _focusVisible={{ outline: "none", boxShadow: "none" }}>Menu</Box>
</MenuTrigger>
```

## Database Schema

- **lessons**: Topic containers (Tokenization, Language Models, etc.)
- **concepts**: Sub-topics within lessons
- **challenges**: Practice problems with test cases
- **test_cases**: Input/expected output pairs for validation
- **user_progress**: SM-2 tracking (repetitions, ease factor, interval)
- **submissions**: Audit trail of user attempts

## Obsidian Notes — Keep Updated

This project has companion documentation in Obsidian that **must stay in sync** with code changes. When adding a new feature, pipeline, or architectural component, update the notes as part of the same task — not as a follow-up.

### Paths

- **Notes root:** `~/Desktop/claude-notes/projects/AI Engineering Practice Lab/`
- **Project index:** `AI Engineering Practice Lab.md` — links to all sub-notes, update when adding new notes
- **Python RAG Service notes:** `Python RAG Service/` subfolder

### Existing Notes

| Note | Covers |
|------|--------|
| `Python RAG Service/LLM Architecture.md` | 3-model setup (Groq, MiniMax, OpenAI) |
| `Python RAG Service/Service Architecture & API.md` | FastAPI routes, service layer |
| `Python RAG Service/Configuration & Environment.md` | Env vars, config patterns |
| `Python RAG Service/RAG Ingestion Pipeline.md` | Data source → chunks → FAISS |
| `Python RAG Service/Vocabulary Generation Flow.md` | Full vocab generation pipeline |
| `Python RAG Service/Quiz Generation Flow.md` | Full quiz generation pipeline |
| `Python RAG Service/Agent Tool-Calling.md` | MiniMax M2 tool-calling agent |
| `Python RAG Service/Think Block Filtering.md` | Streaming `<think>` block removal |
| `Seeding Lesson Data.md` | Seed script and lesson structure |

### Pattern for New Flow/Feature Notes

Follow the structure established in `Vocabulary Generation Flow.md` and `Quiz Generation Flow.md`:

1. **Frontmatter** — `created`, `parent: "[[AI Engineering Practice Lab]]"`, `tags`
2. **How It Works** — Numbered steps (Frontend → Bun → Python → Storage → Review → Approval)
3. **Summary Diagram** — ASCII flow chart of the pipeline
4. **Data Sources** — What feeds the feature (link to shared notes with `[[wikilinks]]`)
5. **Safety Mechanisms** — Dedup layers, constraints, validation
6. **Gotchas** — Snake_case/camelCase mismatches, normalization quirks
7. **No Overwrite/Rollback** — Explain audit trail behavior
8. **Key Files** — Table of file paths and their roles

### When to Update

- **New generation type** (e.g., challenge approval) → new flow note + link in index
- **New Python service route/feature** → note in `Python RAG Service/`
- **Schema change** (new migration) → mention in the relevant flow note's Key Files table
- **Architectural decision** → add to Key Decisions table in the project index

## Deployment

- Docker multi-stage build
- Coolify on Ubuntu server
- Domain: `ai-practice.cavazos.app`
