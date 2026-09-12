import { test, expect } from "@playwright/test";

/**
 * Auth flow E2E tests.
 * These target the live (or dev-server) frontend with a real API backend.
 * Use E2E_BASE_URL env var to point at staging.
 *
 * Required env vars:
 *   E2E_TEST_EMAIL    — a registered test account email
 *   E2E_TEST_PASSWORD — that account's password
 */

const TEST_EMAIL = process.env.E2E_TEST_EMAIL || "e2e_test@denno.app";
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || "E2eTestPass!2026";

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("renders login form", async ({ page }) => {
    await expect(page).toHaveTitle(/Denno/i);
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("shows validation errors for empty submit", async ({ page }) => {
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(
      page.getByText(/email is required|please enter your email/i)
    ).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.getByLabel(/email/i).fill("wrong@example.com");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(
      page.getByText(/invalid credentials|incorrect email or password/i)
    ).toBeVisible({ timeout: 8000 });
  });

  test("redirects to /applications on successful login", async ({ page }) => {
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/applications/, { timeout: 10000 });
    await expect(page.getByText(/applications/i).first()).toBeVisible();
  });

  test("unauthenticated users are redirected from protected routes", async ({
    page,
  }) => {
    await page.goto("/applications");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Authenticated — Navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Fast-path: inject auth token into storage instead of logging in via UI
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/applications/, { timeout: 10000 });
  });

  test("sidebar navigation links work", async ({ page }) => {
    // Jobs
    await page.getByRole("link", { name: /jobs/i }).click();
    await expect(page).toHaveURL(/\/jobs/);

    // CV
    await page.getByRole("link", { name: /cv/i }).click();
    await expect(page).toHaveURL(/\/cv/);

    // Goals
    await page.getByRole("link", { name: /goals/i }).click();
    await expect(page).toHaveURL(/\/goals/);
  });

  test("user can log out", async ({ page }) => {
    // Trigger logout (look for profile menu / logout button)
    const logoutBtn = page
      .getByRole("button", { name: /logout|sign out/i })
      .first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    } else {
      // Some UIs put logout inside a menu — open then click
      await page.getByRole("button", { name: /account|profile|menu/i }).first().click();
      await page.getByRole("menuitem", { name: /logout|sign out/i }).click();
    }
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });
});

test.describe("Authenticated — Applications", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/applications/, { timeout: 10000 });
  });

  test("applications page loads and shows content", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /applications/i })).toBeVisible();
    // The page should show either a list or an empty state
    const hasContent =
      (await page.getByTestId("application-card").count()) > 0 ||
      (await page.getByText(/no applications|get started/i).count()) > 0;
    expect(hasContent).toBeTruthy();
  });

  test("can open the add application modal or form", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /add|new application/i }).first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();
    // Modal or form should appear
    await expect(
      page.getByRole("dialog").or(page.getByRole("form"))
    ).toBeVisible({ timeout: 5000 });
  });
});
