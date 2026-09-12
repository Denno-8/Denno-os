import { describe, it, expect, beforeEach } from "vitest";
import { authService } from "../services/auth.service";

// Valid base64 JWT with exp in the future
const futureExp = Math.floor(Date.now() / 1000) + 3600;
const mockPayload = btoa(JSON.stringify({ sub: "1", role: "user", exp: futureExp }));
const mockJwtToken = `header.${mockPayload}.signature`;

describe("authService Authentication Utilities", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("returns false for isAuthenticated when token is absent", () => {
    expect(authService.isAuthenticated()).toBe(false);
  });

  it("returns true for isAuthenticated when valid token exists in sessionStorage", () => {
    sessionStorage.setItem("denno_access_token", mockJwtToken);
    expect(authService.isAuthenticated()).toBe(true);
  });

  it("clears storage when logout is called", async () => {
    sessionStorage.setItem("denno_access_token", mockJwtToken);
    await authService.logout();
    expect(sessionStorage.getItem("denno_access_token")).toBeNull();
    expect(authService.isAuthenticated()).toBe(false);
  });
});
