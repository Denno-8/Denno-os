import { api } from "./api";
import type { TokenResponse, CurrentUser } from "../types/auth.types";

/**
 * Token storage strategy:
 *
 * - Access token  → sessionStorage  (cleared on tab/window close; JS-readable
 *                                    is acceptable since it's short-lived ~60 min)
 * - Refresh token → httpOnly cookie  (set by the server; JS cannot read or steal
 *                                    it even under XSS — the server reads it via
 *                                    Cookie header on POST /auth/refresh)
 *
 * Why not localStorage?  It persists across browser restarts and is readable by
 * any same-origin script, making long-lived refresh tokens a prime XSS target.
 */

const ACCESS_KEY = "denno_access_token";

function storeTokens(tokens: TokenResponse) {
  // Store only the access token client-side; the refresh token arrives as
  // an httpOnly cookie set by the server — we intentionally never touch it.
  sessionStorage.setItem(ACCESS_KEY, tokens.access_token);
}

function clearTokens() {
  sessionStorage.removeItem(ACCESS_KEY);
  // No need to remove the refresh token — the server clears the cookie on logout.
}

/** Decode the JWT payload without verifying the signature (client-side only). */
function _decodePayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1];
    return JSON.parse(atob(base64.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

export const authService = {
  async register(email: string, password: string, firstName: string, lastName: string) {
    const tokens = await api.post<TokenResponse>("/auth/register", {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
    });
    storeTokens(tokens);
    return tokens;
  },

  async login(email: string, password: string) {
    const tokens = await api.post<TokenResponse>("/auth/login", { email, password });
    storeTokens(tokens);
    return tokens;
  },

  me: () => api.get<CurrentUser>("/auth/me"),

  updateProfile: (data: Partial<CurrentUser>) =>
    api.patch<CurrentUser>("/auth/profile", data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<{ message: string }>("/auth/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
    }),

  requestPasswordReset: (email: string) =>
    api.post<{ message: string }>("/auth/request-password-reset", { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post<{ message: string }>("/auth/reset-password", { token, new_password: newPassword }),

  async logout() {
    try {
      // Tell the server to revoke both tokens and clear the httpOnly cookie.
      // The server reads the refresh token from the Cookie header automatically.
      await api.post("/auth/logout", {});
    } catch {
      // If the server call fails (offline), still clear local storage so
      // the user is signed out of this browser session.
    }
    clearTokens();
  },

  /**
   * Returns true only if a non-expired access token is present.
   * Checks the JWT `exp` claim client-side to avoid treating expired
   * stored tokens as valid sessions.
   */
  isAuthenticated(): boolean {
    const token = sessionStorage.getItem(ACCESS_KEY);
    if (!token) return false;
    const payload = _decodePayload(token);
    if (!payload || typeof payload.exp !== "number") return false;
    // 10-second buffer so we don't send requests with a token that expires
    // in the next few seconds (avoids a race between expiry check and request).
    return payload.exp * 1000 > Date.now() + 10_000;
  },

  /** Expose the raw access token for Authorization header injection in api.ts. */
  getAccessToken(): string | null {
    return sessionStorage.getItem(ACCESS_KEY);
  },
};
