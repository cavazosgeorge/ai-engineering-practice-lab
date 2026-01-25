import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as adminApi from "../services/admin-api";

export const adminKeys = {
  all: ["admin"] as const,
  stats: () => [...adminKeys.all, "stats"] as const,
  lessons: () => [...adminKeys.all, "lessons"] as const,
  vocabularyTerms: () => [...adminKeys.all, "vocabulary-terms"] as const,
  vocabularyTerm: (id: string) => [...adminKeys.all, "vocabulary-terms", id] as const,
};

export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: adminApi.fetchAdminStats,
  });
}

export function useAdminLessons() {
  return useQuery({
    queryKey: adminKeys.lessons(),
    queryFn: adminApi.fetchAdminLessons,
  });
}

export function useAdminVocabularyTerms() {
  return useQuery({
    queryKey: adminKeys.vocabularyTerms(),
    queryFn: adminApi.fetchAdminVocabularyTerms,
  });
}

export function useAdminVocabularyTerm(id: string) {
  return useQuery({
    queryKey: adminKeys.vocabularyTerm(id),
    queryFn: () => adminApi.fetchAdminVocabularyTerm(id),
    enabled: !!id,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.vocabularyTerms() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });
}
