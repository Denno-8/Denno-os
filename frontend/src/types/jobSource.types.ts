export interface JobSource {
  id: string;
  company_id: string;
  company_name: string;
  url: string;
  scrape_method: string;
  status: string;
  jobs_found: number;
  last_checked_at: string;
  created_at: string;
}

export const SOURCE_STATUSES = ["verified", "recent", "expired", "archived"];
