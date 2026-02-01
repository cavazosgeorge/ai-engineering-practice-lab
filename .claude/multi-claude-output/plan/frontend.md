All three subagents have completed their analysis. Let me now synthesize their findings into a unified frontend implementation plan.

---

# FRONTEND IMPLEMENTATION PLAN

## Executive Summary

This plan covers the frontend architecture for evolving the AI Engineering Practice Lab into a capstone project demonstrating LLMs, RAG, agents, and tool-calling. The plan is synthesized from three specialist analyses: component architecture, state management, and UX/interaction design.

---

## 1. NEW FILE STRUCTURE

### Components (24 new)

```
src/components/
├── weeks/                          [NEW - 5 components]
│   ├── WeekNavigator.tsx           # Horizontal week selector (Week 1, 2, 3...)
│   ├── WeekCard.tsx                # Summary card (title, lesson count, progress %)
│   ├── WeekDetail.tsx              # Full week view (lessons + data sources)
│   ├── WeekBreadcrumb.tsx          # Breadcrumb trail for week context
│   ├── WeekLessonGrid.tsx          # Filtered lesson grid for a specific week
│   └── index.ts
├── dataSources/                    [NEW - 5 components]
│   ├── DataSourceUploader.tsx      # Drag-drop file upload zone
│   ├── DataSourceList.tsx          # Table: name, status, size, actions
│   ├── DataSourceStatus.tsx        # Single source: chunking/embedding progress timeline
│   ├── DataSourcePreview.tsx       # Extracted content + chunk boundaries preview
│   ├── DataSourceDelete.tsx        # Confirm dialog + delete mutation
│   └── index.ts
├── rag/                            [NEW - 5 components]
│   ├── RAGPipelineVisualizer.tsx   # Flowchart: upload → chunk → embed → index
│   ├── ChunkingPreview.tsx         # Document chunks with highlighted boundaries
│   ├── EmbeddingVisualization.tsx   # Visual embedding space (lazy-loaded)
│   ├── VectorSearchResults.tsx     # Query + ranked results with similarity scores
│   ├── RAGMetrics.tsx              # Stats: chunk count, embedding status, latency
│   └── index.ts
├── generation/                     [NEW - 5 components]
│   ├── GenerationPanel.tsx         # Config: content type, sources, LLM params
│   ├── GenerationProgress.tsx      # Real-time progress + streaming logs
│   ├── GeneratedContent.tsx        # Preview + accept/edit/discard generated items
│   ├── GenerationHistory.tsx       # Past generations with status badges
│   ├── ContentReview.tsx           # Before-save review with inline editing
│   └── index.ts
├── agent/                          [NEW - 6 components]
│   ├── AgentChat.tsx               # Chat container (messages + input)
│   ├── AgentMessage.tsx            # Single message (user or assistant)
│   ├── ToolCallVisualization.tsx   # Visualize tool execution (name, args, result)
│   ├── SourceCitation.tsx          # Clickable footnotes with document preview
│   ├── TypingIndicator.tsx         # Streaming state indicator
│   ├── ConversationHistory.tsx     # Save/load/export conversations
│   └── index.ts
└── admin/                          [EXTEND - 7 new components]
    ├── WeekForm.tsx                # Create/edit week form
    ├── WeekTable.tsx               # Week list with edit/delete actions
    ├── DataSourceManagement.tsx    # Upload + list panel for admin
    ├── GenerationConfig.tsx        # LLM selection, parameters, source selection
    ├── GenerationQueue.tsx         # Pending/running generation jobs
    ├── AgentToolManager.tsx        # Enable/disable tools, edit parameters
    ├── SystemPromptEditor.tsx      # Textarea for agent system prompt
    └── index.ts                    [EXTEND]
```

### Pages (8 new + 4 extended)

```
src/pages/
├── WeeksDashboard.tsx              [NEW] - All published weeks grid
├── WeekDetailPage.tsx              [NEW] - Week content (lessons + vocab + chat)
├── AgentPage.tsx                   [NEW] - Conversation list + new chat
├── AgentChatPage.tsx               [NEW] - Active chat with streaming
├── admin/
│   ├── WeekAdminPage.tsx           [NEW] - Create/manage weeks
│   ├── DataSourceAdminPage.tsx     [NEW] - Upload/manage data sources
│   ├── GenerationAdminPage.tsx     [NEW] - Generate + review content
│   └── AgentAdminPage.tsx          [NEW] - Configure agent tools/prompt
├── Dashboard.tsx                   [EXTEND] - Add week toggle view
├── LessonDetail.tsx                [EXTEND] - Add data sources sidebar
└── admin/AdminDashboardPage.tsx    [EXTEND] - Add tabs for new features
```

