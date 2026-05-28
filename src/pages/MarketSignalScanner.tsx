import { useState, useEffect, useCallback } from "react";
import { Loader2, Radio, Plus, Check, ExternalLink, ShoppingBag, RefreshCw } from "lucide-react";
import { searchEDGARText, type EDGARTextHit } from "@/lib/api";
import { addMonitored } from "@/lib/alertEngine";
import { useData } from "@/lib/DataContext";
import {
  fetchBrokerListings,
  formatPrice,
  daysAgo,
  BROKER_SOURCES,
  type BrokerListing,
} from "@/lib/bizBuySellApi";

const WATCHLIST_NAME = "Market Signals";

const card = { background: "var(--bg-surface)", border: "1px solid rgba(0,0,0,0.08)" };

interface Preset {
  label: string;
  query: string;
  forms: string;
  description: string;
  color: string;
}

const PRESETS: Preset[] = [
  { label: "Strategic Alternatives", query: '"strategic alternatives"', forms: "8-K,10-K", description: "Exploring a sale or merger", color: "var(--accent)" },
  { label: "Going Concern", query: '"going concern"', forms: "10-K,10-Q", description: "Auditor distress flag", color: "#DC2626" },
  { label: "Investment Banker Retained", query: '"investment banker" OR "financial advisor retained" OR "engaged a financial advisor"', forms: "8-K", description: "Active sale process started", color: "var(--accent)" },
  { label: "Founder / CEO Transition", query: '"chief executive" OR "founder" "transition" OR "succession"', forms: "8-K", description: "Leadership change = exit signal", color: "var(--accent-hover)" },
  { label: "Exploring Strategic", query: '"exploring strategic" OR "evaluating strategic"', forms: "8-K,10-K", description: "Early-stage process indicator", color: "var(--text-secondary)" },
  { label: "Sale of the Company", query: '"sale of the company" OR "sale of our company"', forms: "8-K", description: "Direct sale announcement", color: "var(--accent)" },
  { label: "Chapter 11 / Distress", query: '"chapter 11" OR "bankruptcy protection" OR "restructuring"', forms: "8-K", description: "Distressed acquisition candidates", color: "#DC2626" },
  { label: "Key Man / Founder Exit", query: '"key man" OR "key person" OR "founder departure"', forms: "8-K,10-K", description: "Founder dependency risk", color: "var(--accent-hover)" },
  { label: "Material Agreement", query: '"material definitive agreement" "acquisition" OR "merger"', forms: "8-K", description: "Deal announcement filings", color: "var(--accent)" },
  { label: "WARN / Layoffs", query: '"WARN Act" OR "workforce reduction" OR "reduction in force"', forms: "8-K,10-K", description: "Operational contraction signal", color: "#DC2626" },
];

const FORM_OPTIONS = ["8-K", "10-K", "10-Q", "8-K,10-K", "All"];
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
  return `${Math.floor(days / 30)}mo ago`;
}

function edgarUrl(accession: string): string {
  if (!accession) return "";
  const clean = accession.replace(/-/g, "");
  return `https://www.sec.gov/Archives/edgar/data/0/${clean}/`;
}

