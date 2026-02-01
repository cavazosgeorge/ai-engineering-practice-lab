import { nanoid } from "nanoid";
import { db, type GenerationJobRow } from "../db";

export type JobType = "vocabulary" | "quiz" | "challenge";
export type JobStatus = "pending" | "running" | "completed" | "failed";

export interface CreateJobInput {
  weekId: string;
  jobType: JobType;
  prompt?: string;
}

export interface UpdateJobInput {
  status?: JobStatus;
  result?: string;
  modelName?: string;
  inputTokenCount?: number;
  outputTokenCount?: number;
  errorMessage?: string;
}

export function createGenerationJob(input: CreateJobInput): GenerationJobRow {
  const id = nanoid();
  const now = new Date().toISOString();

  db.run(
    `INSERT INTO generation_jobs (id, week_id, job_type, status, prompt, created_at, updated_at)
     VALUES (?, ?, ?, 'pending', ?, ?, ?)`,
    [id, input.weekId, input.jobType, input.prompt ?? null, now, now]
  );

  return db
    .query<GenerationJobRow, [string]>(
      `SELECT * FROM generation_jobs WHERE id = ?`
    )
    .get(id)!;
}

export function getGenerationJob(id: string): GenerationJobRow | null {
  return (
    db
      .query<GenerationJobRow, [string]>(
        `SELECT * FROM generation_jobs WHERE id = ?`
      )
      .get(id) ?? null
  );
}

export function getGenerationJobsByWeek(weekId: string): GenerationJobRow[] {
  return db
    .query<GenerationJobRow, [string]>(
      `SELECT * FROM generation_jobs WHERE week_id = ? ORDER BY created_at DESC`
    )
    .all(weekId);
}

export function getAllGenerationJobs(): GenerationJobRow[] {
  return db
    .query<GenerationJobRow, []>(
      `SELECT * FROM generation_jobs ORDER BY created_at DESC LIMIT 50`
    )
    .all();
}

export function updateGenerationJob(
  id: string,
  input: UpdateJobInput
): GenerationJobRow | null {
  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (input.status !== undefined) {
    updates.push("status = ?");
    values.push(input.status);
  }
  if (input.result !== undefined) {
    updates.push("result = ?");
    values.push(input.result);
  }
  if (input.modelName !== undefined) {
    updates.push("model_name = ?");
    values.push(input.modelName);
  }
  if (input.inputTokenCount !== undefined) {
    updates.push("input_token_count = ?");
    values.push(input.inputTokenCount);
  }
  if (input.outputTokenCount !== undefined) {
    updates.push("output_token_count = ?");
    values.push(input.outputTokenCount);
  }
  if (input.errorMessage !== undefined) {
    updates.push("error_message = ?");
    values.push(input.errorMessage);
  }

  if (updates.length === 0) return getGenerationJob(id);

  updates.push("updated_at = ?");
  values.push(new Date().toISOString());

  db.run(
    `UPDATE generation_jobs SET ${updates.join(", ")} WHERE id = ?`,
    [...values, id]
  );

  return getGenerationJob(id);
}

export function deleteGenerationJob(id: string): boolean {
  const result = db.run(`DELETE FROM generation_jobs WHERE id = ?`, [id]);
  return result.changes > 0;
}
