import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Mail,
  Radio,
  Target,
  Bell,
  Sparkles,
  X,
  Trash2,
  CheckCheck,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  ExternalLink,
  Check,
} from "lucide-react";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkNotificationUnread,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useBatchMarkNotificationsRead,
  useBatchDeleteNotifications,
  useClearNotifications,
} from "../hooks/useNotifications";
import { NotificationItem } from "../services/notifications.service";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type ReadFilter = "all" | "unread" | "read";
type TypeFilter = "all" | "application" | "email" | "job_source" | "match";

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return "Just now";
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const navigate = useNavigate();
  const { data: notifications, isLoading } = useNotifications();

  const markRead = useMarkNotificationRead();
  const markUnread = useMarkNotificationUnread();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotif = useDeleteNotification();
  const batchMarkRead = useBatchMarkNotificationsRead();
  const batchDelete = useBatchDeleteNotifications();
  const clearAll = useClearNotifications();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  if (!isOpen) return null;

  const items: NotificationItem[] = notifications ?? [];
  const unreadItems = items.filter((n) => !n.read);

  // Filtered notifications
  const filteredItems = items.filter((n) => {
    if (readFilter === "unread" && n.read) return false;
    if (readFilter === "read" && !n.read) return false;
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    return true;
  });

  const allFilteredSelected =
    filteredItems.length > 0 && filteredItems.every((n) => selectedIds.includes(n.id));

  // Toggle single selection
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select / Deselect All in current view
  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      const currentFilteredSet = new Set(filteredItems.map((n) => n.id));
      setSelectedIds((prev) => prev.filter((id) => !currentFilteredSet.has(id)));
    } else {
      const newIds = new Set([...selectedIds, ...filteredItems.map((n) => n.id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const handleBatchMarkRead = (read: boolean) => {
    if (selectedIds.length === 0) return;
    if (batchMarkRead?.mutate) {
      batchMarkRead.mutate({ ids: selectedIds, read });
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    if (batchDelete?.mutate) {
      batchDelete.mutate(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleItemClick = (n: NotificationItem) => {
    if (!n.read && markRead?.mutate) {
      markRead.mutate(n.id);
    }
    if (n.link) {
      onClose();
      navigate(n.link);
    }
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case "application":
        return <ClipboardList size={17} className="text-blue-500 dark:text-blue-400" />;
      case "email":
        return <Mail size={17} className="text-purple-500 dark:text-purple-400" />;
      case "job_source":
        return <Radio size={17} className="text-emerald-500 dark:text-emerald-400" />;
      case "match":
        return <Target size={17} className="text-amber-500 dark:text-amber-400" />;
      default:
        return <Bell size={17} className="text-indigo-400" />;
    }
  };

  const renderTypeLabel = (type: string) => {
    switch (type) {
      case "application": return "Application";
      case "email": return "Email";
      case "job_source": return "Source Alert";
      case "match": return "Job Match";
      default: return "System";
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={styles.title}>Notifications</h3>
              <span style={styles.badge}>{unreadItems.length} unread</span>
            </div>
            <p style={styles.subTitle}>
              {items.length} total alerts &amp; updates
            </p>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {unreadItems.length > 0 && markAllRead?.mutate && (
              <button
                title="Mark all as read"
                style={styles.actionIconBtn}
                onClick={() => markAllRead.mutate()}
              >
                <CheckCheck size={16} />
              </button>
            )}
            {items.length > 0 && clearAll?.mutate && (
              <button
                title="Clear all notifications"
                style={{ ...styles.actionIconBtn, color: "#ef4444" }}
                onClick={() => {
                  clearAll.mutate();
                  setSelectedIds([]);
                }}
              >
                <Trash2 size={16} />
              </button>
            )}
            <button style={styles.closeBtn} onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Read / Unread Status Filter Tabs */}
        <div style={styles.filterRow}>
          <div style={styles.tabGroup}>
            {(["all", "unread", "read"] as ReadFilter[]).map((rf) => (
              <button
                key={rf}
                style={{
                  ...styles.tabBtn,
                  ...(readFilter === rf ? styles.tabBtnActive : {}),
                }}
                onClick={() => setReadFilter(rf)}
              >
                {rf.charAt(0).toUpperCase() + rf.slice(1)}
                {rf === "unread" && unreadItems.length > 0 && ` (${unreadItems.length})`}
              </button>
            ))}
          </div>

          {items.length > 0 && (
            <button
              style={styles.selectAllToggleBtn}
              onClick={toggleSelectAll}
              title={allFilteredSelected ? "Deselect All" : "Select All"}
            >
              {allFilteredSelected ? (
                <CheckSquare size={14} className="text-blue-500" />
              ) : (
                <Square size={14} className="text-slate-400" />
              )}
              <span style={{ fontSize: 11, fontWeight: 600 }}>
                {allFilteredSelected ? "Deselect All" : "Select All"}
              </span>
            </button>
          )}
        </div>

        {/* Type Category Pills */}
        <div style={styles.typePillRow}>
          {(
            [
              { id: "all", label: "All Types" },
              { id: "application", label: "Apps" },
              { id: "email", label: "Emails" },
              { id: "job_source", label: "Sources" },
              { id: "match", label: "Matches" },
            ] as { id: TypeFilter; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              style={{
                ...styles.typePill,
                ...(typeFilter === t.id ? styles.typePillActive : {}),
              }}
              onClick={() => setTypeFilter(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Batch Selection Action Bar */}
        {selectedIds.length > 0 && (
          <div style={styles.batchBar}>
            <span style={styles.batchCount}>
              {selectedIds.length} selected
            </span>

            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button
                style={styles.batchBtn}
                title="Mark selected as Read"
                onClick={() => handleBatchMarkRead(true)}
              >
                <Check size={13} /> Read
              </button>

              <button
                style={styles.batchBtn}
                title="Mark selected as Unread"
                onClick={() => handleBatchMarkRead(false)}
              >
                <EyeOff size={13} /> Unread
              </button>

              <button
                style={{ ...styles.batchBtn, color: "#f87171", borderColor: "rgba(239,68,68,0.3)" }}
                title="Delete selected"
                onClick={handleBatchDelete}
              >
                <Trash2 size={13} /> Delete
              </button>

              <button
                style={styles.batchCancelBtn}
                title="Clear selection"
                onClick={() => setSelectedIds([])}
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Notification Items List */}
        <div style={styles.list}>
          {isLoading && <div style={styles.empty}>Loading notifications…</div>}

          {!isLoading && filteredItems.length === 0 && (
            <div style={styles.empty}>
              <Sparkles size={28} className="mx-auto mb-2 text-amber-400 opacity-90" />
              <div>No alerts found for this filter.</div>
              {items.length > 0 && (
                <button
                  style={styles.resetFilterBtn}
                  onClick={() => {
                    setReadFilter("all");
                    setTypeFilter("all");
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {filteredItems.map((n) => {
            const isSelected = selectedIds.includes(n.id);
            const timeAgo = formatRelativeTime(n.created_at);

            return (
              <div
                key={n.id}
                style={{
                  ...styles.item,
                  ...(n.read ? styles.itemRead : styles.itemUnread),
                  ...(isSelected ? styles.itemSelected : {}),
                }}
                onClick={() => handleItemClick(n)}
              >
                {/* Selection Checkbox */}
                <div
                  style={styles.checkboxWrapper}
                  onClick={(e) => toggleSelect(n.id, e)}
                  title={isSelected ? "Deselect" : "Select"}
                >
                  {isSelected ? (
                    <CheckSquare size={16} className="text-blue-500" />
                  ) : (
                    <Square size={16} className="text-slate-400 opacity-60 hover:opacity-100" />
                  )}
                </div>

                {/* Category Icon */}
                <div style={styles.iconBox}>{renderIcon(n.type)}</div>

                {/* Main Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.itemHeader}>
                    <span style={styles.typeBadge}>{renderTypeLabel(n.type)}</span>
                    <span style={styles.itemTime}>{timeAgo}</span>
                  </div>

                  <div style={{ ...styles.itemTitle, fontWeight: n.read ? 600 : 700 }}>
                    {n.title}
                  </div>

                  <div style={styles.itemMsg}>{n.message}</div>

                  {n.link && (
                    <div style={styles.linkHint}>
                      <ExternalLink size={10} style={{ marginRight: 3 }} /> View details
                    </div>
                  )}
                </div>

                {/* Hover / Direct Actions */}
                <div style={styles.itemActions} onClick={(e) => e.stopPropagation()}>
                  {n.read ? (
                    markUnread?.mutate && (
                      <button
                        style={styles.miniActionBtn}
                        title="Mark as unread"
                        onClick={() => markUnread.mutate(n.id)}
                      >
                        <EyeOff size={13} />
                      </button>
                    )
                  ) : (
                    markRead?.mutate && (
                      <button
                        style={styles.miniActionBtn}
                        title="Mark as read"
                        onClick={() => markRead.mutate(n.id)}
                      >
                        <Eye size={13} />
                      </button>
                    )
                  )}

                  {deleteNotif?.mutate && (
                    <button
                      style={{ ...styles.miniActionBtn, color: "#f87171" }}
                      title="Delete notification"
                      onClick={() => {
                        deleteNotif.mutate(n.id);
                        setSelectedIds((prev) => prev.filter((id) => id !== n.id));
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {/* Unread indicator dot */}
                {!n.read && <span style={styles.dot} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0, 0, 0, 0.45)", zIndex: 100,
    display: "flex", justifyContent: "flex-end",
    backdropFilter: "blur(3px)",
  },
  drawer: {
    width: 410, height: "100%",
    backgroundColor: "var(--modal-bg, #0f172a)",
    borderLeft: "1px solid var(--border-color, rgba(255,255,255,0.1))",
    display: "flex", flexDirection: "column",
    boxShadow: "-12px 0 35px rgba(0,0,0,0.35)",
    color: "var(--text-primary, #f8fafc)",
  },
  header: {
    padding: "18px 20px 14px", borderBottom: "1px solid var(--border-color, rgba(255,255,255,0.08))",
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  title: { margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary, #f8fafc)" },
  badge: {
    fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10,
    background: "rgba(59, 130, 246, 0.2)", color: "#60a5fa",
    border: "1px solid rgba(59, 130, 246, 0.3)",
  },
  subTitle: { margin: "3px 0 0", fontSize: 12, color: "var(--text-secondary, #94a3b8)" },
  closeBtn: {
    background: "none", border: "none", color: "var(--text-secondary, #94a3b8)",
    cursor: "pointer", padding: 5, borderRadius: 6, display: "flex", alignItems: "center",
  },
  actionIconBtn: {
    background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color, rgba(255,255,255,0.1))",
    color: "var(--text-secondary, #94a3b8)",
    cursor: "pointer", padding: "5px 7px", borderRadius: 6, display: "flex", alignItems: "center",
  },
  filterRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 16px 6px",
  },
  tabGroup: {
    display: "flex", background: "rgba(0,0,0,0.2)", padding: 2, borderRadius: 8,
    border: "1px solid var(--border-color, rgba(255,255,255,0.06))",
  },
  tabBtn: {
    background: "none", border: "none", color: "var(--text-secondary, #94a3b8)",
    fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, cursor: "pointer",
    transition: "all 0.15s ease",
  },
  tabBtnActive: {
    background: "var(--border-color, rgba(255,255,255,0.15))",
    color: "var(--text-primary, #ffffff)", fontWeight: 700,
  },
  selectAllToggleBtn: {
    background: "none", border: "none", color: "var(--text-secondary, #94a3b8)",
    cursor: "pointer", display: "flex", alignItems: "center", gap: 5, padding: "4px 6px",
  },
  typePillRow: {
    display: "flex", gap: 6, padding: "0 16px 10px", overflowX: "auto",
    borderBottom: "1px solid var(--border-color, rgba(255,255,255,0.08))",
  },
  typePill: {
    background: "none", border: "1px solid var(--border-color, rgba(255,255,255,0.1))",
    color: "var(--text-secondary, #94a3b8)", fontSize: 10, fontWeight: 600,
    padding: "3px 8px", borderRadius: 12, cursor: "pointer", whitespace: "nowrap" as any,
  },
  typePillActive: {
    background: "rgba(59, 130, 246, 0.2)", borderColor: "rgba(59, 130, 246, 0.4)",
    color: "#60a5fa", fontWeight: 700,
  },
  batchBar: {
    background: "rgba(30, 58, 138, 0.35)", borderBottom: "1px solid rgba(59, 130, 246, 0.3)",
    padding: "8px 16px", display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  batchCount: { fontSize: 12, fontWeight: 700, color: "#93c5fd" },
  batchBtn: {
    background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255,255,255,0.12)",
    color: "#e2e8f0", fontSize: 11, fontWeight: 600, padding: "3px 7px", borderRadius: 6,
    cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
  },
  batchCancelBtn: {
    background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 3,
  },
  list: { flex: 1, overflowY: "auto", padding: 12 },
  empty: { textAlign: "center", color: "var(--text-muted, #64748b)", fontSize: 13, padding: "50px 20px" },
  resetFilterBtn: {
    marginTop: 12, background: "rgba(59,130,246,0.15)", border: "none", color: "#3b82f6",
    fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 6, cursor: "pointer",
  },
  item: {
    display: "flex", gap: 10, padding: "12px 12px", borderRadius: 10,
    marginBottom: 8, cursor: "pointer", transition: "all 0.15s ease",
    position: "relative", alignItems: "flex-start",
  },
  itemUnread: {
    background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.25)",
  },
  itemRead: {
    background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color, rgba(255,255,255,0.07))",
    opacity: 0.85,
  },
  itemSelected: {
    borderColor: "#3b82f6", background: "rgba(59, 130, 246, 0.18)",
  },
  checkboxWrapper: {
    paddingTop: 2, cursor: "pointer", flexShrink: 0,
  },
  iconBox: { flexShrink: 0, paddingTop: 2 },
  itemHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 },
  typeBadge: {
    fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px",
    color: "#94a3b8", opacity: 0.9,
  },
  itemTitle: { fontSize: 13, color: "var(--text-primary, #f8fafc)", marginBottom: 2, lineHeight: 1.3 },
  itemMsg: { fontSize: 11.5, color: "var(--text-secondary, #cbd5e1)", lineHeight: 1.4 },
  itemTime: { fontSize: 10, color: "var(--text-muted, #64748b)" },
  linkHint: {
    display: "flex", alignItems: "center", fontSize: 10, color: "#60a5fa",
    fontWeight: 600, marginTop: 4,
  },
  itemActions: {
    display: "flex", gap: 3, alignItems: "center", flexShrink: 0, opacity: 0.8,
  },
  miniActionBtn: {
    background: "none", border: "none", color: "var(--text-secondary, #94a3b8)",
    cursor: "pointer", padding: 3, borderRadius: 4, display: "flex", alignItems: "center",
  },
  dot: { width: 7, height: 7, borderRadius: "50%", background: "#3b82f6", flexShrink: 0, marginTop: 5 },
};
