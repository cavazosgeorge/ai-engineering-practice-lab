Now let me synthesize the three subagent reports into a unified backend implementation plan.

---

# BACKEND IMPLEMENTATION PLAN

## Overview

This plan covers the full backend evolution of the AI Engineering Practice Lab into a capstone project demonstrating LLMs, RAG, agents, and tool-calling. It is synthesized from three parallel analysis tracks: API architecture, database engineering, and service design.

---

## 1. New Files to Create (in implementation order)

| # | File | Purpose |
|---|------|---------|
| 1 | `server/db/migrations/004_weeks_and_rag_schema.sql` | Weeks, data_sources, chunks, embeddings tables |
| 2 | `server/db/migrations/005_agent_and_generation_schema.sql` | generation_jobs, agent_conversations, agent_messages tables |
| 3 | `server/db/index.ts` (MODIFY) | Add 7 new TypeScript row types; update LessonRow with `week_id` |
| 4 | `server/services/embedding-utils.ts` | Float32Array serialization, cosine similarity (zero deps) |
| 5 | `server/services/openai-client.ts` | Shared OpenAI API client (embeddings + chat + streaming) |
| 6 | `server/services/rag-service.ts` | Chunking, PDF extraction, embedding, semantic search |
| 7 | `server/services/ai-generation-service.ts` | Vocabulary/quiz/challenge generation from RAG context |
| 8 | `server/services/agent-service.ts` | Agent conversation management, tool-calling loop |
| 9 | `server/routes/weeks.ts` | Public week listing endpoints |
| 10 | `server/routes/data-sources.ts` | Admin data source CRUD + upload |
| 11 | `server/routes/rag.ts` | Public semantic search + admin stats |
| 12 | `server/routes/ai-generation.ts` | Admin content generation jobs |
| 13 | `server/routes/agent.ts` | Agent conversation + chat endpoints |
| 14 | `server/index.ts` (MODIFY) | Mount 5 new route files |
| 15 | `server/routes/admin.ts` (MODIFY) | Extend with week management CRUD |
| 16 | `server/scripts/seed-weeks.ts` | Seed weeks and link existing lessons |

---

## 2. Database Schema (7 New Tables)

### Migration 004: `weeks_and_rag_schema.sql`

**`weeks`** - Top-level course week containers
- PK: `id TEXT`, unique `week_number INTEGER`, unique `slug TEXT`
- Columns: `title`, `description`, `start_date`, `end_date`, `is_published INTEGER DEFAULT 0`, `order_index`
- ALTERs `lessons` to add nullable `week_id TEXT REFERENCES weeks(id) ON DELETE SET NULL`

**`data_sources`** - Course material records (PDF/URL/text)
- PK: `id TEXT`, FK: `week_id -> weeks(id) ON DELETE CASCADE`
- Columns: `source_type CHECK ('pdf','url','text')`, `title`, `url`, `file_path`, `raw_content`, `content_hash`, `status CHECK ('pending','processing','processed','error')`, `error_message`, `chunk_count`, `metadata JSON`
- Indexes: `week_id`, `status`, `content_hash`

**`chunks`** - Text segments from processed data sources
- PK: `id TEXT`, FK: `data_source_id -> data_sources(id) ON DELETE CASCADE`
- Columns: `chunk_index`, `content`, `token_count`, `metadata JSON`
- Unique constraint: `(data_source_id, chunk_index)`

**`embeddings`** - Vector representations stored as BLOB
- PK: `id TEXT`, FK: `chunk_id -> chunks(id) ON DELETE CASCADE`
- Columns: `model_name TEXT`, `dimensions INTEGER`, `vector BLOB` (serialized Float32Array)
- Unique constraint: `(chunk_id, model_name)`

### Migration 005: `agent_and_generation_schema.sql`

