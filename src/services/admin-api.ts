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
