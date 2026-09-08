import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { learningService } from "../services/learning.service";
import type { CourseCreateInput } from "../types/learning.types";

const KEY = ["learning"] as const;

export function useCourses(category?: string) {
  return useQuery({ queryKey: [...KEY, category], queryFn: () => learningService.list(category), staleTime: 300_000 });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CourseCreateInput) => learningService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, lessonsCompleted }: { courseId: string; lessonsCompleted: number }) =>
      learningService.updateProgress(courseId, lessonsCompleted),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => learningService.remove(courseId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