### Hooks (5 new)

```
src/hooks/
├── useWeeks.ts                     [NEW] - weekKeys, useCurrentWeek, useWeeks, useWeekDetail, prefetchWeek
├── useDataSources.ts               [NEW] - dataSourceKeys, useWeekDataSources, useDataSourceStatus, useUploadDataSource
├── useRAG.ts                       [NEW] - ragKeys, useRAGSearch, useVectorStoreStats, useSourceChunks
├── useAIGeneration.ts              [NEW] - generationKeys, useGenerationRequest, useGenerationStatus, useRequestAIGeneration
└── useAgentChat.ts                 [NEW] - agentKeys, useAgentConversations, useAgentMessage (streaming)
```

### Services (5 new)

```
src/services/
├── weeks-api.ts                    [NEW] - fetchWeeks, fetchWeekDetail, createWeek, updateWeek
├── data-sources-api.ts             [NEW] - uploadDataSource, fetchDataSourceStatus, deleteDataSource
├── rag-api.ts                      [NEW] - searchRAG, fetchVectorStoreStats, fetchSourceChunks
├── ai-generation-api.ts            [NEW] - requestAIGeneration, fetchGenerationStatus, fetchGenerationHistory
└── agent-api.ts                    [NEW] - fetchAgentConversations, streamAgentMessage (ReadableStream)
```

### Types (5 new)

```
src/types/
├── weeks.ts                        [NEW] - Week, WeekDetail, WeekFilter
├── data-sources.ts                 [NEW] - DataSource, UploadProgress, ProcessingStatus
├── rag.ts                          [NEW] - DocumentChunk, RAGSearchResult, VectorStoreStats
├── ai-generation.ts                [NEW] - AIGenerationRequest, GeneratedVocabularyTerm, GeneratedQuizQuestion
└── agent.ts                        [NEW] - AgentMessage, ToolCall, AgentConversation
```

---

## 2. ROUTING ADDITIONS

```typescript
// In App.tsx — new routes
<Route element={<AppShell />}>
  {/* Existing routes unchanged */}
  <Route path="/" element={<Dashboard />} />
  <Route path="/lessons" element={<Lessons />} />
  <Route path="/lessons/:slug" element={<LessonDetail />} />
  
  {/* NEW: Week-based navigation */}
  <Route path="/weeks" element={<WeeksDashboard />} />
  <Route path="/weeks/:weekId" element={<WeekDetailPage />} />
  
  {/* NEW: Agent chat */}
  <Route path="/agent" element={<AgentPage />} />
  <Route path="/agent/:conversationId" element={<AgentChatPage />} />
</Route>

{/* Admin routes — new pages */}
<Route element={<ProtectedRoute />}>
  <Route element={<AdminLayout />}>
    <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
    <Route path="/admin/weeks" element={<WeekAdminPage />} />
    <Route path="/admin/weeks/:weekId/sources" element={<DataSourceAdminPage />} />
    <Route path="/admin/generation" element={<GenerationAdminPage />} />
    <Route path="/admin/agent" element={<AgentAdminPage />} />
  </Route>
</Route>
```

---

## 3. STATE MANAGEMENT PATTERNS

### Query Key Constants (follow existing `lessonKeys`/`vocabularyKeys` pattern)

| Hook File | Key Structure | Stale Time | Notes |
|-----------|---------------|------------|-------|
| `useWeeks.ts` | `["weeks", id?]` | 60s | Static content |
| `useDataSources.ts` | `["data-sources", weekId, id?]` | 15s | Active processing → poll at 2s |
| `useRAG.ts` | `["rag", "search", query]` | 0 (fresh) | Search always fresh |
| `useAIGeneration.ts` | `["ai-generation", id?]` | 10s | Poll at 1s during generation |
| `useAgentChat.ts` | `["agent", conversationId?]` | 15s | Streaming bypasses cache |

### Real-Time Patterns