**`generation_jobs`** - AI content generation job tracking
- PK: `id TEXT`, FK: `week_id -> weeks(id) ON DELETE CASCADE`, FK: `created_by -> user(id) ON DELETE SET NULL`
- Columns: `job_type CHECK ('vocabulary','quiz','challenge')`, `status CHECK ('pending','running','completed','failed')`, `prompt`, `result JSON`, `model_name`, `input_token_count`, `output_token_count`, `error_message`
- Indexes: `week_id`, `status`, `job_type`

**`agent_conversations`** - Chat sessions with the AI study agent
- PK: `id TEXT`, FK: `week_id -> weeks(id) ON DELETE SET NULL`
- Columns: `session_id`, `title`, `model_name`, `system_prompt`, `message_count`, `is_archived`
- Indexes: `session_id`, `week_id`

**`agent_messages`** - Individual messages in agent conversations
- PK: `id TEXT`, FK: `conversation_id -> agent_conversations(id) ON DELETE CASCADE`
- Columns: `role CHECK ('user','assistant','system','tool')`, `content`, `tool_calls JSON`, `tool_call_id`, `token_count`, `retrieved_chunks JSON`, `latency_ms`

---

## 3. Service Architecture & Dependency Graph

```
embedding-utils.ts        (pure math, zero deps)
       |
openai-client.ts          (fetch + retry, env vars only)
       |
rag-service.ts            (embedding-utils + openai-client + db)
       |
ai-generation-service.ts  (rag-service + openai-client + admin-service + db)
       |
agent-service.ts          (rag-service + ai-generation-service + vocabulary-service + openai-client + db)
```

### Key Service Functions

**`embedding-utils.ts`**: `serializeEmbedding()`, `deserializeEmbedding()`, `cosineSimilarity()`, `rankBySimilarity()`

**`openai-client.ts`**: `createEmbeddings()`, `createChatCompletion()`, `createStreamingChatCompletion()` -- shared HTTP client with retry logic (backoff on 429/500/503)

**`rag-service.ts`**: `chunkText()`, `extractTextFromPdf()`, `fetchUrlContent()`, `generateEmbeddings()`, `processDataSource()` (full pipeline: extract -> chunk -> embed -> store), `searchKnowledgeBase()` (embed query -> brute-force cosine similarity -> top-K results)

**`ai-generation-service.ts`**: `generateVocabulary()`, `generateQuizQuestions()`, `generateChallenges()`, `approveAndSaveVocabulary()`, `parseGeneratedVocabulary/Quiz/Challenges()` -- all use RAG context retrieval + structured JSON output from LLM

**`agent-service.ts`**: `createConversation()`, `chat()`, `streamChat()`, `executeTool()`, `getToolDefinitions()`, `buildSystemPrompt()` -- full tool-calling loop with 5 tools:
1. `search_knowledge_base` - semantic search over course materials
2. `get_vocabulary_terms` - retrieve vocab for a lesson
3. `get_vocabulary_stats` - student mastery statistics
4. `generate_practice_question` - on-demand quiz generation
5. `get_lesson_content` - lesson structure and concepts

---

## 4. API Endpoints (29 new endpoints)

### Public Routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/weeks` | List published weeks with content counts |
| GET | `/api/weeks/:slug` | Get week detail with lesson tree |
| POST | `/api/rag/search` | Semantic search (query + optional weekId/topK) |
| POST | `/api/agent/conversations` | Start new agent conversation |
| GET | `/api/agent/conversations` | List conversations by sessionId |
| GET | `/api/agent/conversations/:id` | Get conversation with messages |
| POST | `/api/agent/conversations/:id/messages` | Send message, get agent response |
| DELETE | `/api/agent/conversations/:id` | Delete conversation |

