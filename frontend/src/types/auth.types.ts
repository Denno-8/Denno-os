export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  title: string;
  location: string;
  phone?: string;
  years_experience?: number;
  linkedin?: string;
  github?: string;
  website?: string;
  summary?: string;
  career_goal?: string;
  availability?: string;
  notice_period?: string;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  skills?: string[];
  notifications?: Record<string, boolean>;
  theme?: string;
  two_fa_enabled?: boolean;
  profile_public?: boolean;
  role: string;
}
