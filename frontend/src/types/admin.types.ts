export interface AdminUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: "user" | "admin";
  is_active: boolean;
  title: string;
  location: string;
  created_at: string;
  application_count: number;
}

export interface AdminJob {
  id: number;
  title: string;
  company_name: string;
  mode: string;
  level: string;
  employment_type: string;
  salary_min: number;
  salary_max: number;
  currency: string;
  is_hot: boolean;
  is_expired?: boolean;
  source_url: string;
  match_score: number;
  ats_score: number;
  created_at: string | null;
}

export interface AdminCompany {
  id: number;
  name: string;
  sector: string;
  location: string;
  tier: number;
  open_roles_count: number;
  career_url: string;
  contact_email: string;
  ats_platform: string;
  created_at: string | null;
}

export interface PlatformAnalytics {
  total_users: number;
  total_applications: number;
  total_jobs: number;
  total_companies: number;
  total_courses: number;
  total_emails: number;
  total_interviews: number;
  total_offers: number;
  avg_match_score: number;
  platform_offer_rate: number;
}

export interface AdminEmailSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password_set: boolean;
  smtp_from_email: string;
  smtp_from_name: string;
  emails_enabled: boolean;
}

