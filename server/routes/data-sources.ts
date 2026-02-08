import { Hono } from "hono";
import { requireAdmin } from "../middleware/auth";
import {
  createDataSource,
  getDataSource,
  getDataSourcesByWeek,
  updateDataSourceStatus,
  deleteDataSource,
  saveChunks,
  getChunksBySource,
  getDataSourceStats,
} from "../services/data-source-service";
import {
  forwardRequest,
  forwardFileUpload,
  PythonServiceError,
} from "../services/python-service-client";

const app = new Hono();

// All data source routes require admin
app.use("*", requireAdmin);

/**
 * GET /api/admin/data-sources/:weekId
 * List all data sources for a week
 */
app.get("/:weekId", (c) => {
  const weekId = c.req.param("weekId");
  const sources = getDataSourcesByWeek(weekId);
  return c.json(
    sources.map((s) => ({
      id: s.id,
      weekId: s.week_id,
      sourceType: s.source_type,
      title: s.title,
      url: s.url,
      status: s.status,
      errorMessage: s.error_message,
      chunkCount: s.chunk_count,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }))
  );
});

/**
 * GET /api/admin/data-sources/:weekId/stats
 * Get data source statistics for a week
 */
app.get("/:weekId/stats", (c) => {
  const weekId = c.req.param("weekId");
  const stats = getDataSourceStats(weekId);
  return c.json(stats);
});

/**
 * GET /api/admin/data-sources/detail/:sourceId
 * Get a single data source with its chunks
 */
app.get("/detail/:sourceId", (c) => {
  const sourceId = c.req.param("sourceId");
  const source = getDataSource(sourceId);

  if (!source) {
    return c.json({ error: "Data source not found" }, 404);
  }

  const chunks = getChunksBySource(sourceId);

  return c.json({
    id: source.id,
    weekId: source.week_id,
    sourceType: source.source_type,
    title: source.title,
    url: source.url,
    rawContent: source.raw_content,
    status: source.status,
    errorMessage: source.error_message,
    chunkCount: source.chunk_count,
    createdAt: source.created_at,
    updatedAt: source.updated_at,
    chunks: chunks.map((ch) => ({
      id: ch.id,
      chunkIndex: ch.chunk_index,
      content: ch.content,
      tokenCount: ch.token_count,
    })),
  });
});

/**
 * POST /api/admin/data-sources/ingest/text
 * Ingest plain text content
 */
app.post("/ingest/text", async (c) => {
  const body = await c.req.json<{
    weekId: string;
    weekSlug: string;
    title: string;
    content: string;
  }>();

  if (!body.weekId || !body.weekSlug || !body.title || !body.content) {
    return c.json(
      { error: "Missing required fields: weekId, weekSlug, title, content" },
      400
    );
  }

  // Create metadata in SQLite
  const source = createDataSource({
    weekId: body.weekId,
    sourceType: "text",
    title: body.title,
    rawContent: body.content,
  });

  // Update status to processing
  updateDataSourceStatus(source.id, "processing");

  try {
    // Forward to Python service for RAG processing
    const result = await forwardRequest<{
      source_id: string;
      status: string;
      chunk_count: number;
      chunks: Array<{
        chunk_index: number;
        content: string;
        token_count: number;
        metadata: Record<string, unknown>;
      }>;
      error?: string;
    }>("/sources/ingest/text", {
      method: "POST",
      body: {
        week_slug: body.weekSlug,
        source_id: source.id,
        title: body.title,
        content: body.content,
      },
      timeout: 180000,
    });

    if (result.status === "error") {
      updateDataSourceStatus(source.id, "error", {
        errorMessage: result.error || "Processing failed",
      });
      return c.json(
        {
          id: source.id,
          status: "error",
          error: result.error || "Processing failed",
        },
        500
      );
    }

    // Save chunks to SQLite for display
    saveChunks(
      source.id,
      result.chunks.map((ch) => ({
        chunkIndex: ch.chunk_index,
        content: ch.content,
        tokenCount: ch.token_count,
        metadata: ch.metadata,
      }))
    );

    // Update status to processed
    updateDataSourceStatus(source.id, "processed", {
      chunkCount: result.chunk_count,
    });

    return c.json(
      {
        id: source.id,
        status: "processed",
        chunkCount: result.chunk_count,
      },
      201
    );
  } catch (error) {
    const message =
      error instanceof PythonServiceError
        ? error.message
        : "Python service unavailable";
    updateDataSourceStatus(source.id, "error", { errorMessage: message });
    const status = error instanceof PythonServiceError ? error.statusCode : 503;
    return c.json({ id: source.id, status: "error", error: message }, status);
  }
});

/**
 * POST /api/admin/data-sources/ingest/url
 * Ingest content from a URL
 */
