export interface Goal {
  id: string;
  label: string;
  category: string;
  current: number;
  target: number;
  deadline: string | null;
  created_at: string;
}

export interface GoalCreateInput {
  label: string;
  category?: string;
  current?: number;
  target?: number;
  deadline?: string;
}

export const GOAL_CATEGORIES = [
  "Applications",
  "CV/Resume",
  "Learning",
  "Portfolio",
  "Interviews",
  "Networking",
  "Interview Mastery",   // auto-incrementable via question mastery
  "Certifications",      // e.g. OSCP, AWS SAA, CompTIA Sec+
  "Study Hours",         // daily/weekly study time tracking
  "Custom",
];

export interface GoalVelocityProjectionResponse {
  total_applications: number;
  weekly_velocity: number;
  interview_conversion_pct: number;
  offer_conversion_pct: number;
  projected_weeks_to_offer: number;
  status: string;
  recommendation: string;
}
