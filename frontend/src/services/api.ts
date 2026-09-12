export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

/** Read the access token from sessionStorage (set by auth.service). */
function getAccessToken(): string | null {
  return sessionStorage.getItem("denno_access_token");
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
      (status === 0
        ? "Failed to connect to backend server on http://localhost:8000."
        : `API error ${status}`);
    super(detailMsg);
    this.name = "ApiError";
    this.detail = detailMsg;
  }
}

/** Attempt a silent token refresh using the httpOnly cookie. */
async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include", // sends the httpOnly refresh-token cookie
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.access_token) {
      sessionStorage.setItem("denno_access_token", data.access_token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function redirectToLogin() {
  sessionStorage.removeItem("denno_access_token");
  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  _isRetry = false,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include", // always include — needed for the httpOnly refresh cookie
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
        ...(options.headers ?? {}),
      },
    });
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(0, {
      detail: "Failed to connect to Denno API. Please ensure the backend is running on http://localhost:8000.",
      message: err?.message || "Failed to fetch",
    });
  }

  if (!res.ok) {
    // ── Silent refresh on 401 ────────────────────────────────────────────────
    // On any 401 (except login/register/refresh themselves), attempt one
    // automatic token refresh before giving up. This handles the common case
    // where the access token expires mid-session; the user never sees a
    // redirect unless the refresh token is also expired or revoked.
    if (
      res.status === 401 &&
      !_isRetry &&
      !path.includes("/auth/login") &&
      !path.includes("/auth/register") &&
      !path.includes("/auth/refresh")
    ) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        // Retry the original request with the new access token.
        return request<T>(path, options, true);
      }
      redirectToLogin();
    }

    let body: unknown = null;
    try {
      body = await res.json();
    } catch { /* no body */ }
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