app.post("/ingest/url", async (c) => {
  const body = await c.req.json<{
    weekId: string;
    weekSlug: string;
    title: string;
    url: string;
  }>();

  if (!body.weekId || !body.weekSlug || !body.title || !body.url) {
    return c.json(
      { error: "Missing required fields: weekId, weekSlug, title, url" },
      400
    );
  }

  const source = createDataSource({
    weekId: body.weekId,
    sourceType: "url",
    title: body.title,
    url: body.url,
  });

  updateDataSourceStatus(source.id, "processing");

  try {
    const result = await forwardRequest<{
      source_id: string;
      status: string;
      chunk_count: number;
      chunks: Array<{
        chunk_index: number;
        content: string;
        token_count: number;
        metadata: Record<string, unknown>;
      }>;
      error?: string;
    }>("/sources/ingest/url", {
      method: "POST",
      body: {
        week_slug: body.weekSlug,
        source_id: source.id,
        title: body.title,
        url: body.url,
      },
      timeout: 180000,
    });

    if (result.status === "error") {
      updateDataSourceStatus(source.id, "error", {
        errorMessage: result.error || "Processing failed",
      });
      return c.json(
        { id: source.id, status: "error", error: result.error },
        500
      );
    }

    saveChunks(
      source.id,
      result.chunks.map((ch) => ({
        chunkIndex: ch.chunk_index,
        content: ch.content,
        tokenCount: ch.token_count,
        metadata: ch.metadata,
      }))
    );

    updateDataSourceStatus(source.id, "processed", {
      chunkCount: result.chunk_count,
    });

    return c.json(
      { id: source.id, status: "processed", chunkCount: result.chunk_count },
      201
    );
  } catch (error) {
    const message =
      error instanceof PythonServiceError
        ? error.message
        : "Python service unavailable";
    updateDataSourceStatus(source.id, "error", { errorMessage: message });
    const status = error instanceof PythonServiceError ? error.statusCode : 503;
    return c.json({ id: source.id, status: "error", error: message }, status);
  }
});

/**
 * POST /api/admin/data-sources/ingest/pdf
 * Ingest a PDF file upload
 */
app.post("/ingest/pdf", async (c) => {
  const formData = await c.req.formData();
  const weekId = formData.get("weekId") as string;
  const weekSlug = formData.get("weekSlug") as string;
  const title = formData.get("title") as string;
  const file = formData.get("file") as File | null;

  if (!weekId || !weekSlug || !title || !file) {
    return c.json(
      { error: "Missing required fields: weekId, weekSlug, title, file" },
      400
    );
  }

  const source = createDataSource({
    weekId,
    sourceType: "pdf",
    title,
  });

  updateDataSourceStatus(source.id, "processing");

  try {
    // Forward file to Python service
    const pythonForm = new FormData();
    pythonForm.append("week_slug", weekSlug);
    pythonForm.append("source_id", source.id);
    pythonForm.append("title", title);
    pythonForm.append("file", file);

    const result = await forwardFileUpload<{
      source_id: string;
      status: string;
      chunk_count: number;
      chunks: Array<{
        chunk_index: number;
        content: string;
        token_count: number;
        metadata: Record<string, unknown>;
      }>;
      error?: string;
    }>("/sources/ingest/pdf", pythonForm, 180000);

    if (result.status === "error") {
      updateDataSourceStatus(source.id, "error", {
        errorMessage: result.error || "Processing failed",
      });
      return c.json(
        { id: source.id, status: "error", error: result.error },
        500
      );
    }

    saveChunks(
      source.id,
      result.chunks.map((ch) => ({
        chunkIndex: ch.chunk_index,
        content: ch.content,
        tokenCount: ch.token_count,
        metadata: ch.metadata,
      }))
    );

    updateDataSourceStatus(source.id, "processed", {
      chunkCount: result.chunk_count,
    });

    return c.json(
      { id: source.id, status: "processed", chunkCount: result.chunk_count },
      201
    );
  } catch (error) {
    const message =
      error instanceof PythonServiceError
        ? error.message
        : "Python service unavailable";
    updateDataSourceStatus(source.id, "error", { errorMessage: message });
    const status = error instanceof PythonServiceError ? error.statusCode : 503;
    return c.json({ id: source.id, status: "error", error: message }, status);
  }
});

/**
 * DELETE /api/admin/data-sources/:sourceId
 * Delete a data source and its chunks from both SQLite and FAISS
 */
app.delete("/:sourceId", async (c) => {
  const sourceId = c.req.param("sourceId");
  const source = getDataSource(sourceId);

  if (!source) {
    return c.json({ error: "Data source not found" }, 404);
  }

  // Get week slug for FAISS cleanup
  const weekRow = (await import("../db")).db
    .query<{ slug: string }, [string]>(
      `SELECT w.slug FROM weeks w
       INNER JOIN data_sources ds ON ds.week_id = w.id
       WHERE ds.id = ?`
    )
    .get(sourceId);

  // Try to remove from Python/FAISS (non-blocking — source may not have been indexed)
  if (weekRow) {
    try {
      await forwardRequest(`/sources/${sourceId}?week_slug=${weekRow.slug}`, {
        method: "DELETE",
      });
    } catch {
      // FAISS cleanup failure shouldn't block SQLite delete
    }
  }

  // Delete from SQLite (CASCADE handles chunks)
  deleteDataSource(sourceId);

  return c.json({ success: true });
});

export default app;
