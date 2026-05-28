import { useState } from "react";
import { FileText, Scale, Lightbulb, Building, RefreshCw, Check, X, Clock, Shield, User, Bell, Server } from "lucide-react";

const APIS = [
  { name: "SEC EDGAR", status: "operational", latency: "~800ms", desc: "8-K, 13D, S-4 forms. No key required.", icon: FileText, endpoints: ["Tickers JSON", "Submissions", "Documents"] },
  { name: "CourtListener", status: "operational", latency: "~600ms", desc: "Federal court dockets. No key required.", icon: Scale, endpoints: ["Docket search", "Case metadata", "Court info"] },
  { name: "USPTO PatentsView", status: "operational", latency: "~1200ms", desc: "Patent filings, assignee data. No key required.", icon: Lightbulb, endpoints: ["Patent query", "Metadata", "Citations"] },
  { name: "OpenCorporates", status: "degraded", latency: "~2000ms", desc: "State SOS records. Rate limited.", icon: Building, endpoints: ["Company search", "Officer data", "Jurisdiction"] },
  { name: "CORS Proxy", status: "operational", latency: "~400ms", desc: "Routes browser requests through proxy.", icon: Server, endpoints: ["Raw proxy", "JSON passthrough"] },
];

const NOTIFS = [
  { id: "n1", label: "High-confidence signal detected", on: true },
  { id: "n2", label: "New 8-K from watched company", on: true },
  { id: "n3", label: "Court case filed", on: true },
  { id: "n4", label: "Weekly signal digest", on: false },
  { id: "n5", label: "Daily hot prospects summary", on: false },
];

const statusIcon = (s: string) => s === "operational" ? <Check size={11} style={{ color: "#22C55E" }} /> : s === "degraded" ? <Clock size={11} style={{ color: "#f59e0b" }} /> : <X size={11} style={{ color: "#DC2626" }} />;
const statusColor = (s: string) => s === "operational" ? { bg: "rgba(22,163,74,0.12)", text: "#22C55E" } : s === "degraded" ? { bg: "rgba(245,158,11,0.12)", text: "#f59e0b" } : { bg: "rgba(220,38,38,0.1)", text: "#DC2626" };
const card = { background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)" };

export default function SettingsPage() {
  const [tab, setTab] = useState("apis");
  const [refreshing, setRefreshing] = useState(false);
  const [notifs, setNotifs] = useState(NOTIFS);

  const tabs = [
    { id: "apis", label: "API Status", icon: Server },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "account", label: "Account", icon: User },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-4">
      <div>
        <h1 className="font-serif text-2xl font-bold" style={{ color: "#1A2416" }}>Settings</h1>
        <p className="text-xs mt-1" style={{ color: "#64748B" }}>API configuration and preferences</p>
      </div>

      <div className="flex flex-wrap gap-1 pb-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-colors"
            style={tab === t.id ? { background: "#16A34A", color: "#FFFFFF", fontWeight: 600 } : { color: "#64748B" }}>
            <t.icon size={13} />{t.label}
          </button>
        ))}
      </div>

      {tab === "apis" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: "#1A2416" }}>API Integration Status</h2>
            <button onClick={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 1500); }} disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] disabled:opacity-50"
              style={{ background: "#F0EDE5", color: "#64748B", border: "1px solid rgba(0,0,0,0.07)" }}>
              <RefreshCw size={11} className={refreshing ? "animate-spin" : ""} />{refreshing ? "Checking..." : "Refresh"}
            </button>
          </div>

          {APIS.map(api => (
            <div key={api.name} className="rounded-xl p-4" style={card}>
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="p-2 rounded-lg shrink-0" style={{ background: "#F0EDE5" }}><api.icon size={16} style={{ color: "#16A34A" }} /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold" style={{ color: "#1A2416" }}>{api.name}</h3>
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full" style={{ background: statusColor(api.status).bg, color: statusColor(api.status).text }}>{statusIcon(api.status)}{api.status}</span>
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: "#64748B" }}>{api.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {api.endpoints.map(e => <span key={e} className="text-[9px] px-2 py-0.5 rounded font-mono" style={{ background: "#F0EDE5", color: "#64748B" }}>{e}</span>)}
                  </div>
                </div>
                <div className="text-right shrink-0"><p className="text-[9px]" style={{ color: "#64748B" }}>Latency</p><p className="text-sm font-mono" style={{ color: "#1A2416" }}>{api.latency}</p></div>
              </div>
            </div>
          ))}

          <div className="rounded-xl p-4" style={{ background: "rgba(22,163,74,0.05)", border: "1px solid rgba(22,163,74,0.12)" }}>
            <div className="flex items-center gap-2 mb-1"><Shield size={14} style={{ color: "#16A34A" }} /><h3 className="text-sm font-semibold" style={{ color: "#1A2416" }}>How It Works</h3></div>
            <p className="text-[11px] leading-relaxed" style={{ color: "#64748B" }}>
              All calls route through a CORS proxy because government APIs lack browser CORS headers. 
              No backend needed — data fetched directly from free public APIs. No API keys required.
            </p>
          </div>
        </div>
      )}

      {tab === "notifications" && (
        <div className="space-y-2">
          {notifs.map(n => (
            <div key={n.id} className="rounded-xl p-4 flex items-center justify-between" style={card}>
              <span className="text-sm" style={{ color: "#1A2416" }}>{n.label}</span>
              <button onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, on: !x.on } : x))}
                className="w-9 h-5 rounded-full relative transition-colors" style={{ background: n.on ? "#22C55E" : "rgba(0,0,0,0.1)" }}>
                <span className="absolute top-0.5 w-4 h-4 rounded-full transition-all" style={{ background: "#FFFFFF", left: n.on ? "18px" : "2px" }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "account" && (
        <div className="space-y-4 max-w-md">
          <div className="rounded-xl p-4 flex items-center gap-3" style={card}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "rgba(22,163,74,0.15)", color: "#16A34A" }}>ST</div>
            <div><p className="font-semibold text-sm" style={{ color: "#1A2416" }}>Saint Thomas Capital Partners</p><p className="text-[10px]" style={{ color: "#64748B" }}>Signal Engine — Internal</p></div>
          </div>
          <div className="rounded-xl p-4 space-y-3" style={card}>
            <div>
              <label className="text-[10px] uppercase block mb-1" style={{ color: "#64748B" }}>Firm Name</label>
              <input defaultValue="Saint Thomas Capital Partners" className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "#F0EDE5", color: "#1A2416", border: "1px solid rgba(0,0,0,0.07)" }} />
            </div>
            <div>
              <label className="text-[10px] uppercase block mb-1" style={{ color: "#64748B" }}>Email</label>
              <input defaultValue="deals@stc-capital.com" className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "#F0EDE5", color: "#1A2416", border: "1px solid rgba(0,0,0,0.07)" }} />
            </div>
            <div>
              <label className="text-[10px] uppercase block mb-1" style={{ color: "#64748B" }}>Outreach Signature</label>
              <textarea defaultValue="Thomas Saint\nManaging Partner\nSaint Thomas Capital Partners\n(212) 555-0147" rows={3}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                style={{ background: "#F0EDE5", color: "#1A2416", border: "1px solid rgba(0,0,0,0.07)" }} />
            </div>
          </div>
          <button className="w-full py-2 rounded-lg text-sm font-semibold" style={{ background: "#16A34A", color: "#FFFFFF" }}>Save Changes</button>
        </div>
      )}
    </div>
  );
}
