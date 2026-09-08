import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ApiErrorCard from "../../components/ApiErrorCard";
import { GraduationCap, Plus, Trash2, Edit3, X, BookOpen, Clock, ExternalLink, ArrowLeft } from "lucide-react";
import { useCourses, useCreateCourse, useDeleteCourse } from "../../hooks/useLearning";

export default function AdminCoursesPage() {
  const navigate = useNavigate();
  const { data: courses, isLoading, isError, refetch } = useCourses();
  const deleteCourse = useDeleteCourse();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");

  if (isLoading) return <div className="p-6 text-sm text-slate-500">Loading course management…</div>;
  if (isError) return <ApiErrorCard onRetry={refetch} />;

  const filtered = (courses ?? []).filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate("/admin")}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors mb-2"
          >
            <ArrowLeft size={13} /> Back to Admin Overview
          </button>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Manage Learning Catalog</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Admin Course CMS · Shared platform learning catalog</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 shadow-md transition-all hover:scale-[1.02]"
        >
          <Plus size={16} />
          <span>Add Course</span>
        </button>
      </div>

      <div className="flex gap-3">
        <input
          className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 shadow-xs"
          placeholder="Filter courses by title or category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="p-4">Title</th>
              <th className="p-4">Category</th>
              <th className="p-4">Lessons</th>
              <th className="p-4">Duration</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {filtered.map((course) => (
              <tr key={course.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="p-4 font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {course.title}
                </td>
                <td className="p-4">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {course.category}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1 font-semibold">
                    <BookOpen size={13} className="text-slate-400" />
                    <span>{course.lesson_count} lessons</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1 font-semibold">
                    <Clock size={13} className="text-slate-400" />
                    <span>{course.duration_minutes || 120} mins</span>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => deleteCourse.mutate(course.id)}
                    className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors"
                    title="Delete Course"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  No courses found in catalog.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && <AddCourseModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function AddCourseModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Cybersecurity");
  const [lessonCount, setLessonCount] = useState(10);
  const createCourse = useCreateCourse();

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Add New Catalog Course</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <input className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none placeholder:text-slate-400" placeholder="Course Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none font-medium" value={category} onChange={(e) => setCategory(e.target.value)}>
            {["Cybersecurity", "Ethical Hacking", "Digital Forensics", "Cloud", "DevOps", "Backend", "Frontend", "Database"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none font-medium" placeholder="Total Lesson Count" value={lessonCount} onChange={(e) => setLessonCount(parseInt(e.target.value) || 1)} />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            disabled={!title.trim()}
            onClick={() => createCourse.mutate({ title, category, lesson_count: lessonCount }, { onSuccess: onClose })}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors shadow-sm"
          >
            Create Course
          </button>
          <button onClick={onClose} className="flex-1 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl py-2.5 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  );
}
