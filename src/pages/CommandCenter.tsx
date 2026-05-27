import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, FileText, Scale, Lightbulb, Building, Activity } from "lucide-react";
import { searchCompany } from "@/lib/api";
import { useData } from "@/lib/DataContext";

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const c = 2 * Math.PI * (size / 2 - 4);
  const off = c - (score / 100) * c;
  const col = score >= 80 ? "#B8860B" : score >= 65 ? "#4A7C59" : score >= 50 ? "#8A7D6B" : "#5A4D3A";
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={size/2-4} fill="none" stroke="rgba(212,197,169,0.1)" strokeWidth={3} />
        <circle cx={size/2} cy={size/2} r={size/2-4} fill="none" stroke={col} strokeWidth={3} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <span className="absolute font-mono text-sm font-bold" style={{ color: col }}>{score}</span>
    </div>
  );
}

export default function CommandCenter() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<import("@/lib/api").CompanyResult | null>(null);
  const { companies, addCompany } = useData();
  const navigate = useNavigate();

  const go = useCallback(async (name: string, ticker?: string, cik?: string) => {
    setQuery(name);
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const d = await Promise.race([
        searchCompany(name, ticker, cik),
        new Promise<never>((_, r) => setTimeout(() => r(new Error("Timed out — try again")), 55000))
      ]);
      setResult(d);
      addCompany(d);
    } catch (e: any) {
      setError(e.message || "Failed to fetch data");
    }
    setLoading(false);
  }, []);

  const quick = [
    { n: "Apple Inc", t: "AAPL", c: "0000320193" },
    { n: "Microsoft Corp", t: "MSFT", c: "0000789019" },
    { n: "Wells Fargo", t: "WFC", c: "0000072971" },
    { n: "Intel Corp", t: "INTC", c: "0000050863" },
    { n: "Meta Platforms", t: "META", c: "0001326801" },
    { n: "NVIDIA Corp", t: "NVDA", c: "0001018724" },
    { n: "Tesla Inc", t: "TSLA", c: "0001318605" },
    { n: "JPMorgan Chase", t: "JPM", c: "0000019617" },
  ];

  const cardBg = { background: "#132A1A", border: "1px solid rgba(212,197,169,0.12)" };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold" style={{ color: "#F5F0E6" }}>Signal Command Center</h1>
        <p className="text-xs mt-1" style={{ color: "#8A7D6B" }}>Query SEC EDGAR, CourtListener, USPTO, and OpenCorporates in real-time</p>
      </div>

      <form onSubmit={e => { e.preventDefault(); if (query) go(query); }} className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: "#5A4D3A" }} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Company name or ticker..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: "#1A351F", color: "#F5F0E6", border: "1px solid rgba(212,197,169,0.15)" }} />
        </div>
        <button type="submit" disabled={loading}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50" style={{ background: "#B8860B", color: "#0B1A0E" }}>
          {loading ? <Loader2 size={15} className="animate-spin inline mr-1" /> : <Search size={15} className="inline mr-1" />}
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {quick.map(q => (
          <button key={q.t} onClick={() => go(q.n, q.t, q.c)}
            className="px-3 py-1.5 rounded-full text-[11px] font-mono transition-colors hover:opacity-80"
            style={{ background: "#1A351F", color: "#B8860B", border: "1px solid rgba(212,197,169,0.12)" }}>
            {q.t}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg p-3 text-xs" style={{ background: "rgba(139,58,58,0.15)", border: "1px solid rgba(139,58,58,0.3)", color: "#C9A0A0" }}>
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8 gap-2 text-xs" style={{ color: "#8A7D6B" }}>
          <Loader2 size={16} className="animate-spin" />Fetching real SEC data...
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4">
          <div className="rounded-xl p-5" style={cardBg}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <ScoreRing score={result.score} size={64} />
                <div>
                  <h2 className="font-serif text-xl font-semibold" style={{ color: "#F5F0E6" }}>{result.name}</h2>
                  <div className="flex items-center gap-3 mt-1 text-[10px] font-mono" style={{ color: "#5A4D3A" }}>
                    {result.ticker && <span>{result.ticker}</span>}
                    {result.cik && <span>CIK: {result.cik}</span>}
                    <span className="px-2 py-0.5 rounded-full font-bold"
                      style={{ background: result.tier === "hot" ? "rgba(184,134,11,0.15)" : "rgba(212,197,169,0.06)", color: result.tier === "hot" ? "#B8860B" : "#8A7D6B" }}>
                      {result.tier.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => navigate(`/company/${encodeURIComponent(result.name)}`)}
                className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ background: "#B8860B", color: "#0B1A0E" }}>
                View Full Dossier
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: FileText, label: "SEC Filings", value: result.sec_filings.length },
              { icon: Scale, label: "Court Cases", value: result.court_cases.length },
              { icon: Lightbulb, label: "Patents", value: result.patents.length },
              { icon: Building, label: "State Records", value: result.sos_records.length },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-lg p-4 text-center" style={cardBg}>
                <Icon className="mx-auto mb-1.5" size={16} style={{ color: "#B8860B" }} />
                <p className="text-xl font-bold font-mono" style={{ color: "#F5F0E6" }}>{value}</p>
                <p className="text-[10px]" style={{ color: "#8A7D6B" }}>{label}</p>
              </div>
            ))}
          </div>

          {result.signals.length > 0 && (
            <div className="rounded-xl p-4" style={cardBg}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "#F5F0E6" }}>Detected Signals ({result.signals.length})</h3>
              <div className="space-y-2">
                {result.signals.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 py-2" style={{ borderBottom: i < result.signals.length - 1 ? "1px solid rgba(212,197,169,0.06)" : "none" }}>
                    <span className="w-2 h-2 rounded-full mt-1 shrink-0"
                      style={{ background: s.confidence === "high" ? "#B8860B" : s.confidence === "medium" ? "#4A7C59" : "#5A4D3A" }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#F5F0E6" }}>{s.signal_type.replace(/_/g, " ")}</p>
                      <p className="text-xs" style={{ color: "#8A7D6B" }}>{s.description}</p>
                      <p className="text-[10px] font-mono mt-0.5" style={{ color: "#5A4D3A" }}>{s.evidence}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.api_errors.length > 0 && (
            <div className="rounded-lg p-3 text-[10px]" style={{ background: "rgba(184,134,11,0.05)", border: "1px solid rgba(184,134,11,0.15)", color: "#8A7D6B" }}>
              <p style={{ color: "#B8860B" }}>Some data sources unavailable:</p>
              {result.api_errors.map((e, i) => <p key={i}>• {e}</p>)}
            </div>
          )}
        </div>
      )}

      {!loading && !result && companies.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#8A7D6B" }}>Recently Searched</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {companies.slice(0, 6).map((c, i) => (
              <div key={i} onClick={() => navigate(`/company/${encodeURIComponent(c.name)}`)}
                className="rounded-lg p-4 cursor-pointer transition-all hover:-translate-y-0.5"
                style={{ background: "#132A1A", border: "1px solid rgba(212,197,169,0.1)" }}>
                <div className="flex items-center justify-between">
                  <span className="font-serif text-sm font-semibold" style={{ color: "#F5F0E6" }}>{c.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: c.tier === "hot" ? "rgba(184,134,11,0.12)" : "rgba(212,197,169,0.06)", color: c.tier === "hot" ? "#B8860B" : "#8A7D6B" }}>
                    {c.tier} {c.score}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px]" style={{ color: "#5A4D3A" }}>
                  <span>{c.signals.length} signals</span>
                  <span>{c.sec_filings.length} filings</span>
                  <span>{c.fetched_at?.slice(0, 10)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !result && companies.length === 0 && (
        <div className="text-center py-16">
          <Activity className="mx-auto mb-3" size={36} style={{ color: "#5A4D3A" }} />
          <h3 className="font-serif text-lg" style={{ color: "#8A7D6B" }}>Search any public company</h3>
          <p className="text-xs mt-1" style={{ color: "#5A4D3A" }}>Click a ticker above or type a company name to begin signal detection.</p>
        </div>
      )}
    </div>
  );
}
