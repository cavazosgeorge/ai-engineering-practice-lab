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

## Database Schema

- **lessons**: Topic containers (Tokenization, Language Models, etc.)
- **concepts**: Sub-topics within lessons
- **challenges**: Practice problems with test cases
- **test_cases**: Input/expected output pairs for validation
- **user_progress**: SM-2 tracking (repetitions, ease factor, interval)
- **submissions**: Audit trail of user attempts

## Deployment

- Docker multi-stage build
- Coolify on Ubuntu server
- Domain: `ai-practice.cavazos.app`
