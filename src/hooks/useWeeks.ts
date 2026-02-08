import { useQuery, type QueryClient } from "@tanstack/react-query";
import { fetchWeeks, fetchWeekDetail, type Week, type WeekDetail } from "../services/api";

// Query keys
export const weekKeys = {
  all: ["weeks"] as const,
  detail: (slug: string) => [...weekKeys.all, slug] as const,
};

/**
 * Fetch all published weeks with lesson/vocabulary counts
 */
export function useWeeks() {
  return useQuery<Week[]>({
    queryKey: weekKeys.all,
    queryFn: fetchWeeks,
  });
}

/**
 * Fetch a single week detail by slug (with lessons)
 */
export function useWeekDetail(slug: string | undefined) {
  return useQuery<WeekDetail>({
    queryKey: weekKeys.detail(slug || ""),
    queryFn: () => fetchWeekDetail(slug!),
    enabled: !!slug,
  });
}

/**
 * Prefetch a week detail for hover-based preloading
 */
export function prefetchWeekDetail(queryClient: QueryClient, slug: string) {
  return queryClient.prefetchQuery({
    queryKey: weekKeys.detail(slug),
    queryFn: () => fetchWeekDetail(slug),
  });
}
