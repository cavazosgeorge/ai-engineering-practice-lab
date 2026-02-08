import { nanoid } from "nanoid";
import { db, type DataSourceRow, type ChunkRow } from "../db";

// ============================================
// Data Source CRUD
// ============================================

export interface CreateDataSourceInput {
  weekId: string;
  sourceType: "pdf" | "url" | "text";
  title: string;
  url?: string | null;
  rawContent?: string | null;
}

export function createDataSource(input: CreateDataSourceInput): DataSourceRow {
  const id = nanoid();
  const now = new Date().toISOString();

  db.run(
    `INSERT INTO data_sources (id, week_id, source_type, title, url, raw_content, status, chunk_count, metadata, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, '{}', ?, ?)`,
    [
      id,
      input.weekId,
      input.sourceType,
      input.title,
      input.url ?? null,
      input.rawContent ?? null,
      now,
      now,
    ]
  );

  return db
    .query<DataSourceRow, [string]>(`SELECT * FROM data_sources WHERE id = ?`)
    .get(id)!;
}

export function getDataSource(id: string): DataSourceRow | null {
  return (
    db
      .query<DataSourceRow, [string]>(
        `SELECT * FROM data_sources WHERE id = ?`
      )
      .get(id) ?? null
  );
}

export function getDataSourcesByWeek(weekId: string): DataSourceRow[] {
  return db
    .query<DataSourceRow, [string]>(
      `SELECT * FROM data_sources WHERE week_id = ? ORDER BY created_at DESC`
    )
    .all(weekId);
}

export function updateDataSourceStatus(
  id: string,
  status: "pending" | "processing" | "processed" | "error",
  options?: {
    chunkCount?: number;
    errorMessage?: string | null;
  }
): DataSourceRow | null {
  const now = new Date().toISOString();
  const updates: string[] = ["status = ?", "updated_at = ?"];
  const values: (string | number | null)[] = [status, now];

  if (options?.chunkCount !== undefined) {
    updates.push("chunk_count = ?");
    values.push(options.chunkCount);
  }
  if (options?.errorMessage !== undefined) {
    updates.push("error_message = ?");
    values.push(options.errorMessage);
  }

  values.push(id);

  db.run(
    `UPDATE data_sources SET ${updates.join(", ")} WHERE id = ?`,
    values
  );

  return getDataSource(id);
}

export function deleteDataSource(id: string): boolean {
  const result = db.run(`DELETE FROM data_sources WHERE id = ?`, [id]);
  return result.changes > 0;
}

// ============================================
// Chunk Storage (for display/reference)
// ============================================

export function saveChunks(
  dataSourceId: string,
  chunks: Array<{
    chunkIndex: number;
    content: string;
    tokenCount: number;
    metadata?: Record<string, unknown>;
  }>
): void {
  const now = new Date().toISOString();

  db.transaction(() => {
    // Clear existing chunks for this source
    db.run(`DELETE FROM chunks WHERE data_source_id = ?`, [dataSourceId]);

    for (const chunk of chunks) {
      db.run(
        `INSERT INTO chunks (id, data_source_id, chunk_index, content, token_count, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          nanoid(),
          dataSourceId,
          chunk.chunkIndex,
          chunk.content,
          chunk.tokenCount,
          JSON.stringify(chunk.metadata ?? {}),
          now,
        ]
      );
    }
  })();
}

export function getChunksBySource(dataSourceId: string): ChunkRow[] {
  return db
    .query<ChunkRow, [string]>(
      `SELECT * FROM chunks WHERE data_source_id = ? ORDER BY chunk_index ASC`
    )
    .all(dataSourceId);
}

// ============================================
// Admin Stats
// ============================================

export function getDataSourceStats(weekId: string): {
  totalSources: number;
  totalChunks: number;
  byStatus: Record<string, number>;
} {
  const totalSources =
    db
      .query<{ count: number }, [string]>(
        `SELECT COUNT(*) as count FROM data_sources WHERE week_id = ?`
      )
      .get(weekId)?.count ?? 0;

  const totalChunks =
    db
      .query<{ count: number }, [string]>(
        `SELECT COUNT(*) as count FROM chunks c
         INNER JOIN data_sources ds ON c.data_source_id = ds.id
         WHERE ds.week_id = ?`
      )
      .get(weekId)?.count ?? 0;

  const statusRows = db
    .query<{ status: string; count: number }, [string]>(
      `SELECT status, COUNT(*) as count FROM data_sources WHERE week_id = ? GROUP BY status`
    )
    .all(weekId);

  const byStatus: Record<string, number> = {};
  for (const row of statusRows) {
    byStatus[row.status] = row.count;
  }

  return { totalSources, totalChunks, byStatus };
}
