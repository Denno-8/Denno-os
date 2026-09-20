const rawApiUrl = (import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1").trim();
export const API_URL = rawApiUrl.endsWith("/api/v1")
  ? rawApiUrl
  : `${rawApiUrl.replace(/\/+$/, "")}/api/v1`;

// Base URL without /api/v1 (used for /health ping)
const BASE_URL = API_URL.replace(/\/api\/v1\/?$/, "");

/** Read the access token from sessionStorage/localStorage. */
export function getAccessToken(): string {
  return (
    sessionStorage.getItem("denno_access_token") ||
    localStorage.getItem("denno_access_token") ||
    localStorage.getItem("token") ||
    ""
  );
}

function authHeader(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export class ApiError extends Error {
  public detail: string;

  constructor(public status: number, public body: unknown) {
    const extractedDetail =
      typeof body === "string"
        ? body
        : (body as any)?.detail || (body as any)?.message;
    const detailMsg =
      extractedDetail ||
      (status === 429
        ? "Rate limit reached (Too many requests). Please wait a moment and try again."
        : status === 0
        ? `Cannot reach backend at ${API_URL}. The server may be starting up — please wait a moment and try again.`
        : `API error ${status}`);
    super(detailMsg);
    this.name = "ApiError";
    this.detail = detailMsg;
  }
}

/**
 * Polls /health until Render free-tier instance finishes cold boot.
 * Tries every 2.5 seconds up to maxWaitMs (default 90 seconds).
 */
export async function wakeBackend(maxWaitMs = 60000): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${BASE_URL}/health`, {
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timer);
      if (res.ok) return true;
    } catch {
      // Render free tier is spinning up container — poll every 1.5s
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return false;
}

/** Attempt a silent token refresh using the httpOnly cookie. */
async function tryRefresh(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return false;
    const data = await res.json();
    if (data.access_token) {
      sessionStorage.setItem("denno_access_token", data.access_token);
      return true;
    }
    return false;
  } catch {
    clearTimeout(timer);
    return false;
  }
}

function redirectToLogin() {
  sessionStorage.removeItem("denno_access_token");
  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  _isRetry = false,
): Promise<T> {
  const reqOptions: RequestInit = {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
      ...(options.headers ?? {}),
    },
  };

  let res: Response;
  try {
    // 60-second timeout per attempt
    res = await fetchWithTimeout(`${API_URL}${path}`, reqOptions, 60000);
  } catch (err: any) {
    if (err instanceof ApiError) throw err;

    // On network failure (cold boot connection reset), wake backend actively then retry once
    if (!_isRetry) {
      const awake = await wakeBackend(45000);
      if (awake) {
        return request<T>(path, options, true);
      }
    }

    throw new ApiError(0, {
      detail: `Cannot reach backend at ${API_URL}. The server may still be starting up — please wait a moment and try again.`,
      message: err?.message ?? "Failed to fetch",
    });
  }

  if (!res.ok) {
    // Silent 401 -> refresh -> retry
    if (
      res.status === 401 &&
      !_isRetry &&
      !path.includes("/auth/login") &&
      !path.includes("/auth/register") &&
      !path.includes("/auth/refresh") &&
      !path.includes("/auth/request-password-reset") &&
      !path.includes("/auth/reset-password")
    ) {
      const refreshed = await tryRefresh();
      if (refreshed) return request<T>(path, options, true);
      redirectToLogin();
    }

    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      /* no body */
    }
    throw new ApiError(res.status, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(data) }),
  patch: <T>(path: string, data: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(data) }),
  put: <T>(path: string, data: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(data) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export default api;
