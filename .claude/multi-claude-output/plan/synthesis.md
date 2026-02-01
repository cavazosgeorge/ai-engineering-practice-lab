The unified capstone implementation plan is written to `CAPSTONE_PLAN.md` at the project root. Here's a summary of what it contains:

## 6 Phases, ~72 new files, ~444 new tests

**Phase 1: Schema + Utilities** (Low-Medium complexity)
- 2 SQL migrations (7 new tables), embedding math utilities, OpenAI client wrapper
- ~37 tests. No user-facing changes.

**Phase 2: Weeks System** (Medium) -- can run parallel with Phase 3
- Week CRUD (admin + public), 14 frontend files, seed script
- ~70 tests. Students browse by week, admin manages weeks.

**Phase 3: RAG Pipeline** (High) -- can run parallel with Phase 2
- Data source upload, text chunking, embedding generation, semantic search
- SQLite BLOB vector storage with brute-force cosine similarity
- ~165 tests. Heaviest infrastructure phase.

**Phase 4: AI Content Generation** (Medium-High)
- Generate vocabulary/quizzes from RAG context via LLM
- Staging/review/publish workflow for admin quality control
- ~54 tests. Depends on Phases 2+3.

**Phase 5: Agent Chat** (High)
- SSE streaming chat with 5 OpenAI function-calling tools
- Tool-call visualization, source citations, conversation history
- ~68 tests. Most complex user-facing feature.

**Phase 6: Integration + Polish** (Medium)
- Navigation wiring, cross-feature flows, accessibility, responsive audit
- ~50 tests. No new files, just modifications.

Key decisions: SQLite BLOBs for vectors (no external vector DB), SSE for agent streaming, soft FK for week-lesson link, OpenAI via native fetch, content approval workflow before student visibility.

The plan also flags 3 existing bugs in vocabulary code that should be fixed in Phase 1, and lists high-risk edge cases (chunking infinite loops, path traversal, agent tool loop guards) that must be addressed during implementation.

To copy the plan to `.claude/multi-claude-output/plan/synthesis.md`, run:
```
cp CAPSTONE_PLAN.md .claude/multi-claude-output/plan/synthesis.md
```
