import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notesService } from "../services/notes.service";
import type { NoteCreateInput } from "../types/note.types";

const KEY = ["notes"] as const;

export function useNotes(category?: string, q?: string) {
  return useQuery({ queryKey: [...KEY, category, q], queryFn: () => notesService.list(category, q), staleTime: 120_000 });
}

export function useNoteCategories() {
  return useQuery({ queryKey: [...KEY, "categories"], queryFn: () => notesService.categories(), staleTime: 300_000 });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NoteCreateInput) => notesService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notesService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
