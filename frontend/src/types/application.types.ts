export type ApplicationStage =
  | "Saved" | "Preparing" | "CV Optimized" | "Applied" | "Confirmed"
  | "Under Review" | "Unresponded" | "Assessment" | "Technical" | "HR Interview"
  | "Final Interview" | "Offer" | "Accepted" | "Job Closed" | "Rejected";

export const ALL_STAGES: ApplicationStage[] = [
  "Saved", "Preparing", "CV Optimized", "Applied", "Confirmed",
  "Under Review", "Unresponded", "Assessment", "Technical", "HR Interview",
  "Final Interview", "Offer", "Accepted", "Job Closed", "Rejected",
];

export interface Application {
  id: string;
  company_name: string;
  role: string;
  stage: ApplicationStage;
  date_applied: string; // ISO date
  required_skills: string[];
  match_score: number;
  ats_score: number;
  salary_range?: string | null;
  notes?: string | null;
  recruiter_email?: string | null;
  source_job_id?: string | null;
  source_url?: string | null;
  apply_method?: "website" | "email" | null;
  cv_version_id?: string | null;
  cv_snapshot?: {
    cv_id?: string;
    name?: string;
    focus?: string;
    skills?: string[];
    ats_score?: number;
    content?: string;
  } | null;
  app_letter_snapshot?: {
    version_name?: string;
    content?: string;
    role_title?: string;
    company_name?: string;
    created_at?: string;
  } | null;
  checklist: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

export interface ApplicationCreateInput {
  company_name: string;
  role: string;
  stage?: ApplicationStage;
  date_applied: string;
  required_skills?: string[];
  match_score?: number;
  ats_score?: number;
  salary_range?: string;
  notes?: string;
  recruiter_email?: string;
  source_job_id?: string;
  source_url?: string;
  apply_method?: "website" | "email";
  cv_version_id?: string;
  app_letter_text?: string;
}

export interface ApplicationUpdateInput {
  company_name?: string;
  role?: string;
  stage?: ApplicationStage;
  date_applied?: string;
  salary_range?: string;
  notes?: string;
  recruiter_email?: string;
  source_url?: string;
  apply_method?: "website" | "email";
  cv_version_id?: string;
  app_letter_text?: string;
  required_skills?: string[];
  match_score?: number;
  ats_score?: number;
  checklist?: Record<string, boolean>;
}

export interface ApplicationAnalytics {
  total: number;
  interviews: number;
  offers: number;
  responded: number;
  not_responded?: number;
  feedback_received?: number;
  response_rate: number;
  interview_rate: number;
  offer_rate?: number;
  avg_match: number;
  avg_ats: number;
  by_stage: Record<string, number>;
}

export interface FollowUpDraftResponse {
  application_id: number;
  company_name: string;
  role: string;
  stage: string;
  days_elapsed: number;
  recruiter_email: string;
  subject: string;
  body: string;
  recommended_date: string;
  ics_content: string;
}

export interface FunnelStep {
  step: string;
  count: number;
  pct: number;
}

export interface BottleneckDiagnostics {
  primary_bottleneck: string;
  recommendation: string;
}

export interface PipelineFunnelAnalytics {
  total_applications: number;
  funnel_steps: FunnelStep[];
  stage_breakdown: Record<string, number>;
  conversion_rates: {
    saved_to_applied: number;
    applied_to_interview: number;
    interview_to_offer: number;
  };
  diagnostics: BottleneckDiagnostics;
}

