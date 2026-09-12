import React, { useState } from "react";
import { X, CheckCircle2, RotateCcw, Eye, Sparkles, Award, ArrowRight, ShieldCheck, Flame, Calendar } from "lucide-react";
import { TOP_200_QUESTIONS, type InterviewQuestionItem } from "../data/interviewQuestions200";
import { CYBERSECURITY_QUESTIONS, type SecurityQuestionItem } from "../data/cybersecurityData";

interface QuizModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionMastered?: (id: number, isCybersec?: boolean) => void;
}

type QuizQuestion = {
  id: number;
  question: string;
  answer: string;
  codeSnippet?: string;
  category: string;
  difficulty: string;
  isCybersec?: boolean;
};

export default function QuizModeModal({ isOpen, onClose, onQuestionMastered }: QuizModeModalProps) {
  const [source, setSource] = useState<"all" | "q200" | "cybersec">("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [scoreHistory, setScoreHistory] = useState<Record<number, number>>({});
  const [isFinished, setIsFinished] = useState(false);

  if (!isOpen) return null;

  const startQuiz = () => {
    let pool: QuizQuestion[] = [];

    if (source === "all" || source === "q200") {
      const q200Mapped: QuizQuestion[] = TOP_200_QUESTIONS.map((q: InterviewQuestionItem) => ({
        id: q.id,
        question: q.question,
        answer: q.answer,
        codeSnippet: q.codeSnippet,
        category: q.category,
        difficulty: q.difficulty,
        isCybersec: false,
      }));
      pool.push(...q200Mapped);
    }

    if (source === "all" || source === "cybersec") {
      const cyberMapped: QuizQuestion[] = CYBERSECURITY_QUESTIONS.map((q: SecurityQuestionItem) => ({
        id: q.id + 1000, // offset to avoid id collisions
        question: q.question,
        answer: q.answer,
        codeSnippet: q.commandSnippet,
        category: q.category,
        difficulty: q.difficulty,
        isCybersec: true,
      }));
      pool.push(...cyberMapped);
    }

    if (selectedDifficulty !== "All") {
      pool = pool.filter((q) => q.difficulty.toLowerCase() === selectedDifficulty.toLowerCase());
    }

    // Shuffle pool
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setShowAnswer(false);
    setScoreHistory({});
    setIsFinished(false);
    setIsQuizStarted(true);
  };

  const currentQ = questions[currentIndex];

  const handleRating = (rating: number) => {
    if (!currentQ) return;
    setScoreHistory((prev) => ({ ...prev, [currentQ.id]: rating }));

    if (rating >= 4 && onQuestionMastered) {
      const actualId = currentQ.isCybersec ? currentQ.id - 1000 : currentQ.id;
      onQuestionMastered(actualId, currentQ.isCybersec);
    }

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setShowAnswer(false);
    } else {
      setIsFinished(true);
    }
  };

  const calculateMasteryScore = () => {
    const vals = Object.values(scoreHistory);
    if (vals.length === 0) return 0;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return Math.round((avg / 5) * 100);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white m-0">Active Recall & Quiz Engine</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 m-0">SM-2 Spaced Repetition Testing</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {!isQuizStarted ? (
            /* Setup Screen */
            <div className="space-y-6">
              <div className="text-center space-y-2 max-w-md mx-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold">
                  <Flame size={14} className="text-amber-500" /> Active Recall Mode
                </div>
                <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">Configure Your Flashcard Challenge</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select a question bank and difficulty level. You'll be tested on 10 random questions with spaced-repetition self-evaluations.
                </p>
              </div>

              <div className="space-y-4 max-w-md mx-auto">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Question Pool</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "all", label: "All Banks" },
                      { id: "q200", label: "Top 200 Qs" },
                      { id: "cybersec", label: "Cybersecurity" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setSource(opt.id as any)}
                        className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition-all ${
                          source === opt.id
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Difficulty Level</label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none"
                  >
                    <option value="All">All Difficulties (Beginner → Expert)</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 max-w-md mx-auto">
                <button
                  onClick={startQuiz}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                >
                  <span>Start 10-Question Flashcard Quiz</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : !isFinished && currentQ ? (
            /* Active Quiz Question Card */
            <div className="space-y-5">
              {/* Progress & Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {currentQ.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                    {currentQ.difficulty}
                  </span>
                </div>

                <span className="text-xs font-bold text-slate-400">
                  {Math.round(((currentIndex + 1) / questions.length) * 100)}% Complete
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>

              {/* Question Text */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Flashcard Prompt:</div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                  {currentQ.question}
                </h3>
              </div>

              {/* Solution Section */}
              {!showAnswer ? (
                <div className="py-6 text-center space-y-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Try answering aloud or in your head before checking the model solution.
                  </p>
                  <button
                    onClick={() => setShowAnswer(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-extrabold hover:opacity-90 transition-all shadow-md"
                  >
                    <Eye size={15} />
                    <span>Reveal Model Answer</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl space-y-2">
                    <div className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 size={15} /> Verified Solution:
                    </div>
                    <div className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                      {currentQ.answer}
                    </div>

                    {currentQ.codeSnippet && (
                      <div className="mt-3 bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] border border-slate-800 overflow-x-auto">
                        <pre className="m-0 whitespace-pre-wrap">{currentQ.codeSnippet}</pre>
                      </div>
                    )}
                  </div>

                  {/* SM-2 Rating Prompt */}
                  <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-300">How well did you recall this answer?</span>
                      <span className="text-[10px] font-bold text-blue-400 flex items-center gap-1">
                        <Calendar size={11} /> SM-2 Spaced Repetition
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                       <button
                        onClick={() => handleRating(1)}
                        className="p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-extrabold flex flex-col items-center gap-1 transition-all"
                      >
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"/> Hard (1)</span>
                        <span className="text-[9px] font-normal text-rose-400">Review tomorrow</span>
                      </button>
                      <button
                        onClick={() => handleRating(3)}
                        className="p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-extrabold flex flex-col items-center gap-1 transition-all"
                      >
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"/> Medium (3)</span>
                        <span className="text-[9px] font-normal text-amber-400">Review in 3 days</span>
                      </button>
                      <button
                        onClick={() => handleRating(4)}
                        className="p-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 text-xs font-extrabold flex flex-col items-center gap-1 transition-all"
                      >
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"/> Good (4)</span>
                        <span className="text-[9px] font-normal text-blue-400">Review in 7 days</span>
                      </button>
                      <button
                        onClick={() => handleRating(5)}
                        className="p-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold flex flex-col items-center gap-1 transition-all"
                      >
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"/> Master (5)</span>
                        <span className="text-[9px] font-normal text-emerald-400">Mastered ✓</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Quiz Completed Screen */
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-300 dark:border-emerald-800 flex items-center justify-center mx-auto">
                <Award size={36} />
              </div>

              <div className="space-y-1">
                <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white">Quiz Challenge Complete!</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Great job actively testing your memory &amp; technical comprehension.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-sm mx-auto flex items-center justify-around">
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase">Recall Score</div>
                  <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{calculateMasteryScore()}%</div>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:border-slate-700" />
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase">Questions Tested</div>
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{questions.length}</div>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsQuizStarted(false)}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-extrabold hover:bg-slate-200 transition-colors flex items-center gap-2"
                >
                  <RotateCcw size={15} />
                  <span>Try Another Quiz</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-extrabold hover:bg-blue-700 transition-colors shadow-md"
                >
                  Return to Learning Page
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
