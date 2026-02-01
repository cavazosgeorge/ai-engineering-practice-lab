import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as adminApi from "../services/admin-api";

export const adminKeys = {
  all: ["admin"] as const,
  stats: () => [...adminKeys.all, "stats"] as const,
  lessons: () => [...adminKeys.all, "lessons"] as const,
  vocabularyTerms: () => [...adminKeys.all, "vocabulary-terms"] as const,
  vocabularyTerm: (id: string) => [...adminKeys.all, "vocabulary-terms", id] as const,
  weeks: () => [...adminKeys.all, "weeks"] as const,
  dataSources: (weekId: string) => [...adminKeys.all, "data-sources", weekId] as const,
  dataSourceDetail: (id: string) => [...adminKeys.all, "data-source", id] as const,
  dataSourceStats: (weekId: string) => [...adminKeys.all, "data-source-stats", weekId] as const,
  ragStats: () => [...adminKeys.all, "rag-stats"] as const,
  generationJobs: (weekId?: string) => [...adminKeys.all, "generation-jobs", weekId] as const,
  generationJob: (jobId: string) => [...adminKeys.all, "generation-job", jobId] as const,
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

// ============================================
// Data Sources Hooks
// ============================================

export function useDataSources(weekId: string) {
  return useQuery({
    queryKey: adminKeys.dataSources(weekId),
    queryFn: () => adminApi.fetchDataSources(weekId),
    enabled: !!weekId,
    staleTime: ADMIN_STALE_TIME,
  });
}

export function useDataSourceDetail(sourceId: string) {
  return useQuery({
    queryKey: adminKeys.dataSourceDetail(sourceId),
    queryFn: () => adminApi.fetchDataSourceDetail(sourceId),
    enabled: !!sourceId,
    staleTime: ADMIN_STALE_TIME,
  });
}

export function useDataSourceStats(weekId: string) {
  return useQuery({
    queryKey: adminKeys.dataSourceStats(weekId),
    queryFn: () => adminApi.fetchDataSourceStats(weekId),
    enabled: !!weekId,
    staleTime: ADMIN_STALE_TIME,
  });
}

export function useIngestText() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.ingestText,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.dataSources(variables.weekId),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.dataSourceStats(variables.weekId),
      });
      queryClient.invalidateQueries({ queryKey: adminKeys.ragStats() });
    },
  });
}

export function useIngestURL() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.ingestURL,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.dataSources(variables.weekId),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.dataSourceStats(variables.weekId),
      });
      queryClient.invalidateQueries({ queryKey: adminKeys.ragStats() });
    },
  });
}

export function useIngestPDF() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.ingestPDF,
    onSuccess: () => {
      // Can't easily get weekId from FormData, invalidate all data sources
      queryClient.invalidateQueries({
        queryKey: [...adminKeys.all, "data-sources"],
      });
      queryClient.invalidateQueries({
        queryKey: [...adminKeys.all, "data-source-stats"],
      });
      queryClient.invalidateQueries({ queryKey: adminKeys.ragStats() });
    },
  });
}

export function useDeleteDataSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deleteDataSource,
    onSettled: () => {
      // Invalidate all data source related queries
      queryClient.invalidateQueries({
        queryKey: [...adminKeys.all, "data-sources"],
      });
      queryClient.invalidateQueries({
        queryKey: [...adminKeys.all, "data-source-stats"],
      });
      queryClient.invalidateQueries({ queryKey: adminKeys.ragStats() });
    },
  });
}

export function useRAGStats() {
  return useQuery({
    queryKey: adminKeys.ragStats(),
    queryFn: adminApi.fetchRAGStats,
    staleTime: ADMIN_STALE_TIME,
  });
}

// ============================================
// AI Generation Hooks
// ============================================

export function useGenerationJobs(weekId?: string) {
  return useQuery({
    queryKey: adminKeys.generationJobs(weekId),
    queryFn: () => adminApi.fetchGenerationJobs(weekId),
    staleTime: 10_000,
  });
}

export function useGenerationJob(jobId: string) {
  return useQuery({
    queryKey: adminKeys.generationJob(jobId),
    queryFn: () => adminApi.fetchGenerationJob(jobId),
    enabled: !!jobId,
    staleTime: 5_000,
  });
}

export function useRequestGeneration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.requestGeneration,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...adminKeys.all, "generation-jobs"],
      });
    },
  });
}

export function useApproveGeneration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, input }: { jobId: string; input: adminApi.ApproveRequest }) =>
      adminApi.approveGeneration(jobId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...adminKeys.all, "generation-jobs"],
      });
      queryClient.invalidateQueries({ queryKey: adminKeys.vocabularyTerms() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });
}

export function useDeleteGenerationJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deleteGenerationJob,
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [...adminKeys.all, "generation-jobs"],
      });
    },
  });
}
