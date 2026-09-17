import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught render error:", error, errorInfo);

    // Auto-reload on dynamic chunk loading failures (happens after new Vercel/Render deployments)
    const isChunkLoadError =
      error?.name === "ChunkLoadError" ||
      /Failed to fetch dynamically imported module/i.test(error?.message || "") ||
      /Failed to load module script/i.test(error?.message || "") ||
      /Importing a module script failed/i.test(error?.message || "");

    if (isChunkLoadError) {
      const reloadKey = "denno_chunk_reload_timestamp";
      const lastReload = Number(sessionStorage.getItem(reloadKey) || "0");
      // Prevent infinite reloads if network is truly down (only reload once per 10 seconds)
      if (Date.now() - lastReload > 10_000) {
        sessionStorage.setItem(reloadKey, String(Date.now()));
        console.warn("Dynamic module import failed due to deployment update. Auto-reloading page...");
        window.location.reload();
      }
    }
  }

  public render() {
    if (this.state.hasError) {
      const isChunkError =
        /Failed to fetch dynamically imported module/i.test(this.state.error?.message || "") ||
        /Failed to load module script/i.test(this.state.error?.message || "");

      return (
        <div className="p-8 max-w-2xl mx-auto my-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl text-center space-y-4">
          <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950/60 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-900">
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            {isChunkError ? "App Updated — Refresh Required" : "Something went wrong on this page"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-left overflow-x-auto">
            {isChunkError
              ? "A new version of Denno was deployed. Please reload to load the latest features."
              : this.state.error?.message || "Unknown rendering exception"}
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                sessionStorage.removeItem("denno_chunk_reload_timestamp");
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md"
            >
              <RefreshCw size={14} /> Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
