/**
 * useTokenRefresh
 *
 * Proactively refreshes the access token 5 minutes before it expires,
 * preventing mid-session 401 errors for active users.
 *
 * Usage: Call once at the app root (e.g. inside AuthProvider or App.tsx).
 *
 * How it works:
 * 1. Reads the stored access token and decodes its `exp` claim.
 * 2. Schedules a refresh setTimeout for (exp - 5 minutes - now).
 * 3. On refresh success, the new tokens are stored, and a new timer fires.
 * 4. If the user is not authenticated (no token / already expired), no timer fires.
 */
import { useEffect, useRef } from "react";
import { api } from "../services/api";
import type { TokenResponse } from "../types/auth.types";

const ACCESS_KEY = "denno_access_token";
const REFRESH_KEY = "denno_refresh_token";
const REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

function getTokenExpiry(token: string): number | null {
  try {
    const base64 = token.split(".")[1];
    const payload = JSON.parse(atob(base64.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function useTokenRefresh(): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRefresh = () => {
    // Clear any existing timer before scheduling a new one
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const token = localStorage.getItem(ACCESS_KEY);
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (!token || !refreshToken) return;

    const expiry = getTokenExpiry(token);
    if (!expiry) return;

    const delay = expiry - Date.now() - REFRESH_BUFFER_MS;
    if (delay <= 0) {
      // Token already expired or expiring very soon — refresh immediately
      doRefresh(refreshToken);
      return;
    }

    timerRef.current = setTimeout(() => doRefresh(refreshToken), delay);
  };

  const doRefresh = async (refreshToken: string) => {
    try {
      const tokens = await api.post<TokenResponse>("/auth/refresh", {
        refresh_token: refreshToken,
      });
      localStorage.setItem(ACCESS_KEY, tokens.access_token);
      localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
      // Schedule the next refresh cycle for the new token
      scheduleRefresh();
    } catch {
      // Refresh failed (token revoked, server error, etc.)
      // Clear tokens and let the app's 401 handler redirect to login.
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
    }
  };

  useEffect(() => {
    scheduleRefresh();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []); // Runs once on mount; timer self-renews after each successful refresh
}
