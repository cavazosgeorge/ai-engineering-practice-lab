const API_BASE = "/api";

export interface Lesson {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  orderIndex: number;
  concepts: Concept[];
}

export interface Concept {
  id: string;
  lessonId: string;
  title: string;
  explanation: string | null;
  orderIndex: number;
  challenges: Challenge[];
}

export interface Challenge {
  id: string;
  conceptId: string;
  type: "implement" | "explain" | "compare" | "multiple_choice";
  title: string;
  description: string;
  starterCode: string | null;
  hints: string[] | null;
  difficulty: "beginner" | "intermediate" | "advanced";
  orderIndex: number;
  testCases?: TestCase[];
  concept?: Concept & { lesson?: Lesson };
  lastSubmission?: { code: string; passed: boolean } | null;
  modelAnswer?: string | null;
}

export interface TestCase {
  id: string;
  input: unknown;
  expectedOutput: unknown;
  description: string | null;
}

export interface TestResult {
  testId: string;
  passed: boolean;
  actual?: unknown;
  expected?: unknown;
  error?: string;
}

export interface SubmissionResult {
  passed: boolean;
  results: TestResult[];
  executionTimeMs: number;
}

export interface UserProgress {
  id: string;
  challengeId: string;
  masteryLevel: "learning" | "reviewing" | "mastered";
  nextReviewDate: string | null;
  repetitions: number;
  challenge: Challenge;
}

export interface ProgressStats {
  total: number;
  mastered: number;
  reviewing: number;
  learning: number;
}

// Session management (simple localStorage-based)
export function getSessionId(): string {
  let sessionId = localStorage.getItem("sessionId");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("sessionId", sessionId);
  }
  return sessionId;
}

// API functions
export async function fetchLessons(): Promise<Lesson[]> {
  const res = await fetch(`${API_BASE}/lessons`);
  if (!res.ok) throw new Error("Failed to fetch lessons");
  return res.json();
}

export async function fetchLesson(slug: string): Promise<Lesson> {
  const res = await fetch(`${API_BASE}/lessons/${slug}`);
  if (!res.ok) throw new Error("Failed to fetch lesson");
  return res.json();
}

export async function fetchChallenge(id: string): Promise<Challenge> {
  const sessionId = getSessionId();
  const res = await fetch(`${API_BASE}/challenges/${id}?sessionId=${sessionId}`);
  if (!res.ok) throw new Error("Failed to fetch challenge");
  return res.json();
}

// Record a submission result for progress tracking (code executed client-side)
export async function recordSubmission(
  challengeId: string,
  code: string,
  passed: boolean,
  hintUsed: boolean = false
): Promise<void> {
  const res = await fetch(`${API_BASE}/challenges/${challengeId}/record`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, passed, sessionId: getSessionId(), hintUsed }),
  });
  if (!res.ok) throw new Error("Failed to record submission");
}

export async function fetchProgress(): Promise<{
  progress: UserProgress[];
  stats: ProgressStats;
}> {
  const res = await fetch(`${API_BASE}/progress/${getSessionId()}`);
  if (!res.ok) throw new Error("Failed to fetch progress");
  return res.json();
}

export async function fetchReviewQueue(): Promise<UserProgress[]> {
  const res = await fetch(`${API_BASE}/progress/${getSessionId()}/review-queue`);
  if (!res.ok) throw new Error("Failed to fetch review queue");
  return res.json();
}

// Reset progress for a challenge (clears submissions and progress)
export async function resetChallengeProgress(challengeId: string): Promise<void> {
  const sessionId = getSessionId();
  const res = await fetch(
    `${API_BASE}/challenges/${challengeId}/progress?sessionId=${sessionId}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error("Failed to reset progress");
}

// ============================================================================
// Vocabulary Types
// ============================================================================

export interface VocabularyTerm {
  id: string;
  lessonId: string;
  term: string;
  definition: string;
  context: string | null;
  difficulty: "beginner" | "intermediate" | "advanced";
  orderIndex: number;
}

export interface VocabularyProgress {
  termId: string;
  learningMode: "flashcard" | "quiz";
  masteryLevel: "learning" | "reviewing" | "mastered";
  nextReviewDate: string | null;
  repetitions: number;
}

export interface VocabularyTermWithProgress extends VocabularyTerm {
  flashcardProgress?: VocabularyProgress;
  quizProgress?: VocabularyProgress;
}

export interface QuizQuestion {
  termId: string;
  questionText: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
}

export interface VocabularyStats {
  total: number;
  mastered: number;
  reviewing: number;
  learning: number;
  flashcard: { total: number; mastered: number; reviewing: number; learning: number };
  quiz: { total: number; mastered: number; reviewing: number; learning: number };
}

// ============================================================================
// Vocabulary API Functions
// ============================================================================

export async function fetchVocabularyTerms(lessonId: string): Promise<VocabularyTermWithProgress[]> {
  const sessionId = getSessionId();
  const res = await fetch(`${API_BASE}/vocabulary/${lessonId}/terms?sessionId=${sessionId}`);
  if (!res.ok) throw new Error("Failed to fetch vocabulary terms");
  const data = await res.json();
  return data.terms || [];
}

export async function submitFlashcardReview(termId: string, quality: number): Promise<VocabularyProgress> {
  const sessionId = getSessionId();
  const res = await fetch(`${API_BASE}/vocabulary/flashcard/${termId}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quality, sessionId }),
  });
  if (!res.ok) throw new Error("Failed to submit flashcard review");
  return res.json();
}

export async function fetchQuizQuestion(termId: string): Promise<QuizQuestion> {
  const res = await fetch(`${API_BASE}/vocabulary/quiz/${termId}/question`);
  if (!res.ok) throw new Error("Failed to fetch quiz question");
  return res.json();
}

export async function submitQuizAnswer(
  termId: string,
  selectedOptionId: string,
  timeSpentMs: number
): Promise<{ correct: boolean; progress: VocabularyProgress }> {
  const sessionId = getSessionId();
  const res = await fetch(`${API_BASE}/vocabulary/quiz/${termId}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ selectedOptionId, timeSpentMs, sessionId }),
  });
  if (!res.ok) throw new Error("Failed to submit quiz answer");
  return res.json();
}

export async function fetchVocabularyReviewQueue(lessonId?: string): Promise<VocabularyTermWithProgress[]> {
  const sessionId = getSessionId();
  const url = lessonId
    ? `${API_BASE}/vocabulary/review-queue?sessionId=${sessionId}&lessonId=${lessonId}`
    : `${API_BASE}/vocabulary/review-queue?sessionId=${sessionId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch vocabulary review queue");
  const data = await res.json();
  return data.queue || [];
}

export async function fetchVocabularyStats(lessonIdOrSlug?: string): Promise<VocabularyStats> {
  const sessionId = getSessionId();
  const url = lessonIdOrSlug
    ? `${API_BASE}/vocabulary/${lessonIdOrSlug}/stats?sessionId=${sessionId}`
    : `${API_BASE}/vocabulary/stats?sessionId=${sessionId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch vocabulary stats");
  return res.json();
}
