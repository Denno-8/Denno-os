import { api } from "./api";
import type { Course, CourseCreateInput, SkillGapHeatmapResponse } from "../types/learning.types";

export const learningService = {
  list: (category?: string) =>
    api.get<Course[]>(`/learning${category && category !== "All" ? `?category=${encodeURIComponent(category)}` : ""}`),
  create: (input: CourseCreateInput) => api.post<Course>("/learning", input),
  updateProgress: (courseId: string, lessonsCompleted: number) =>
    api.post<Course>(`/learning/${courseId}/progress`, { lessons_completed: lessonsCompleted }),
  remove: (courseId: string) => api.delete<void>(`/learning/${courseId}`),
  getSkillGapHeatmap: () => api.get<SkillGapHeatmapResponse>("/learning/skill-gap-heatmap"),
};
