import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, Star, Eye } from "lucide-react";
import { searchCompany, type CompanyResult } from "@/lib/api";
import { useData } from "@/lib/DataContext";

export default function DealFlow() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<CompanyResult[]>([]);
  const { companies, addCompany, watchlists, toggleWatchlist } = useData();
  const navigate = useNavigate();

  const go = useCallback(async (name: string, ticker?: string, cik?: string) => {
    setQuery(name); setLoading(true); setError("");
    try {
      const d = await Promise.race([
        searchCompany(name, ticker, cik),
        new Promise<never>((_, r) => setTimeout(() => r(new Error("Timed out — try again")), 55000))
      ]);
      addCompany(d); setResults([d]);
    } catch (e: any) { setError(e.message || "Failed"); setResults([]); }
    setLoading(false);
  }, [addCompany]);

  const quick = [
    { n: "Apple Inc", t: "AAPL", c: "0000320193" },
    { n: "Microsoft Corp", t: "MSFT", c: "0000789019" },
    { n: "Wells Fargo", t: "WFC", c: "0000072971" },
    { n: "Intel Corp", t: "INTC", c: "0000050863" },
    { n: "Meta Platforms", t: "META", c: "0001326801" },
    { n: "NVIDIA Corp", t: "NVDA", c: "0001018724" },
    { n: "Tesla Inc", t: "TSLA", c: "0001318605" },
    { n: "JPMorgan Chase", t: "JPM", c: "0000019617" },
    { n: "Bank of America", t: "BAC", c: "0000070858" },
    { n: "Goldman Sachs", t: "GS", c: "0000886982" },
  ];

  const inWatchlist = (name: string) => watchlists.some(w => w.companies.includes(name));

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-4">
      <div>
        <h1 className="font-serif text-2xl font-bold" style={{ color: "#F5F0E6" }}>Deal Flow</h1>
        <p className="text-xs mt-1" style={{ color: "#8A7D6B" }}>Company search and watchlist management</p>
      </div>

      <form onSubmit={e => { e.preventDefault(); if (query) go(query); }} className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: "#5A4D3A" }} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name or ticker..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: "#1A351F", color: "#F5F0E6", border: "1px solid rgba(212,197,169,0.15)" }} />
        </div>
        <button type="submit" disabled={loading}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50" style={{ background: "#B8860B", color: "#0B1A0E" }}>
          {loading ? <Loader2 size={14} className="animate-spin inline mr-1" /> : <Search size={14} className="inline mr-1" />}
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        {quick.map(q => (
          <button key={q.t} onClick={() => go(q.n, q.t, q.c)}
            className="px-2.5 py-1 rounded text-[11px] font-mono transition-colors hover:opacity-80"
            style={{ background: "#1A351F", color: "#B8860B", border: "1px solid rgba(212,197,169,0.1)" }}>
            {q.t}
          </button>
        ))}
      </div>

      {error && <div className="rounded-lg p-3 text-xs" style={{ background: "rgba(139,58,58,0.15)", border: "1px solid rgba(139,58,58,0.3)", color: "#C9A0A0" }}>{error}</div>}

      {loading && <div className="flex items-center justify-center py-8 gap-2 text-xs" style={{ color: "#8A7D6B" }}><Loader2 size={16} className="animate-spin" />Fetching real SEC data...</div>}

      {results.length > 0 && !loading && results.map(r => (
        <div key={r.name} className="rounded-xl p-5 space-y-3" style={{ background: "#132A1A", border: "1px solid rgba(212,197,169,0.12)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-serif text-lg font-semibold" style={{ color: "#F5F0E6" }}>{r.name}</h3>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                style={{ background: r.tier === "hot" ? "rgba(184,134,11,0.15)" : "rgba(212,197,169,0.06)", color: r.tier === "hot" ? "#B8860B" : "#8A7D6B" }}>
                {r.tier} {r.score}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggleWatchlist(r.name, "1")}
                className="p-1.5 rounded-md transition-colors" style={{ background: "rgba(212,197,169,0.06)" }}>
                <Star size={14} style={{ color: inWatchlist(r.name) ? "#B8860B" : "#5A4D3A", fill: inWatchlist(r.name) ? "#B8860B" : "none" }} />
              </button>
              <button onClick={() => navigate(`/company/${encodeURIComponent(r.name)}`)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold" style={{ background: "#B8860B", color: "#0B1A0E" }}>
                <Eye size={12} className="inline mr-1" />Dossier
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px]" style={{ color: "#5A4D3A" }}>
            <span className="font-mono">{r.ticker}</span>
            <span>{r.cik}</span>
            <span>{r.signals.length} signals</span>
            <span>{r.sec_filings.length} filings</span>
          </div>
          {r.signals.length > 0 && (
            <div className="space-y-1">
              {r.signals.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: s.confidence === "high" ? "#B8860B" : s.confidence === "medium" ? "#4A7C59" : "#5A4D3A" }} />
                  <span style={{ color: "#8A7D6B" }}>{s.signal_type.replace(/_/g, " ")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {!loading && companies.length > 0 && results.length === 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#8A7D6B" }}>Previously Searched</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {companies.slice(0, 8).map((c, i) => (
              <div key={i} onClick={() => { navigate(`/company/${encodeURIComponent(c.name)}`); }}
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

      {!loading && companies.length === 0 && results.length === 0 && (
        <div className="text-center py-16">
          <Search className="mx-auto mb-3" size={32} style={{ color: "#5A4D3A" }} />
          <p className="text-sm" style={{ color: "#8A7D6B" }}>Search a company to begin deal flow.</p>
        </div>
      )}
    </div>
  );
}