| Feature | Pattern | Implementation |
|---------|---------|---------------|
| Data source processing | **Polling** (2s interval) | `refetchInterval: 2_000` on `useDataSourceStatus`, disabled when complete |
| AI content generation | **Polling** (1s interval) | `refetchInterval: 1_000` on `useGenerationStatus`, disabled when complete |
| Agent chat streaming | **ReadableStream** | `res.body.getReader()` + `TextDecoder` for chunked JSON, optimistic cache updates |
| Upload progress | **XHR/fetch progress** | `onUploadProgress` callback updating local state |

### Cache Invalidation Hierarchy

```
Week updated → invalidate weekKeys.all
Data source uploaded → invalidate dataSourceKeys.byWeek(weekId) + weekKeys.detail(weekId)
Embedding complete → invalidate ragKeys.stats()
Generation approved → invalidate vocabularyKeys.all + adminKeys.vocabularyTerms()
```

---

## 4. KEY DATA TYPES

```typescript
// Core types (abbreviated - full definitions in src/types/)

interface Week {
  id: string; number: number; title: string; description: string | null;
  startDate: string; endDate: string; isPublished: boolean; orderIndex: number;
}

interface DataSource {
  id: string; weekId: string; title: string; sourceType: "pdf" | "url" | "text";
  processingStatus: "pending" | "processing" | "chunked" | "embedded" | "failed";
  chunkCount: number; embeddingProgress: number;
}

interface RAGSearchResult {
  chunkId: string; sourceId: string; content: string;
  relevanceScore: number; metadata: { source: string; pageNumber?: number };
}

interface AIGenerationRequest {
  id: string; weekId: string; requestType: "vocabulary" | "quiz" | "challenge";
  status: "pending" | "processing" | "completed" | "failed";
  generatedContent: string | null;
}

interface AgentMessage {
  id: string; conversationId: string; role: "user" | "assistant";
  content: string; toolCalls?: ToolCall[]; toolResults?: ToolResult[];
}

interface ToolCall {
  id: string; name: string; arguments: Record<string, unknown>;
  status: "pending" | "completed" | "failed"; result?: unknown;
}
```

---

## 5. UX INTERACTION PATTERNS

### Student Flows

1. **Browse Weeks**: Dashboard → week selector → filtered lessons/vocab/chat
2. **Chat with Agent**: Agent page → new/resume conversation → streaming responses with tool-call visualization + source citations
3. **Study Generated Content**: Week detail → AI-generated vocabulary deck (same flashcard/quiz UX) with "Generated from materials" badge

### Admin Flows

1. **Manage Weeks**: Admin → Weeks tab → create/edit weeks → assign lessons
2. **Upload Sources**: Admin → Week → Data Sources → drag-drop upload → processing timeline → "Ready" badge
3. **Generate Content**: Admin → Generation → select week/type/params → stream progress → review/edit → publish
4. **Configure Agent**: Admin → Agent → edit system prompt → toggle tools → test

### Critical UX Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| File upload | Drag-drop + file picker | Desktop + mobile support |
| Chat streaming | Token-by-token with tool-call cards | Real-time transparency; shows RAG pipeline |
| Generated content | Staging → review/edit → publish | Admin quality control before student visibility |
| Week navigation | Sidebar + top-level route | Doesn't break existing lesson hierarchy |
| Source citations | Clickable footnotes → document preview sidebar | Builds trust in AI responses |

### Animation Specs

- **Page transitions**: `opacity: 0→1, y: 10→0` over 200ms (matches existing pattern)
- **Chat messages**: Slide from right (user) / left (assistant) over 250ms
- **Tool-call cards**: Expand from 0 height over 300ms with left cyan border
- **Upload progress**: Animated width bar with 300ms easeOut
- **Generation progress**: Pulse animation (`opacity: 0.6→1→0.6`, 2s loop)
- **Respect `prefers-reduced-motion`**: All animations reduced to 0.01ms

### Accessibility

- Keyboard: Tab navigation, Cmd+Enter to send chat, Escape to close modals
- Screen readers: `aria-live="polite"` for status updates, proper labels on all inputs
- Color: Status uses icon+color pairs (not color alone)
- Focus: Two-layer Chakra v3 pattern (`_focus` + `_focusVisible`) on all interactive elements
- Responsive: Mobile-first, single-column on small screens, full layout on desktop

---

## 6. EXISTING COMPONENTS TO REUSE

