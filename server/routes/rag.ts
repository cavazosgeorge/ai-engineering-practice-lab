import { Hono } from "hono";
import { requireAdmin } from "../middleware/auth";
import {
  forwardRequest,
  PythonServiceError,
} from "../services/python-service-client";

const app = new Hono();

/**
 * POST /api/rag/search
 * Public: Semantic search over the knowledge base
 */
app.post("/search", async (c) => {
  const body = await c.req.json<{
    query: string;
    weekSlug?: string;
    topK?: number;
  }>();

  if (!body.query?.trim()) {
    return c.json({ error: "query is required" }, 400);
  }

  try {
    const result = await forwardRequest<{
      results: Array<{
        chunk_id: string;
        source_id: string;
        content: string;
        score: number;
        metadata: Record<string, unknown>;
      }>;
      query: string;
      week_slug: string | null;
    }>("/search", {
      method: "POST",
      body: {
        query: body.query,
        week_slug: body.weekSlug ?? null,
        top_k: body.topK ?? 5,
      },
    });

    return c.json({
      results: result.results.map((r) => ({
        chunkId: r.chunk_id,
        sourceId: r.source_id,
        content: r.content,
        score: r.score,
        metadata: r.metadata,
      })),
      query: result.query,
      weekSlug: result.week_slug,
    });
  } catch (error) {
    if (error instanceof PythonServiceError) {
      return c.json({ error: error.message }, error.statusCode);
    }
    return c.json({ error: "Search service unavailable" }, 503);
  }
});

/**
 * GET /api/admin/rag/stats
 * Admin: Get vector store statistics
 */
app.get("/stats", requireAdmin, async (c) => {
  try {
    const stats = await forwardRequest<{
      total_chunks: number;
      total_indexes: number;
      indexes: Array<{
        week_slug: string;
        chunk_count: number;
        index_size_bytes: number;
      }>;
    }>("/stats");

    return c.json({
      totalChunks: stats.total_chunks,
      totalIndexes: stats.total_indexes,
      indexes: stats.indexes.map((idx) => ({
        weekSlug: idx.week_slug,
        chunkCount: idx.chunk_count,
        indexSizeBytes: idx.index_size_bytes,
      })),
    });
  } catch (error) {
    if (error instanceof PythonServiceError) {
      return c.json({ error: error.message }, error.statusCode);
    }
    return c.json({ error: "RAG service unavailable" }, 503);
  }
});

export default app;