### Admin Routes (requireAdmin middleware)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/weeks` | List all weeks (including unpublished) |
| POST | `/api/admin/weeks` | Create week |
| PATCH | `/api/admin/weeks/:id` | Update week |
| DELETE | `/api/admin/weeks/:id` | Delete week (cascades) |
| GET | `/api/data-sources` | List data sources (filter by weekId) |
| GET | `/api/data-sources/:id` | Get data source with chunks |
| POST | `/api/data-sources/text` | Create text data source |
| POST | `/api/data-sources/url` | Create URL data source |
| POST | `/api/data-sources/upload` | Upload PDF (multipart) |
| POST | `/api/data-sources/:id/reprocess` | Re-run chunking/embedding |
| DELETE | `/api/data-sources/:id` | Delete data source |
| GET | `/api/rag/stats` | RAG pipeline statistics |
| POST | `/api/rag/embed` | Manually embed specific chunks |
| POST | `/api/ai/generate/vocabulary` | Generate vocab from materials |
| POST | `/api/ai/generate/quiz` | Generate quiz questions |
| POST | `/api/ai/generate/challenges` | Generate coding challenges |
| GET | `/api/ai/generate/jobs` | List generation jobs |
| GET | `/api/ai/generate/jobs/:id` | Get job with results |
| POST | `/api/ai/generate/jobs/:id/approve` | Approve/reject generated items |

---

## 5. Vector Storage Strategy

- **Storage**: SQLite BLOB columns with Float32Array serialized to Buffer
- **Model**: `text-embedding-3-small` (1536 dimensions, ~6KB per vector)
- **Search**: Brute-force cosine similarity in JavaScript -- load all embeddings for target week, compute similarity, return top-K
- **Performance**: ~1ms for 1,000 comparisons. Bottleneck is the embedding API call (~200-500ms), not similarity search
- **Scale limit**: Works well up to ~50K chunks. Beyond that, consider `sqlite-vec` extension or dedicated vector store

---

## 6. Environment Configuration

```bash
OPENAI_API_KEY=sk-...
EMBEDDING_MODEL=text-embedding-3-small       # $0.02/M tokens
CHAT_MODEL=gpt-4o-mini                       # $0.15/$0.60/M tokens
CHUNK_SIZE=1000                              # chars per chunk
CHUNK_OVERLAP=200                            # overlap between chunks
RAG_TOP_K=5                                  # default search results
MAX_UPLOAD_SIZE_MB=10
UPLOAD_DIR=./data/uploads
```

**New npm dependency**: `pdf-parse` for PDF text extraction. OpenAI API accessed via native `fetch()`.

---

## 7. Implementation Phases

| Phase | Scope | Dependencies |
|-------|-------|-------------|
| **1: Schema** | Migrations 004+005, row types in db/index.ts | None |
| **2: Utilities** | embedding-utils.ts, openai-client.ts | Phase 1 |
| **3: Weeks** | weeks routes (public + admin CRUD), seed-weeks.ts | Phase 1 |
| **4: RAG Pipeline** | rag-service.ts, data-sources routes, rag routes | Phases 1-2 |
| **5: AI Generation** | ai-generation-service.ts, generation routes | Phases 1-4 |
| **6: Agent** | agent-service.ts, agent routes (with streaming) | Phases 1-5 |

Each phase is independently testable. Phase 3 can run in parallel with Phase 2 since weeks don't require OpenAI.

---

## 8. Key Design Decisions

1. **Week-lesson relationship**: Soft FK via `lessons.week_id` (nullable). Existing lessons continue working without a week.
2. **Agent auth**: Uses `sessionId` pattern (matching existing unauthenticated routes) rather than requiring login.
3. **Async generation**: Content generation endpoints return immediately with a job ID. Client polls for completion.
4. **Agent streaming**: Chat endpoint streams via SSE for real-time UX. Generation endpoints do not stream (admin waits for full JSON result).
5. **Tool-calling**: Uses OpenAI native function-calling (not prompt-engineered JSON). 5 tools defined covering knowledge search, vocab, stats, question generation, and lesson content.
6. **Cost controls**: Conversation truncation (20 messages), model tiering (mini for routine, 4o for challenges), embedding caching (never re-embed unchanged chunks).
