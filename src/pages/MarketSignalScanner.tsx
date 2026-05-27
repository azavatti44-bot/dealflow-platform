import { useState } from "react";
import { Loader2, Radio, Plus, Check } from "lucide-react";
import { searchEDGARText, type EDGARTextHit } from "@/lib/api";
import { addMonitored, getMonitored } from "@/lib/alertEngine";

const card = { background: "#132A1A", border: "1px solid rgba(212,197,169,0.12)" };

interface Preset {
  label: string;
  query: string;
  forms: string;
}

const PRESETS: Preset[] = [
  { label: "Strategic Alternatives", query: "strategic alternatives", forms: "8-K,10-K" },
  { label: "Going Concern", query: "going concern", forms: "10-K,10-Q" },
  { label: "Sale of the Company", query: "sale of the company", forms: "8-K" },
  { label: "Investment Banker Retained", query: "investment banker retained", forms: "8-K" },
  { label: "Exploring Strategic", query: "exploring strategic", forms: "8-K" },
  { label: "Chapter 11", query: "chapter 11", forms: "8-K" },
  { label: "Key Man", query: "key man", forms: "8-K,10-K" },
  { label: "Founder Transition", query: "founder transition", forms: "8-K" },
];

const FORM_OPTIONS = ["All", "8-K", "10-K", "10-Q", "S-4", "D"];

const DATE_OPTIONS = [
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "Last 6 months", days: 180 },
  { label: "Last Year", days: 365 },
];

function getStartDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function relDate(iso: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function MarketSignalScanner() {
  const [query, setQuery] = useState("");
  const [formType, setFormType] = useState("All");
  const [dateRange, setDateRange] = useState(90);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<EDGARTextHit[]>([]);
  const [total, setTotal] = useState(0);
  const [from, setFrom] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [monitored, setMonitored] = useState<string[]>(() => getMonitored());

  async function doSearch(q: string, forms: string, newFrom = 0) {
    if (newFrom === 0) setLoading(true);
    else setLoadingMore(true);
    try {
      const { total: t, results: r } = await searchEDGARText(q, {
        forms: forms === "All" ? undefined : forms,
        startDate: getStartDate(dateRange),
        from: newFrom,
      });
      if (newFrom === 0) {
        setResults(r);
        setTotal(t);
        setFrom(0);
      } else {
        setResults(prev => [...prev, ...r]);
        setFrom(newFrom);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setHasSearched(true);
    }
  }

  function handlePreset(p: Preset) {
    setQuery(p.query);
    setFormType(p.forms);
    setActivePreset(p.label);
    doSearch(p.query, p.forms);
  }

  function handleSearch() {
    setActivePreset(null);
    doSearch(query, formType);
  }

  function handleMonitor(name: string) {
    addMonitored(name);
    setMonitored(getMonitored());
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg" style={{ background: "rgba(184,134,11,0.1)" }}>
          <Radio size={20} style={{ color: "#B8860B" }} />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold" style={{ color: "#F5F0E6" }}>Market Signal Scanner</h1>
          <p className="text-xs mt-0.5" style={{ color: "#8A7D6B" }}>Real-time EDGAR full-text search for off-market deal signals</p>
        </div>
      </div>

      {/* Preset buttons */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5A4D3A" }}>Signal Presets</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => handlePreset(p)}
              className="px-3 py-1.5 rounded-full text-xs transition-all"
              style={activePreset === p.label
                ? { background: "#B8860B", color: "#0B1A0E", fontWeight: 600 }
                : { background: "#1A351F", color: "#8A7D6B", border: "1px solid rgba(212,197,169,0.1)" }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom search */}
      <div className="rounded-xl p-5 space-y-4" style={card}>
        <p className="text-xs font-semibold" style={{ color: "#F5F0E6" }}>Custom Search</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-1 space-y-1">
            <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5A4D3A" }}>Query</label>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder={`"strategic alternatives" OR "investment banker"`}
              className="w-full px-3 py-2 rounded-lg text-xs outline-none"
              style={{ background: "#1A351F", color: "#F5F0E6", border: "1px solid rgba(212,197,169,0.15)" }}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5A4D3A" }}>Form Type</label>
            <select
              value={formType}
              onChange={e => setFormType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs outline-none"
              style={{ background: "#1A351F", color: "#F5F0E6", border: "1px solid rgba(212,197,169,0.15)" }}
            >
              {FORM_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5A4D3A" }}>Date Range</label>
            <select
              value={dateRange}
              onChange={e => setDateRange(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg text-xs outline-none"
              style={{ background: "#1A351F", color: "#F5F0E6", border: "1px solid rgba(212,197,169,0.15)" }}
            >
              {DATE_OPTIONS.map(o => <option key={o.days} value={o.days}>{o.label}</option>)}
            </select>
          </div>
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-60"
          style={{ background: "#B8860B", color: "#0B1A0E" }}
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Radio size={13} />}
          Scan EDGAR
        </button>
      </div>

      {/* Stats */}
      {hasSearched && !loading && (
        <div className="text-xs font-mono" style={{ color: "#8A7D6B" }}>
          <span style={{ color: "#B8860B" }}>{total.toLocaleString()}</span> filings match this signal
          {results.length > 0 && total > results.length && (
            <span> — showing {results.length}</span>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin mr-2" size={18} style={{ color: "#B8860B" }} />
          <span className="text-xs" style={{ color: "#8A7D6B" }}>Scanning EDGAR full-text index...</span>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="space-y-2">
          {results.map((r, i) => {
            const isMonitored = monitored.includes(r.entity_name);
            return (
              <div key={`${r.accession_no}_${i}`} className="rounded-lg p-4 flex items-center gap-4" style={card}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold truncate" style={{ color: "#F5F0E6" }}>{r.entity_name || "Unknown Entity"}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0" style={{ background: "rgba(184,134,11,0.12)", color: "#B8860B" }}>{r.form_type}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono" style={{ color: "#5A4D3A" }}>
                    <span>{relDate(r.file_date)} ({r.file_date})</span>
                    <span className="truncate">{r.accession_no}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleMonitor(r.entity_name)}
                  disabled={isMonitored || !r.entity_name}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] shrink-0 transition-colors disabled:opacity-50"
                  style={isMonitored
                    ? { background: "rgba(74,124,89,0.12)", color: "#4A7C59" }
                    : { background: "rgba(184,134,11,0.1)", color: "#B8860B" }}
                >
                  {isMonitored ? <Check size={10} /> : <Plus size={10} />}
                  {isMonitored ? "Monitoring" : "Monitor"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && hasSearched && results.length === 0 && (
        <div className="rounded-xl py-16 text-center" style={card}>
          <Radio size={32} className="mx-auto mb-3 opacity-30" style={{ color: "#B8860B" }} />
          <p className="text-sm" style={{ color: "#8A7D6B" }}>No filings matched this signal query.</p>
          <p className="text-xs mt-1" style={{ color: "#5A4D3A" }}>Try broadening the date range or using a different search term.</p>
        </div>
      )}

      {/* Load More */}
      {!loading && results.length > 0 && results.length < total && (
        <div className="flex justify-center">
          <button
            onClick={() => doSearch(query, formType, from + 10)}
            disabled={loadingMore}
            className="flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-60"
            style={{ background: "#1A351F", color: "#B8860B", border: "1px solid rgba(184,134,11,0.2)" }}
          >
            {loadingMore ? <Loader2 size={13} className="animate-spin" /> : null}
            Load More ({total - results.length} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
