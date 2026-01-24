import { useQuery, type QueryClient } from "@tanstack/react-query";
import { fetchLesson, fetchVocabularyStats, type Lesson } from "../services/api";
import { vocabularyKeys } from "./useVocabulary";

// Query keys
export const lessonKeys = {
  all: ["lessons"] as const,
  detail: (slug: string) => [...lessonKeys.all, slug] as const,
};

/**
 * Fetch a single lesson by slug
 */
export function useLesson(slug: string | undefined) {
  return useQuery<Lesson>({
    queryKey: lessonKeys.detail(slug || ""),
    queryFn: () => fetchLesson(slug!),
    enabled: !!slug,
  });
}

/**
 * ✅ Prefetch a lesson AND vocabulary stats - both use slug, so no cascading dependency
 */
export function prefetchLesson(queryClient: QueryClient, slug: string) {
  return Promise.all([
    queryClient.prefetchQuery({
      queryKey: lessonKeys.detail(slug),
      queryFn: () => fetchLesson(slug),
    }),
    queryClient.prefetchQuery({
      queryKey: vocabularyKeys.stats(slug),
      queryFn: () => fetchVocabularyStats(slug),
    }),
  ]);
}
