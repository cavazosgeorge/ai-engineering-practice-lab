import { useQuery } from "@tanstack/react-query";
import { fetchLesson, type Lesson } from "../services/api";

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
