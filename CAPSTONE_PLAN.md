# Unified Capstone Implementation Plan

## Overview

This plan transforms the AI Engineering Practice Lab from a study tool into a capstone project demonstrating LLMs, RAG, agents, and tool-calling. It merges the frontend, backend, and testing strategies into **6 sequential phases**, each independently deployable and testable.

**Guiding principles:**
- Each phase produces a working increment (no half-built features)
- Backend lands before frontend consumes it (no mock APIs)
- Tests ship with the feature they cover (not as a separate phase)
- Existing 337 tests must keep passing throughout
- No changes to existing lesson/challenge/vocabulary flows unless extending them

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser (React + Vite)                       │
│  Chakra UI v3 · TanStack Query · CodeMirror · Pyodide              │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Bun + Hono API Server                           │
│  Port 3000                                                          │
│  ├── Auth (better-auth), sessions, SQLite                          │
│  ├── Lessons, challenges, vocabulary CRUD                          │
│  ├── Week management, data source metadata                         │
│  ├── Proxies /api/rag/* ──────────────────────┐                    │
│  ├── Proxies /api/agent/* ────────────────────┤                    │
│  └── Proxies /api/ai/* ──────────────────────┤                    │
└───────────────────────────────────────────────┤────────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Python RAG/Agent Service                        │
│  Port 8000 · FastAPI                                                │
│  ├── LangChain: document loaders, text splitters, chains           │
│  ├── FAISS: vector store (per-week indexes, persisted to disk)     │
│  ├── Groq + Llama 3.3 70B: chat completions, content generation   │
│  ├── MiniMax M2: agent tool-calling loop                           │
│  ├── OpenAI text-embedding-3-small: embedding generation           │
│  └── Document processing: PDF, URL, text extraction                │
└─────────────────────────────────────────────────────────────────────┘

Data stores:
  SQLite (existing)  ─── weeks, lessons, vocabulary, progress, auth
  FAISS indexes      ─── python-service/data/faiss/{week_slug}/
  Upload files       ─── data/uploads/
```

### Why Two Services?

| Concern | Bun/Hono | Python/FastAPI |
|---------|----------|----------------|
| Web serving, auth, sessions | Yes | No |
| SQLite CRUD (lessons, vocab, progress) | Yes | No |
| Data source metadata + status tracking | Yes | No |
| Document processing, chunking, embedding | No | Yes (LangChain) |
| Vector store (FAISS) | No | Yes |
| Semantic search | No | Yes |
| Content generation (vocab, quiz) | No | Yes (Groq Llama) |
| Agent tool-calling loop | No | Yes (MiniMax M2) |
| Streaming chat responses | Proxies SSE | Produces SSE |

The Bun server remains the single entry point for the browser. It proxies AI-related requests to the Python service, which handles all LLM, RAG, and agent operations.

### Model Strategy

| Role | Provider | Model | Cost | Why |
|------|----------|-------|------|-----|
| **Embeddings** | OpenAI | `text-embedding-3-small` | $0.02/M tokens | Reliable, 1536 dims, wide LangChain support |
| **Chat / Generation** | Groq | `llama-3.3-70b-versatile` | $0.59/$0.79/M tokens | Fast (280 T/s), cheap, good quality for explanations |
| **Agent Tool-Calling** | MiniMax | `MiniMax-M2` | ~8% of Claude Sonnet | Built for agentic workflows, native tool calling, OpenAI-compatible API |

---

## Dependency Graph

```
Phase 1: Schema + Python Service Scaffold
    |
    +---> Phase 2: Weeks (no AI needed) ------+
    |                                          |
    +---> Phase 3: RAG Pipeline (needs AI) ----+
                                               |
         Phase 4: AI Content Generation -------+
              (needs RAG + Weeks)              |
                                               |
         Phase 5: Agent Chat ------------------+
              (needs all above)                |
                                               |
         Phase 6: Integration + Polish --------+
              (wires everything together)
```

Phases 2 and 3 can run in **parallel** after Phase 1 completes (Weeks don't need AI; RAG doesn't need Weeks). All other phases are sequential.

---

## Phase 1: Schema + Python Service Scaffold

**Goal:** Database foundation, Python service skeleton, and inter-service communication. No user-facing changes.

### Backend (Bun/Hono)

| # | File | Action | Description |
|---|------|--------|-------------|
| 1 | `server/db/migrations/004_weeks_and_rag_schema.sql` | CREATE | `weeks`, `data_sources`, `chunks` tables. ALTER `lessons` to add nullable `week_id` FK |
| 2 | `server/db/migrations/005_agent_and_generation_schema.sql` | CREATE | `generation_jobs`, `agent_conversations`, `agent_messages` tables |
| 3 | `server/db/index.ts` | MODIFY | Add TypeScript row types: `WeekRow`, `DataSourceRow`, `ChunkRow`, `GenerationJobRow`, `AgentConversationRow`, `AgentMessageRow`. Update `LessonRow` with optional `week_id` |
| 4 | `server/services/python-service-client.ts` | CREATE | HTTP client to proxy requests to Python service at `localhost:8000`. Handles health check, request forwarding, SSE proxying, error translation |
| 5 | `server/index.ts` | MODIFY | Add Python service health check on startup (warn if unavailable, don't block) |

**Note:** No `embeddings` table in SQLite — FAISS manages vectors on the Python side. The `chunks` table stores text content and metadata for reference, but embeddings live in FAISS indexes.

### Python Service

| # | File | Action | Description |
|---|------|--------|-------------|
| 1 | `python-service/pyproject.toml` | CREATE | Project config with dependencies: `fastapi`, `uvicorn`, `langchain`, `langchain-community`, `langchain-openai`, `langchain-groq`, `faiss-cpu`, `python-dotenv`, `httpx`, `pypdf` |
| 2 | `python-service/main.py` | CREATE | FastAPI app entry point with CORS, health endpoint, lifespan startup |
| 3 | `python-service/config.py` | CREATE | Environment config: API keys, model names, chunk settings, FAISS paths |
| 4 | `python-service/routers/__init__.py` | CREATE | Router barrel file |
| 5 | `python-service/services/__init__.py` | CREATE | Service barrel file |
| 6 | `python-service/models/__init__.py` | CREATE | Pydantic model barrel file |
| 7 | `python-service/models/schemas.py` | CREATE | Pydantic request/response models for all endpoints |
| 8 | `python-service/data/faiss/.gitkeep` | CREATE | FAISS index storage directory |
| 9 | `python-service/tests/__init__.py` | CREATE | Test package init |
| 10 | `python-service/tests/conftest.py` | CREATE | pytest fixtures: mock LLM clients, temp FAISS indexes, test data |
| 11 | `python-service/Makefile` | CREATE | `make install`, `make dev`, `make test`, `make lint` |
| 12 | `python-service/requirements.txt` | CREATE | Pinned dependencies for deployment |

### Environment

New variables for `.env` and `.env.example`:
- `OPENAI_API_KEY` — for embeddings
- `GROQ_API_KEY` — for chat/generation via Llama 3.3 70B
- `MINIMAX_API_KEY` — for agent tool-calling via MiniMax M2
- `PYTHON_SERVICE_URL=http://localhost:8000`
- `EMBEDDING_MODEL=text-embedding-3-small`
- `CHAT_MODEL=llama-3.3-70b-versatile`
- `AGENT_MODEL=MiniMax-M2`
- `CHUNK_SIZE=1000`
- `CHUNK_OVERLAP=200`
- `RAG_TOP_K=5`
- `MAX_UPLOAD_SIZE_MB=10`
- `UPLOAD_DIR=./data/uploads`
- `FAISS_INDEX_DIR=./python-service/data/faiss`

### Dev Script Updates

Update `package.json`:
- `bun dev` — starts both Bun server AND Python service (via `concurrently` or similar)
- `bun dev:server` — Bun only
- `bun dev:python` — Python service only (runs `uvicorn python-service.main:app --reload --port 8000`)

### Tests (Phase 1)

| File | Count | Covers |
|------|-------|--------|
| `server/__tests__/integration/db/capstone-schema.test.ts` | ~12 | Migration runs cleanly, FK constraints, CASCADE deletes, unique constraints, nullable `week_id` on lessons |
| `server/__tests__/unit/services/python-service-client.test.ts` | ~10 | Request forwarding, health check, error handling, SSE proxy, timeout |
| `python-service/tests/test_health.py` | ~5 | Health endpoint, CORS, config loading |

### Fixtures

| File | Action |
|------|--------|
| `server/__tests__/fixtures/mock-data-capstone.ts` | CREATE: Mock rows for all new tables |
| `server/__tests__/fixtures/helpers-capstone.ts` | CREATE: `seedEmptyWeek`, `seedFullWeek`, `seedPartialWeek`, `seedAgentConversation`, `seedAllCapstoneData` |
| `python-service/tests/fixtures/` | CREATE: Mock LLM responses, sample documents, test FAISS indexes |

### Complexity: Low-Medium
- SQL migrations, FastAPI skeleton, HTTP client
- Primary risk: getting inter-service communication right (proxy, SSE forwarding, error handling)

### Definition of Done
- `bun test` passes (all existing 337 + ~22 new TS tests)
- `cd python-service && make test` passes (~5 Python tests)
- Python service starts and responds to health check
- Bun server detects Python service availability
- `data/uploads/` and `python-service/data/faiss/` directories created (gitignored)
- `.env.example` updated with all new vars
- `bun dev` starts both services

---

## Phase 2: Weeks System

**Goal:** Organize lessons by week. Admin can create/manage weeks. Students browse by week.

### Backend (Bun/Hono)

| # | File | Action | Description |
|---|------|--------|-------------|
| 1 | `server/routes/weeks.ts` | CREATE | `GET /api/weeks` (published, with lesson/vocab counts), `GET /api/weeks/:slug` (detail with lessons) |
| 2 | `server/routes/admin.ts` | MODIFY | Add week CRUD: `GET/POST /api/admin/weeks`, `PATCH/DELETE /api/admin/weeks/:id` |
| 3 | `server/index.ts` | MODIFY | Mount weeks routes |
| 4 | `server/scripts/seed-weeks.ts` | CREATE | Seed weeks 1-6 linking existing lessons |

### Frontend

| # | File | Action | Description |
|---|------|--------|-------------|
| 1 | `src/types/weeks.ts` | CREATE | `Week`, `WeekDetail`, `WeekFilter` types |
| 2 | `src/services/weeks-api.ts` | CREATE | `fetchWeeks`, `fetchWeekDetail`, `createWeek`, `updateWeek`, `deleteWeek` |
| 3 | `src/hooks/useWeeks.ts` | CREATE | `weekKeys`, `useWeeks`, `useWeekDetail`, `useCurrentWeek`, `prefetchWeek` (staleTime: 60s) |
| 4 | `src/components/weeks/WeekNavigator.tsx` | CREATE | Horizontal week selector (scrollable pills/tabs) |
| 5 | `src/components/weeks/WeekCard.tsx` | CREATE | Summary card (title, lesson count, progress %) |
| 6 | `src/components/weeks/WeekDetail.tsx` | CREATE | Week content view (lessons + data sources later) |
| 7 | `src/components/weeks/WeekBreadcrumb.tsx` | CREATE | Breadcrumb trail for week context |
| 8 | `src/components/weeks/WeekLessonGrid.tsx` | CREATE | Filtered lesson grid for a specific week |
| 9 | `src/components/weeks/index.ts` | CREATE | Barrel exports |
| 10 | `src/pages/WeeksDashboard.tsx` | CREATE | All published weeks grid |
| 11 | `src/pages/WeekDetailPage.tsx` | CREATE | Week content (lessons filtered by week) |
| 12 | `src/pages/admin/WeekAdminPage.tsx` | CREATE | Week CRUD admin page |
| 13 | `src/components/admin/WeekForm.tsx` | CREATE | Create/edit week form |
| 14 | `src/components/admin/WeekTable.tsx` | CREATE | Week list with edit/delete actions |

### Routing Changes

New public routes: `/weeks`, `/weeks/:slug`
New admin route: `/admin/weeks`

### Navigation Changes

- `AppShell.tsx`: Add "Weeks" link in header nav (between "Lessons" and "Review")
- `AdminDashboardPage.tsx`: Add "Weeks" tab alongside existing "Dashboard" and "Vocabulary" tabs

### Tests (Phase 2)

| File | Count | Covers |
|------|-------|--------|
| `server/__tests__/unit/services/week-service.test.ts` | ~22 | Week CRUD logic, lesson-week associations, publish/unpublish |
| `server/__tests__/integration/routes/weeks.test.ts` | ~22 | All week endpoints (public + admin), auth enforcement, slug uniqueness |
| `src/__tests__/hooks/useWeeks.test.ts` | ~6 | Query key structure, stale time, prefetching |
| `src/__tests__/components/weeks/WeekSelector.test.tsx` | ~10 | Rendering, selection, empty state |
| `src/__tests__/components/admin/AdminWeekManager.test.tsx` | ~10 | CRUD forms, validation, delete confirmation |

### Complexity: Medium
- Straightforward CRUD with existing patterns
- Week-lesson soft FK (nullable) avoids breaking existing flows

### Definition of Done
- `bun test` passes (all previous + ~70 new)
- Admin can create/edit/delete/publish weeks
- Students see weeks on `/weeks`, can browse lessons by week
- Existing `/lessons` route still works unchanged
- Seed script links existing 6 lessons to weeks

---

## Phase 3: RAG Pipeline

**Goal:** Upload course materials, chunk them, generate embeddings, store in FAISS, enable semantic search.

### Python Service (core RAG logic)

| # | File | Action | Description |
|---|------|--------|-------------|
| 1 | `python-service/services/document_processor.py` | CREATE | LangChain document loaders: `PyPDFLoader`, `WebBaseLoader`, plain text. Extracts text from PDF/URL/text sources |
| 2 | `python-service/services/chunking_service.py` | CREATE | LangChain `RecursiveCharacterTextSplitter`. Configurable chunk size/overlap. Returns chunks with metadata (source, page, index) |
| 3 | `python-service/services/embedding_service.py` | CREATE | LangChain `OpenAIEmbeddings` with `text-embedding-3-small`. Batch embedding generation. Dimension validation |
| 4 | `python-service/services/vector_store_service.py` | CREATE | FAISS index management: create per-week index, add embeddings, search, persist/load from disk, delete source chunks, get stats |
| 5 | `python-service/services/rag_pipeline.py` | CREATE | Orchestrates full pipeline: extract -> chunk -> embed -> store in FAISS. Status callbacks for progress tracking |
| 6 | `python-service/routers/data_sources.py` | CREATE | `POST /ingest/text`, `POST /ingest/url`, `POST /ingest/pdf` (file upload), `POST /reprocess/{source_id}`, `DELETE /sources/{source_id}` |
| 7 | `python-service/routers/search.py` | CREATE | `POST /search` (query + optional week_slug + top_k), `GET /stats` (index sizes, chunk counts) |

### Backend (Bun/Hono — proxy + metadata)

| # | File | Action | Description |
|---|------|--------|-------------|
| 1 | `server/routes/data-sources.ts` | CREATE | Admin: GET data sources by week, POST upload/text/url (saves metadata + forwards to Python), POST reprocess, DELETE, GET with chunks |
| 2 | `server/routes/rag.ts` | CREATE | Public: `POST /api/rag/search` (proxies to Python). Admin: `GET /api/admin/rag/stats` |
| 3 | `server/index.ts` | MODIFY | Mount data-sources and rag routes |

**Flow:** Browser → Bun (auth check, save metadata to SQLite, set status=processing) → Python (extract, chunk, embed, FAISS store) → Bun (update status=processed, save chunk text to SQLite for display)

### Frontend

| # | File | Action | Description |
|---|------|--------|-------------|
| 1 | `src/types/data-sources.ts` | CREATE | `DataSource`, `UploadProgress`, `ProcessingStatus` |
| 2 | `src/types/rag.ts` | CREATE | `DocumentChunk`, `RAGSearchResult`, `VectorStoreStats` |
| 3 | `src/services/data-sources-api.ts` | CREATE | `uploadDataSource`, `fetchDataSources`, `fetchDataSourceStatus`, `deleteDataSource` |
| 4 | `src/services/rag-api.ts` | CREATE | `searchRAG`, `fetchVectorStoreStats`, `fetchSourceChunks` |
| 5 | `src/hooks/useDataSources.ts` | CREATE | `dataSourceKeys`, `useWeekDataSources`, `useDataSourceStatus` (poll 2s when processing), `useUploadDataSource` |
| 6 | `src/hooks/useRAG.ts` | CREATE | `ragKeys`, `useRAGSearch`, `useVectorStoreStats`, `useSourceChunks` |
| 7-12 | `src/components/dataSources/*.tsx` | CREATE | DataSourceUploader, DataSourceList, DataSourceStatus, DataSourcePreview, DataSourceDelete, index |
| 13-17 | `src/components/rag/*.tsx` | CREATE | RAGPipelineVisualizer, ChunkingPreview, VectorSearchResults, RAGMetrics, index |
| 18 | `src/pages/admin/DataSourceAdminPage.tsx` | CREATE | Upload + manage data sources per week |

### Routing Changes

New admin route: `/admin/weeks/:weekId/sources`

### Vector Storage Design (FAISS)

- **Storage:** FAISS flat index (`IndexFlatIP` with normalized vectors for cosine similarity)
- **Organization:** One FAISS index per week at `python-service/data/faiss/{week_slug}/index.faiss`
- **Embedding model:** OpenAI `text-embedding-3-small` (1536 dimensions) via LangChain `OpenAIEmbeddings`
- **Persistence:** `faiss.write_index()` / `faiss.read_index()` — indexes loaded into memory on demand, cached with LRU
- **Metadata:** LangChain `FAISS` vectorstore handles document-to-vector mapping (stores chunk IDs alongside vectors)
- **Performance:** FAISS flat search over 10K vectors: <1ms. Bottleneck remains the embedding API call
- **Scale limit:** Flat index works to ~100K vectors per week. Well beyond course material scope

### Tests (Phase 3)

| File | Count | Covers |
|------|-------|--------|
| `python-service/tests/test_document_processor.py` | ~14 | PDF extraction, URL fetching, text passthrough, error handling |
| `python-service/tests/test_chunking.py` | ~18 | Fixed-size, overlapping, edge cases (empty, single char, overlap >= size guard) |
| `python-service/tests/test_embedding_service.py` | ~12 | Batch embedding, dimension validation, API error handling |
| `python-service/tests/test_vector_store.py` | ~15 | FAISS create/add/search/delete/persist/load, empty index, per-week isolation |
| `python-service/tests/test_rag_pipeline.py` | ~10 | Full pipeline: extract -> chunk -> embed -> store -> search |
| `python-service/tests/test_search_router.py` | ~8 | Search endpoint, stats endpoint, empty results |
| `python-service/tests/test_data_source_router.py` | ~10 | Ingest endpoints, reprocess, delete |
| `server/__tests__/unit/services/data-source-service.test.ts` | ~18 | Status machine, metadata CRUD, proxy forwarding |
| `server/__tests__/integration/routes/data-sources.test.ts` | ~18 | Upload, status polling, delete, auth enforcement |
| `server/__tests__/integration/routes/rag.test.ts` | ~14 | Search proxy, stats proxy, error forwarding |
| `server/__tests__/edge-cases/rag-boundaries.test.ts` | ~10 | Infinite loop guard, concurrent processing, Python service down |
| `server/__tests__/edge-cases/file-upload-edge-cases.test.ts` | ~8 | Path traversal, oversized files, invalid MIME types |
| `src/__tests__/components/admin/DataSourceUploader.test.tsx` | ~10 | Drag-drop, file type validation, progress |
| `src/__tests__/components/admin/DataSourceList.test.tsx` | ~8 | List rendering, status badges, delete |
| `src/__tests__/hooks/useDataSources.test.ts` | ~6 | Polling behavior, cache invalidation |
| `src/__tests__/hooks/useRAGStatus.test.ts` | ~5 | Stats fetching, search hook |

### High-Risk Validations

1. **Chunking infinite loop:** `overlap >= chunkSize` must throw, not loop forever (LangChain handles this but verify)
2. **Path traversal in uploads:** Sanitize filenames (strip `..`, `/`, null bytes) in Bun before forwarding
3. **Concurrent reprocess:** Check status before starting; reject if already processing
4. **Python service down:** Bun returns 503 with clear error message, doesn't crash
5. **FAISS index corruption:** Write to temp file first, then atomic rename

### Complexity: High
- Two-service coordination for file upload pipeline
- FAISS index lifecycle management (create, update, delete, persist, load)
- LangChain document loader configuration
- Most new infrastructure of any phase

### Definition of Done
- `bun test` passes (all previous + ~64 new TS tests)
- `cd python-service && make test` passes (previous + ~87 new Python tests)
- Admin can upload PDF/URL/text data sources per week
- Processing pipeline: extract → chunk → embed → FAISS store runs to completion
- `POST /api/rag/search` returns ranked results with similarity scores and source citations
- Admin stats show chunk count per week, index sizes, processing status
- FAISS indexes persist to disk and survive service restart

---

## Phase 4: AI Content Generation

**Goal:** Admin generates vocabulary terms, quiz questions, and challenges from uploaded materials using RAG context + Groq Llama 3.3 70B.

### Python Service

| # | File | Action | Description |
|---|------|--------|-------------|
| 1 | `python-service/services/generation_service.py` | CREATE | LangChain chains for vocabulary/quiz/challenge generation. Uses `ChatGroq` with `llama-3.3-70b-versatile`. RAG retrieval → structured prompt → JSON output parsing |
| 2 | `python-service/routers/generation.py` | CREATE | `POST /generate/vocabulary`, `POST /generate/quiz`, `POST /generate/challenges`. All return structured JSON with generated items |
| 3 | `python-service/prompts/` | CREATE | Prompt templates directory: `vocabulary_prompt.py`, `quiz_prompt.py`, `challenge_prompt.py` with LangChain `ChatPromptTemplate` |

**Generation Flow:**
1. Receive request (week_slug, content_type, count, optional params)
2. Retrieve relevant chunks from FAISS for the week
3. Build LangChain chain: retriever → prompt → `ChatGroq(model="llama-3.3-70b-versatile")` → JSON output parser
4. Parse structured output (vocabulary terms with definitions, quiz questions with options, etc.)
5. Return generated items to Bun for staging

### Backend (Bun/Hono — job management + approval)

| # | File | Action | Description |
|---|------|--------|-------------|
| 1 | `server/services/generation-job-service.ts` | CREATE | Job CRUD in SQLite: create (pending), update status, store results, approval workflow |
| 2 | `server/routes/ai-generation.ts` | CREATE | POST generate (creates job, forwards to Python), GET jobs list, GET job status, POST approve individual items |
| 3 | `server/index.ts` | MODIFY | Mount ai-generation routes |

### Frontend

| # | File | Action | Description |
|---|------|--------|-------------|
| 1 | `src/types/ai-generation.ts` | CREATE | `AIGenerationRequest`, `GeneratedVocabularyTerm`, `GeneratedQuizQuestion`, `GenerationJob` |
| 2 | `src/services/ai-generation-api.ts` | CREATE | `requestGeneration`, `fetchGenerationStatus`, `fetchGenerationHistory`, `approveGeneration` |
| 3 | `src/hooks/useAIGeneration.ts` | CREATE | `generationKeys`, `useGenerationRequest`, `useGenerationStatus` (poll 1s while running), `useGenerationHistory` |
| 4-9 | `src/components/generation/*.tsx` | CREATE | GenerationPanel, GenerationProgress, GeneratedContent, GenerationHistory, ContentReview, index |
| 10 | `src/pages/admin/GenerationAdminPage.tsx` | CREATE | Full generation workflow page |

### Routing Changes

New admin route: `/admin/generation`

### Admin Flow

1. Select week + content type (vocabulary / quiz / challenge)
2. Optionally adjust: source filter, count, temperature
3. Click "Generate" → job created in SQLite (pending) → request forwarded to Python
4. Poll for completion (1s interval), show progress
5. On complete: preview generated items in review UI
6. Admin can: accept individual items, edit inline, discard
7. "Publish" saves accepted items to existing vocabulary/challenge tables in SQLite
8. Reuses existing `VocabularyFlashcard` and `VocabularyQuiz` components for student-facing display

### Cache Invalidation

- Generation approved (vocabulary): invalidate `vocabularyKeys.all` + `adminKeys.vocabularyTerms`
- Generation approved (quiz/challenge): invalidate relevant lesson/challenge keys

### Tests (Phase 4)

| File | Count | Covers |
|------|-------|--------|
| `python-service/tests/test_generation_service.py` | ~18 | Prompt construction, RAG context retrieval, JSON parsing, deduplication, Groq integration |
| `python-service/tests/test_generation_router.py` | ~10 | Endpoint validation, generation execution, error responses |
| `python-service/tests/test_prompts.py` | ~8 | Prompt templates produce valid LangChain chains, variable injection |
| `server/__tests__/unit/services/generation-job-service.test.ts` | ~14 | Job CRUD, status transitions, approval logic |
| `server/__tests__/integration/routes/ai-generation.test.ts` | ~14 | Job creation, status polling, approval flow, auth enforcement |
| `server/__tests__/edge-cases/llm-failures.test.ts` | ~11 | Malformed JSON retry, rate limiting, timeout, empty context |
| `src/__tests__/components/admin/ContentGenerationPanel.test.tsx` | ~7 | Form validation, generation trigger, progress display |
| `src/__tests__/hooks/useAIGeneration.test.ts` | ~4 | Polling, cache invalidation on approval |

### Complexity: Medium-High
- LangChain chain construction with structured output parsing
- Groq-specific handling (fast but may have different error patterns)
- Review/approve workflow bridges Python-generated content to SQLite storage
- Depends on RAG pipeline working correctly

### Definition of Done
- `bun test` passes (all previous + ~50 new TS tests)
- `cd python-service && make test` passes (previous + ~36 new Python tests)
- Admin can generate vocabulary from uploaded materials via Groq Llama 3.3 70B
- Generated items appear in review UI with edit/accept/discard
- Approved vocabulary saves to existing `vocabulary_terms` table
- Generated vocab appears in student flashcard/quiz UX with "AI Generated" badge
- Generation history shows past jobs with status

---

## Phase 5: Agent Chat

**Goal:** Students chat with an AI study agent powered by MiniMax M2 for tool-calling. Agent uses RAG search and vocabulary tools. Admin configures the agent.

### Python Service (agent logic)

| # | File | Action | Description |
|---|------|--------|-------------|
| 1 | `python-service/services/agent_service.py` | CREATE | LangChain agent with MiniMax M2. Tool-calling loop, conversation management, system prompt building, streaming response generation |
| 2 | `python-service/services/agent_tools.py` | CREATE | LangChain `@tool` decorated functions for each agent capability |
| 3 | `python-service/routers/agent.py` | CREATE | `POST /agent/chat` (streaming SSE), `POST /agent/conversations`, `GET /agent/conversations/{id}` |

### Agent Tools (LangChain tools using MiniMax M2 function-calling)

| Tool | Description | Implementation |
|------|-------------|----------------|
| `search_knowledge_base` | Semantic search over course materials | Calls FAISS vector store search for the conversation's week |
| `get_vocabulary_terms` | Get vocabulary for a lesson | HTTP call to Bun API `/api/vocabulary/:slug/terms` |
| `get_vocabulary_stats` | Student mastery statistics | HTTP call to Bun API `/api/vocabulary/:slug/stats` |
| `generate_practice_question` | On-demand quiz generation | Uses Groq Llama to generate a question from RAG context |
| `get_lesson_content` | Lesson structure and concepts | HTTP call to Bun API `/api/lessons/:slug` |

### MiniMax M2 Integration

```python
from langchain_openai import ChatOpenAI

# MiniMax exposes OpenAI-compatible API
llm = ChatOpenAI(
    model="MiniMax-M2",
    base_url="https://api.minimax.io/v1",
    api_key=settings.MINIMAX_API_KEY,
)

# LangChain agent with tools
agent = create_tool_calling_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, max_iterations=5)
```

### Agent Loop

```
User message
  → Python builds messages (system prompt + history + new message)
  → MiniMax M2 via LangChain AgentExecutor with tools
  → if tool_calls: LangChain executes tools, appends results, recurses (max 5)
  → if content: stream response tokens via SSE back through Bun to browser
```

### Backend (Bun/Hono — proxy + persistence)

| # | File | Action | Description |
|---|------|--------|-------------|
| 1 | `server/services/agent-metadata-service.ts` | CREATE | Conversation/message CRUD in SQLite. Stores conversation history, tool call logs |
| 2 | `server/routes/agent.ts` | CREATE | POST/GET conversations, GET conversation with messages, POST message (proxies to Python, streams SSE back), DELETE conversation |
| 3 | `server/index.ts` | MODIFY | Mount agent routes |

**Flow:** Browser → Bun (save user message to SQLite, proxy to Python) → Python (MiniMax M2 agent loop, streaming SSE) → Bun (forward SSE to browser, save assistant message + tool calls to SQLite on stream end)

### Frontend

| # | File | Action | Description |
|---|------|--------|-------------|
| 1 | `src/types/agent.ts` | CREATE | `AgentMessage`, `ToolCall`, `ToolResult`, `AgentConversation` |
| 2 | `src/services/agent-api.ts` | CREATE | `createConversation`, `fetchConversations`, `fetchConversation`, `streamAgentMessage` (ReadableStream) |
| 3 | `src/hooks/useAgentChat.ts` | CREATE | `agentKeys`, `useAgentConversations`, `useAgentConversation`, `useAgentMessage` (streaming mutation) |
| 4-10 | `src/components/agent/*.tsx` | CREATE | AgentChat, AgentMessage, ToolCallVisualization, SourceCitation, TypingIndicator, ConversationHistory, index |
| 11 | `src/pages/AgentPage.tsx` | CREATE | Conversation list + new chat button |
| 12 | `src/pages/AgentChatPage.tsx` | CREATE | Active chat with streaming |
| 13 | `src/pages/admin/AgentAdminPage.tsx` | CREATE | System prompt editor + tool toggle |
| 14 | `src/components/admin/AgentToolManager.tsx` | CREATE | Enable/disable tools, view parameters |
| 15 | `src/components/admin/SystemPromptEditor.tsx` | CREATE | Textarea for agent system prompt |

### Routing Changes

New public routes: `/agent`, `/agent/:conversationId`
New admin route: `/admin/agent`

### Streaming Implementation

**Python → Bun:** FastAPI `StreamingResponse` with SSE format (`data: {...}\n\n`)
**Bun → Browser:** Hono SSE proxy — reads Python stream, forwards chunks to browser
**Browser:** `ReadableStream` with `TextDecoder` for chunked JSON parsing, optimistic cache updates

### Tests (Phase 5)

| File | Count | Covers |
|------|-------|--------|
| `python-service/tests/test_agent_service.py` | ~14 | Agent creation, tool loop, max iterations guard, system prompt, MiniMax integration |
| `python-service/tests/test_agent_tools.py` | ~12 | Each tool executes correctly, handles missing data, HTTP errors to Bun API |
| `python-service/tests/test_agent_router.py` | ~10 | Chat endpoint, SSE streaming format, conversation CRUD |
| `server/__tests__/unit/services/agent-metadata-service.test.ts` | ~12 | Conversation/message CRUD, tool call storage |
| `server/__tests__/integration/routes/agent.test.ts` | ~10 | Conversation CRUD, message posting, sessionId auth, SSE proxy |
| `server/__tests__/edge-cases/agent-edge-cases.test.ts` | ~10 | Infinite tool loop guard, empty conversation, concurrent messages, Python service down |
| `src/__tests__/components/agent/AgentChat.test.tsx` | ~14 | Message rendering, send flow, streaming, tool-call cards, citations |
| `src/__tests__/hooks/useAgent.test.ts` | ~8 | Conversation list, streaming mutation, cache updates |

### Safety Guards

- **Max tool calls per turn:** 5 (enforced in LangChain `AgentExecutor(max_iterations=5)`)
- **Max conversation history:** 20 messages sent to LLM (older truncated by Python service)
- **Max message length:** 5000 chars (validated in Bun before proxying)
- **Session isolation:** Conversations scoped to sessionId (existing auth pattern)
- **Tool timeout:** Each tool call has 10s timeout (prevents hanging on Bun API calls)

### Complexity: High
- MiniMax M2 integration via LangChain (OpenAI-compatible but may have quirks)
- SSE streaming across two services (Python → Bun → Browser)
- Tool-calling loop with external HTTP calls back to Bun API
- Most complex user-facing feature

### Definition of Done
- `bun test` passes (all previous + ~55 new TS tests)
- `cd python-service && make test` passes (previous + ~36 new Python tests)
- Student can start conversations, send messages, receive streamed responses
- Agent uses MiniMax M2 for tool-calling (`search_knowledge_base` visible as expandable cards in UI)
- Source citations link to original documents
- Conversation history persists and is loadable
- Admin can edit system prompt and toggle tools
- Max tool-call guard prevents infinite loops

---

## Phase 6: Integration + Polish

**Goal:** Wire everything together. Update navigation, cross-feature flows, accessibility audit, responsive polish.

### Changes

| # | File | Action | Description |
|---|------|--------|-------------|
| 1 | `src/App.tsx` | MODIFY | All new routes from phases 2-5 (consolidated) |
| 2 | `src/components/layout/AppShell.tsx` | MODIFY | Add "Weeks" and "Agent" nav links, prefetch week data on hover |
| 3 | `src/components/admin/AdminLayout.tsx` | MODIFY | Add nav links: Weeks, Data Sources, Generation, Agent |
| 4 | `src/pages/admin/AdminDashboardPage.tsx` | MODIFY | Add tabs for new admin features |
| 5 | `src/pages/Dashboard.tsx` | MODIFY | Add week toggle view alongside existing lesson view |
| 6 | `src/pages/LessonDetail.tsx` | MODIFY | Add week breadcrumb, data sources sidebar when in week context |
| 7 | `src/pages/WeekDetailPage.tsx` | MODIFY | Add agent chat entry point per week |

### Cross-Feature Integration

| Flow | Implementation |
|------|---------------|
| Week → Data Sources → RAG → Generation | Admin uploads source for week, Python processes it, "Generate Vocabulary" button enabled when FAISS index populated |
| Week → Agent | Agent scoped to week context — MiniMax M2 searches only that week's FAISS index |
| Generation → Vocabulary | Groq-generated terms approved by admin appear in existing flashcard/quiz UX |
| Agent → Citations → Data Sources | Clicking citation in agent chat opens source chunk preview |

### Cache Invalidation (Cross-Feature)

- Week updated: invalidate `weekKeys.all`
- Data source uploaded: invalidate `dataSourceKeys.byWeek(weekId)` + `weekKeys.detail(weekId)`
- Embedding complete: invalidate `ragKeys.stats()`
- Generation approved: invalidate `vocabularyKeys.all` + `adminKeys.vocabularyTerms()`
- New agent message: invalidate `agentKeys.conversation(id)`

### Accessibility Audit Checklist

- All interactive elements keyboard navigable (Tab, Enter, Escape)
- `aria-live="polite"` on status updates (processing, generation, streaming)
- Status indicators use icon+color (not color alone)
- Two-layer Chakra v3 styling on all new focusable components (`_focus` + `_focusVisible`)
- `prefers-reduced-motion` respected (all animations reduced to 0.01ms)
- Screen reader labels on all inputs, buttons, and navigation
- Chat input: Cmd+Enter to send, Escape to close modals

### Responsive Audit

- All new pages single-column on mobile (< 768px)
- Agent chat: full-screen on mobile, split-panel on desktop
- Data source upload: stack vertically on small screens
- Week cards: 1-column mobile, 2-column tablet, 3-column desktop

### Animation Specs

| Element | Animation | Duration |
|---------|-----------|----------|
| Page transitions | opacity 0 to 1, y 10 to 0 | 200ms (matches existing) |
| Chat messages | Slide from right (user) / left (assistant) | 250ms |
| Tool-call cards | Expand from 0 height, cyan left border | 300ms |
| Upload progress bar | Animated width | 300ms easeOut |
| Generation progress | Pulse opacity 0.6 to 1 to 0.6 | 2s loop |
| Respect reduced motion | All above reduced to 0.01ms | -- |

### Tests (Phase 6)

| File | Count | Covers |
|------|-------|--------|
| `python-service/tests/test_integration.py` | ~10 | End-to-end: ingest → chunk → embed → search → generate → agent uses |
| `server/__tests__/integration/flows/cross-service.test.ts` | ~8 | Upload, process, generate, approve end-to-end via proxy |
| `server/__tests__/edge-cases/concurrency.test.ts` | ~6 | Race conditions: double upload, concurrent generation, simultaneous agent messages |
| `server/__tests__/edge-cases/data-integrity.test.ts` | ~7 | Cascade deletes across all new tables, orphan cleanup |
| `server/__tests__/edge-cases/input-validation.test.ts` (EXTEND) | ~18 | Validation for all new endpoints |
| `src/__tests__/edge-cases/frontend-edge-cases.test.tsx` | ~11 | Network failures, empty states, rapid navigation, SSE reconnect |

### Complexity: Medium
- Mostly wiring together existing pieces
- Risk is in cross-feature cache invalidation timing
- Accessibility and responsive work is systematic

### Definition of Done
- `bun test` passes (all previous + ~50 new TS tests)
- `cd python-service && make test` passes (previous + ~10 new Python tests)
- All navigation paths work (header, sidebar, breadcrumbs, cross-links)
- End-to-end flow: upload → process → generate → publish → student sees content
- Agent works scoped to a week's materials
- Accessibility checklist passes
- Responsive on mobile/tablet/desktop
- No console errors or warnings

---

## Summary

| Phase | New TS Files | New Python Files | Modified Files | New TS Tests | New Python Tests | Cumulative |
|-------|-------------|-----------------|----------------|-------------|-----------------|------------|
| 1: Schema + Scaffold | 4 | 12 | 2 | ~22 | ~5 | ~364 |
| 2: Weeks | 16 | 0 | 3 | ~70 | 0 | ~434 |
| 3: RAG Pipeline | 14 | 7 | 1 | ~64 | ~87 | ~585 |
| 4: AI Generation | 12 | 3 | 1 | ~50 | ~36 | ~671 |
| 5: Agent Chat | 17 | 3 | 1 | ~55 | ~36 | ~762 |
| 6: Integration | 0 | 0 | 7 | ~50 | ~10 | ~822 |
| **Total** | **~63** | **~25** | **~15** | **~311** | **~174** | **~822** |

### Existing Code Bugs to Fix (from testing analysis)

These were found in the edge case analysis and should be fixed in Phase 1 as a prerequisite:

1. **`server/routes/vocabulary.ts:149`** -- `null` and `NaN` quality values pass the `quality < 0 || quality > 5` check. Fix: add `typeof quality !== 'number' || isNaN(quality)` guard
2. **`server/routes/vocabulary.ts:237`** -- `timeSpentMs || 0` passes negative values. Fix: add `Math.max(0, timeSpentMs || 0)`
3. **`server/services/vocabulary-service.ts:219`** -- Quiz generates with only 1 option when lesson has 1 term. Fix: minimum 2 options or skip quiz generation

### Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Service split | Bun/Hono + Python/FastAPI | FAISS and LangChain are Python-native. Bun handles web, Python handles AI |
| Vector storage | FAISS (per-week flat indexes) | Production-grade ANN search, disk persistence, industry standard |
| RAG framework | LangChain | Mature Python ecosystem: document loaders, text splitters, chains, agents, tool decorators |
| Chat model | Groq Llama 3.3 70B | $0.59/$0.79/M tokens. Fast (280 T/s), good quality for explanations, cheap |
| Agent model | MiniMax M2 | Built for agentic workflows, native tool-calling, OpenAI-compatible API, 8% of Claude cost |
| Embedding model | OpenAI text-embedding-3-small | $0.02/M tokens. Reliable, 1536 dims, native LangChain support |
| Streaming | SSE (Python → Bun → Browser) | Agent needs real-time token display; generation is admin-only and can poll |
| Week-lesson link | Soft FK (nullable `week_id`) | Doesn't break existing lesson flows. Lessons work with or without weeks |
| Agent auth | SessionId (matching existing pattern) | No login required for students. Conversations isolated by session |
| Content approval | Staging → review → publish | Admin quality control before student visibility |
| Tool-calling | LangChain AgentExecutor with MiniMax M2 | Handles tool loop, max iterations, error recovery automatically |

### Cost Estimates

| Operation | Provider / Model | Est. Cost per Unit |
|-----------|-----------------|-------------------|
| Embed 1 page (~500 tokens) | OpenAI / text-embedding-3-small | ~$0.01 |
| Generate 10 vocab terms | Groq / Llama 3.3 70B | ~$0.002 |
| Agent chat turn (with RAG) | MiniMax / M2 | ~$0.005-0.02 |
| Full course (6 weeks, 50 pages) | Mixed | ~$0.50-2.00 total |

---

## Execution Notes

- **Branch strategy:** Create `feature/capstone-phase-N` from `development` for each phase. PR to `main` when phase is complete.
- **Phases 2+3 parallelism:** These can be developed on separate branches simultaneously since they don't touch the same files.
- **Environment:** `OPENAI_API_KEY` + `GROQ_API_KEY` required starting Phase 3. `MINIMAX_API_KEY` required starting Phase 5. Phases 1-2 work without any API keys.
- **Python setup:** `cd python-service && python -m venv .venv && source .venv/bin/activate && pip install -e .` (or `make install`)
- **Seeding:** Run `bun run db:seed-weeks` after Phase 2. Existing seed scripts unchanged.
- **Docker:** Phase 6 should update `Dockerfile` to build both services. Python service as a second stage or sidecar container.
- **Backwards compatibility:** All existing routes, pages, and features continue working throughout. New features are additive. If Python service is down, existing features still work — only RAG/agent/generation features degrade gracefully.
