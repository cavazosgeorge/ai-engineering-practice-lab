import { Hono } from "hono";
import { requireAdmin } from "../middleware/auth";
import {
  createGenerationJob,
  getGenerationJob,
  getGenerationJobsByWeek,
  getAllGenerationJobs,
  updateGenerationJob,
  deleteGenerationJob,
} from "../services/generation-job-service";
import { forwardRequest, PythonServiceError } from "../services/python-service-client";
import { db } from "../db";

interface PythonGenerateVocabularyResponse {
  terms: Array<{
    term: string;
    definition: string;
    context: string | null;
    difficulty: string;
  }>;
  model: string;
  input_tokens: number | null;
  output_tokens: number | null;
}

interface PythonGenerateQuizResponse {
  questions: Array<{
    question: string;
    options: Array<{ text: string; is_correct: boolean }>;
    explanation: string;
    difficulty: string;
  }>;
  model: string;
  input_tokens: number | null;
  output_tokens: number | null;
}

interface PythonGenerateChallengeResponse {
  challenges: Array<{
    title: string;
    description: string;
    starter_code: string;
    test_code: string;
    difficulty: string;
  }>;
  model: string;
  input_tokens: number | null;
  output_tokens: number | null;
}

const app = new Hono();

// All generation routes require admin
app.use("*", requireAdmin);

/**
 * POST /api/admin/ai-generation/generate
 * Create a generation job and forward to Python service
 */
app.post("/generate", async (c) => {
  const body = await c.req.json<{
    weekId: string;
    weekSlug: string;
    jobType: "vocabulary" | "quiz" | "challenge";
    count?: number;
    temperature?: number;
    existingTerms?: string[];
    existingQuestions?: string[];
    existingTitles?: string[];
  }>();

  const { weekId, weekSlug, jobType, count = 10, temperature = 0.7 } = body;

  // Create job in SQLite
  const job = createGenerationJob({
    weekId,
    jobType,
    prompt: JSON.stringify({ weekSlug, count, temperature }),
  });

  // Update to running
  updateGenerationJob(job.id, { status: "running" });

  try {
    let result: string;
    let model: string;
    let inputTokens: number | null = null;
    let outputTokens: number | null = null;

    if (jobType === "vocabulary") {
      const response = await forwardRequest<PythonGenerateVocabularyResponse>(
        "/generate/vocabulary",
        {
          method: "POST",
          body: {
            week_slug: weekSlug,
            count,
            existing_terms: body.existingTerms || [],
            temperature,
          },
          timeout: 120000,
        }
      );
      result = JSON.stringify(response.terms);
      model = response.model;
      inputTokens = response.input_tokens;
      outputTokens = response.output_tokens;
    } else if (jobType === "quiz") {
      const response = await forwardRequest<PythonGenerateQuizResponse>(
        "/generate/quiz",
        {
          method: "POST",
          body: {
            week_slug: weekSlug,
            count,
            existing_questions: body.existingQuestions || [],
            temperature,
          },
          timeout: 120000,
        }
      );
      result = JSON.stringify(response.questions);
      model = response.model;
      inputTokens = response.input_tokens;
      outputTokens = response.output_tokens;
    } else {
      const response = await forwardRequest<PythonGenerateChallengeResponse>(
        "/generate/challenges",
        {
          method: "POST",
          body: {
            week_slug: weekSlug,
            count,
            existing_titles: body.existingTitles || [],
            temperature,
          },
          timeout: 120000,
        }
      );
      result = JSON.stringify(response.challenges);
      model = response.model;
      inputTokens = response.input_tokens;
      outputTokens = response.output_tokens;
    }

    // Update job with results
    const updated = updateGenerationJob(job.id, {
      status: "completed",
      result,
      modelName: model,
      inputTokenCount: inputTokens ?? undefined,
      outputTokenCount: outputTokens ?? undefined,
    });

    return c.json(formatJob(updated!));
  } catch (error) {
    const message =
      error instanceof PythonServiceError
        ? error.message
        : error instanceof Error
        ? error.message
        : "Generation failed";

    updateGenerationJob(job.id, {
      status: "failed",
      errorMessage: message,
    });

    const statusCode =
      error instanceof PythonServiceError ? error.statusCode : 500;
    return c.json({ error: message, jobId: job.id }, statusCode as 500);
  }
});

/**
 * GET /api/admin/ai-generation/jobs
 * List all generation jobs (most recent first)
 */
app.get("/jobs", (c) => {
  const weekId = c.req.query("weekId");
  const jobs = weekId
    ? getGenerationJobsByWeek(weekId)
    : getAllGenerationJobs();
  return c.json(jobs.map(formatJob));
});

/**
 * GET /api/admin/ai-generation/jobs/:jobId
 * Get a specific generation job
 */
app.get("/jobs/:jobId", (c) => {
  const jobId = c.req.param("jobId");
  const job = getGenerationJob(jobId);
  if (!job) {
    return c.json({ error: "Job not found" }, 404);
  }
  return c.json(formatJob(job));
});

/**
 * POST /api/admin/ai-generation/jobs/:jobId/approve
 * Approve generated items — save them to the appropriate tables
 */
app.post("/jobs/:jobId/approve", async (c) => {
  const jobId = c.req.param("jobId");
  const job = getGenerationJob(jobId);

  if (!job) {
    return c.json({ error: "Job not found" }, 404);
  }
  if (job.status !== "completed" || !job.result) {
    return c.json({ error: "Job is not completed or has no results" }, 400);
  }

  const body = await c.req.json<{
    lessonId: string;
    selectedIndices?: number[];
  }>();

  const { lessonId, selectedIndices } = body;
  const items = JSON.parse(job.result);

  if (job.job_type === "vocabulary") {
    const terms = selectedIndices
      ? items.filter((_: unknown, i: number) => selectedIndices.includes(i))
      : items;

    const { nanoid } = await import("nanoid");

    let inserted = 0;
    db.transaction(() => {
      for (const term of terms) {
        const id = nanoid();
        try {
          db.run(
            `INSERT INTO vocabulary_terms (id, lesson_id, term, definition, context, difficulty, order_index)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              lessonId,
              term.term,
              term.definition,
              term.context || null,
              term.difficulty || "intermediate",
              0,
            ]
          );
          inserted++;
        } catch {
          // Skip duplicates (unique constraint on lesson_id + term)
        }
      }
    })();

    return c.json({ approved: inserted, jobId });
  }

  // Quiz and challenge approval can be added later
  return c.json({ error: `Approval for ${job.job_type} not yet implemented` }, 501);
});

/**
 * DELETE /api/admin/ai-generation/jobs/:jobId
 * Delete a generation job
 */
app.delete("/jobs/:jobId", (c) => {
  const jobId = c.req.param("jobId");
  const deleted = deleteGenerationJob(jobId);
  if (!deleted) {
    return c.json({ error: "Job not found" }, 404);
  }
  return c.json({ deleted: true });
});

// Helpers

function formatJob(job: {
  id: string;
  week_id: string;
  created_by: string | null;
  job_type: string;
  status: string;
  prompt: string | null;
  result: string | null;
  model_name: string | null;
  input_token_count: number | null;
  output_token_count: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}) {
  return {
    id: job.id,
    weekId: job.week_id,
    jobType: job.job_type,
    status: job.status,
    prompt: job.prompt,
    result: job.result ? JSON.parse(job.result) : null,
    modelName: job.model_name,
    inputTokenCount: job.input_token_count,
    outputTokenCount: job.output_token_count,
    errorMessage: job.error_message,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
  };
}

export default app;
