export interface Note {
  id: string;
  title: string;
  category: string;
  body: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface NoteCreateInput {
  title: string;
  category?: string;
  body?: string;
  tags?: string[];
}
