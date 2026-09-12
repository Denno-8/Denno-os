import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import LoginPage from "./pages/Auth/LoginPage";
import OnboardingPage from "./pages/Auth/OnboardingPage";
import OAuthCallbackPage from "./pages/Auth/OAuthCallbackPage";
import AppLayout from "./routes/AppLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminRoute from "./routes/AdminRoute";
import { authService } from "./services/auth.service";
import { ThemeProvider } from "./context/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";

// Code split non-critical routes so Login Page loads in < 50ms
const ApplicationsPage = lazy(() => import("./pages/Applications/ApplicationsPage"));
const JobsPage = lazy(() => import("./pages/Jobs/JobsPage"));
const CompaniesPage = lazy(() => import("./pages/Companies/CompaniesPage"));
const EmailsPage = lazy(() => import("./pages/Emails/EmailsPage"));
const CVPage = lazy(() => import("./pages/CV/CVPage"));
const CVGeneratorPage = lazy(() => import("./pages/CV/CVGeneratorPage"));
const CoverLetterPage = lazy(() => import("./pages/CoverLetter/CoverLetterPage"));
const LearningPage = lazy(() => import("./pages/Learning/LearningPage"));
const InterviewsPage = lazy(() => import("./pages/Interviews/InterviewsPage"));
const CalendarPage = lazy(() => import("./pages/Calendar/CalendarPage"));
const GoalsPage = lazy(() => import("./pages/Goals/GoalsPage"));
const NotesPage = lazy(() => import("./pages/Notes/NotesPage"));
const RecruitersPage = lazy(() => import("./pages/Recruiters/RecruitersPage"));
const JobSourcesPage = lazy(() => import("./pages/JobSources/JobSourcesPage"));
const DataTransferPage = lazy(() => import("./pages/DataTransfer/DataTransferPage"));
const SettingsPage = lazy(() => import("./pages/Settings/SettingsPage"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
const AdminScraperPage = lazy(() => import("./pages/Admin/AdminScraperPage"));
const AdminUsersPage = lazy(() => import("./pages/Admin/AdminUsersPage"));
const AdminJobsPage = lazy(() => import("./pages/Admin/AdminJobsPage"));
const AdminCompaniesPage = lazy(() => import("./pages/Admin/AdminCompaniesPage"));
const AdminCoursesPage = lazy(() => import("./pages/Admin/AdminCoursesPage"));
const AdminSettingsPage = lazy(() => import("./pages/Admin/AdminSettingsPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,                // don't double-wait on failures
      refetchOnWindowFocus: false, // don't re-fetch when user alt-tabs back
      staleTime: 30_000,           // treat data as fresh for 30s — eliminates re-fetches on tab switch
      gcTime: 5 * 60_000,          // keep data in memory for 5 min after unmount — navigating back is instant
    },
  },
});

function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-900/50 mb-3 border border-white/10">
        D
      </div>
      <div className="text-sm font-extrabold text-slate-200">Denno</div>
      <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-blue-500 animate-spin mt-4" />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Navigate to={authService.isAuthenticated() ? "/applications" : "/login"} replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />

              {/* OAuth callback routes — Google and LinkedIn redirect here after consent screen */}
              <Route path="/auth/google/callback" element={<OAuthCallbackPage />} />
              <Route path="/auth/linkedin/callback" element={<OAuthCallbackPage />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<ErrorBoundary><AppLayout /></ErrorBoundary>}>
                  <Route path="/applications" element={<ApplicationsPage />} />
                  <Route path="/jobs" element={<JobsPage />} />
                  <Route path="/companies" element={<CompaniesPage />} />
                  <Route path="/emails" element={<EmailsPage />} />
                  <Route path="/cv" element={<CVPage />} />
                  <Route path="/cv-generator" element={<CVGeneratorPage />} />
                  <Route path="/cover-letter" element={<CoverLetterPage />} />
                  <Route path="/learning" element={<LearningPage />} />
                  <Route path="/interviews" element={<InterviewsPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/goals" element={<GoalsPage />} />
                  <Route path="/notes" element={<NotesPage />} />
                  <Route path="/recruiters" element={<RecruitersPage />} />
                  <Route path="/job-sources" element={<JobSourcesPage />} />
                  <Route path="/data" element={<DataTransferPage />} />
                  <Route path="/settings" element={<SettingsPage />} />

                  {/* ── Admin-only routes ── */}
                  <Route element={<AdminRoute />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/scrapers" element={<AdminScraperPage />} />
                    <Route path="/admin/users" element={<AdminUsersPage />} />
                    <Route path="/admin/jobs" element={<AdminJobsPage />} />
                    <Route path="/admin/companies" element={<AdminCompaniesPage />} />
                    <Route path="/admin/courses" element={<AdminCoursesPage />} />
                    <Route path="/admin/settings" element={<AdminSettingsPage />} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<Navigate to={authService.isAuthenticated() ? "/applications" : "/login"} replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
