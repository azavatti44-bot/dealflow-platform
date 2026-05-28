import { useState } from "react";
import { HeartPulse, Search, AlertTriangle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import {
  SPECIALTY_BENCHMARKS,
  searchHealthcareProviders,
  type PracticeProfile,
} from "@/lib/healthcareApi";
import { addMonitored } from "@/lib/alertEngine";
import { useData } from "@/lib/DataContext";

const WATCHLIST_NAME = "Healthcare";
import type { CompanyResult } from "@/lib/api";

// ---------------------------------------------------------------------------
// Quick-select specialty mapping (display -> benchmark key)
// ---------------------------------------------------------------------------
const QUICK_SPECIALTIES: { key: string; label: string; benchmark: string }[] = [
  { key: "all", label: "All Specialties", benchmark: "all" },
  { key: "family_medicine", label: "Family Medicine", benchmark: "physician" },
  { key: "general_practice", label: "General Practice", benchmark: "physician" },
  { key: "internal_medicine", label: "Internal Medicine", benchmark: "physician" },
  { key: "geriatric", label: "Geriatric Medicine", benchmark: "geriatric" },
  { key: "surgery", label: "Surgery", benchmark: "surgery" },
  { key: "ent", label: "Otolaryngology (ENT)", benchmark: "ent" },
  { key: "ophthalmology", label: "Ophthalmology", benchmark: "ophthalmology" },
  { key: "dermatology", label: "Dermatology", benchmark: "dermatology" },
  { key: "dental", label: "Dental", benchmark: "dental" },
  { key: "orthopedic", label: "Orthopedics", benchmark: "orthopedic" },
  { key: "urgent_care", label: "Urgent Care", benchmark: "urgent_care" },
  { key: "behavioral", label: "Behavioral Health", benchmark: "behavioral" },
  { key: "medspa", label: "MedSpa", benchmark: "medspa" },
  { key: "home_health", label: "Home Health", benchmark: "home_health" },
  { key: "pharmacy", label: "Pharmacy", benchmark: "pharmacy" },
];

// ---------------------------------------------------------------------------
// US States
// ---------------------------------------------------------------------------
const US_STATES = [
  { code: "ALL", name: "All States" },
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------
function fmtMoney(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}k`;
  return `$${n}`;
}

function scoreBadgeStyle(score: number) {
  if (score >= 80) return { background: "var(--accent)", color: "#FFFFFF" };
  if (score >= 60) return { background: "var(--accent-hover)", color: "#FFFFFF" };
  return { background: "rgba(0,0,0,0.06)", color: "var(--text-secondary)" };
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------
function passesRevenueFilter(profile: PracticeProfile, filter: string): boolean {
  const low = profile.revenueRangeLow;
  switch (filter) {
    case "under1m": return low < 1000000;
    case "1m_3m": return low >= 750000 && low < 3000000;
    case "3m_10m": return low >= 2250000 && low < 10000000;
    case "10m_30m": return low >= 7500000 && low < 30000000;
    case "30m_plus": return low >= 22500000;
    default: return true;
  }
}

function passesAgeFilter(profile: PracticeProfile, filter: string): boolean {
  switch (filter) {
    case "7": return profile.practiceAge >= 7;
    case "10": return profile.practiceAge >= 10;
    case "15": return profile.practiceAge >= 15;
    case "20": return profile.practiceAge >= 20;
    default: return true;
  }
}

// ---------------------------------------------------------------------------
// Practice Card
// ---------------------------------------------------------------------------
interface PracticeCardProps {
  profile: PracticeProfile;
  isMonitored: boolean;
  isInPipeline: boolean;
  onAddPipeline: (profile: PracticeProfile) => void;
  onMonitor: (profile: PracticeProfile) => void;
}

function PracticeCard({
  profile,
  isMonitored,
  isInPipeline,
  onAddPipeline,
  onMonitor,
}: PracticeCardProps) {
  const p = profile.provider;
  const [expanded, setExpanded] = useState(false);

  const foundingYearStr =
    p.foundingYear > 0
      ? `Est. ${p.foundingYear} · ${profile.practiceAge} yr${profile.practiceAge !== 1 ? "s" : ""}`
      : "";

  return (
    <div
      className="rounded-xl p-5 mb-3 transition-shadow duration-150"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.35)")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.2)")
      }
    >
      {/* ROW 1: Score + Name + Specialty + Age */}
      <div className="flex items-start gap-3 flex-wrap mb-3">
        <span
          className="rounded-md px-2.5 py-0.5 text-[13px] font-bold font-mono shrink-0"
          style={scoreBadgeStyle(profile.acquisitionScore)}
        >
          {profile.acquisitionScore}
        </span>

        <span
          className="text-[17px] font-bold flex-1 min-w-0 leading-snug"
          style={{ color: "var(--text-primary)" }}
        >
          {p.name}
        </span>

        <span
          className="text-[11px] px-2 py-0.5 rounded font-medium shrink-0 self-center"
          style={{ background: "rgba(0,0,0,0.06)", color: "var(--text-secondary)" }}
        >
          {p.specialty}
        </span>

        {foundingYearStr && (
          <span
            className="text-[11px] shrink-0 self-center"
            style={{ color: "var(--text-secondary)" }}
          >
            {foundingYearStr}
          </span>
        )}
      </div>

      {/* Score label */}
      <div className="mb-3">
        <span
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{
            color:
              profile.acquisitionScore >= 80
                ? "var(--accent)"
                : profile.acquisitionScore >= 60
                ? "var(--accent-hover)"
                : "var(--text-secondary)",
          }}
        >
          {profile.scoreLabel}
        </span>
      </div>

      {/* ROW 2: Key metrics bar */}
      <div
        className="flex rounded-lg overflow-hidden mb-4"
        style={{ border: "1px solid rgba(0,0,0,0.06)" }}
      >
        {[
          {
            label: "Est. Revenue",
            value: `${fmtMoney(profile.revenueRangeLow)} – ${fmtMoney(profile.revenueRangeHigh)}`,
          },
          {
            label: "Est. EBITDA",
            value: `${fmtMoney(profile.ebitdaRangeLow)} – ${fmtMoney(profile.ebitdaRangeHigh)}`,
          },
          {
            label: "EV Multiple",
            value: `${profile.impliedMultipleLow}–${profile.impliedMultipleHigh}x`,
          },
          {
            label: "Providers",
            value: `~${profile.estimatedProviders} provider${profile.estimatedProviders !== 1 ? "s" : ""}`,
          },
        ].map((m, i) => (
          <div
            key={i}
            className="flex-1 px-3 py-2.5"
            style={{
              borderRight: i < 3 ? "1px solid rgba(0,0,0,0.06)" : "none",
              background: "rgba(27,67,50,0.07)",
            }}
          >
            <div
              className="text-[10px] uppercase tracking-wider mb-0.5"
              style={{ color: "var(--text-secondary)" }}
            >
              {m.label}
            </div>
            <div
              className="text-[13px] font-semibold font-mono"
              style={{ color: "var(--text-primary)" }}
            >
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* ROW 3: Why Enticing + Approach Angle */}
      <div className="flex gap-6 mb-3.5 flex-wrap md:flex-nowrap">
        <div className="flex-1 min-w-[240px]">
          <div
            className="text-[10px] font-semibold uppercase tracking-widest mb-1"
            style={{ color: "var(--text-secondary)" }}
          >
            Why Enticing
          </div>
          <div className="text-xs leading-relaxed" style={{ color: "#A39B8B" }}>
            {profile.thesis}
          </div>
        </div>

        <div className="flex-1 min-w-[240px]">
          <div
            className="text-[10px] font-semibold uppercase tracking-widest mb-1"
            style={{ color: "var(--text-secondary)" }}
          >
            Approach Angle
          </div>
          <div className="text-xs leading-relaxed" style={{ color: "#A39B8B" }}>
            {profile.approachAngle}
          </div>
        </div>
      </div>

      {/* ROW 4: Signals + Contact + Actions */}
      <div
        className="flex justify-between items-start gap-4 flex-wrap pt-3"
        style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
      >
        {/* Signals */}
        <div className="flex flex-wrap gap-1.5 flex-1">
          {profile.signals.map((sig, i) => (
            <span
              key={i}
              className="text-[10px] px-2 py-0.5 rounded whitespace-nowrap"
              style={{
                background: "rgba(27,67,50,0.07)",
                border: "1px solid rgba(0,0,0,0.06)",
                color: "var(--text-secondary)",
              }}
            >
              {sig}
            </span>
          ))}
        </div>

        {/* Contact + Actions */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="text-right">
            {p.phone && (
              <div
                className="text-xs font-semibold font-mono"
                style={{ color: "var(--text-primary)" }}
              >
                📞 {p.phone}
              </div>
            )}
            {p.contactName && (
              <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                {p.contactName}
                {p.contactTitle ? ` · ${p.contactTitle}` : ""}
              </div>
            )}
            {(p.address || p.city) && (
              <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                {[p.address, p.city, p.state].filter(Boolean).join(", ")}
              </div>
            )}
          </div>

          <div className="flex gap-2 items-center flex-wrap justify-end">
            <button
              onClick={() => onAddPipeline(profile)}
              disabled={isInPipeline}
              className="px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors disabled:opacity-60"
              style={{
                background: isInPipeline ? "rgba(27,67,50,0.3)" : "var(--accent)",
                color: isInPipeline ? "var(--text-secondary)" : "#FFFFFF",
                border: "none",
                cursor: isInPipeline ? "default" : "pointer",
              }}
            >
              {isInPipeline ? "✓ In Pipeline" : "Add to Pipeline"}
            </button>

            <button
              onClick={() => onMonitor(profile)}
              disabled={isMonitored}
              className="px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors disabled:opacity-60"
              style={{
                background: "transparent",
                color: isMonitored ? "var(--text-secondary)" : "var(--accent)",
                border: `1px solid ${isMonitored ? "rgba(0,0,0,0.06)" : "rgba(45,106,79,0.4)"}`,
                cursor: isMonitored ? "default" : "pointer",
              }}
            >
              {isMonitored ? "✓ Monitored" : "Monitor"}
            </button>

            <span
              className="text-[10px] font-mono"
              style={{ color: "var(--text-secondary)" }}
            >
              NPI: {p.npi}
            </span>
          </div>

          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-[10px] transition-colors hover:opacity-80"
            style={{ background: "none", border: "none", color: "var(--text-secondary)", padding: 0, cursor: "pointer" }}
          >
            {expanded ? "▲ Less details" : "▼ More details"}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          className="mt-3 p-3 rounded-lg grid grid-cols-2 md:grid-cols-3 gap-3"
          style={{
            background: "rgba(27,67,50,0.07)",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          {[
            { label: "NPI Number", value: p.npi },
            { label: "Taxonomy Code", value: p.taxonomyCode || "—" },
            { label: "License State", value: p.licenseState || "—" },
            { label: "ZIP Code", value: p.zip || "—" },
            { label: "Last Updated", value: p.lastUpdated || "—" },
            { label: "Entity Type", value: p.enumType },
          ].map((item) => (
            <div key={item.label}>
              <div
                className="text-[10px] uppercase tracking-wider mb-0.5"
                style={{ color: "var(--text-secondary)" }}
              >
                {item.label}
              </div>
              <div
                className="text-xs font-mono"
                style={{ color: "var(--text-primary)" }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function HealthcareDealEngine() {
  const { addCompany, addToWatchlist, watchlists } = useData();
  const watchlistCompanies = watchlists.find(w => w.name === WATCHLIST_NAME)?.companies || [];

  const [selectedQuickKey, setSelectedQuickKey] = useState("all");
  const [showAllSpecialties, setShowAllSpecialties] = useState(false);
  const [stateFilter, setStateFilter] = useState("TX");
  const [city, setCity] = useState("");
  const [entityType, setEntityType] = useState<"all" | "NPI-1" | "NPI-2">("all");
  const [orgName, setOrgName] = useState("");
  const [lastName, setLastName] = useState("");
  const [revenueFilter, setRevenueFilter] = useState("any");
  const [ageFilter, setAgeFilter] = useState("any");
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState<"score" | "age" | "revenue">("score");
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<PracticeProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedToPipeline, setAddedToPipeline] = useState<Set<string>>(new Set());

  const selectedBenchmark = SPECIALTY_BENCHMARKS[QUICK_SPECIALTIES.find(s => s.key === selectedQuickKey)?.benchmark || "all"];

  async function doSearch(newSkip = 0) {
    if (newSkip === 0) {
      setLoading(true);
      setProfiles([]);
      setTotal(0);
      setError(null);
    }
    try {
      const quick = QUICK_SPECIALTIES.find((s) => s.key === selectedQuickKey);
      const { total: t, profiles: p } = await searchHealthcareProviders({
        specialtyKey: quick?.benchmark || "all",
        state: stateFilter,
        city: city.trim() || undefined,
        limit: 25,
        skip: newSkip,
        entityType,
        orgName: orgName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
      if (newSkip === 0) {
        setProfiles(p);
        setTotal(t);
      } else {
        setProfiles((prev) => [...prev, ...p]);
      }
    } catch (err: any) {
      setError(err.message || "NPI Registry unavailable — try again in a moment.");
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  }

  // Client-side filtering & sorting
  const filteredProfiles = profiles
    .filter((p) => passesRevenueFilter(p, revenueFilter))
    .filter((p) => passesAgeFilter(p, ageFilter))
    .filter((p) => p.acquisitionScore >= minScore)
    .sort((a, b) => {
      if (sortBy === "score") return b.acquisitionScore - a.acquisitionScore;
      if (sortBy === "age") return b.practiceAge - a.practiceAge;
      return b.revenueRangeHigh - a.revenueRangeHigh;
    });

  function handleAddPipeline(profile: PracticeProfile) {
    const mockCompany: CompanyResult = {
      name: profile.provider.name,
      score: profile.acquisitionScore,
      tier:
        profile.acquisitionScore >= 80
          ? "hot"
          : profile.acquisitionScore >= 60
          ? "warm"
          : "watch",
      signals: [],
      sec_filings: [],
      court_cases: [],
      patents: [],
      sos_records: [],
      api_errors: [],
      fetched_at: new Date().toISOString(),
    };
    addCompany(mockCompany);
    setAddedToPipeline((prev) => new Set([...prev, profile.provider.npi]));
  }

  function handleMonitor(profile: PracticeProfile) {
    addMonitored(profile.provider.name);              // keep for alert engine
    addToWatchlist(profile.provider.name, WATCHLIST_NAME);
  }

  const visibleQuickSpecialties = showAllSpecialties
    ? QUICK_SPECIALTIES
    : QUICK_SPECIALTIES.slice(0, 8);

  const cardBg = { background: "var(--bg-surface)", border: "1px solid rgba(0,0,0,0.08)" };
  const inputBase = {
    background: "var(--bg-surface-alt)",
    color: "var(--text-primary)",
    border: "1px solid rgba(0,0,0,0.1)",
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "rgba(27,67,50,0.1)", border: "1px solid rgba(45,106,79,0.25)" }}
        >
          <HeartPulse size={18} style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Healthcare Practice Finder
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Search CMS NPI Registry for practice acquisition targets
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div
        className="rounded-lg px-4 py-3 text-xs"
        style={{ background: "rgba(27,67,50,0.07)", border: "1px solid rgba(0,0,0,0.06)", color: "var(--text-secondary)" }}
      >
        Practice targets: Physician groups, dental practices, ASCs, and home health agencies. Enter at least one filter below to search.
      </div>

      {/* Search card */}
      <div className="rounded-xl p-5 space-y-5" style={cardBg}>
        {/* Quick select */}
        <div>
          <div
            className="text-[10px] font-semibold uppercase tracking-widest mb-2.5"
            style={{ color: "var(--text-secondary)" }}
          >
            Quick Select Specialty
          </div>
          <div className="flex flex-wrap gap-2">
            {visibleQuickSpecialties.map((spec) => {
              const selected = selectedQuickKey === spec.key;
              return (
                <button
                  key={spec.key}
                  onClick={() => setSelectedQuickKey(spec.key)}
                  className="px-3 py-1.5 rounded-full text-[11px] font-medium transition-all"
                  style={{
                    background: selected ? "var(--accent)" : "var(--bg-surface-alt)",
                    color: selected ? "#FFFFFF" : "var(--text-secondary)",
                    border: selected ? "1px solid #16A34A" : "1px solid rgba(0,0,0,0.07)",
                  }}
                >
                  {spec.label}
                </button>
              );
            })}
          </div>
          {QUICK_SPECIALTIES.length > 8 && (
            <button
              onClick={() => setShowAllSpecialties((v) => !v)}
              className="flex items-center gap-1 mt-2 text-[11px] font-medium transition-opacity hover:opacity-80"
              style={{ color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}
            >
              {showAllSpecialties ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {showAllSpecialties ? "Show Fewer" : "Show All Specialties"}
            </button>
          )}
        </div>

        {/* Filter grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Specialty */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Specialty
            </label>
            <select
              value={selectedQuickKey}
              onChange={(e) => setSelectedQuickKey(e.target.value)}
              className="w-full px-3 py-2 rounded-md text-sm outline-none cursor-pointer"
              style={inputBase}
            >
              {QUICK_SPECIALTIES.map((s) => (
                <option key={s.key} value={s.key} style={{ background: "var(--bg-surface-alt)", color: "var(--text-primary)" }}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* State */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-secondary)" }}>
              State
            </label>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-md text-sm outline-none cursor-pointer"
              style={inputBase}
            >
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code} style={{ background: "var(--bg-surface-alt)", color: "var(--text-primary)" }}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-secondary)" }}>
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Dallas"
              className="w-full px-3 py-2 rounded-md text-sm outline-none placeholder:text-[#64748B]"
              style={inputBase}
            />
          </div>

          {/* Entity Type */}
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Entity Type
            </label>
            <div className="flex rounded-md overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.1)" }}>
              {(["all", "NPI-1", "NPI-2"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setEntityType(type)}
                  className="flex-1 py-2 text-[11px] font-medium transition-colors"
                  style={{
                    background: entityType === type ? "var(--accent)" : "var(--bg-surface-alt)",
                    color: entityType === type ? "#FFFFFF" : "var(--text-secondary)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {type === "all" ? "All" : type === "NPI-1" ? "Individual" : "Organization"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Name row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Practice / Group Name
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Texas Oncology..."
              className="w-full px-3 py-2 rounded-md text-sm outline-none placeholder:text-[#64748B]"
              style={inputBase}
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Provider Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Smith..."
              className="w-full px-3 py-2 rounded-md text-sm outline-none placeholder:text-[#64748B]"
              style={inputBase}
            />
          </div>
        </div>

        {/* Search button */}
        <button
          onClick={() => doSearch(0)}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50"
          style={{ background: "var(--accent)", color: "#FFFFFF", border: "none", cursor: loading ? "not-allowed" : "pointer" }}
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          Search NPI Registry
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="rounded-lg p-3 text-xs flex items-start gap-2"
          style={{ background: "rgba(139,58,58,0.15)", border: "1px solid rgba(139,58,58,0.3)", color: "#C9A0A0" }}
        >
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Sidebar filters + Results area */}
      {hasSearched && (
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Left sidebar filters */}
          <div className="w-full lg:w-64 shrink-0 space-y-4">
            <div className="rounded-xl p-4 space-y-4" style={cardBg}>
              <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                Refine Results
              </div>

              {/* Revenue */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Est. Revenue
                </label>
                <select
                  value={revenueFilter}
                  onChange={(e) => setRevenueFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-md text-xs outline-none cursor-pointer"
                  style={inputBase}
                >
                  <option value="any" style={{ background: "var(--bg-surface-alt)" }}>Any size</option>
                  <option value="under1m" style={{ background: "var(--bg-surface-alt)" }}>Under $1M</option>
                  <option value="1m_3m" style={{ background: "var(--bg-surface-alt)" }}>$1M – $3M</option>
                  <option value="3m_10m" style={{ background: "var(--bg-surface-alt)" }}>$3M – $10M</option>
                  <option value="10m_30m" style={{ background: "var(--bg-surface-alt)" }}>$10M – $30M</option>
                  <option value="30m_plus" style={{ background: "var(--bg-surface-alt)" }}>$30M+</option>
                </select>
              </div>

              {/* Age */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Practice Age
                </label>
                <select
                  value={ageFilter}
                  onChange={(e) => setAgeFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-md text-xs outline-none cursor-pointer"
                  style={inputBase}
                >
                  <option value="any" style={{ background: "var(--bg-surface-alt)" }}>Any age</option>
                  <option value="7" style={{ background: "var(--bg-surface-alt)" }}>7+ years</option>
                  <option value="10" style={{ background: "var(--bg-surface-alt)" }}>10+ years</option>
                  <option value="15" style={{ background: "var(--bg-surface-alt)" }}>15+ years</option>
                  <option value="20" style={{ background: "var(--bg-surface-alt)" }}>20+ years</option>
                </select>
              </div>

              {/* Score */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Min Readiness Score
                </label>
                <div className="text-xs mb-1 font-mono" style={{ color: "var(--text-primary)" }}>{minScore}</div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full cursor-pointer"
                  style={{ accentColor: "var(--accent)" }}
                />
                <div className="flex justify-between text-[10px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  <span>0</span><span>50</span><span>100</span>
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "score" | "age" | "revenue")}
                  className="w-full px-3 py-2 rounded-md text-xs outline-none cursor-pointer"
                  style={inputBase}
                >
                  <option value="score" style={{ background: "var(--bg-surface-alt)" }}>Readiness Score</option>
                  <option value="age" style={{ background: "var(--bg-surface-alt)" }}>Practice Age</option>
                  <option value="revenue" style={{ background: "var(--bg-surface-alt)" }}>Est. Revenue</option>
                </select>
              </div>
            </div>

            {/* Benchmark box */}
            {selectedBenchmark && (
              <div className="rounded-xl p-4 space-y-3" style={cardBg}>
                <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
                  {selectedBenchmark.label} Benchmarks
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Rev/Provider", value: fmtMoney(selectedBenchmark.revenuePerProvider) },
                    { label: "EBITDA Margin", value: `${Math.round(selectedBenchmark.ebitdaMarginLow * 100)}–${Math.round(selectedBenchmark.ebitdaMarginHigh * 100)}%` },
                    { label: "EV Multiple", value: `${selectedBenchmark.multipleLow}–${selectedBenchmark.multipleHigh}x` },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="text-[9px] uppercase" style={{ color: "var(--text-secondary)" }}>{b.label}</div>
                      <div className="text-xs font-bold font-mono" style={{ color: "var(--text-primary)" }}>{b.value}</div>
                    </div>
                  ))}
                </div>
                <div className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {selectedBenchmark.marketContext}
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {filteredProfiles.length > 0 ? (
              <div>
                {/* Stats bar */}
                <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                  <div>
                    <div className="text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>
                      {filteredProfiles.length} practice{filteredProfiles.length !== 1 ? "s" : ""} found
                      {" · "}
                      <span className="font-normal" style={{ color: "var(--text-secondary)" }}>
                        {selectedBenchmark?.label ?? selectedQuickKey} in {stateFilter === "ALL" ? "All States" : stateFilter}
                        {city ? `, ${city}` : ""}
                      </span>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      Showing practices independent sponsors and PE firms are actively targeting.
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as "score" | "age" | "revenue")}
                      className="px-2 py-1 rounded-md text-xs outline-none cursor-pointer"
                      style={inputBase}
                    >
                      <option value="score" style={{ background: "var(--bg-surface-alt)" }}>Score</option>
                      <option value="age" style={{ background: "var(--bg-surface-alt)" }}>Age</option>
                      <option value="revenue" style={{ background: "var(--bg-surface-alt)" }}>Revenue</option>
                    </select>
                    <span
                      className="px-2 py-1 rounded-md text-[11px]"
                      style={{ background: "rgba(0,0,0,0.04)", color: "var(--text-secondary)" }}
                    >
                      {total > profiles.length
                        ? `${profiles.length} of ${total.toLocaleString()} total`
                        : `${total.toLocaleString()} total`}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                {filteredProfiles.map((profile) => (
                  <PracticeCard
                    key={profile.provider.npi}
                    profile={profile}
                    isMonitored={watchlistCompanies.includes(profile.provider.name)}
                    isInPipeline={addedToPipeline.has(profile.provider.npi)}
                    onAddPipeline={handleAddPipeline}
                    onMonitor={handleMonitor}
                  />
                ))}

                {/* Load more */}
                {total > profiles.length && (
                  <div className="text-center mt-4">
                    <button
                      onClick={() => doSearch(profiles.length)}
                      className="px-6 py-2.5 rounded-lg text-[13px] font-medium transition-opacity hover:opacity-80"
                      style={{ background: "var(--bg-surface-alt)", color: "var(--text-primary)", border: "1px solid rgba(0,0,0,0.1)", cursor: "pointer" }}
                    >
                      Load {Math.min(25, total - profiles.length)} more practices
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="text-center rounded-xl py-16 px-6"
                style={cardBg}
              >
                <div className="text-3xl mb-3">🔍</div>
                <div className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                  No practices found
                </div>
                <div className="text-xs mt-1.5" style={{ color: "var(--text-secondary)" }}>
                  {profiles.length > 0
                    ? `${profiles.length} practice${profiles.length !== 1 ? "s" : ""} fetched but none match the current filters. Relax a filter to see results.`
                    : "Try a different state, city, or specialty."}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state — no search yet */}
      {!hasSearched && !loading && !error && (
        <div
          className="rounded-xl p-8 text-center"
          style={cardBg}
        >
          <div className="text-5xl mb-4">⚕️</div>
          <h2 className="font-serif text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Healthcare Deal Engine
          </h2>
          <p className="text-xs mt-2 max-w-md mx-auto leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Search 7.5 million healthcare providers across all specialties.
            Find independent practices before a banker does.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {[
              { label: "7.5M", sub: "Providers" },
              { label: "All 50", sub: "States" },
              { label: "Real-Time", sub: "NPI Data" },
            ].map((s) => (
              <div
                key={s.sub}
                className="px-5 py-3 rounded-lg text-center min-w-[110px]"
                style={{ background: "rgba(27,67,50,0.07)", border: "1px solid rgba(0,0,0,0.07)" }}
              >
                <div className="text-lg font-extrabold font-mono" style={{ color: "var(--accent)" }}>
                  {s.label}
                </div>
                <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.sub}</div>
              </div>
            ))}
          </div>
          <p className="text-xs mt-6" style={{ color: "var(--text-secondary)" }}>
            Select filters above and click <strong style={{ color: "var(--text-primary)" }}>Search NPI Registry</strong>
          </p>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl p-5"
              style={cardBg}
            >
              <div className="flex gap-3 mb-3 items-center">
                <div className="animate-pulse rounded-md w-11 h-7 shrink-0" style={{ background: "var(--bg-surface-alt)" }} />
                <div className="animate-pulse rounded flex-1 h-5" style={{ background: "var(--bg-surface-alt)" }} />
                <div className="animate-pulse rounded w-20 h-5 shrink-0" style={{ background: "var(--bg-surface-alt)" }} />
              </div>
              <div className="animate-pulse rounded h-12 mb-3" style={{ background: "rgba(27,67,50,0.07)" }} />
              <div className="flex gap-4">
                {[1, 2].map((j) => (
                  <div key={j} className="flex-1">
                    <div className="animate-pulse rounded h-2.5 mb-2 w-14" style={{ background: "var(--bg-surface-alt)" }} />
                    <div className="animate-pulse rounded h-10" style={{ background: "rgba(27,67,50,0.07)" }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
