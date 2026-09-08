/**
 * StructuredCVEditor
 *
 * Parses a flat CV plain-text string into named sections and renders each one
 * as an individually editable textarea. Any change rebuilds the full text and
 * calls `onChange` so the parent can persist it via the normal PATCH endpoint.
 *
 * Recognised section headers (case-insensitive) that appear as numbered lines
 * like "1. EXECUTIVE SUMMARY" or bare ALLCAPS headers:
 *   EXECUTIVE SUMMARY / PROFESSIONAL SUMMARY / ABOUT
 *   CORE TECHNICAL SKILLS / SKILLS
 *   PROFESSIONAL WORK EXPERIENCE / EXPERIENCE
 *   KEY PROJECTS / PROJECTS
 *   EDUCATION / CREDENTIALS
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  User, Code2, Briefcase, FolderOpen, GraduationCap, ChevronDown,
  ChevronUp, Save, RotateCcw, Sparkles,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CVSection {
  key: string;
  label: string;
  icon: React.ReactNode;
  rawHeader: string; // the original header line found in text
  content: string;
  color: string; // tailwind accent
}

interface StructuredCVEditorProps {
  /** Raw plain-text CV content */
  content: string;
  /** Called whenever any section is edited — passes the reassembled full text */
  onChange: (fullContent: string) => void;
  /** Whether the Save button is loading */
  isSaving?: boolean;
  /** Called when user clicks the save button */
  onSave?: () => void;
  /** Called when user cancels edits (reset to original) */
  onCancel?: () => void;
  /** Show save/cancel toolbar buttons */
  showToolbar?: boolean;
}

// ─── Section detection ───────────────────────────────────────────────────────

const SECTION_PATTERNS: { key: string; label: string; icon: React.ReactNode; color: string; patterns: RegExp[] }[] = [
  {
    key: "summary",
    label: "Professional Summary",
    icon: <User size={14} />,
    color: "blue",
    patterns: [
      /executive\s+summary/i,
      /professional\s+summary/i,
      /about\s*\/?\s*professional/i,
      /\bsummary\b/i,
      /\babout\b/i,
      /\bprofile\b/i,
      /\bobjective\b/i,
    ],
  },
  {
    key: "skills",
    label: "Core Skills & Keywords",
    icon: <Code2 size={14} />,
    color: "violet",
    patterns: [
      /core\s+technical\s+skills/i,
      /technical\s+skills/i,
      /\bskills\b/i,
      /keywords/i,
      /competencies/i,
      /technologies/i,
      /tech\s+stack/i,
    ],
  },
  {
    key: "experience",
    label: "Work Experience",
    icon: <Briefcase size={14} />,
    color: "emerald",
    patterns: [
      /professional\s+work\s+experience/i,
      /work\s+experience/i,
      /\bexperience\b/i,
      /accomplishments/i,
      /employment\s+history/i,
      /career\s+history/i,
      /work\s+history/i,
    ],
  },
  {
    key: "projects",
    label: "Key Projects",
    icon: <FolderOpen size={14} />,
    color: "amber",
    patterns: [
      /key\s+projects/i,
      /notable\s+projects/i,
      /portfolio/i,
      /\bprojects\b/i,
    ],
  },
  {
    key: "education",
    label: "Education & Credentials",
    icon: <GraduationCap size={14} />,
    color: "rose",
    patterns: [
      /education\s*&?\s*(?:professional\s+)?credentials/i,
      /\beducation\b/i,
      /credentials/i,
      /certifications/i,
      /qualifications/i,
      /academic/i,
    ],
  },
];

