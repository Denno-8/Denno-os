export interface Job {
  id: string;
  company_id: string;
  company_name: string;
  title: string;
  mode: "Remote" | "Hybrid" | "Onsite";
  level: string;
  employment_type: string;
  salary_min: number;
  salary_max: number;
  currency: string;
  required_skills: string[];
  requirements: string[];
  match_score: number;
  ats_score: number;
  posted_at: string;
  deadline: string | null;
  is_expired: boolean;
  source_url: string;
  contact_email: string;
  is_hot: boolean;
  description: string;
}

export interface SalaryBenchmark {
  level: string;
  job_count: number;
  avg_min: number;
  avg_max: number;
  currency: string;
  formatted: string;
}

export interface SalaryBenchmarksResponse {
  levels: SalaryBenchmark[];
}

export interface CompanyIntelligence {
  company_name: string;
  total_jobs: number;
  active_jobs: number;
  top_skills: string[];
  oldest_posting_days?: number;
  ghost_job_risk: "Low" | "Moderate" | "High";
  hiring_velocity: string;
  recent_roles?: string[];
  message?: string;
}
