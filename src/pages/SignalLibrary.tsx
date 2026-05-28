import { useState } from "react";
import { Zap, Shield, AlertTriangle, TrendingUp, UserX, FileText, Scale, Lightbulb, Activity, Search } from "lucide-react";

interface Sig { id: string; name: string; category: string; description: string; confidence: "high" | "medium" | "emerging"; data_source: string; weight: number; accuracy: string; lead_time: string; examples: string[]; }

const SIGNALS: Sig[] = [
  { id: "s1", name: "Key Executive Departure", category: "Governance", description: "CEO, CFO, COO departure via 8-K Item 5.02", confidence: "high", data_source: "SEC EDGAR", weight: 16, accuracy: "78%", lead_time: "30-120 days", examples: ["CEO resignation → PE sale within 60 days", "CFO departure 90 days before strategic review"] },
  { id: "s2", name: "Auditor Change", category: "Financial", description: "Certifying accountant change via 8-K Item 4.01", confidence: "high", data_source: "SEC EDGAR", weight: 18, accuracy: "72%", lead_time: "45-180 days", examples: ["Regional auditor → EY 4 months before sale", "Auditor resignation → QoE engagement"] },
  { id: "s3", name: "M&A Activity", category: "Transaction", description: "Acquisition/disposition via 8-K Item 2.01", confidence: "high", data_source: "SEC EDGAR", weight: 15, accuracy: "65%", lead_time: "Ongoing", examples: ["Competitor acquisition → own sale 12 months later", "Asset sale to focus on core business"] },
  { id: "s4", name: "Change of Control (13D)", category: "Ownership", description: "Investor crosses 5% threshold", confidence: "high", data_source: "SEC EDGAR", weight: 16, accuracy: "82%", lead_time: "30-90 days", examples: ["Activist 13D → CEO replacement and sale", "Strategic accumulation before hostile approach"] },
  { id: "s5", name: "Bankruptcy Filing", category: "Distress", description: "Chapter 7/11/13 in court records", confidence: "high", data_source: "CourtListener", weight: 20, accuracy: "95%", lead_time: "Immediate", examples: ["Ch. 11 → 363 sale to strategic buyer", "Pre-packaged bankruptcy with stalking horse"] },
  { id: "s6", name: "M&A Litigation", category: "Legal", description: "Lawsuit related to merger or appraisal", confidence: "high", data_source: "CourtListener", weight: 15, accuracy: "85%", lead_time: "During process", examples: ["Appraisal action after going-private", "Shareholder class action on merger terms"] },
  { id: "s7", name: "Elevated Filing Activity", category: "Pattern", description: "3+ 8-Ks in 12 months", confidence: "medium", data_source: "SEC EDGAR", weight: 6, accuracy: "58%", lead_time: "60-180 days", examples: ["4 8-Ks → strategic alternatives announcement", "Cluster around board changes"] },
  { id: "s8", name: "Financial Restatement", category: "Financial", description: "Non-reliance on prior financials (Item 4.02)", confidence: "medium", data_source: "SEC EDGAR", weight: 12, accuracy: "55%", lead_time: "90-270 days", examples: ["Revenue restatement → PE take-private", "Inventory fix → strategic review"] },
  { id: "s9", name: "Governance Change", category: "Governance", description: "Articles/bylaws amendment (Item 5.03)", confidence: "medium", data_source: "SEC EDGAR", weight: 8, accuracy: "52%", lead_time: "30-120 days", examples: ["Bylaw amendment removing staggered board", "Authorized share increase for acquisition"] },
  { id: "s10", name: "Material Agreement", category: "Transaction", description: "Material definitive agreement (Item 1.01)", confidence: "medium", data_source: "SEC EDGAR", weight: 8, accuracy: "48%", lead_time: "60-150 days", examples: ["Engagement letter with Qatalyst → sale", "Exclusive distribution agreement"] },
  { id: "s11", name: "Litigation Exposure", category: "Legal", description: "2+ commercial disputes", confidence: "medium", data_source: "CourtListener", weight: 8, accuracy: "45%", lead_time: "Ongoing", examples: ["Multiple disputes → owner fatigue sale", "Patent cluster → strategic IP acquisition"] },
  { id: "s12", name: "Officer Changes (SOS)", category: "Governance", description: "CFO/COO/GC changes per state records", confidence: "medium", data_source: "OpenCorporates", weight: 8, accuracy: "50%", lead_time: "45-120 days", examples: ["New CFO 3 months before PE sale", "GC change → strategic review"] },
  { id: "s13", name: "No New IP Filings", category: "Innovation", description: "No patents in 24+ months for active filer", confidence: "medium", data_source: "USPTO", weight: 8, accuracy: "42%", lead_time: "6-18 months", examples: ["Tech stops patenting → platform sale 8 months later", "R&D shift to buyback program"] },
  { id: "s14", name: "Low Innovation Activity", category: "Innovation", description: "Minimal patent portfolio (≤2) for tech business", confidence: "emerging", data_source: "USPTO", weight: 4, accuracy: "35%", lead_time: "Structural", examples: ["Services firm → attractive roll-up target", "Minimal IP → acquired for customer base"] },
  { id: "s15", name: "Strategic Alternatives Disclosure", category: "Transaction", description: "Company publicly discloses exploring strategic alternatives in SEC filing", confidence: "high", data_source: "EDGAR Full-Text", weight: 22, accuracy: "88%", lead_time: "30-90 days", examples: ["Board announces strategic review → sale 45 days later", "10-K risk factor language → PE take-private"] },
  { id: "s16", name: "Reg D Equity Raise", category: "Ownership", description: "Private company raised institutional equity — approaching typical 5-7yr hold period", confidence: "medium", data_source: "SEC Form D", weight: 12, accuracy: "60%", lead_time: "2-5 years", examples: ["2019 PE raise → 2025 exit window opening", "Repeat D/A amendments indicate ongoing cap raise"] },
  { id: "s17", name: "Going Concern Opinion", category: "Distress", description: "Auditor issued going concern qualification in 10-K or 10-Q", confidence: "high", data_source: "EDGAR Full-Text", weight: 18, accuracy: "70%", lead_time: "Immediate", examples: ["Going concern → 363 sale 60 days later", "Distressed asset available at discount to book"] },
  { id: "s18", name: "WARN Act / Mass Layoff", category: "Distress", description: "Company filed mass layoff notice — contraction signal, owner may be motivated to sell", confidence: "medium", data_source: "EDGAR / State WARN", weight: 10, accuracy: "55%", lead_time: "30-90 days", examples: ["WARN filing → PE sale 6 months later", "Workforce reduction → plant closure, sell core biz"] },
];

