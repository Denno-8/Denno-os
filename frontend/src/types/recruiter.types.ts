export interface Recruiter {
  id: string;
  name: string;
  company_name: string;
  email: string;
  linkedin: string;
  notes: string;
  relationship_strength: string;
  last_contacted_at: string | null;
  created_at: string;
}

export interface RecruiterCreateInput {
  name: string;
  company_name?: string;
  email?: string;
  linkedin?: string;
  notes?: string;
  relationship_strength?: string;
}

export interface RecruiterUpdateInput {
  name?: string;
  company_name?: string;
  email?: string;
  linkedin?: string;
  notes?: string;
  relationship_strength?: string;
  last_contacted_at?: string;
}

export const STRENGTHS = ["Hot", "Warm", "Cold", "New"];
