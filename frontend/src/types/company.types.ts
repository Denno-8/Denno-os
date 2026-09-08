export interface Company {
  id: string;
  name: string;
  sector: string;
  location: string;
  ats_platform: string;
  career_url: string;
  contact_email: string;
  tech_stack: string[];
  open_roles_count: number;
  tier: number;
  verification_status: string;
  created_at: string;
}
