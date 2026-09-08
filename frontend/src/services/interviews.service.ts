import { api } from "./api";
import type { Interview, InterviewCreateInput, InterviewUpdateInput, MockQuestionsResponse, STAREvaluationResponse } from "../types/interview.types";

export const interviewsService = {
  list: (upcomingOnly = false) =>
    api.get<Interview[]>(`/interviews${upcomingOnly ? "?upcoming_only=true" : ""}`),
  create: (input: InterviewCreateInput) => api.post<Interview>("/interviews", input),
  update: (id: string, patch: InterviewUpdateInput) => api.patch<Interview>(`/interviews/${id}`, patch),
  remove: (id: string) => api.delete<void>(`/interviews/${id}`),
  getMockQuestions: (roleTitle: string, companyName: string, interviewType = "Technical") =>
    api.post<MockQuestionsResponse>("/interviews/mock-questions", { role_title: roleTitle, company_name: companyName, interview_type: interviewType }),
  evaluateStar: (question: string, responseText: string) =>
    api.post<STAREvaluationResponse>("/interviews/evaluate-star", { question, response_text: responseText }),
};
