All three subagents have completed their analysis. Let me synthesize their findings into a unified testing strategy.

---

# Unified Testing Strategy: AI Engineering Practice Lab Capstone

## Executive Summary

This strategy covers **~452 tests** across three layers: unit tests (~269), integration tests (~98), and edge case/failure mode tests (~85). The plan is organized by priority tiers and follows all existing project conventions (`bun:test`, in-memory SQLite, Hono's `app.request()`, TanStack Query hooks, and the established mock patterns).

---

## 1. Test Architecture Overview

```
server/__tests__/
├── fixtures/
│   ├── test-db.ts                          # (existing)
│   ├── mock-data.ts                        # (extend with capstone objects)
│   ├── helpers.ts                          # (extend with seed functions)
│   ├── mock-data-capstone.ts               # NEW: Weeks, sources, chunks, embeddings, vocab, agent
│   ├── helpers-capstone.ts                 # NEW: seedEmptyWeek, seedFullWeek, etc.
│   ├── mock-services.ts                    # NEW: LLM mock, file service mock, auth mock
│   └── mock-llm.ts                         # NEW: Deterministic LLM client mock factory
├── unit/services/
│   ├── week-service.test.ts                # ~22 tests
│   ├── data-source-service.test.ts         # ~18 tests
│   ├── content-extractor.test.ts           # ~14 tests
│   ├── rag/
│   │   ├── chunking.test.ts               # ~18 tests
│   │   ├── embeddings.test.ts             # ~17 tests
│   │   └── vector-store.test.ts           # ~15 tests
│   ├── ai/vocabulary-generator.test.ts     # ~18 tests
│   └── agent/
│       ├── tools.test.ts                   # ~14 tests
│       └── agent-service.test.ts           # ~12 tests
├── integration/
│   ├── db/capstone-schema.test.ts          # ~12 tests (migration, cascades, constraints)
│   ├── routes/
│   │   ├── weeks.test.ts                   # ~22 tests
│   │   ├── data-sources.test.ts            # ~18 tests
│   │   ├── rag.test.ts                     # ~14 tests
│   │   ├── vocabulary-generation.test.ts   # ~14 tests
│   │   └── agent.test.ts                   # ~10 tests
│   └── flows/cross-service.test.ts         # ~8 tests (end-to-end flows)
└── edge-cases/
    ├── input-validation.test.ts            # ~18 tests
    ├── rag-boundaries.test.ts              # ~14 tests
    ├── llm-failures.test.ts                # ~11 tests
    ├── agent-edge-cases.test.ts            # ~10 tests
    ├── file-upload-edge-cases.test.ts      # ~8 tests
    ├── concurrency.test.ts                 # ~6 tests
    └── data-integrity.test.ts              # ~7 tests

src/__tests__/
├── components/
│   ├── weeks/WeekSelector.test.tsx         # ~10 tests
│   ├── admin/
│   │   ├── DataSourceUploader.test.tsx     # ~10 tests
│   │   ├── DataSourceList.test.tsx         # ~8 tests
│   │   ├── RAGPipelineStatus.test.tsx      # ~5 tests
│   │   ├── AdminWeekManager.test.tsx       # ~10 tests
│   │   ├── AdminDataSourcePanel.test.tsx   # ~5 tests
│   │   └── ContentGenerationPanel.test.tsx # ~7 tests
│   ├── vocabulary/VocabularyCard.test.tsx   # ~6 tests
│   ├── quiz/FillInBlankQuestion.test.tsx    # ~7 tests
│   └── agent/AgentChat.test.tsx            # ~14 tests
├── hooks/
│   ├── useWeeks.test.ts                    # ~6 tests
│   ├── useDataSources.test.ts             # ~6 tests
│   ├── useRAGStatus.test.ts               # ~5 tests
│   ├── useVocabulary.test.ts              # ~4 tests
│   ├── useQuiz.test.ts                    # ~4 tests
│   └── useAgent.test.ts                   # ~8 tests
└── edge-cases/
    └── frontend-edge-cases.test.tsx        # ~11 tests
```

---

## 2. Priority Tiers (Implementation Order)

### Tier 1 - Critical Path (implement first)

These tests cover the foundational data flow. Everything else depends on them.

| Test Area | Count | Why Critical |
|-----------|-------|-------------|
| RAG Chunking (unit) | 18 | All downstream features depend on correct chunking |
| Embedding generation (unit) | 17 | Required for vector search to work |
| Vector store search (unit) | 15 | Core retrieval mechanism for entire RAG pipeline |
| Week management CRUD (unit + integration) | 44 | Structural foundation for all content organization |
| Data source status machine (unit + integration) | 36 | Pipeline processing depends on correct state transitions |
| Schema migration + cascades (integration) | 12 | Data integrity for all new tables |

### Tier 2 - Core Features

| Test Area | Count | Why Important |
|-----------|-------|-------------|
| Vocabulary term extraction (unit) | 18 | Bridges RAG pipeline to learning features |
| Agent tool execution (unit) | 26 | Primary user-facing AI feature |
| Cross-service integration flows | 8 | Validates end-to-end data flow |
| LLM failure modes (edge) | 11 | External dependency resilience |
| Concurrency race conditions (edge) | 6 | Production reliability |

### Tier 3 - UI and Polish

| Test Area | Count |
|-----------|-------|
| Frontend components (all) | 82 |
| Frontend hooks (all) | 33 |
| Input validation edge cases | 18 |
| File upload edge cases | 8 |
| Frontend edge cases | 11 |

---

## 3. Mock Strategy

### External Dependencies Requiring Mocks

| Dependency | Mock Pattern | Used By |
|-----------|-------------|---------|
| **LLM API** (OpenAI/Anthropic) | `createMockLLMClient()` factory returning deterministic responses | Embeddings, vocab generation, agent chat |
| **File System** (PDF reading) | `mock(fs, "readFileSync", ...)` | Content extraction |
| **URL Fetching** | `mock(globalThis, "fetch", ...)` | URL data source processing |
| **Auth Sessions** | `mock.module("../../../auth", ...)` with role-based session lookup | All admin routes |
| **Database** | In-memory SQLite via existing `test-db.ts` | All backend tests |

### LLM Mock Factory (key design)

```typescript
// server/__tests__/fixtures/mock-llm.ts
export function createMockLLMClient() {
  return {
    embed: async (text: string) => ({
      data: [{ embedding: Array(1536).fill(0.01) }],
    }),
    chat: async (messages: any[]) => ({
      choices: [{ message: { role: "assistant", content: "Mock response" } }],
    }),
    chatWithTools: async (messages: any[], tools: any[]) => ({
      choices: [{ message: { role: "assistant", tool_calls: [...] } }],
    }),
    setResponse: (response: any) => { /* override default */ },
    setError: (error: Error) => { /* simulate failures */ },
    calls: [] as any[], // Track calls for assertions
  };
}
```

---

## 4. Key Test Fixtures

### Seed State Configurations

| Fixture | State | Contents |
|---------|-------|----------|
| `seedEmptyWeek()` | Week exists, no content | 1 published week |
| `seedPartialWeek()` | Mixed processing states | 1 week + 2 sources (1 pending, 1 failed) |
| `seedFullWeek()` | Fully processed | 1 week + 3 sources + 3 chunks + 3 embeddings + 3 vocab terms |
| `seedUnpublishedWeek()` | Draft state | 1 unpublished week |
| `seedAgentConversation()` | Existing chat history | 1 conversation + 3 messages (user, assistant, tool) |
| `seedAllCapstoneData()` | Everything | All 4 weeks + full content |

---

## 5. High-Risk Edge Cases Requiring Special Attention

The edge case analysis identified **29 high-risk scenarios**. The most critical:

1. **Chunking infinite loop** - overlap >= chunkSize causes infinite loop. Must validate `overlap < chunkSize`.
2. **Embedding dimension mismatch** - switching models between ingestion and query silently corrupts search. Must validate dimensions match.
3. **LLM malformed JSON** - vocabulary generation relies on parsed JSON from LLM. Must handle parse failures with retry.
4. **Agent infinite tool loop** - agent could repeatedly call the same tool. Must enforce max tool call limit per turn.
5. **Concurrent processing** - double-click on "Process" creates duplicate chunks. Must check status before processing.
6. **Week deletion during processing** - CASCADE deletes data while background job is still writing. Must detect and abort gracefully.
7. **Path traversal in filenames** - file upload with `../../etc/passwd` filename. Must sanitize before storage.

### Existing Code Bugs Found

The edge case analysis also identified validation gaps in existing code:
- `server/routes/vocabulary.ts:149` - `null` and `NaN` quality values pass the `quality < 0 || quality > 5` check
- `server/routes/vocabulary.ts:237` - `timeSpentMs || 0` passes negative values through
- `server/services/vocabulary-service.ts:219` - quiz generates with only 1 option when lesson has 1 term (meaningless quiz)

---

## 6. Testing Conventions (matching existing codebase)

- **Test runner**: `bun:test` with `describe`/`it`/`expect`/`mock`/`beforeEach`/`afterEach`
- **Backend DB**: In-memory SQLite via `setupTestDb()`/`teardownTestDb()` from `server/__tests__/fixtures/test-db.ts`
- **Backend mocking**: `mock.module()` for module-level mocks, `bun:test` `mock()` for function-level
- **Frontend DOM**: happy-dom via `src/__tests__/setup/dom.ts`
- **Frontend rendering**: Custom `render` with QueryClient + Chakra + MemoryRouter from `src/__tests__/setup/react-utils.tsx`
- **API testing**: Hono's `app.request()` (no HTTP server needed)
- **IDs**: `nanoid()` for DB IDs, `crypto.randomUUID()` for session IDs
