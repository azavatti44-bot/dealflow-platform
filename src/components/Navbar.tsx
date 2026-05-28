import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Activity, Send, Settings, Signal, Database, Radio, Zap, HeartPulse, Briefcase, LogOut } from "lucide-react";
import AlertBell from "./AlertBell";
import { startAlertEngine } from "@/lib/alertEngine";
import { useAuth } from "@/lib/AuthContext";

const navItems = [
  { to: "/",               label: "Command",        icon: Activity   },
  { to: "/watchlists",     label: "Watchlists",     icon: Signal     },
  { to: "/private-finder", label: "Deal Finder",    icon: Database   },
  { to: "/market-signals", label: "Market Signals", icon: Radio      },
  { to: "/signals",        label: "Signals",        icon: Zap        },
  { to: "/healthcare",     label: "Healthcare",     icon: HeartPulse },
  { to: "/advisors",       label: "Advisors",       icon: Briefcase  },
  { to: "/outreach",       label: "Outreach",       icon: Send       },
  { to: "/settings",       label: "Settings",       icon: Settings   },
];

export default function Navbar() {
  const loc = useLocation();
  const { user, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => { startAlertEngine(); }, []);

  useEffect(() => {
    if (!showMenu) return;
    const close = () => setShowMenu(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [showMenu]);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 md:px-6 border-b"
      style={{ background: "rgba(245,241,235,0.95)", backdropFilter: "blur(12px)", borderColor: "rgba(0,0,0,0.07)" }}
    >
      {/* Left: logo + nav links */}
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="font-serif text-base font-bold tracking-wide" style={{ color: "var(--text-primary)" }}>DEALNEXA</span>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
        </Link>
        <div className="hidden md:flex items-center gap-1 overflow-x-auto">
          {navItems.map(n => {
            const active = loc.pathname === n.to;
            return (
              <Link key={n.to} to={n.to}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all whitespace-nowrap active:scale-[0.97]"
                style={{ color: active ? "var(--accent)" : "var(--text-secondary)", background: active ? "rgba(27,67,50,0.09)" : "transparent" }}>
                <n.icon size={13} />{n.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Right: alert bell + user avatar */}
      <div className="flex items-center gap-3">
        <AlertBell />

        <div className="relative">
          <button
            onClick={e => { e.stopPropagation(); setShowMenu(v => !v); }}
            className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full transition-all active:scale-[0.97] hover:opacity-80"
            style={{ border: "1px solid rgba(27,67,50,0.18)", background: "rgba(27,67,50,0.06)" }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ background: "rgba(27,67,50,0.12)", color: "var(--accent)" }}
            >
              {user?.initials || "?"}
            </div>
            <span className="hidden sm:block text-[11px] font-medium max-w-[100px] truncate" style={{ color: "var(--text-primary)" }}>
              {user?.name?.split(" ")[0] || "User"}
            </span>
          </button>

          {showMenu && (
            <div
              className="absolute right-0 top-10 w-48 rounded-xl py-1 shadow-2xl z-50"
              style={{ background: "var(--bg-surface-alt)", border: "1px solid rgba(0,0,0,0.08)" }}
              onClick={e => e.stopPropagation()}
            >
              <div className="px-4 py-2.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{user?.name}</p>
                <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>{user?.email}</p>
              </div>
              <button
                onClick={() => { setShowMenu(false); signOut(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs transition-colors hover:opacity-80"
                style={{ color: "#DC2626" }}
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
