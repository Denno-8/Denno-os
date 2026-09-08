import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const ACCESS_KEY = "denno_access_token";

/**
 * OAuthCallbackPage
 * ─────────────────
 * This page lives at any route that the backend redirects to after a
 * successful Google / LinkedIn OAuth login. The backend appends
 * `?token=<access_jwt>` to the redirect URL. We:
 *   1. Read and store the access token in sessionStorage.
 *   2. Replace the URL (to remove ?token= from history).
 *   3. Navigate to the dashboard.
 */
export default function OAuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get("token");
    if (token) {
      sessionStorage.setItem(ACCESS_KEY, token);
      // Replace current history entry to strip the token from the URL bar
      window.history.replaceState({}, document.title, "/");
      navigate("/applications", { replace: true });
    } else {
      setError("OAuth login failed — no token received. Please try again.");
    }
  }, [params, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-8 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center font-black text-2xl shadow-lg">
          D
        </div>
        <p className="text-rose-400 font-semibold text-sm text-center max-w-sm">{error}</p>
        <button
          onClick={() => navigate("/login", { replace: true })}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors"
        >
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white gap-4">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center font-black text-2xl shadow-lg">
        D
      </div>
      <div className="text-sm font-bold text-slate-300">Signing you in…</div>
      <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-blue-400 animate-spin" />
    </div>
  );
}
