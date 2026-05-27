import { useState, useEffect, useCallback } from "react";
import { Loader2, Database, Plus, Check, TrendingUp, Clock, DollarSign } from "lucide-react";
import { browseFormD, type FormDRecord } from "@/lib/api";
import { addMonitored, getMonitored } from "@/lib/alertEngine";

const card = { background: "#132A1A", border: "1px solid rgba(212,197,169,0.12)" };

const US_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" }, { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" },
];

// Lower middle market sector presets — keyword searches against company names
const LMM_SECTORS = [
  { label: "All Sectors", query: "" },
  { label: "Business Services", query: "services consulting staffing" },
  { label: "Healthcare Services", query: "health medical dental therapy clinic" },
  { label: "Industrials / Mfg", query: "manufacturing industrial fabrication distribution" },
  { label: "Insurance Distribution", query: "insurance agency brokerage" },
  { label: "IT Services / SaaS", query: "software technology IT solutions" },
  { label: "Financial Services", query: "financial advisory wealth lending" },
  { label: "Specialty Distribution", query: "wholesale distribution supply logistics" },
];

// LMM deal size ranges (Reg D offering amounts)
const AMOUNT_RANGES = [
  { label: "All Sizes", min: undefined, max: undefined },
  { label: "< $5M", min: 0, max: 5_000_000 },
  { label: "$5M – $25M", min: 5_000_000, max: 25_000_000 },
  { label: "$25M – $100M", min: 25_000_000, max: 100_000_000 },
  { label: "> $100M", min: 100_000_000, max: undefined },
];

const DATE_RANGE_OPTIONS = [
  { label: "Last 2 Years", value: "2" },
  { label: "Last 3 Years", value: "3" },
  { label: "Last 5 Years", value: "5" },
  { label: "Last 7 Years", value: "7" },
];

function getStartDate(range: string): string {
  const years = parseInt(range, 10);
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
}

