const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface AdminStats {
  lessonCount: number;
  vocabularyCount: number;
  challengeCount: number;
  weekCount: number;
}

export interface AdminLesson {
  id: string;
  title: string;
  slug: string;
  termCount: number;
}

export interface AdminVocabularyTerm {
  id: string;
  lesson_id: string;
  lesson_title: string;
  lesson_slug: string;
  term: string;
  definition: string;
  context: string | null;
  difficulty: "beginner" | "intermediate" | "advanced";
  order_index: number;
}

export interface CreateVocabularyTermInput {
  lesson_id: string;
  term: string;
  definition: string;
  context?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
}

export interface UpdateVocabularyTermInput {
  term?: string;
  definition?: string;
  context?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await fetch(`${API_URL}/api/admin/stats`, {
    credentials: "include",
  });
  return handleResponse<AdminStats>(res);
}

export async function fetchAdminLessons(): Promise<AdminLesson[]> {
  const res = await fetch(`${API_URL}/api/admin/lessons`, {
    credentials: "include",
  });
  return handleResponse<AdminLesson[]>(res);
}

export async function fetchAdminVocabularyTerms(): Promise<AdminVocabularyTerm[]> {
  const res = await fetch(`${API_URL}/api/admin/vocabulary/terms`, {
    credentials: "include",
  });
  return handleResponse<AdminVocabularyTerm[]>(res);
}

export async function fetchAdminVocabularyTerm(id: string): Promise<AdminVocabularyTerm> {
  const res = await fetch(`${API_URL}/api/admin/vocabulary/terms/${id}`, {
    credentials: "include",
  });
  return handleResponse<AdminVocabularyTerm>(res);
}

export async function createVocabularyTerm(
  input: CreateVocabularyTermInput
): Promise<AdminVocabularyTerm> {
  const res = await fetch(`${API_URL}/api/admin/vocabulary/terms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  return handleResponse<AdminVocabularyTerm>(res);
}

export async function updateVocabularyTerm(
  id: string,
  input: UpdateVocabularyTermInput
): Promise<AdminVocabularyTerm> {
  const res = await fetch(`${API_URL}/api/admin/vocabulary/terms/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  return handleResponse<AdminVocabularyTerm>(res);
}

export async function deleteVocabularyTerm(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/vocabulary/terms/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Delete failed" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }
}

// ============================================================================
// Admin Week Types
// ============================================================================

export interface AdminWeek {
  id: string;
  weekNumber: number;
  slug: string;
  title: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  isPublished: boolean;
  orderIndex: number;
  lessonCount: number;
  vocabularyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWeekInput {
  weekNumber: number;
  title: string;
  slug: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isPublished?: boolean;
}

export interface UpdateWeekInput {
  weekNumber?: number;
  title?: string;
  slug?: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isPublished?: boolean;
  orderIndex?: number;
  lessonIds?: string[];
}

// ============================================================================
// Admin Week API Functions
// ============================================================================

export async function fetchAdminWeeks(): Promise<AdminWeek[]> {
  const res = await fetch(`${API_URL}/api/admin/weeks`, {
    credentials: "include",
  });
  return handleResponse<AdminWeek[]>(res);
}

export async function createWeek(input: CreateWeekInput): Promise<AdminWeek> {
  const res = await fetch(`${API_URL}/api/admin/weeks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  return handleResponse<AdminWeek>(res);
}

export async function updateWeek(
  id: string,
  input: UpdateWeekInput
): Promise<AdminWeek> {
  const res = await fetch(`${API_URL}/api/admin/weeks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  return handleResponse<AdminWeek>(res);
}

export async function deleteWeek(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/admin/weeks/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Delete failed" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }
}

// ============================================================================
// Data Source Types
// ============================================================================

export interface DataSource {
  id: string;
  weekId: string;
  sourceType: "pdf" | "url" | "text";
  title: string;
  url: string | null;
  status: "pending" | "processing" | "processed" | "error";
  errorMessage: string | null;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DataSourceDetail extends DataSource {
  rawContent: string | null;
  chunks: Array<{
    id: string;
    chunkIndex: number;
    content: string;
    tokenCount: number;
  }>;
}

export interface DataSourceStats {
  totalSources: number;
  totalChunks: number;
  byStatus: Record<string, number>;
}

export interface IngestTextInput {
  weekId: string;
  weekSlug: string;
  title: string;
  content: string;
}

export interface IngestURLInput {
  weekId: string;
  weekSlug: string;
  title: string;
  url: string;
}

export interface IngestResult {
  id: string;
  status: string;
  chunkCount?: number;
  error?: string;
}

// ============================================================================
// Data Source API Functions
// ============================================================================

export async function fetchDataSources(weekId: string): Promise<DataSource[]> {
  const res = await fetch(`${API_URL}/api/admin/data-sources/${weekId}`, {
    credentials: "include",
  });
  return handleResponse<DataSource[]>(res);
}

export async function fetchDataSourceDetail(
  sourceId: string
): Promise<DataSourceDetail> {
  const res = await fetch(
    `${API_URL}/api/admin/data-sources/detail/${sourceId}`,
    { credentials: "include" }
  );
  return handleResponse<DataSourceDetail>(res);
}

export async function fetchDataSourceStats(
  weekId: string
): Promise<DataSourceStats> {
  const res = await fetch(
    `${API_URL}/api/admin/data-sources/${weekId}/stats`,
    { credentials: "include" }
  );
  return handleResponse<DataSourceStats>(res);
}

export async function ingestText(input: IngestTextInput): Promise<IngestResult> {
  const res = await fetch(`${API_URL}/api/admin/data-sources/ingest/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  return handleResponse<IngestResult>(res);
}

export async function ingestURL(input: IngestURLInput): Promise<IngestResult> {
  const res = await fetch(`${API_URL}/api/admin/data-sources/ingest/url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  return handleResponse<IngestResult>(res);
}

export async function ingestPDF(formData: FormData): Promise<IngestResult> {
  const res = await fetch(`${API_URL}/api/admin/data-sources/ingest/pdf`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  return handleResponse<IngestResult>(res);
}

export async function deleteDataSource(sourceId: string): Promise<void> {
  const res = await fetch(
    `${API_URL}/api/admin/data-sources/${sourceId}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Delete failed" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }
}

// ============================================================================
// RAG Stats Types & API
// ============================================================================

export interface RAGStats {
  totalChunks: number;
  totalIndexes: number;
  indexes: Array<{
    weekSlug: string;
    chunkCount: number;
    indexSizeBytes: number;
  }>;
}

export async function fetchRAGStats(): Promise<RAGStats> {
  const res = await fetch(`${API_URL}/api/rag/stats`, {
    credentials: "include",
  });
  return handleResponse<RAGStats>(res);
}
