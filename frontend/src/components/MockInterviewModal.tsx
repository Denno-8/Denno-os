import React, { useState, useEffect } from "react";
import { X, Sparkles, Send, CheckCircle2, Award, AlertCircle, RefreshCw, MessageSquare, Building2, HelpCircle } from "lucide-react";
import { interviewsService } from "../services/interviews.service";
import type { MockQuestionsResponse, STAREvaluationResponse } from "../types/interview.types";

interface MockInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleTitle: string;
  companyName: string;
  interviewType?: string;
}

export default function MockInterviewModal({
  isOpen,
  onClose,
  roleTitle,
  companyName,
  interviewType = "Technical",
}: MockInterviewModalProps) {
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionsData, setQuestionsData] = useState<MockQuestionsResponse | null>(null);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);

  const [responseText, setResponseText] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<STAREvaluationResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    setErrorMsg(null);
    try {
      const res = await interviewsService.getMockQuestions(roleTitle, companyName, interviewType);
      setQuestionsData(res);
      setSelectedQuestionIndex(0);
      setEvaluation(null);
      setResponseText("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load mock interview questions.");
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchQuestions();
    }
  }, [isOpen, roleTitle, companyName, interviewType]);

  if (!isOpen) return null;

  const currentQuestion = questionsData?.questions[selectedQuestionIndex] || "";

  const handleEvaluate = async () => {
    if (!responseText.trim() || !currentQuestion) return;
    setEvaluating(true);
    setErrorMsg(null);
    try {
      const res = await interviewsService.evaluateStar(currentQuestion, responseText);
      setEvaluation(res);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to evaluate response.");
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white tracking-tight m-0">AI Mock Interview Simulator</h3>
              <p className="text-xs text-slate-300 m-0">Dynamic {interviewType} practice &amp; STAR response coach for {companyName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {loadingQuestions ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <RefreshCw size={28} className="animate-spin mx-auto text-purple-500" />
              <p className="font-bold">Generating interview questions tailored to {companyName}...</p>
            </div>
          ) : errorMsg ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center gap-2 font-bold">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          ) : questionsData ? (
            <div className="space-y-5">
              {/* Question Navigation Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {questionsData.questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedQuestionIndex(idx);
                      setEvaluation(null);
                      setResponseText("");
                    }}
                    className={`px-3 py-1.5 rounded-xl font-extrabold text-xs shrink-0 transition-all ${
                      selectedQuestionIndex === idx
                        ? "bg-purple-600 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    Question #{idx + 1}
                  </button>
                ))}
              </div>

              {/* Current Question Card */}
              <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1">
                    <HelpCircle size={12} /> Prompt #{selectedQuestionIndex + 1} ({interviewType})
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{roleTitle}</span>
                </div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white m-0 leading-relaxed">
                  "{currentQuestion}"
                </h4>
              </div>

              {/* Response Input */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">Your Response (Type or Paste Answer)</label>
                <textarea
                  rows={6}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Structure your answer using Situation, Task, Action, Result (e.g. 'In my previous project at..., the task was..., I implemented..., resulting in 30% performance gain.')"
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Evaluate Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleEvaluate}
                  disabled={evaluating || !responseText.trim()}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-md disabled:opacity-50 transition-all hover:scale-[1.02]"
                >
                  {evaluating ? <RefreshCw size={14} className="animate-spin" /> : <Award size={14} />}
                  <span>{evaluating ? "Analyzing STAR Structure..." : "Evaluate Response with STAR Coach"}</span>
                </button>
              </div>

              {/* Evaluation Feedback Breakdown */}
              {evaluation && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-extrabold text-sm text-slate-900 dark:text-white">
                      <Award size={18} className="text-purple-500" />
                      <span>STAR Framework Evaluation</span>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-black text-xs">
                      {evaluation.star_score}/100 Score
                    </div>
                  </div>

                  {/* STAR Breakdown Pills */}
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {[
                      { key: "situation", label: "Situation" },
                      { key: "task", label: "Task" },
                      { key: "action", label: "Action" },
                      { key: "result", label: "Result" },
                    ].map((item) => {
                      const passed = (evaluation.star_breakdown as any)[item.key];
                      return (
                        <div
                          key={item.key}
                          className={`p-2 rounded-xl border text-center font-bold text-[11px] flex items-center justify-center gap-1 ${
                            passed
                              ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                              : "bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300"
                          }`}
                        >
                          <CheckCircle2 size={12} className={passed ? "text-emerald-600" : "text-amber-500"} />
                          <span>{item.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Constructive Suggestions */}
                  <div className="space-y-1.5 pt-1">
                    <div className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">Actionable AI Feedback:</div>
                    <ul className="space-y-1 pl-4 text-slate-600 dark:text-slate-300 list-disc">
                      {evaluation.feedback.map((fb, idx) => (
                        <li key={idx}>{fb}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400 font-semibold">
            Practicing builds candidate confidence and STAR clarity.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-bold text-xs transition-colors"
          >
            Close Practice
          </button>
        </div>
      </div>
    </div>
  );
}
