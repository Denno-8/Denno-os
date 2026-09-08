import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { goalsService } from "../services/goals.service";
import type { GoalCreateInput } from "../types/goal.types";

const KEY = ["goals"] as const;

export function useGoals() {
  return useQuery({ queryKey: KEY, queryFn: () => goalsService.list(), staleTime: 60_000 });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: GoalCreateInput) => goalsService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useIncrementGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, delta }: { id: string; delta: number }) => goalsService.increment(id, delta),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => goalsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
