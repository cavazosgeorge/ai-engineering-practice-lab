import { useQuery, type QueryClient } from "@tanstack/react-query";
import { fetchLessons, fetchProgress, fetchReviewQueue, fetchChallenge, type Lesson, type UserProgress, type Challenge } from "../services/api";

// Query keys
export const progressKeys = {
  all: ["progress"] as const,
  stats: () => [...progressKeys.all, "stats"] as const,
  lessons: () => ["lessons"] as const,
  reviewQueue: () => [...progressKeys.all, "review-queue"] as const,
};

/**
 * Fetch all lessons
 */
export function useLessons() {
  return useQuery<Lesson[]>({
    queryKey: progressKeys.lessons(),
    queryFn: fetchLessons,
  });
}

/**
 * Fetch user progress stats and completed challenges
 */
export function useProgressStats() {
  return useQuery({
    queryKey: progressKeys.stats(),
    queryFn: async () => {
      const progressData = await fetchProgress();
      const completedChallenges = new Set(
        progressData.progress.map((p) => p.challengeId)
      );
      return {
        stats: progressData.stats,
        completedChallenges,
      };
    },
  });
}

/**
 * Fetch full progress data including individual challenge progress
 */
export function useFullProgress() {
  return useQuery({
    queryKey: progressKeys.stats(),
    queryFn: fetchProgress,
  });
}

/**
 * Fetch review queue
 */
export function useReviewQueue() {
  return useQuery<UserProgress[]>({
    queryKey: progressKeys.reviewQueue(),
    queryFn: fetchReviewQueue,
  });
}

// Challenge query keys
export const challengeKeys = {
  all: ["challenges"] as const,
  detail: (id: string) => [...challengeKeys.all, id] as const,
};

/**
 * Fetch a single challenge by ID
 */
export function useChallenge(id: string | undefined) {
  return useQuery<Challenge>({
    queryKey: challengeKeys.detail(id || ""),
    queryFn: () => fetchChallenge(id!),
    enabled: !!id,
  });
}

/**
 * ✅ Prefetch a challenge - call this to warm the cache before navigation
 */
export function prefetchChallenge(queryClient: QueryClient, id: string) {
  return queryClient.prefetchQuery({
    queryKey: challengeKeys.detail(id),
    queryFn: () => fetchChallenge(id),
  });
}
