import { api } from "./api";
import type { Goal, GoalCreateInput, GoalVelocityProjectionResponse } from "../types/goal.types";

export const goalsService = {
  list: () => api.get<Goal[]>("/goals"),
  create: (input: GoalCreateInput) => api.post<Goal>("/goals", input),
  increment: (id: string, delta: number) => api.post<Goal>(`/goals/${id}/increment`, { delta }),
  remove: (id: string) => api.delete<void>(`/goals/${id}`),
  getVelocityProjections: () => api.get<GoalVelocityProjectionResponse>("/goals/velocity-projection"),
};
