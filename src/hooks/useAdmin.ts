import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as adminApi from "../services/admin-api";

export const adminKeys = {
  all: ["admin"] as const,
  stats: () => [...adminKeys.all, "stats"] as const,
  lessons: () => [...adminKeys.all, "lessons"] as const,
  vocabularyTerms: () => [...adminKeys.all, "vocabulary-terms"] as const,
  vocabularyTerm: (id: string) => [...adminKeys.all, "vocabulary-terms", id] as const,
  weeks: () => [...adminKeys.all, "weeks"] as const,
};

const ADMIN_STALE_TIME = 30_000; // 30s — admin data changes infrequently

export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: adminApi.fetchAdminStats,
    staleTime: ADMIN_STALE_TIME,
  });
}

export function useAdminLessons() {
  return useQuery({
    queryKey: adminKeys.lessons(),
    queryFn: adminApi.fetchAdminLessons,
    staleTime: ADMIN_STALE_TIME,
  });
}

export function useAdminVocabularyTerms() {
  return useQuery({
    queryKey: adminKeys.vocabularyTerms(),
    queryFn: adminApi.fetchAdminVocabularyTerms,
    staleTime: ADMIN_STALE_TIME,
  });
}

export function useAdminVocabularyTerm(id: string) {
  return useQuery({
    queryKey: adminKeys.vocabularyTerm(id),
    queryFn: () => adminApi.fetchAdminVocabularyTerm(id),
    enabled: !!id,
    staleTime: ADMIN_STALE_TIME,
  });
}

export function useCreateVocabularyTerm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createVocabularyTerm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.vocabularyTerms() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });
}

export function useUpdateVocabularyTerm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: adminApi.UpdateVocabularyTermInput }) =>
      adminApi.updateVocabularyTerm(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.vocabularyTerms() });
      queryClient.invalidateQueries({ queryKey: adminKeys.vocabularyTerm(id) });
    },
  });
}

export function useDeleteVocabularyTerm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deleteVocabularyTerm,
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.vocabularyTerms() });
      const previous = queryClient.getQueryData<adminApi.AdminVocabularyTerm[]>(
        adminKeys.vocabularyTerms()
      );
      queryClient.setQueryData<adminApi.AdminVocabularyTerm[]>(
        adminKeys.vocabularyTerms(),
        (old) => old?.filter((t) => t.id !== deletedId)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(adminKeys.vocabularyTerms(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.vocabularyTerms() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });
}

// ============================================
// Admin Weeks Hooks
// ============================================

export function useAdminWeeks() {
  return useQuery({
    queryKey: adminKeys.weeks(),
    queryFn: adminApi.fetchAdminWeeks,
    staleTime: ADMIN_STALE_TIME,
  });
}

export function useCreateWeek() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createWeek,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.weeks() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });
}

export function useUpdateWeek() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: adminApi.UpdateWeekInput }) =>
      adminApi.updateWeek(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.weeks() });
    },
  });
}

export function useDeleteWeek() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deleteWeek,
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.weeks() });
      const previous = queryClient.getQueryData<adminApi.AdminWeek[]>(
        adminKeys.weeks()
      );
      queryClient.setQueryData<adminApi.AdminWeek[]>(
        adminKeys.weeks(),
        (old) => old?.filter((w) => w.id !== deletedId)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(adminKeys.weeks(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.weeks() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });
}
