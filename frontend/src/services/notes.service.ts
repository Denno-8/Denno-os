import { api } from "./api";
import type { Note, NoteCreateInput } from "../types/note.types";

export const notesService = {
  list: (category?: string, q?: string) => {
    const qs = new URLSearchParams();
    if (category && category !== "All") qs.set("category", category);
    if (q) qs.set("q", q);
    const suffix = qs.toString() ? `?${qs}` : "";
    return api.get<Note[]>(`/notes${suffix}`);
  },
  categories: () => api.get<string[]>("/notes/categories"),
  create: (input: NoteCreateInput) => api.post<Note>("/notes", input),
  remove: (id: string) => api.delete<void>(`/notes/${id}`),
};
