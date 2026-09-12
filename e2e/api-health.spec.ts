import { test, expect } from "@playwright/test";

/**
 * API health endpoint smoke tests.
 * Runs against the real backend API (E2E_API_URL env var).
 */

const API_URL = process.env.E2E_API_URL || "http://localhost:8000";

test.describe("API Health Endpoints", () => {
  test("GET /health returns 200 ok", async ({ request }) => {
    const resp = await request.get(`${API_URL}/health`);
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.status).toBe("ok");
  });

  test("GET /health/ready returns postgres and redis status", async ({
    request,
  }) => {
    const resp = await request.get(`${API_URL}/health/ready`);
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body).toHaveProperty("postgres");
    expect(body).toHaveProperty("redis");
    expect(body).toHaveProperty("ready");
  });

  test("Unauthenticated request to protected route returns 401", async ({
    request,
  }) => {
    const resp = await request.get(`${API_URL}/api/v1/applications/`);
    expect(resp.status()).toBe(401);
  });

  test("Security headers are present on all responses", async ({ request }) => {
    const resp = await request.get(`${API_URL}/health`);
    const headers = resp.headers();

    // These must always be present
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBeTruthy();
  });
});
