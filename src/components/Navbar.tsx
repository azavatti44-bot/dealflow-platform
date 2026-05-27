import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Activity, Send, Settings, Signal, Database, Radio, Zap, HeartPulse } from "lucide-react";
import AlertBell from "./AlertBell";
import { startAlertEngine } from "@/lib/alertEngine";

const navItems = [
  { to: "/", label: "Command", icon: Activity },
  { to: "/deals", label: "Deal Flow", icon: Search },
  { to: "/watchlists", label: "Watchlists", icon: Signal },
  { to: "/private-finder", label: "Deal Finder", icon: Database },
  { to: "/market-signals", label: "Market Signals", icon: Radio },
  { to: "/signals", label: "Signals", icon: Zap },
  { to: "/healthcare", label: "Healthcare", icon: HeartPulse },
  { to: "/outreach", label: "Outreach", icon: Send },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Navbar() {
  const loc = useLocation();

  useEffect(() => {
    startAlertEngine();
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 md:px-6 border-b"
      style={{ background: "rgba(11,26,14,0.92)", backdropFilter: "blur(12px)", borderColor: "rgba(212,197,169,0.12)" }}>
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="font-serif text-base font-bold tracking-wide" style={{ color: "#F5F0E6" }}>DEALNEXA</span>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#B8860B" }} />
        </Link>
        <div className="hidden md:flex items-center gap-1 overflow-x-auto">
          {navItems.map(n => {
            const active = loc.pathname === n.to;
            return (
              <Link key={n.to} to={n.to}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors whitespace-nowrap"
                style={{ color: active ? "#B8860B" : "#8A7D6B", background: active ? "rgba(184,134,11,0.1)" : "transparent" }}>
                <n.icon size={13} />{n.label}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden sm:block text-[10px] font-mono tracking-wider" style={{ color: "#5A4D3A" }}>STC INTERNAL</span>
        <AlertBell />
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
          style={{ background: "rgba(184,134,11,0.15)", color: "#B8860B", border: "1px solid rgba(184,134,11,0.3)" }}>ST</div>
      </div>
    </nav>
  );
}
