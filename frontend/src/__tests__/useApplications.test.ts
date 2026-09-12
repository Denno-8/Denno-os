import { describe, it, expect, vi, beforeEach } from "vitest";
import { applicationsService } from "../services/applications.service";

vi.mock("../services/applications.service", () => ({
  applicationsService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("applicationsService Layer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches application list successfully", async () => {
    const mockApps = [{ id: "1", role: "Fullstack Engineer", company_name: "TechCorp", stage: "Applied" }];
    (applicationsService.list as any).mockResolvedValue(mockApps);

    const apps = await applicationsService.list();
    expect(applicationsService.list).toHaveBeenCalledTimes(1);
    expect(apps[0].role).toBe("Fullstack Engineer");
  });

  it("creates new job application entry", async () => {
    const newApp = { role: "Backend Lead", company_name: "FinTech Inc", stage: "Saved" as const, date_applied: "2026-09-12" };
    (applicationsService.create as any).mockResolvedValue({ id: "2", ...newApp });

    const created = await applicationsService.create(newApp);
    expect(applicationsService.create).toHaveBeenCalledWith(newApp);
    expect(created.id).toBe("2");
  });
});