function formatAmount(n?: number): string {
  if (!n) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function holdPeriod(dateFiled: string): { years: number; label: string; badge: { bg: string; color: string } } {
  const filed = new Date(dateFiled);
  const years = Math.floor((Date.now() - filed.getTime()) / (365.25 * 24 * 3600 * 1000));
  let label = `${years}yr hold`;
  let badge = { bg: "rgba(90,77,58,0.2)", color: "#5A4D3A" };
  if (years >= 3 && years <= 7) {
    label = `${years}yr — exit window`;
    badge = { bg: "rgba(184,134,11,0.15)", color: "#B8860B" };
  } else if (years > 7) {
    label = `${years}yr — overdue exit`;
    badge = { bg: "rgba(180,60,60,0.15)", color: "#C07070" };
  }
  return { years, label, badge };
}

export default function PrivateDealFinder() {
  const [stateFilter, setStateFilter] = useState("");
  const [dateRange, setDateRange] = useState("5");
  const [sector, setSector] = useState(0); // index into LMM_SECTORS
  const [amountRange, setAmountRange] = useState(0); // index into AMOUNT_RANGES
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FormDRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [from, setFrom] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [monitored, setMonitored] = useState<string[]>(() => getMonitored());
  const [hasSearched, setHasSearched] = useState(false);

  const doSearch = useCallback(async (newFrom = 0) => {
    if (newFrom === 0) setLoading(true);
    else setLoadingMore(true);
    const ar = AMOUNT_RANGES[amountRange];
    const sec = LMM_SECTORS[sector];
    try {
      const { total: t, results: r } = await browseFormD({
        state: stateFilter || undefined,
        query: sec.query || undefined,
        startDate: getStartDate(dateRange),
        from: newFrom,
        minAmount: ar.min,
        maxAmount: ar.max,
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
  }, [stateFilter, dateRange, sector, amountRange]);

  // Auto-load on mount
  useEffect(() => { doSearch(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleMonitor(name: string) {
    addMonitored(name);
    setMonitored(getMonitored());
  }

  const exitWindowCount = results.filter(r => {
    const yrs = holdPeriod(r.date_filed).years;
    return yrs >= 3 && yrs <= 7;
  }).length;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg" style={{ background: "rgba(184,134,11,0.1)" }}>
          <Database size={20} style={{ color: "#B8860B" }} />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold" style={{ color: "#F5F0E6" }}>Private Deal Finder</h1>
          <p className="text-xs mt-0.5" style={{ color: "#8A7D6B" }}>Reg D equity raises — lower middle market companies approaching exit</p>
        </div>
      </div>

      {/* Summary stats */}
      {hasSearched && !loading && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Database, label: "Total Matches", value: total.toLocaleString() },
            { icon: Clock, label: "Exit Window (3–7yr)", value: exitWindowCount },
            { icon: TrendingUp, label: "Showing", value: results.length },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-lg p-3 text-center" style={card}>
              <Icon size={14} className="mx-auto mb-1" style={{ color: "#B8860B" }} />
              <p className="text-lg font-bold font-mono" style={{ color: "#F5F0E6" }}>{value}</p>
              <p className="text-[10px]" style={{ color: "#8A7D6B" }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sector presets */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5A4D3A" }}>LMM Sector Focus</p>
        <div className="flex flex-wrap gap-2">
          {LMM_SECTORS.map((s, i) => (
            <button key={s.label} onClick={() => { setSector(i); }}
              className="px-3 py-1.5 rounded-full text-xs transition-all"
              style={sector === i
                ? { background: "#B8860B", color: "#0B1A0E", fontWeight: 600 }
                : { background: "#1A351F", color: "#8A7D6B", border: "1px solid rgba(212,197,169,0.1)" }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl p-4 space-y-3" style={card}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5A4D3A" }}>State</label>
            <select value={stateFilter} onChange={e => setStateFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs outline-none"
              style={{ background: "#1A351F", color: "#F5F0E6", border: "1px solid rgba(212,197,169,0.15)" }}>
              <option value="">All States</option>
              {US_STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5A4D3A" }}>Raise Date</label>
            <select value={dateRange} onChange={e => setDateRange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs outline-none"
              style={{ background: "#1A351F", color: "#F5F0E6", border: "1px solid rgba(212,197,169,0.15)" }}>
              {DATE_RANGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5A4D3A" }}>Deal Size</label>
            <select value={amountRange} onChange={e => setAmountRange(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg text-xs outline-none"
              style={{ background: "#1A351F", color: "#F5F0E6", border: "1px solid rgba(212,197,169,0.15)" }}>
              {AMOUNT_RANGES.map((o, i) => <option key={i} value={i}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={() => doSearch()} disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-60"
              style={{ background: "#B8860B", color: "#0B1A0E" }}>
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Database size={13} />}
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin mr-2" size={18} style={{ color: "#B8860B" }} />
          <span className="text-xs" style={{ color: "#8A7D6B" }}>Scanning Reg D filings...</span>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="space-y-2">
          {results.map((r, i) => {
            const hp = holdPeriod(r.date_filed);
            const isMonitored = monitored.includes(r.company_name);
            return (
              <div key={`${r.accession_no}_${i}`} className="rounded-lg p-4 flex items-center gap-4" style={card}>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold" style={{ color: "#F5F0E6" }}>{r.company_name || "—"}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0"
                      style={{ background: "rgba(184,134,11,0.12)", color: "#B8860B" }}>{r.form_type}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0"
                      style={hp.badge}>{hp.label}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono" style={{ color: "#5A4D3A" }}>
                    <span>{r.state || "—"}</span>
                    <span>Filed {r.date_filed}</span>
                    {r.amount_raised && (
                      <span className="flex items-center gap-1" style={{ color: "#8A7D6B" }}>
                        <DollarSign size={9} />{formatAmount(r.amount_raised)} raised
                      </span>
                    )}
                    {r.industry && <span style={{ color: "#5A4D3A" }}>{r.industry}</span>}
                  </div>
                </div>
                <button onClick={() => handleMonitor(r.company_name)}
                  disabled={isMonitored || !r.company_name}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] shrink-0 transition-colors disabled:opacity-50"
                  style={isMonitored
                    ? { background: "rgba(74,124,89,0.12)", color: "#4A7C59" }
                    : { background: "rgba(184,134,11,0.1)", color: "#B8860B" }}>
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
          <Database size={32} className="mx-auto mb-3 opacity-30" style={{ color: "#B8860B" }} />
          <p className="text-sm" style={{ color: "#8A7D6B" }}>No Reg D filings found for these filters.</p>
          <p className="text-xs mt-1" style={{ color: "#5A4D3A" }}>Try broadening the date range or switching to All Sectors.</p>
        </div>
      )}

      {/* Load More */}
      {!loading && results.length > 0 && results.length < total && (
        <div className="flex justify-center">
          <button onClick={() => doSearch(from + 20)} disabled={loadingMore}
            className="flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-60"
            style={{ background: "#1A351F", color: "#B8860B", border: "1px solid rgba(184,134,11,0.2)" }}>
            {loadingMore ? <Loader2 size={13} className="animate-spin" /> : null}
            Load More ({(total - results.length).toLocaleString()} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
