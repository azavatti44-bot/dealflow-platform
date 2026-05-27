import { useState } from "react";
import { Loader2, Database, Plus, Check } from "lucide-react";
import { browseFormD, type FormDRecord } from "@/lib/api";
import { addMonitored, getMonitored } from "@/lib/alertEngine";

const card = { background: "#132A1A", border: "1px solid rgba(212,197,169,0.12)" };

const US_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" }, { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" }, { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" }, { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" }, { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" }, { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" }, { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" }, { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" }, { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" }, { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" }, { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" }, { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" }, { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" }, { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" }, { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" },
];

const DATE_RANGE_OPTIONS = [
  { label: "Last 1 Year", value: "1" },
  { label: "Last 2 Years", value: "2" },
  { label: "Last 3 Years", value: "3" },
  { label: "Last 5 Years", value: "5" },
  { label: "All", value: "all" },
];

function getStartDate(range: string): string {
  if (range === "all") return "2010-01-01";
  const years = parseInt(range, 10);
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
}

export default function PrivateDealFinder() {
  const [state, setStateFilter] = useState("");
  const [dateRange, setDateRange] = useState("3");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FormDRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [from, setFrom] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [monitored, setMonitored] = useState<string[]>(() => getMonitored());
  const [hasSearched, setHasSearched] = useState(false);

  async function doSearch(newFrom = 0) {
    if (newFrom === 0) setLoading(true);
    else setLoadingMore(true);
    try {
      const { total: t, results: r } = await browseFormD({
        state: state || undefined,
        query: query || undefined,
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

  function handleMonitor(name: string) {
    addMonitored(name);
    setMonitored(getMonitored());
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg" style={{ background: "rgba(184,134,11,0.1)" }}>
          <Database size={20} style={{ color: "#B8860B" }} />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold" style={{ color: "#F5F0E6" }}>Private Deal Finder</h1>
          <p className="text-xs mt-0.5" style={{ color: "#8A7D6B" }}>Browse Reg D equity raises — PE-backed companies approaching exit</p>
        </div>
      </div>

      {/* Notice */}
      <div className="rounded-lg px-4 py-3 text-xs" style={{ background: "rgba(184,134,11,0.06)", border: "1px solid rgba(184,134,11,0.15)", color: "#8A7D6B" }}>
        Showing Reg D filings — private companies that raised equity capital. PE-backed companies in year 5–7 are prime exit candidates.
      </div>

      {/* Filters */}
      <div className="rounded-xl p-5 space-y-4" style={card}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5A4D3A" }}>US State</label>
            <select
              value={state}
              onChange={e => setStateFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs outline-none"
              style={{ background: "#1A351F", color: "#F5F0E6", border: "1px solid rgba(212,197,169,0.15)" }}
            >
              <option value="">All States</option>
              {US_STATES.map(s => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5A4D3A" }}>Date Range</label>
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs outline-none"
              style={{ background: "#1A351F", color: "#F5F0E6", border: "1px solid rgba(212,197,169,0.15)" }}
            >
              {DATE_RANGE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5A4D3A" }}>Search Query</label>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doSearch()}
              placeholder="Company name or keyword..."
              className="w-full px-3 py-2 rounded-lg text-xs outline-none"
              style={{ background: "#1A351F", color: "#F5F0E6", border: "1px solid rgba(212,197,169,0.15)" }}
            />
          </div>
        </div>

        <button
          onClick={() => doSearch()}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-60"
          style={{ background: "#B8860B", color: "#0B1A0E" }}
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Database size={13} />}
          Search Reg D Filings
        </button>
      </div>

      {/* Stats bar */}
      {hasSearched && !loading && (
        <div className="text-xs font-mono" style={{ color: "#8A7D6B" }}>
          <span style={{ color: "#B8860B" }}>{total.toLocaleString()}</span> private raises found
          {results.length > 0 && total > results.length && (
            <span> — showing {results.length}</span>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin mr-2" size={18} style={{ color: "#B8860B" }} />
          <span className="text-xs" style={{ color: "#8A7D6B" }}>Searching Form D filings...</span>
        </div>
      )}

      {/* Results Table */}
      {!loading && results.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={card}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(212,197,169,0.12)" }}>
                <th className="text-left py-3 px-4" style={{ color: "#8A7D6B" }}>Company</th>
                <th className="text-left py-3 px-4 hidden md:table-cell" style={{ color: "#8A7D6B" }}>State</th>
                <th className="text-left py-3 px-4 hidden md:table-cell" style={{ color: "#8A7D6B" }}>Filed</th>
                <th className="text-left py-3 px-4" style={{ color: "#8A7D6B" }}>Form Type</th>
                <th className="text-right py-3 px-4" style={{ color: "#8A7D6B" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => {
                const isMonitored = monitored.includes(r.company_name);
                return (
                  <tr
                    key={`${r.accession_no}_${i}`}
                    style={{ borderBottom: "1px solid rgba(212,197,169,0.06)" }}
                  >
                    <td className="py-2.5 px-4">
                      <span className="font-medium" style={{ color: "#F5F0E6" }}>{r.company_name || "—"}</span>
                    </td>
                    <td className="py-2.5 px-4 hidden md:table-cell">
                      <span className="font-mono text-[10px]" style={{ color: "#8A7D6B" }}>{r.state || "—"}</span>
                    </td>
                    <td className="py-2.5 px-4 hidden md:table-cell">
                      <span className="font-mono text-[10px]" style={{ color: "#8A7D6B" }}>{r.date_filed || "—"}</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                        style={r.form_type === "D/A"
                          ? { background: "rgba(90,77,58,0.3)", color: "#8A7D6B" }
                          : { background: "rgba(184,134,11,0.12)", color: "#B8860B" }}
                      >
                        {r.form_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => handleMonitor(r.company_name)}
                        disabled={isMonitored || !r.company_name}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] transition-colors ml-auto disabled:opacity-50"
                        style={isMonitored
                          ? { background: "rgba(74,124,89,0.12)", color: "#4A7C59" }
                          : { background: "rgba(184,134,11,0.1)", color: "#B8860B" }}
                      >
                        {isMonitored ? <Check size={10} /> : <Plus size={10} />}
                        {isMonitored ? "Monitoring" : "Monitor"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {!loading && hasSearched && results.length === 0 && (
        <div className="rounded-xl py-16 text-center" style={card}>
          <Database size={32} className="mx-auto mb-3 opacity-30" style={{ color: "#B8860B" }} />
          <p className="text-sm" style={{ color: "#8A7D6B" }}>No Reg D filings found for these filters.</p>
          <p className="text-xs mt-1" style={{ color: "#5A4D3A" }}>Try broadening your date range or removing the state filter.</p>
        </div>
      )}

      {/* Load More */}
      {!loading && results.length > 0 && results.length < total && (
        <div className="flex justify-center">
          <button
            onClick={() => doSearch(from + 20)}
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
