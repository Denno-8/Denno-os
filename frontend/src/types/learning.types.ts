export interface Course {
  id: string;
  title: string;
  category: string;
  level: string;
  duration_minutes: number;
  lesson_count: number;
  url: string;
  linked_skill: string;
  lessons_completed: number;
  status: "not_started" | "in_progress" | "complete";
}

export interface CourseCreateInput {
  title: string;
  category: string;
  level?: string;
  duration_minutes?: number;
  lesson_count?: number;
  url?: string;
  linked_skill?: string;
}

export interface MissingSkillItem {
  skill: string;
  missing_count: number;
  target_job_pct: number;
  recommendation: string;
}

export interface SkillGapHeatmapResponse {
  total_jobs_analyzed: number;
  candidate_known_skills: string[];
  top_missing_skills: MissingSkillItem[];
}
