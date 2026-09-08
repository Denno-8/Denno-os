export interface QuestionReflection {
  question: string;
  answer_given: string;
  quality_rating: number;
}

export interface Interview {
  id: string;
  application_id: string;
  type: string;
  scheduled_at: string;
  location: string;
  status: string;
  prep_checklist: Record<string, boolean>;
  behavioral_questions: string[];
  technical_questions: string[];
  post_interview_notes: string;
  outcome: string | null;
  questions_asked?: QuestionReflection[];
  what_went_well?: string;
  what_to_improve?: string;
  overall_confidence?: number | null;
  follow_up_actions?: string[];
  post_mortem_done?: boolean;
  has_conflict?: boolean;
  conflict_warning?: string | null;
  created_at: string;
}

export interface InterviewCreateInput {
  application_id: string;
  type?: string;
  scheduled_at: string;
  location?: string;
  behavioral_questions?: string[];
  technical_questions?: string[];
}

export interface InterviewUpdateInput {
  status?: string;
  location?: string;
  prep_checklist?: Record<string, boolean>;
  post_interview_notes?: string;
  outcome?: string;
  questions_asked?: QuestionReflection[];
  what_went_well?: string;
  what_to_improve?: string;
  overall_confidence?: number;
  follow_up_actions?: string[];
  post_mortem_done?: boolean;
}

export const INTERVIEW_TYPES = ["Technical", "HR", "Final", "Assessment"];
export const DEFAULT_CHECKLIST = [
  "Updated CV ready", "Portfolio tested", "Portfolio profile updated",
  "National ID ready", "Questions for interviewer prepared", "Laptop/phone charged",
];

export interface MockQuestionsResponse {
  company_name: string;
  role_title: string;
  interview_type: string;
  questions: string[];
}

export interface STAREvaluationResponse {
  question: string;
  response_text: string;
  star_score: number;
  star_breakdown: {
    situation: boolean;
    task: boolean;
    action: boolean;
    result: boolean;
  };
  feedback: string[];
}
