export interface CVVersion {
  id: string;
  name: string;
  focus: string;
  ats_score: number;
  skills: string[];
  file_url: string | null;
  parsed_content?: string | null;
  parsed_sections?: Record<string, string> | null;
  times_used: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CVVersionCreateInput {
  name: string;
  focus?: string;
  ats_score?: number;
  skills?: string[];
  parsed_content?: string;
}

export interface CVVersionUpdateInput {
  name?: string;
  focus?: string;
  ats_score?: number;
  skills?: string[];
  parsed_content?: string;
}