/** Returns true if a line is a pure separator (=====, -----, *****) */
const isSeparatorLine = (line: string) => /^[=\-*_#]{4,}\s*$/.test(line.trim());

// ─── Parser ──────────────────────────────────────────────────────────────────

function parseIntoSections(raw: string): CVSection[] {
  if (!raw?.trim()) return [];

  const lines = raw.split("\n");

  /** find which section definition matches a line header */
  const matchSection = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed || isSeparatorLine(trimmed)) return null;
    // Strip leading numbers "1. ", markdown "## ", separator chars
    const cleaned = trimmed
      .replace(/^[\d]+\.\s*/, "")
      .replace(/^[#]+\s*/, "")
      .replace(/[\-=*_]{3,}\s*$/, "") // trailing separators
      .trim();
    if (!cleaned) return null;
    return SECTION_PATTERNS.find((sp) => sp.patterns.some((p) => p.test(cleaned))) ?? null;
  };

  interface Chunk { sectionKey: string | null; rawHeader: string; lines: string[] }
  const chunks: Chunk[] = [];
  let current: Chunk = { sectionKey: null, rawHeader: "", lines: [] };

  for (const line of lines) {
    const sp = matchSection(line);
    if (sp) {
      // push previous chunk
      if (current.lines.length > 0 || current.sectionKey) {
        chunks.push({ ...current });
      }
      current = { sectionKey: sp.key, rawHeader: line, lines: [] };
    } else if (isSeparatorLine(line)) {
      // Skip pure separator lines (=====, -----) — don't add to content
      continue;
    } else {
      current.lines.push(line);
    }
  }
  if (current.lines.length > 0 || current.sectionKey) {
    chunks.push(current);
  }

  // Build result — unknown leading lines go into a "header" pseudo-section
  const result: CVSection[] = [];

  for (const chunk of chunks) {
    if (!chunk.sectionKey) {
      // Header / name block — always include
      result.push({
        key: "_header",
        label: "Header / Contact Info",
        icon: <User size={14} />,
        rawHeader: "",
        content: chunk.lines.join("\n").trim(),
        color: "slate",
      });
      continue;
    }
    const sp = SECTION_PATTERNS.find((s) => s.key === chunk.sectionKey)!;
    result.push({
      key: sp.key,
      label: sp.label,
      icon: sp.icon,
      rawHeader: chunk.rawHeader,
      content: chunk.lines.join("\n").trim(),
      color: sp.color,
    });
  }

  return result;
}

/** Reassemble sections back into a flat text string */
function assembleFromSections(sections: CVSection[]): string {
  return sections
    .map((s) => {
      if (s.key === "_header") return s.content;
      return `${s.rawHeader}\n${s.content}`;
    })
    .join("\n\n");
}

// ─── Color helpers ────────────────────────────────────────────────────────────

const colorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-700 dark:text-blue-300",
    badge: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
  },
  violet: {
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-200 dark:border-violet-800",
    text: "text-violet-700 dark:text-violet-300",
    badge: "bg-violet-100 dark:bg-violet-900 text-violet-800 dark:text-violet-200",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-700 dark:text-emerald-300",
    badge: "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-300",
    badge: "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200",
  },
  rose: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-200 dark:border-rose-800",
    text: "text-rose-700 dark:text-rose-300",
    badge: "bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200",
  },
  slate: {
    bg: "bg-slate-50 dark:bg-slate-800/60",
    border: "border-slate-200 dark:border-slate-700",
    text: "text-slate-700 dark:text-slate-300",
    badge: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function StructuredCVEditor({
  content,
  onChange,
  isSaving = false,
  onSave,
  onCancel,
  showToolbar = true,
}: StructuredCVEditorProps) {
  const [sections, setSections] = useState<CVSection[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const originalRef = React.useRef(content);

  useEffect(() => {
    const parsed = parseIntoSections(content);
    setSections(parsed);
    originalRef.current = content;
    // Expand all by default
    const init: Record<string, boolean> = {};
    parsed.forEach((s) => { init[s.key] = false; });
    setCollapsed(init);
  }, [content]);

  const handleSectionChange = useCallback(
    (key: string, newContent: string) => {
      setSections((prev) => {
        const updated = prev.map((s) =>
          s.key === key ? { ...s, content: newContent } : s
        );
        onChange(assembleFromSections(updated));
        return updated;
      });
    },
    [onChange]
  );

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleReset = () => {
    const parsed = parseIntoSections(originalRef.current);
    setSections(parsed);
    onChange(originalRef.current);
    if (onCancel) onCancel();
  };

  if (sections.length === 0 || sections.every((s) => s.key === "_header")) {
    // No recognisable sections — show a helpful raw editor so the user isn't stuck
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs">
          <Sparkles size={14} className="text-amber-500 shrink-0" />
          <span className="text-amber-800 dark:text-amber-200 font-semibold">
            No standard section headings detected. Edit the raw text below, then the section detector will re-parse it once you save.
          </span>
        </div>
        <textarea
          defaultValue={content}
          onChange={(e) => onChange(e.target.value)}
          rows={16}
          placeholder="Paste your full CV text here. Add section headings like:\n1. PROFESSIONAL SUMMARY\n2. SKILLS\n3. WORK EXPERIENCE\n4. EDUCATION"
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono leading-relaxed text-slate-800 dark:text-slate-200 outline-none focus:border-blue-400 resize-y transition-colors"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      {showToolbar && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {sections.length} Sections Detected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors"
            >
              <RotateCcw size={12} /> Reset
            </button>
            {onSave && (
              <button
                type="button"
                onClick={onSave}
                disabled={isSaving}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                <Save size={12} />
                {isSaving ? "Saving…" : "Save All Sections"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Section Cards */}
      {sections.map((section) => {
        const c = colorMap[section.color] ?? colorMap.slate;
        const isCollapsed = collapsed[section.key] ?? false;
        return (
          <div
            key={section.key}
            className={`rounded-2xl border overflow-hidden ${c.bg} ${c.border}`}
          >
            {/* Section Header Row */}
            <button
              type="button"
              onClick={() => toggleCollapse(section.key)}
              className={`w-full flex items-center justify-between px-4 py-3 text-left hover:opacity-90 transition-opacity`}
            >
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-lg ${c.badge}`}>
                  {section.icon}
                </span>
                <span className={`text-xs font-extrabold uppercase tracking-wider ${c.text}`}>
                  {section.label}
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  ({section.content.length > 0
                    ? `${section.content.trim().split("\n").length} lines`
                    : "empty"})
                </span>
              </div>
              <span className={`${c.text} opacity-70`}>
                {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
              </span>
            </button>

            {/* Editable Textarea */}
            {!isCollapsed && (
              <div className="border-t border-inherit px-4 pb-4 pt-3">
                <textarea
                  value={section.content}
                  onChange={(e) => handleSectionChange(section.key, e.target.value)}
                  rows={Math.max(4, section.content.split("\n").length + 1)}
                  placeholder={`Enter ${section.label} content…`}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono leading-relaxed text-slate-800 dark:text-slate-200 outline-none focus:border-blue-400 dark:focus:border-blue-500 resize-y transition-colors"
                />
                <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                  <span className="font-mono">{section.content.length}</span> characters
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
