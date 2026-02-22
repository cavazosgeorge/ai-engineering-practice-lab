# AI Engineering Practice Lab

A full-stack learning application for practicing AI/ML engineering fundamentals. Built to reinforce concepts from the AI Engineering cohort — featuring interactive Python coding challenges, vocabulary drills with spaced repetition, step-by-step algorithm visualizations, and an AI-powered study agent.

**Live demo:** [ai-practice.cavazos.app](https://ai-practice.cavazos.app)

## Features

- **60 Code Challenges** — Write Python in-browser via Pyodide (WebAssembly) and validate against test cases. No server-side execution needed.
- **14 Algorithm Visualizations** — Step-by-step animated walkthroughs showing how solutions work (matrix ops, tokenization, softmax, decoding strategies, and more) with playback controls and keyboard shortcuts.
- **Vocabulary System** — 100+ AI/ML terms with flashcard decks and multiple-choice quizzes, powered by SM-2 spaced repetition.
- **AI Study Agent** — Chat assistant using MiniMax M2 with 6 tools via LangChain. SSE streaming, week-scoped conversations, searches course materials, generates practice questions.
- **Spaced Repetition** — SM-2 algorithm schedules optimal review times for both challenges and vocabulary with mastery tracking.
- **Admin CRM** — Authenticated admin panel for managing vocabulary, weeks, lesson assignments, and AI-powered content generation (vocabulary, quizzes, challenges via Groq Llama 3.3 70B with RAG context).
- **Progress Tracking** — Per-challenge mastery levels, completion indicators, and review queues.

## Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| [Bun](https://bun.sh) | v1.0+ | Runtime, package manager, server, test runner, SQLite |
| [Git](https://git-scm.com) | any | Clone the repo |
| [Python](https://www.python.org) | 3.11+ | **Optional** — only for the AI study agent / RAG features |

> **Note:** The core app (lessons, challenges, vocabulary, progress) runs entirely on Bun. Python and API keys are only needed if you want the AI-powered study agent.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/cavazosgeorge/ai-engineering-practice-lab.git
cd ai-engineering-practice-lab

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env if you want to change defaults (optional for core features)

# Seed the database (run in this order)
bun run db:seed            # Lessons, concepts, challenges, test cases
bun run db:seed-vocabulary  # Vocabulary terms (depends on lessons)
bun run db:seed-weeks       # Week groupings (depends on lessons)
bun run db:seed-admin       # Admin user account

# Start development
bun dev
```

The app will be available at:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API Server | http://localhost:3000 |

> The database (SQLite) is auto-created on first run — no external database to install. Migrations run automatically when the server starts.

## Environment Variables

Copy `.env.example` to `.env`. For core functionality, the defaults work out of the box.

```bash
cp .env.example .env
```

### Core (works with defaults)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Bun server port |
| `NODE_ENV` | `development` | Environment mode |
| `TRUSTED_ORIGINS` | `http://localhost:5173,http://localhost:3000` | CORS origins |

### AI Features (optional)

These are only needed if you want the study agent and AI-powered features:

| Variable | Description |
|----------|-------------|
| `PYTHON_SERVICE_URL` | Python service URL (default: `http://localhost:8000`) |
| `OPENAI_API_KEY` | OpenAI API key for text embeddings |
| `GROQ_API_KEY` | Groq API key for LLM generation |
| `MINIMAX_API_KEY` | MiniMax API key for the study agent |

## Seeding the Database

The app ships with no data — you need to run the seed scripts to populate lessons, vocabulary, and the admin user. The database file and schema are created automatically.

**Important:** Seed scripts must run in this order due to foreign key dependencies:

```bash
# 1. Lessons & challenges (creates the foundation)
bun run db:seed

# 2. Vocabulary terms (references lessons by slug)
bun run db:seed-vocabulary

# 3. Week groupings (assigns lessons to weeks)
bun run db:seed-weeks

# 4. Admin user (independent, but needs auth tables)
bun run db:seed-admin
```

Each seed script clears and re-creates its data. Re-running is safe but will reset progress for that data type.

### Admin Access

After running `bun run db:seed-admin`, you can log in at `/admin` with:

- **Email:** admin@admin.com
- **Password:** admin123

## Python RAG Service (Optional)

The Python service powers the AI study agent, RAG search, and AI-generated content. **It's not required for the core learning experience.**

### What requires the Python service?

| Feature | Needs Python? |
|---------|:------------:|
| Lessons & code challenges | No |
| Vocabulary flashcards & quizzes | No |
| Spaced repetition & progress | No |
| Execution visualizations | No |
| Admin vocabulary CRUD | No |
| **Study Agent (AI chat)** | **Yes** |
| **RAG course material search** | **Yes** |
| **AI content generation (admin)** | **Yes** |

### Setup

```bash
cd python-service

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # macOS/Linux
# .venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Start the service
uvicorn main:app --reload --port 8000
```

Or use the Makefile:

```bash
cd python-service
make install  # pip install -e ".[dev]"
make dev      # uvicorn main:app --reload --port 8000
```

> When the Python service is running, `bun dev` automatically starts it alongside the frontend and API server via `concurrently`.

## Lesson Content

The app covers 6 weeks of AI/ML engineering topics with 11 lessons, 34 concepts, and 60 challenges:

| Week | Lessons | Topics |
|------|---------|--------|
| 1 | Tokenization, Language Models | Word-level / BPE tokenization, linear layers, softmax |
| 2 | Text Generation | Greedy / top-k / top-p / temperature decoding |
| 3 | Model Types, Building LLM Apps | Completion vs instruction-tuned, chat templates, full LLM pipeline |
| 4 | RAG | Chunking, embeddings, vector search, RAG prompt engineering |
| 5 | Tool Calling, AI Agents, Multimodal AI | Function calling, ReAct pattern, agent loops, multimodal systems |
| 6 | Inference-Time Reasoning, Deep Research | Chain-of-thought, multi-step reasoning, deep research systems |

## Project Structure

```
src/                          # React frontend
├── components/
│   ├── layout/               # AppShell, Header, Sidebar
│   ├── challenges/           # CodeEditor, TestRunner, Visualizations
│   ├── vocabulary/           # Flashcards, Quiz, Dashboard
│   ├── admin/                # AdminLayout, ProtectedRoute
│   └── progress/             # MasteryMeter, ReviewQueue
├── hooks/                    # TanStack Query hooks
├── services/                 # API client, Pyodide validator
└── pages/                    # Route pages

server/                       # Bun/Hono backend
├── index.ts                  # Hono app entry
├── routes/                   # API route handlers
├── services/                 # Business logic (code validator, SM-2)
├── middleware/                # Auth middleware
├── db/
│   ├── index.ts              # SQLite connection + auto-migrations
│   └── migrations/           # SQL migration files
└── scripts/                  # Seed scripts

python-service/               # FastAPI RAG/Agent service (optional)
├── main.py                   # FastAPI app entry
├── routers/                  # API routes (agent, RAG, generation)
├── services/                 # LLM, embeddings, vector search
├── prompts/                  # System prompts for agent
├── models/                   # Pydantic models
├── config.py                 # Environment configuration
└── data/                     # FAISS indexes, uploads
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Chakra UI v3, CodeMirror |
| Backend | Bun, Hono |
| Database | SQLite (bun:sqlite) with WAL mode |
| State | TanStack Query |
| Auth | better-auth |
| Code Execution | Pyodide (Python in the browser) |
| AI Service | FastAPI, LangChain, FAISS, Groq, MiniMax |
| Testing | bun:test, Testing Library, happy-dom |

## Scripts Reference

```bash
# Development
bun dev                  # Start all services (frontend + API + Python)
bun run dev:client       # Frontend only (Vite on :5173)
bun run dev:server       # API server only (Bun on :3000)
bun run dev:python       # Python service only (uvicorn on :8000)

# Database
bun run db:seed          # Seed lessons, concepts, challenges
bun run db:seed-vocabulary  # Seed vocabulary terms
bun run db:seed-weeks    # Seed week groupings
bun run db:seed-admin    # Seed admin user

# Build & Production
bun run build            # TypeScript check + Vite build
bun run start            # Run production server

# Testing
bun test                 # All tests
bun test:backend         # Backend tests only
bun test:frontend        # Frontend tests only
bun test:unit            # Unit tests
bun test:integration     # Integration tests
bun test:components      # React component tests
bun test:coverage        # With coverage report
bun test:watch           # Watch mode

# Linting
bun run lint             # ESLint
```

## Docker

The project includes Docker support for production deployment:

```bash
# Build and run with Docker Compose
docker compose up --build
```

The Docker setup builds the Bun app (frontend + backend) and exposes it on port 3000. The admin user is automatically seeded on startup.

## Contributing

1. Fork the repo
2. Create a feature branch from `main`
3. Make your changes
4. Run tests: `bun test`
5. Open a pull request to `main`

The `main` branch is protected — all changes go through pull requests.
