import { useState } from "react";
import { X, Check, Plus, Trash2, BookOpen, Star } from "lucide-react";
import { api } from "../services/api";

interface QuestionItem {
  question: string;
  answer_given: string;
  quality_rating: number;
}

interface PostMortemModalProps {
  isOpen: boolean;
  onClose: () => void;
  interviewId: string;
  companyName?: string;
  interviewType?: string;
  onSuccess: () => void;
}

export default function PostMortemModal({
  isOpen,
  onClose,
  interviewId,
  companyName = "Company",
  interviewType = "Technical",
  onSuccess,
}: PostMortemModalProps) {
  const [questions, setQuestions] = useState<QuestionItem[]>([
    { question: "Tell me about a time you resolved a database deadlock.", answer_given: "Explained Postgres row locking and isolation levels.", quality_rating: 4 },
  ]);
  const [whatWentWell, setWhatWentWell] = useState("Clear technical explanation of system architecture and concurrency patterns.");
  const [whatToImprove, setWhatToImprove] = useState("Keep code examples more concise when writing on the live codepad.");
  const [confidence, setConfidence] = useState(8);
  const [outcome, setOutcome] = useState("Passed");
  const [followUp, setFollowUp] = useState("Send thank you email to engineering lead");
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const addQuestion = () => {
    setQuestions([...questions, { question: "", answer_given: "", quality_rating: 3 }]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post(`/interviews/${interviewId}/post-mortem`, {
        questions_asked: questions.filter((q) => q.question.trim()),
        what_went_well: whatWentWell,
        what_to_improve: whatToImprove,
        overall_confidence: confidence,
        outcome: outcome,
        follow_up_actions: followUp.split(",").map((s) => s.trim()).filter(Boolean),
      });
      onSuccess();
      onClose();
    } catch (e) {
      console.error("Failed to save post-mortem", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Structured Post-Mortem Reflection</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {interviewType} Interview at {companyName} · Auto-feeds into your Knowledge Base
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={18} />
          </button>
        </div>

        {/* Confidence & Outcome */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Overall Performance Confidence ({confidence}/10)
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Interview Outcome</label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs font-semibold outline-none"
            >
              <option value="Passed">Passed / Advanced</option>
              <option value="Pending">Pending Decision</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Questions Asked Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              Questions Asked & Answers Given ({questions.length})
            </h4>
            <button
              onClick={addQuestion}
              className="text-xs text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1 hover:underline"
            >
              <Plus size={14} /> Add Question
            </button>
          </div>

          {questions.map((q, idx) => (
            <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex gap-2">
                <input
                  placeholder="Question asked by interviewer..."
                  value={q.question}
                  onChange={(e) => {
                    const next = [...questions];
                    next[idx].question = e.target.value;
                    setQuestions(next);
                  }}
                  className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none"
                />
                <select
                  value={q.quality_rating}
                  onChange={(e) => {
                    const next = [...questions];
                    next[idx].quality_rating = Number(e.target.value);
                    setQuestions(next);
                  }}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-lg px-2 text-slate-900 dark:text-white outline-none"
                >
                  <option value={5}>5 ★ (Perfect)</option>
                  <option value={4}>4 ★ (Good)</option>
                  <option value={3}>3 ★ (Average)</option>
                  <option value={2}>2 ★ (Weak)</option>
                  <option value={1}>1 ★ (Flunked)</option>
                </select>
                <button onClick={() => removeQuestion(idx)} className="text-red-400 hover:text-red-600 p-1">
                  <Trash2 size={14} />
                </button>
              </div>
              <textarea
                placeholder="Summary of how you answered..."
                value={q.answer_given}
                onChange={(e) => {
                  const next = [...questions];
                  next[idx].answer_given = e.target.value;
                  setQuestions(next);
                }}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none h-14"
              />
            </div>
          ))}
        </div>

        {/* Reflection text areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">What Went Well?</label>
            <textarea
              value={whatWentWell}
              onChange={(e) => setWhatWentWell(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white outline-none h-20"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">What to Improve Next Time?</label>
            <textarea
              value={whatToImprove}
              onChange={(e) => setWhatToImprove(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white outline-none h-20"
            />
          </div>
        </div>

        {/* Follow up actions */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Follow-up Action Items (Comma Separated)</label>
          <input
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors shadow-md disabled:opacity-50"
          >
            <Check size={14} />
            <span>{saving ? "Saving & Feeding Knowledge Base…" : "Save & Feed Knowledge Base"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