| Component | Reuse In | Changes Needed |
|-----------|----------|----------------|
| `VocabularyFlashcard.tsx` | AI-generated vocab deck | None (same flip animation) |
| `VocabularyQuiz.tsx` | AI-generated quizzes | None (same quiz UX) |
| `CodeEditor.tsx` | Agent system prompt editor, challenge preview | None |
| `TestResults.tsx` | Generated quiz validation | None |
| `HintsSection.tsx` | Generation tips, RAG tips | None |
| `AppShell.tsx` | Main layout | Add "Weeks" + "Agent" nav links |
| `AdminLayout.tsx` | Admin shell | Add nav links for new admin pages |
| `ProtectedRoute.tsx` | All new admin pages | None |

---

## 7. IMPLEMENTATION ORDER

### Phase 1: Foundation — Weeks + Data Sources
**Files**: `src/types/weeks.ts`, `src/types/data-sources.ts`, `src/services/weeks-api.ts`, `src/services/data-sources-api.ts`, `src/hooks/useWeeks.ts`, `src/hooks/useDataSources.ts`, `src/components/weeks/*`, `src/components/dataSources/*`, `src/pages/WeeksDashboard.tsx`, `src/pages/WeekDetailPage.tsx`, `src/pages/admin/WeekAdminPage.tsx`, `src/pages/admin/DataSourceAdminPage.tsx`

**Deliverables**: Week CRUD in admin, file upload with processing status, student week browsing

### Phase 2: RAG Pipeline
**Files**: `src/types/rag.ts`, `src/services/rag-api.ts`, `src/hooks/useRAG.ts`, `src/components/rag/*`

**Deliverables**: Chunking preview, vector search results, RAG metrics dashboard, pipeline flow visualization

### Phase 3: AI Content Generation
**Files**: `src/types/ai-generation.ts`, `src/services/ai-generation-api.ts`, `src/hooks/useAIGeneration.ts`, `src/components/generation/*`, `src/pages/admin/GenerationAdminPage.tsx`

**Deliverables**: Generate vocabulary/quizzes from materials, streaming progress, review/edit/publish workflow

### Phase 4: Agent Chat Interface
**Files**: `src/types/agent.ts`, `src/services/agent-api.ts`, `src/hooks/useAgentChat.ts`, `src/components/agent/*`, `src/pages/AgentPage.tsx`, `src/pages/AgentChatPage.tsx`, `src/pages/admin/AgentAdminPage.tsx`

**Deliverables**: Streaming chat, tool-call visualization, source citations, conversation history, admin tool/prompt config

### Phase 5: Integration & Polish
**Files**: `src/App.tsx` (routes), `src/components/layout/AppShell.tsx` (nav), `src/components/admin/AdminLayout.tsx` (nav)

**Deliverables**: Routing integration, nav updates, responsive refinement, accessibility audit, cross-feature invalidation testing

---

## 8. BACKEND API ENDPOINTS (Frontend Needs)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/weeks` | GET | List published weeks |
| `/api/weeks/current` | GET | Get active week |
| `/api/weeks/:id` | GET | Week detail (lessons + sources) |
| `/api/admin/weeks` | GET/POST | Admin week CRUD |
| `/api/admin/weeks/:id` | PATCH/DELETE | Admin week update/delete |
| `/api/admin/data-sources/upload` | POST | Upload file (multipart) |
| `/api/admin/weeks/:weekId/data-sources` | GET | List sources for week |
| `/api/admin/data-sources/:id/status` | GET | Poll processing status |
| `/api/admin/data-sources/:id/chunks` | GET | View document chunks |
| `/api/rag/search` | POST | Search knowledge base |
| `/api/admin/rag/stats` | GET | Vector store statistics |
| `/api/admin/ai-generation` | POST | Request content generation |
| `/api/admin/ai-generation/:id` | GET | Get generation status |
| `/api/admin/weeks/:weekId/generations` | GET | Generation history |
| `/api/agent/conversations` | GET | List conversations |
| `/api/agent/conversations/:id` | GET | Get conversation + messages |
| `/api/agent/conversations/:id/messages` | POST | Send message (streaming response) |

---

## 9. DATABASE MIGRATION (Frontend-Relevant Schema)

New migration `004_weeks_and_rag_schema.sql` adds: `weeks`, `week_lessons`, `data_sources`, `document_chunks`, `embedding_vectors`, `ai_generation_requests`, `agent_conversations`, `agent_messages` tables.

---

**Total New Files**: ~35 frontend files (5 types + 5 services + 5 hooks + 24 components/pages)
**Modified Files**: 4 (App.tsx, AppShell.tsx, AdminLayout.tsx, AdminDashboardPage.tsx)
**Phases**: 5 sequential phases, each independently testable
