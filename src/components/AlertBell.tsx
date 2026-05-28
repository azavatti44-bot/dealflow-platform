import { useState, useEffect, useRef } from "react";
import { Bell, BellOff } from "lucide-react";
import {
  getAlerts,
  markRead,
  markAllRead,
  getUnreadCount,
  requestNotificationPermission,
  type Alert,
} from "@/lib/alertEngine";

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

const TYPE_COLORS: Record<Alert["type"], string> = {
  new_filing: "#16A34A",
  signal: "#22C55E",
  form_d: "#16A34A",
  warn: "#C9A0A0",
};

export default function AlertBell() {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unread, setUnread] = useState(0);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>("default");
  const ref = useRef<HTMLDivElement>(null);

  function refresh() {
    setAlerts(getAlerts().slice(0, 10));
    setUnread(getUnreadCount());
    if ("Notification" in window) setNotifPerm(Notification.permission);
  }

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener("stc:alert", handler);
    const interval = setInterval(refresh, 60000);
    return () => {
      window.removeEventListener("stc:alert", handler);
      clearInterval(interval);
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleMarkAllRead() {
    markAllRead();
    refresh();
  }

  function handleMarkRead(id: string) {
    markRead(id);
    refresh();
  }

  function handleEnableNotifications() {
    requestNotificationPermission();
    setTimeout(() => {
      if ("Notification" in window) setNotifPerm(Notification.permission);
    }, 500);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-1.5 rounded-md transition-colors"
        style={{ color: unread > 0 ? "#16A34A" : "#64748B" }}
        aria-label="Alerts"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
            style={{ background: "#16A34A", color: "#FFFFFF" }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-xl overflow-hidden shadow-2xl z-50"
          style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.12)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
            <span className="text-xs font-semibold" style={{ color: "#1A2416" }}>Alerts</span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] transition-colors"
                  style={{ color: "#64748B" }}
                >
                  Mark all read
                </button>
              )}
              {notifPerm !== "granted" && "Notification" in window && (
                <button
                  onClick={handleEnableNotifications}
                  className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded"
                  style={{ background: "rgba(22,163,74,0.06)", color: "#16A34A" }}
                >
                  <BellOff size={9} />
                  Enable
                </button>
              )}
            </div>
          </div>

          {/* Alerts list */}
          <div className="max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell size={20} className="mx-auto mb-2 opacity-30" style={{ color: "#64748B" }} />
                <p className="text-xs" style={{ color: "#64748B" }}>No alerts — add companies to monitoring to get notified</p>
              </div>
            ) : (
              alerts.map(a => (
                <div
                  key={a.id}
                  className="px-4 py-3 cursor-pointer transition-colors"
                  style={{
                    borderBottom: "1px solid rgba(0,0,0,0.04)",
                    background: a.read ? "transparent" : "rgba(22,163,74,0.04)",
                  }}
                  onClick={() => handleMarkRead(a.id)}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                      style={{ background: a.read ? "transparent" : TYPE_COLORS[a.type] }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold truncate" style={{ color: "#1A2416" }}>{a.company_name}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "#64748B" }}>{a.message}</p>
                      <p className="text-[9px] font-mono mt-0.5" style={{ color: "#64748B" }}>{relTime(a.timestamp)}</p>
                    </div>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0"
                      style={{ background: "rgba(0,0,0,0.04)", color: "#64748B" }}
                    >
                      {a.type.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
