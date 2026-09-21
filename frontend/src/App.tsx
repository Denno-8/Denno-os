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

// Helper to retry dynamic imports when a new deployment updates bundle hashes on Vercel
function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const pageHasBeenRefreshed = sessionStorage.getItem("denno_page_refreshed") === "true";
    try {
      const component = await componentImport();
      sessionStorage.setItem("denno_page_refreshed", "false");
      return component;
    } catch (error: unknown) {
      if (!pageHasBeenRefreshed) {
        sessionStorage.setItem("denno_page_refreshed", "true");
        window.location.reload();
        return new Promise(() => {}) as any; // pause until reload completes
      }
      throw error;
    }
  });
}

// Code split non-critical routes with auto-reload protection on new deployments
const ApplicationsPage = lazyWithRetry(() => import("./pages/Applications/ApplicationsPage"));
const JobsPage = lazyWithRetry(() => import("./pages/Jobs/JobsPage"));
const EmailsPage = lazyWithRetry(() => import("./pages/Emails/EmailsPage"));
const CVPage = lazyWithRetry(() => import("./pages/CV/CVPage"));
const CVGeneratorPage = lazyWithRetry(() => import("./pages/CV/CVGeneratorPage"));
const CoverLetterPage = lazyWithRetry(() => import("./pages/CoverLetter/CoverLetterPage"));
const LearningPage = lazyWithRetry(() => import("./pages/Learning/LearningPage"));
const InterviewsPage = lazyWithRetry(() => import("./pages/Interviews/InterviewsPage"));
const CalendarPage = lazyWithRetry(() => import("./pages/Calendar/CalendarPage"));
const GoalsPage = lazyWithRetry(() => import("./pages/Goals/GoalsPage"));
const NotesPage = lazyWithRetry(() => import("./pages/Notes/NotesPage"));
const JobSourcesPage = lazyWithRetry(() => import("./pages/JobSources/JobSourcesPage"));
const DataTransferPage = lazyWithRetry(() => import("./pages/DataTransfer/DataTransferPage"));
const SettingsPage = lazyWithRetry(() => import("./pages/Settings/SettingsPage"));
const ResetPasswordPage = lazyWithRetry(() => import("./pages/Auth/ResetPasswordPage"));

// Admin pages
const AdminDashboard = lazyWithRetry(() => import("./pages/Admin/AdminDashboard"));
const AdminScraperPage = lazyWithRetry(() => import("./pages/Admin/AdminScraperPage"));
const AdminUsersPage = lazyWithRetry(() => import("./pages/Admin/AdminUsersPage"));
const AdminJobsPage = lazyWithRetry(() => import("./pages/Admin/AdminJobsPage"));
const AdminCompaniesPage = lazyWithRetry(() => import("./pages/Admin/AdminCompaniesPage"));
const AdminCoursesPage = lazyWithRetry(() => import("./pages/Admin/AdminCoursesPage"));
const AdminSettingsPage = lazyWithRetry(() => import("./pages/Admin/AdminSettingsPage"));

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
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Navigate to={authService.isAuthenticated() ? "/applications" : "/login"} replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* OAuth callback routes — Google and LinkedIn redirect here after consent screen */}
                <Route path="/auth/google/callback" element={<OAuthCallbackPage />} />
                <Route path="/auth/linkedin/callback" element={<OAuthCallbackPage />} />

                <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                    <Route path="/applications" element={<ApplicationsPage />} />
                    <Route path="/jobs" element={<JobsPage />} />
                    <Route path="/emails" element={<EmailsPage />} />
                    <Route path="/cv" element={<CVPage />} />
                    <Route path="/cv-generator" element={<CVGeneratorPage />} />
                    <Route path="/cover-letter" element={<CoverLetterPage />} />
                    <Route path="/learning" element={<LearningPage />} />
                    <Route path="/interviews" element={<InterviewsPage />} />
                    <Route path="/calendar" element={<CalendarPage />} />
                    <Route path="/goals" element={<GoalsPage />} />
                    <Route path="/notes" element={<NotesPage />} />
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
          </ErrorBoundary>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
