import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminScraperPage from "../pages/Admin/AdminScraperPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("../services/jobSources.service", () => ({
  jobSourcesService: {
    list: vi.fn().mockResolvedValue([
      { id: "1", company_name: "Greenhouse Tech Pipeline", scrape_method: "greenhouse", url: "https://boards.greenhouse.io/tech", status: "verified" },
      { id: "2", company_name: "Lever AI Roles", scrape_method: "lever", url: "https://jobs.lever.co/ai", status: "recent" }
    ]),
    verify: vi.fn().mockResolvedValue({ status: "ok" }),
  },
}));

describe("AdminScraperPage Component", () => {
  const createQueryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

  it("renders page header and metric counters", async () => {
    render(
      <QueryClientProvider client={createQueryClient()}>
        <AdminScraperPage />
      </QueryClientProvider>
    );

    expect(screen.getByText("Scraper Engine Monitor")).toBeInTheDocument();
    expect(await screen.findByText("Greenhouse Tech Pipeline")).toBeInTheDocument();
    expect(screen.getByText("Lever AI Roles")).toBeInTheDocument();
  });
});