export default function MarketSignalScanner() {
  const [mainTab, setMainTab] = useState<"edgar" | "listings">("edgar");

  // ── Sell-Side Listings state ──────────────────────────────────────────────
  const [brokerSource, setBrokerSource] = useState(BROKER_SOURCES[0].key);
  const [listings, setListings] = useState<BrokerListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsFetchedAt, setListingsFetchedAt] = useState("");
  const [listingsError, setListingsError] = useState("");

  const loadListings = useCallback(async (source: string) => {
    setListingsLoading(true);
    setListingsError("");
    try {
      const { items, fetchedAt } = await fetchBrokerListings(source);
      setListings(items);
      setListingsFetchedAt(fetchedAt);
    } catch (err) {
      setListingsError(err instanceof Error ? err.message : "Failed to fetch listings");
      setListings([]);
    } finally {
      setListingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mainTab === "listings" && listings.length === 0 && !listingsLoading && !listingsError) {
      loadListings(brokerSource);
    }
  }, [mainTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── EDGAR state ───────────────────────────────────────────────────────────
  const [query, setQuery] = useState(PRESETS[0].query);
  const [formType, setFormType] = useState(PRESETS[0].forms);
  const [dateRange, setDateRange] = useState(90);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<EDGARTextHit[]>([]);
  const [total, setTotal] = useState(0);
  const [from, setFrom] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activePreset, setActivePreset] = useState<string>(PRESETS[0].label);
  const { addToWatchlist, watchlists } = useData();
  const watchlistCompanies = watchlists.find(w => w.name === WATCHLIST_NAME)?.companies || [];

  const doSearch = useCallback(async (q: string, forms: string, days: number, newFrom = 0) => {
    if (newFrom === 0) setLoading(true);
    else setLoadingMore(true);
    try {
      const { total: t, results: r } = await searchEDGARText(q, {
        forms: forms === "All" ? undefined : forms,
        startDate: getStartDate(days),
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
  }, []);

  useEffect(() => {
    doSearch(PRESETS[0].query, PRESETS[0].forms, 90);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handlePreset(p: Preset) {
    setQuery(p.query);
    setFormType(p.forms);
    setActivePreset(p.label);
    doSearch(p.query, p.forms, dateRange);
  }

  function handleSearch() {
    setActivePreset("");
    doSearch(query, formType, dateRange);
  }

  function handleMonitor(name: string) {
    addMonitored(name);
    addToWatchlist(name, WATCHLIST_NAME);
  }

  const inputBase = { background: "var(--bg-surface-alt)", color: "var(--text-primary)", border: "1px solid rgba(0,0,0,0.1)" };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg" style={{ background: "rgba(27,67,50,0.08)" }}>
            {mainTab === "edgar" ? <Radio size={20} style={{ color: "var(--accent)" }} /> : <ShoppingBag size={20} style={{ color: "var(--accent)" }} />}
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Market Signal Scanner</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {mainTab === "edgar" ? "Real-time EDGAR full-text search for off-market LMM deal signals" : "Active sell-side listings from BizBuySell — companies for sale now"}
            </p>
          </div>
        </div>
        {mainTab === "edgar" && hasSearched && !loading && (
          <div className="text-right shrink-0">
            <p className="text-lg font-bold font-mono" style={{ color: "var(--accent)" }}>{total.toLocaleString()}</p>
            <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>filings matched</p>
          </div>
        )}
        {mainTab === "listings" && listings.length > 0 && (
          <div className="text-right shrink-0">
            <p className="text-lg font-bold font-mono" style={{ color: "var(--accent)" }}>{listings.length}</p>
            <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>active listings</p>
          </div>
        )}
      </div>

      {/* Main tab switcher */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "var(--bg-surface)", border: "1px solid rgba(0,0,0,0.07)" }}>
        {(["edgar", "listings"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setMainTab(t)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
            style={mainTab === t
              ? { background: "var(--accent)", color: "#FFFFFF" }
              : { background: "transparent", color: "var(--text-secondary)" }}
          >
            {t === "edgar" ? <Radio size={12} /> : <ShoppingBag size={12} />}
            {t === "edgar" ? "EDGAR Signals" : "Sell-Side Listings"}
          </button>
        ))}
      </div>

      {/* ── EDGAR tab ─────────────────────────────────────────────────────── */}
      {mainTab === "edgar" && <div className="space-y-5">

      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>LMM Signal Presets</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => handlePreset(p)}
              className="text-left rounded-lg px-3 py-2.5 transition-all space-y-0.5"
              style={activePreset === p.label
                ? { background: "rgba(27,67,50,0.12)", border: "1px solid rgba(45,106,79,0.35)" }
                : { background: "var(--bg-surface-alt)", border: "1px solid rgba(0,0,0,0.06)" }}>
              <p className="text-[11px] font-semibold leading-tight" style={{ color: activePreset === p.label ? "var(--accent)" : "var(--text-primary)" }}>{p.label}</p>
              <p className="text-[9px] leading-tight" style={{ color: "var(--text-secondary)" }}>{p.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl p-4 space-y-3" style={card}>
        <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Custom Search</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 space-y-1">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder={`"strategic alternatives" OR "investment banker"`}
              className="w-full px-3 py-2 rounded-lg text-xs outline-none"
              style={inputBase}
            />
          </div>
          <div>
            <select value={formType} onChange={e => setFormType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs outline-none"
              style={inputBase}>
              {FORM_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <select value={dateRange} onChange={e => setDateRange(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg text-xs outline-none"
              style={inputBase}>
              {DATE_OPTIONS.map(o => <option key={o.days} value={o.days}>{o.label}</option>)}
            </select>
          </div>
        </div>
        <button onClick={handleSearch} disabled={loading || !query.trim()}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-60"
          style={{ background: "var(--accent)", color: "#FFFFFF" }}>
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Radio size={13} />}
          Scan EDGAR
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin mr-2" size={18} style={{ color: "var(--accent)" }} />
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Scanning EDGAR full-text index...</span>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-2">
          {results.map((r, i) => {
            const isMonitored = watchlistCompanies.includes(r.entity_name);
            const url = edgarUrl(r.accession_no);
            return (
              <div key={`${r.accession_no}_${i}`} className="rounded-lg p-4 flex items-center gap-4" style={card}>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{r.entity_name || "Unknown Entity"}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0"
                      style={{ background: "rgba(27,67,50,0.10)", color: "var(--accent)" }}>{r.form_type}</span>
                    <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{relDate(r.file_date)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono" style={{ color: "var(--text-secondary)" }}>
                    <span>{r.file_date}</span>
                    <span className="truncate">{r.accession_no}</span>
                    {url && (
                      <a href={url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-0.5 hover:opacity-80 transition-opacity"
                        style={{ color: "var(--accent)" }}>
                        <ExternalLink size={9} /> EDGAR
                      </a>
                    )}
                  </div>
                </div>
                <button onClick={() => handleMonitor(r.entity_name)}
                  disabled={isMonitored || !r.entity_name}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] shrink-0 transition-colors disabled:opacity-50"
                  style={isMonitored
                    ? { background: "rgba(27,67,50,0.12)", color: "var(--accent-hover)" }
                    : { background: "rgba(27,67,50,0.08)", color: "var(--accent)" }}>
                  {isMonitored ? <Check size={10} /> : <Plus size={10} />}
                  {isMonitored ? "Monitoring" : "Monitor"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {!loading && hasSearched && results.length === 0 && (
        <div className="rounded-xl py-16 text-center" style={card}>
          <Radio size={32} className="mx-auto mb-3 opacity-30" style={{ color: "var(--accent)" }} />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No filings matched this signal query.</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>Try broadening the date range or using a different preset.</p>
        </div>
      )}

      {!loading && results.length > 0 && results.length < total && (
        <div className="flex justify-center">
          <button onClick={() => doSearch(query, formType, dateRange, from + 10)} disabled={loadingMore}
            className="flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-60"
            style={{ background: "var(--bg-surface-alt)", color: "var(--accent)", border: "1px solid rgba(27,67,50,0.15)" }}>
            {loadingMore ? <Loader2 size={13} className="animate-spin" /> : null}
            Load More ({(total - results.length).toLocaleString()} remaining)
          </button>
        </div>
      )}

      </div>} {/* end EDGAR tab */}

      {/* ── Sell-Side Listings tab ────────────────────────────────────────── */}
      {mainTab === "listings" && <div className="space-y-4">

        {/* Broker source pills + refresh */}
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {BROKER_SOURCES.map(broker => (
              <button
                key={broker.key}
                onClick={() => {
                  setBrokerSource(broker.key);
                  loadListings(broker.key);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                style={brokerSource === broker.key
                  ? { background: "var(--accent)", color: "#FFFFFF" }
                  : { background: "var(--bg-surface)", color: "var(--text-secondary)", border: "1px solid rgba(0,0,0,0.08)" }}
              >
                {broker.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => loadListings(brokerSource)}
            disabled={listingsLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
            style={{ background: "var(--bg-surface-alt)", color: "var(--accent)", border: "1px solid rgba(27,67,50,0.15)" }}
          >
            {listingsLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            {listingsLoading ? "Loading…" : "Refresh"}
          </button>
        </div>

        {/* Source description */}
        {(() => {
          const broker = BROKER_SOURCES.find(b => b.key === brokerSource);
          return broker ? (
            <div className="rounded-lg px-3 py-2.5 flex items-center justify-between" style={{ background: "var(--bg-surface)", border: "1px solid rgba(0,0,0,0.07)" }}>
              <div>
                <p className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>{broker.focus}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--text-secondary)" }}>{broker.description}</p>
              </div>
              {listingsFetchedAt && (
                <span className="text-[10px] font-mono shrink-0" style={{ color: "var(--text-secondary)" }}>
                  {daysAgo(listingsFetchedAt) || "just now"}
                </span>
              )}
            </div>
          ) : null;
        })()}

        {/* Error state */}
        {listingsError && (
          <div className="rounded-xl px-4 py-3 text-xs" style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.15)", color: "#DC2626" }}>
            {listingsError} — BizBuySell may be blocking automated requests. Try refreshing.
          </div>
        )}

        {/* Loading */}
        {listingsLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin mr-2" size={18} style={{ color: "var(--accent)" }} />
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Fetching listings from BizBuySell…</span>
          </div>
        )}

        {/* Listings grid */}
        {!listingsLoading && listings.length > 0 && (
          <div className="space-y-2">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!listingsLoading && !listingsError && listings.length === 0 && (
          <div className="rounded-xl py-16 text-center" style={card}>
            <ShoppingBag size={32} className="mx-auto mb-3 opacity-30" style={{ color: "var(--accent)" }} />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No listings loaded yet.</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>Select a category above to fetch active sell-side listings.</p>
          </div>
        )}

      </div>} {/* end Listings tab */}

    </div>
  );
}

function ListingCard({ listing }: { listing: BrokerListing }) {
  return (
    <div className="rounded-lg p-4 space-y-2.5" style={{ background: "var(--bg-surface)", border: "1px solid rgba(0,0,0,0.08)" }}>
      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{listing.title}</span>
          {listing.location && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono shrink-0" style={{ background: "rgba(27,67,50,0.08)", color: "var(--accent)" }}>
              {listing.location}
            </span>
          )}
          {listing.pubDate && (
            <span className="text-[10px] shrink-0" style={{ color: "var(--text-secondary)" }}>{daysAgo(listing.pubDate)}</span>
          )}
        </div>
        <a
          href={listing.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold shrink-0 transition-opacity hover:opacity-80"
          style={{ background: "rgba(27,67,50,0.08)", color: "var(--accent)", border: "1px solid rgba(27,67,50,0.12)" }}
        >
          <ExternalLink size={10} /> {listing.financialsAvailable ? "View" : "Request CIM"}
        </a>
      </div>

      {/* Financials row */}
      <div className="flex flex-wrap gap-4 text-[10px] font-mono">
        {listing.financialsAvailable ? (
          <>
            {listing.askingPrice !== null && (
              <span><span style={{ color: "var(--text-secondary)" }}>Ask</span>{" "}<span className="font-bold" style={{ color: "var(--text-primary)" }}>{formatPrice(listing.askingPrice)}</span></span>
            )}
            {listing.revenue !== null && (
              <span><span style={{ color: "var(--text-secondary)" }}>Revenue</span>{" "}<span className="font-bold" style={{ color: "var(--text-primary)" }}>{formatPrice(listing.revenue)}</span></span>
            )}
            {listing.cashFlow !== null && (
              <span><span style={{ color: "var(--text-secondary)" }}>Cash Flow</span>{" "}<span className="font-bold" style={{ color: "var(--accent)" }}>{formatPrice(listing.cashFlow)}</span></span>
            )}
            {listing.askingPrice && listing.cashFlow && (
              <span><span style={{ color: "var(--text-secondary)" }}>Multiple</span>{" "}<span className="font-bold" style={{ color: "var(--text-primary)" }}>{(listing.askingPrice / listing.cashFlow).toFixed(1)}x</span></span>
            )}
          </>
        ) : (
          <span className="italic" style={{ color: "var(--text-secondary)" }}>Financials available with NDA</span>
        )}
      </div>

      {/* Broker row */}
      {(listing.brokerName || listing.brokerPhone || listing.brokerEmail) && (
        <div className="flex flex-wrap items-center gap-3 pt-1.5 text-[10px]" style={{ borderTop: "1px solid rgba(0,0,0,0.05)", color: "var(--text-secondary)" }}>
          {listing.brokerName && <span className="font-medium" style={{ color: "var(--text-primary)" }}>{listing.brokerName}</span>}
          {listing.brokerPhone && (
            <a href={`tel:${listing.brokerPhone}`} className="hover:opacity-80 transition-opacity" style={{ color: "var(--accent)" }}>
              {listing.brokerPhone}
            </a>
          )}
          {listing.brokerEmail && (
            <a href={`mailto:${listing.brokerEmail}`} className="hover:opacity-80 transition-opacity truncate" style={{ color: "var(--accent)" }}>
              {listing.brokerEmail}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
