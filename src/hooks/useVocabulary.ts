import { useQuery, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  fetchVocabularyTerms,
  submitFlashcardReview,
  fetchQuizQuestion,
  submitQuizAnswer,
  fetchVocabularyReviewQueue,
  fetchVocabularyStats,
  type VocabularyTermWithProgress,
  type VocabularyProgress,
  type QuizQuestion,
  type VocabularyStats,
} from "../services/api";

// Query keys - exported for prefetching
export const vocabularyKeys = {
  all: ["vocabulary"] as const,
  terms: (lessonId: string) => [...vocabularyKeys.all, "terms", lessonId] as const,
  stats: (lessonId?: string) => [...vocabularyKeys.all, "stats", lessonId] as const,
  reviewQueue: (lessonId?: string) => [...vocabularyKeys.all, "review-queue", lessonId] as const,
  quizQuestion: (termId: string) => [...vocabularyKeys.all, "quiz", termId] as const,
};

/**
 * ✅ Prefetch a quiz question - call this to warm the cache before the user needs it
 */
export function prefetchQuizQuestion(queryClient: QueryClient, termId: string) {
  return queryClient.prefetchQuery({
    queryKey: vocabularyKeys.quizQuestion(termId),
    queryFn: () => fetchQuizQuestion(termId),
  });
}

/**
 * ✅ Prefetch vocabulary terms and stats - call this to warm the cache before navigation
 */
export function prefetchVocabulary(queryClient: QueryClient, lessonId: string) {
  return Promise.all([
    queryClient.prefetchQuery({
      queryKey: vocabularyKeys.terms(lessonId),
      queryFn: () => fetchVocabularyTerms(lessonId),
    }),
    queryClient.prefetchQuery({
      queryKey: vocabularyKeys.stats(lessonId),
      queryFn: () => fetchVocabularyStats(lessonId),
    }),
  ]);
}

/**
 * Fetch vocabulary terms for a lesson with progress (accepts lesson ID or slug)
 */
export function useVocabularyTerms(lessonIdOrSlug?: string) {
  return useQuery<VocabularyTermWithProgress[]>({
    queryKey: vocabularyKeys.terms(lessonIdOrSlug || ""),
    queryFn: () => fetchVocabularyTerms(lessonIdOrSlug!),
    enabled: !!lessonIdOrSlug,
  });
}

/**
 * Fetch vocabulary statistics (accepts lesson ID or slug)
 */
export function useVocabularyStats(lessonIdOrSlug?: string) {
  return useQuery<VocabularyStats>({
    queryKey: vocabularyKeys.stats(lessonIdOrSlug),
    queryFn: () => fetchVocabularyStats(lessonIdOrSlug),
  });
}

/**
 * Fetch vocabulary terms due for review
 */
export function useVocabularyReviewQueue(lessonId?: string) {
  return useQuery<VocabularyTermWithProgress[]>({
    queryKey: vocabularyKeys.reviewQueue(lessonId),
    queryFn: () => fetchVocabularyReviewQueue(lessonId),
  });
}

/**
 * Submit a flashcard review with quality rating
 */
export function useFlashcardReview() {
  const queryClient = useQueryClient();

  return useMutation<
    VocabularyProgress,
    Error,
    { termId: string; quality: number; lessonId?: string }
  >({
    mutationFn: ({ termId, quality }) => submitFlashcardReview(termId, quality),
    onSuccess: (_, variables) => {
      // ✅ Only invalidate specific queries that changed, not all vocabulary queries
      if (variables.lessonId) {
        queryClient.invalidateQueries({
          queryKey: vocabularyKeys.terms(variables.lessonId),
        });
        queryClient.invalidateQueries({
          queryKey: vocabularyKeys.stats(variables.lessonId),
        });
      }
      // Also invalidate review queue since it depends on progress
      queryClient.invalidateQueries({
        queryKey: vocabularyKeys.reviewQueue(variables.lessonId),
      });
    },
  });
}

/**
 * Fetch a quiz question for a term
 */
export function useQuizQuestion(termId: string, enabled = true) {
  return useQuery<QuizQuestion>({
    queryKey: vocabularyKeys.quizQuestion(termId),
    queryFn: () => fetchQuizQuestion(termId),
    enabled: !!termId && enabled,
    staleTime: 0, // Always refetch to get new question options
  });
}

/**
 * Submit a quiz answer
 */
export function useQuizAnswer() {
  const queryClient = useQueryClient();

  return useMutation<
    { correct: boolean; progress: VocabularyProgress },
    Error,
    { termId: string; selectedOptionId: string; timeSpentMs: number; lessonId?: string }
  >({
    mutationFn: ({ termId, selectedOptionId, timeSpentMs }) =>
      submitQuizAnswer(termId, selectedOptionId, timeSpentMs),
    onSuccess: (_, variables) => {
      // ✅ Only invalidate specific queries that changed, not all vocabulary queries
      if (variables.lessonId) {
        queryClient.invalidateQueries({
          queryKey: vocabularyKeys.terms(variables.lessonId),
        });
        queryClient.invalidateQueries({
          queryKey: vocabularyKeys.stats(variables.lessonId),
        });
      }
      // Also invalidate review queue since it depends on progress
      queryClient.invalidateQueries({
        queryKey: vocabularyKeys.reviewQueue(variables.lessonId),
      });
    },
  });
}