const ICONS: Record<string, typeof Zap> = { Governance: Shield, Financial: FileText, Transaction: TrendingUp, Ownership: UserX, Distress: AlertTriangle, Legal: Scale, Pattern: Activity, Innovation: Lightbulb };

const confBadge = (c: string) => c === "high" ? { bg: "rgba(110,231,183,0.12)", text: "#6EE7B7" } : c === "medium" ? { bg: "rgba(74,124,89,0.12)", text: "#34D399" } : { bg: "rgba(148,163,184,0.06)", text: "#94A3B8" };
const card = { background: "#132A1A", border: "1px solid rgba(148,163,184,0.12)" };

export default function SignalLibrary() {
  const [filter, setFilter] = useState("all");
  const [sel, setSel] = useState<Sig | null>(null);
  const [search, setSearch] = useState("");
  const cats = ["all", "Governance", "Financial", "Transaction", "Ownership", "Distress", "Legal", "Pattern", "Innovation"];
  const dataSources = ["SEC EDGAR", "CourtListener", "USPTO", "OpenCorporates", "EDGAR Full-Text", "SEC Form D", "EDGAR / State WARN"];
  const filtered = SIGNALS.filter(s => (filter === "all" || s.category === filter) && (!search || s.name.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-4">
      <div>
        <h1 className="font-serif text-2xl font-bold" style={{ color: "#F5F0E6" }}>Signal Library</h1>
        <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>18 signal types across 8 categories</p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
        {[
          { label: "Signal Types", value: 18, color: "#6EE7B7" },
          { label: "High Confidence", value: SIGNALS.filter(s => s.confidence === "high").length, color: "#6EE7B7" },
          { label: "Medium Confidence", value: SIGNALS.filter(s => s.confidence === "medium").length, color: "#34D399" },
          { label: "Emerging", value: SIGNALS.filter(s => s.confidence === "emerging").length, color: "#94A3B8" },
        ].map(s => (
          <div key={s.label} className="rounded-lg p-3 text-center" style={card}>
            <p className="text-lg font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px]" style={{ color: "#94A3B8" }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: "#64748B" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search signals..."
          className="w-full pl-9 pr-4 py-2 rounded-lg text-xs outline-none"
          style={{ background: "#1A351F", color: "#F5F0E6", border: "1px solid rgba(148,163,184,0.15)" }} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {cats.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className="px-2.5 py-1 rounded-full text-[11px] transition-colors"
            style={filter === c ? { background: "#6EE7B7", color: "#0B1A0E", fontWeight: 600 } : { background: "#1A351F", color: "#94A3B8", border: "1px solid rgba(148,163,184,0.1)" }}>
            {c === "all" ? "All" : c}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-[10px] uppercase tracking-wider mr-1" style={{ color: "#64748B" }}>Data Sources:</span>
        {dataSources.map(ds => (
          <span key={ds} className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ background: "rgba(110,231,183,0.08)", color: "#94A3B8", border: "1px solid rgba(148,163,184,0.08)" }}>{ds}</span>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {filtered.map(s => {
          const Icon = ICONS[s.category] || Zap;
          const cb = confBadge(s.confidence);
          return (
            <div key={s.id} onClick={() => setSel(s)}
              className="rounded-lg p-4 cursor-pointer transition-all hover:-translate-y-0.5" style={card}>
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded shrink-0" style={{ background: "#1A351F" }}><Icon size={14} style={{ color: "#6EE7B7" }} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-sm font-semibold" style={{ color: "#F5F0E6" }}>{s.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: cb.bg, color: cb.text }}>{s.confidence}</span>
                  </div>
                  <p className="text-xs line-clamp-2 mb-1" style={{ color: "#94A3B8" }}>{s.description}</p>
                  <div className="flex items-center gap-2 text-[10px]" style={{ color: "#64748B" }}>
                    <span className="font-mono">W:{s.weight}</span>
                    <span>{s.accuracy} accuracy</span>
                    <span>{s.data_source}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setSel(null)}>
          <div className="rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6" style={{ background: "#132A1A", border: "1px solid rgba(148,163,184,0.2)" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold font-serif" style={{ color: "#F5F0E6" }}>{sel.name}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: confBadge(sel.confidence).bg, color: confBadge(sel.confidence).text }}>{sel.confidence}</span>
              </div>
              <button onClick={() => setSel(null)} className="text-xs" style={{ color: "#94A3B8" }}>Close</button>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[{ l: "Weight", v: sel.weight }, { l: "Accuracy", v: sel.accuracy }, { l: "Source", v: sel.data_source }, { l: "Lead Time", v: sel.lead_time }].map(d => (
                <div key={d.l} className="rounded-md p-2 text-center" style={{ background: "#1A351F" }}>
                  <p className="text-sm font-bold font-mono" style={{ color: "#F5F0E6" }}>{d.v}</p>
                  <p className="text-[9px]" style={{ color: "#64748B" }}>{d.l}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm">
              <p style={{ color: "#94A3B8" }}>{sel.description}</p>
              <div><p className="text-[10px] font-semibold mb-1" style={{ color: "#F5F0E6" }}>Examples:</p>{sel.examples.map((e, i) => <p key={i} className="text-xs" style={{ color: "#94A3B8" }}><span style={{ color: "#6EE7B7" }}>{i + 1}.</span> {e}</p>)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
