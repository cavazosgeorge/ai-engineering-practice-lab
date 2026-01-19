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
