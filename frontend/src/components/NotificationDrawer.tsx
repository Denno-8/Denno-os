import { ClipboardList, Mail, Radio, Target, Bell, Sparkles, X, Trash2 } from "lucide-react";
import { useNotifications, useMarkNotificationRead, useClearNotifications } from "../hooks/useNotifications";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const clearAll = useClearNotifications();

  if (!isOpen) return null;

  const items = notifications ?? [];
  const unreadItems = items.filter((n) => !n.read);

  const renderIcon = (type: string) => {
    switch (type) {
      case "application": return <ClipboardList size={18} className="text-blue-500" />;
      case "email": return <Mail size={18} className="text-purple-500" />;
      case "job_source": return <Radio size={18} className="text-emerald-500" />;
      case "match": return <Target size={18} className="text-amber-500" />;
      default: return <Bell size={18} className="text-blue-400" />;
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <h3 style={styles.title}>Notifications</h3>
            <p style={styles.subTitle}>{unreadItems.length} unread updates</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {items.length > 0 && (
              <button style={styles.clearBtn} onClick={() => clearAll.mutate()}>
                <Trash2 size={12} style={{ display: "inline", marginRight: 4 }} />
                Clear all
              </button>
            )}
            <button style={styles.closeBtn} onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={styles.list}>
          {isLoading && <div style={styles.empty}>Loading notifications…</div>}
          {!isLoading && items.length === 0 && (
            <div style={styles.empty}>
              <Sparkles size={28} className="mx-auto mb-2 text-amber-400" />
              You're all caught up! No recent alerts.
            </div>
          )}

          {items.map((n) => (
            <div
              key={n.id}
              style={{
                ...styles.item,
                ...(n.read ? styles.itemRead : styles.itemUnread),
              }}
              onClick={() => {
                if (!n.read) markRead.mutate(n.id);
              }}
            >
              <div style={styles.iconBox}>{renderIcon(n.type)}</div>
              <div style={{ flex: 1 }}>
                <div style={styles.itemTitle}>{n.title}</div>
                <div style={styles.itemMsg}>{n.message}</div>
                <div style={styles.itemTime}>
                  {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {!n.read && <span style={styles.dot} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.5)", zIndex: 100,
    display: "flex", justifyContent: "flex-end",
    backdropFilter: "blur(2px)",
  },
  drawer: {
    width: 380, height: "100%",
    backgroundColor: "var(--modal-bg)",
    borderLeft: "1px solid var(--border-color)",
    display: "flex", flexDirection: "column",
    boxShadow: "-10px 0 30px rgba(0,0,0,0.3)",
    color: "var(--text-primary)",
  },
  header: {
    padding: "20px 24px", borderBottom: "1px solid var(--border-color)",
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  title: { margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" },
  subTitle: { margin: "2px 0 0", fontSize: 12, color: "var(--text-secondary)" },
  closeBtn: {
    background: "none", border: "none", color: "var(--text-secondary)",
    cursor: "pointer", padding: 4, display: "flex", alignItems: "center",
  },
  clearBtn: {
    background: "rgba(59,130,246,0.1)", border: "none", color: "#3b82f6",
    fontSize: 12, fontWeight: 600, cursor: "pointer", padding: "4px 8px",
    borderRadius: 6, display: "flex", alignItems: "center",
  },
  list: { flex: 1, overflowY: "auto", padding: 12 },
  empty: { textAlign: "center", color: "var(--text-muted)", fontSize: 13, padding: "40px 20px" },
  item: {
    display: "flex", gap: 12, padding: 14, borderRadius: 12,
    marginBottom: 8, cursor: "pointer", transition: "background 0.2s",
  },
  itemUnread: { background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)" },
  itemRead: { background: "var(--input-bg)", border: "1px solid var(--border-color)", opacity: 0.8 },
  iconBox: { flexShrink: 0, paddingTop: 2 },
  itemTitle: { fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 },
  itemMsg: { fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 },
  itemTime: { fontSize: 10, color: "var(--text-muted)", marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", flexShrink: 0, marginTop: 4 },
};
