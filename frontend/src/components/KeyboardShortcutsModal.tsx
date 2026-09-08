import React from "react";
import { X, Command, Keyboard } from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const SHORTCUTS = [
    { key: "?", description: "Open keyboard shortcuts help modal" },
    { key: "/", description: "Focus global search bar" },
    { key: "G then J", description: "Navigate to Job Feed" },
    { key: "G then A", description: "Navigate to Applications Tracker" },
    { key: "G then L", description: "Navigate to Learning Academy" },
    { key: "G then I", description: "Navigate to Interview Readiness" },
    { key: "G then N", description: "Navigate to Knowledge Base Notes" },
    { key: "G then C", description: "Navigate to CV Manager" },
    { key: "Esc", description: "Close open modal or drawer" },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Keyboard size={18} />
            </div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white m-0">Keyboard Shortcuts</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-medium">{s.description}</span>
              <kbd className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono font-bold text-[11px] shadow-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 text-center text-[11px] text-slate-400 font-medium">
          Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border font-mono">Esc</kbd> to close at any time
        </div>
      </div>
    </div>
  );
}
