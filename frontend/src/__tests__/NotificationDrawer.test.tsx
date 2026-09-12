import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import NotificationDrawer from "../components/NotificationDrawer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("../hooks/useNotifications", () => ({
  useNotifications: () => ({
    data: [
      { id: "1", type: "match", title: "Job Match Found", message: "AI Engineer at Google", read: false, created_at: "2026-09-12T08:00:00Z" },
    ],
    isLoading: false,
  }),
  useMarkNotificationRead: () => ({ mutate: vi.fn() }),
  useClearNotifications: () => ({ mutate: vi.fn() }),
}));

describe("NotificationDrawer Component", () => {
  const queryClient = new QueryClient();

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <NotificationDrawer isOpen={false} onClose={() => {}} />
      </QueryClientProvider>
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders notification items when isOpen is true", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <NotificationDrawer isOpen={true} onClose={() => {}} />
      </QueryClientProvider>
    );

    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Job Match Found")).toBeInTheDocument();
    expect(screen.getByText("AI Engineer at Google")).toBeInTheDocument();
  });
});
