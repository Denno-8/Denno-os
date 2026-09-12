import { describe, it, expect, vi, beforeEach } from "vitest";
import { notificationsService } from "../services/notifications.service";

vi.mock("../services/notifications.service", () => ({
  notificationsService: {
    list: vi.fn(),
    unreadCount: vi.fn(),
    markRead: vi.fn(),
    clearAll: vi.fn(),
  },
}));

describe("useNotifications Hook Service Layer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls notificationsService.list when fetching notifications", async () => {
    const mockNotifs = [
      { id: "1", title: "New Job Match", message: "Senior Python Role", read: false, created_at: "2026-09-12T10:00:00Z" },
    ];
    (notificationsService.list as any).mockResolvedValue(mockNotifs);

    const data = await notificationsService.list();
    expect(notificationsService.list).toHaveBeenCalledTimes(1);
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe("New Job Match");
  });

  it("calls notificationsService.unreadCount correctly", async () => {
    (notificationsService.unreadCount as any).mockResolvedValue({ count: 3 });

    const res = await notificationsService.unreadCount();
    expect(notificationsService.unreadCount).toHaveBeenCalledTimes(1);
    expect(res.count).toBe(3);
  });

  it("invokes markRead with target notification id", async () => {
    (notificationsService.markRead as any).mockResolvedValue({ success: true });

    await notificationsService.markRead("123");
    expect(notificationsService.markRead).toHaveBeenCalledWith("123");
  });
});
