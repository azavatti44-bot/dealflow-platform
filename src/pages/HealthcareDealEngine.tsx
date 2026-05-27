import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, HeartPulse } from "lucide-react";
import {
  SPECIALTY_BENCHMARKS,
  searchHealthcareProviders,
  type PracticeProfile,
} from "@/lib/healthcareApi";
import { addMonitored, getMonitored } from "@/lib/alertEngine";
import { useData } from "@/lib/DataContext";
import type { CompanyResult } from "@/lib/api";

// ---------------------------------------------------------------------------
// US States
// ---------------------------------------------------------------------------
const US_STATES = [
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

function scoreBadgeStyle(score: number): React.CSSProperties {
  if (score >= 80)
    return { background: "#000000", color: "#FFFFFF" };
  if (score >= 60)
    return { background: "#B8860B", color: "#FFFFFF" };
  return { background: "#6B7280", color: "#FFFFFF" };
}

// ---------------------------------------------------------------------------
// Revenue filter helper
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

  const cardStyle: React.CSSProperties = {
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    transition: "box-shadow 0.15s ease",
    cursor: "default",
  };

  const foundingYearStr =
    p.foundingYear > 0
      ? `Est. ${p.foundingYear} · ${profile.practiceAge} yr${profile.practiceAge !== 1 ? "s" : ""}`
      : "";

  return (
    <div
      style={cardStyle}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 4px 12px rgba(0,0,0,0.12)")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 1px 3px rgba(0,0,0,0.08)")
      }
    >
      {/* ROW 1: Score + Name + Specialty + Age */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "12px",
        }}
      >
        {/* Score badge */}
        <span
          style={{
            ...scoreBadgeStyle(profile.acquisitionScore),
            borderRadius: "6px",
            padding: "3px 10px",
            fontSize: "13px",
            fontWeight: 700,
            fontFamily: "monospace",
            flexShrink: 0,
          }}
        >
          {profile.acquisitionScore}
        </span>

        {/* Practice name */}
        <span
          style={{
            fontSize: "17px",
            fontWeight: 700,
            color: "#111111",
            flex: 1,
            minWidth: 0,
            lineHeight: "1.3",
          }}
        >
          {p.name}
        </span>

        {/* Specialty tag */}
        <span
          style={{
            fontSize: "11px",
            padding: "2px 8px",
            borderRadius: "4px",
            background: "#F3F4F6",
            color: "#6B7280",
            fontWeight: 500,
            flexShrink: 0,
            alignSelf: "center",
          }}
        >
          {p.specialty}
        </span>

        {/* Age */}
        {foundingYearStr && (
          <span
            style={{
              fontSize: "11px",
              color: "#9CA3AF",
              flexShrink: 0,
              alignSelf: "center",
              marginLeft: "auto",
            }}
          >
            {foundingYearStr}
          </span>
        )}
      </div>

      {/* Score label */}
      <div style={{ marginBottom: "12px" }}>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color:
              profile.acquisitionScore >= 80
                ? "#000000"
                : profile.acquisitionScore >= 60
                ? "#B8860B"
                : "#6B7280",
          }}
        >
          {profile.scoreLabel}
        </span>
      </div>

      {/* ROW 2: Key metrics bar */}
      <div
        style={{
          display: "flex",
          gap: "0",
          borderRadius: "8px",
          border: "1px solid #E5E7EB",
          overflow: "hidden",
          marginBottom: "16px",
        }}
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
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRight: i < 3 ? "1px solid #E5E7EB" : "none",
              background: "#FAFAFA",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                color: "#9CA3AF",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "3px",
              }}
            >
              {m.label}
            </div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                fontFamily: "monospace",
                color: "#111111",
              }}
            >
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* ROW 3: Why Enticing + Approach Angle */}
      <div
        style={{
          display: "flex",
          gap: "24px",
          marginBottom: "14px",
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#9CA3AF",
              marginBottom: "5px",
            }}
          >
            WHY ENTICING
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#374151",
              lineHeight: "1.6",
            }}
          >
            {profile.thesis}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#9CA3AF",
              marginBottom: "5px",
            }}
          >
            APPROACH ANGLE
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#374151",
              lineHeight: "1.6",
            }}
          >
            {profile.approachAngle}
          </div>
        </div>
      </div>

      {/* ROW 4: Signals + Contact + Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
          borderTop: "1px solid #F3F4F6",
          paddingTop: "12px",
          flexWrap: "wrap",
        }}
      >
        {/* Signals */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px",
            flex: 1,
          }}
        >
          {profile.signals.map((sig, i) => (
            <span
              key={i}
              style={{
                fontSize: "10px",
                padding: "2px 8px",
                borderRadius: "4px",
                background: "#F9FAFB",
                border: "1px solid #E5E7EB",
                color: "#374151",
                whiteSpace: "nowrap",
              }}
            >
              {sig}
            </span>
          ))}
        </div>

        {/* Contact + Actions */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flexShrink: 0 }}>
          {/* Contact info */}
          <div style={{ textAlign: "right" }}>
            {p.phone && (
              <div
                style={{
                  fontSize: "12px",
                  fontFamily: "monospace",
                  color: "#111111",
                  fontWeight: 600,
                }}
              >
                📞 {p.phone}
              </div>
            )}
            {p.contactName && (
              <div style={{ fontSize: "11px", color: "#6B7280" }}>
                {p.contactName}
                {p.contactTitle ? ` · ${p.contactTitle}` : ""}
              </div>
            )}
            {(p.address || p.city) && (
              <div style={{ fontSize: "11px", color: "#9CA3AF" }}>
                {[p.address, p.city, p.state].filter(Boolean).join(", ")}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button
              onClick={() => onAddPipeline(profile)}
              disabled={isInPipeline}
              style={{
                background: isInPipeline ? "#4B5563" : "#000000",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "6px",
                fontSize: "11px",
                padding: "6px 12px",
                cursor: isInPipeline ? "default" : "pointer",
                fontWeight: 600,
                transition: "background 0.15s",
              }}
            >
              {isInPipeline ? "✓ In Pipeline" : "Add to Pipeline"}
            </button>

            <button
              onClick={() => onMonitor(profile)}
              disabled={isMonitored}
              style={{
                background: "transparent",
                color: isMonitored ? "#6B7280" : "#000000",
                border: `1px solid ${isMonitored ? "#D1D5DB" : "#000000"}`,
                borderRadius: "6px",
                fontSize: "11px",
                padding: "6px 12px",
                cursor: isMonitored ? "default" : "pointer",
                fontWeight: 600,
              }}
            >
              {isMonitored ? "✓ Monitored" : "Monitor"}
            </button>

            <span
              style={{
                fontSize: "10px",
                fontFamily: "monospace",
                color: "#9CA3AF",
              }}
            >
              NPI: {p.npi}
            </span>
          </div>

          {/* Toggle expand for address detail */}
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              background: "none",
              border: "none",
              color: "#9CA3AF",
              fontSize: "10px",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {expanded ? "▲ Less" : "▼ More details"}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          style={{
            marginTop: "12px",
            padding: "12px",
            background: "#F9FAFB",
            borderRadius: "8px",
            border: "1px solid #E5E7EB",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "12px",
          }}
        >
          <div>
            <div style={{ fontSize: "10px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>NPI Number</div>
            <div style={{ fontSize: "12px", fontFamily: "monospace", color: "#111111" }}>{p.npi}</div>
          </div>
          <div>
            <div style={{ fontSize: "10px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>Taxonomy Code</div>
            <div style={{ fontSize: "12px", fontFamily: "monospace", color: "#111111" }}>{p.taxonomyCode || "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: "10px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>License State</div>
            <div style={{ fontSize: "12px", fontFamily: "monospace", color: "#111111" }}>{p.licenseState || "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: "10px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>ZIP Code</div>
            <div style={{ fontSize: "12px", fontFamily: "monospace", color: "#111111" }}>{p.zip || "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: "10px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>Last Updated</div>
            <div style={{ fontSize: "12px", fontFamily: "monospace", color: "#111111" }}>{p.lastUpdated || "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: "10px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "3px" }}>Entity Type</div>
            <div style={{ fontSize: "12px", fontFamily: "monospace", color: "#111111" }}>{p.enumType}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function HealthcareDealEngine() {
  const { addCompany } = useData();

  const [selectedSpecialty, setSelectedSpecialty] = useState("dermatology");
  const [stateFilter, setStateFilter] = useState("TX");
  const [city, setCity] = useState("");
  const [revenueFilter, setRevenueFilter] = useState("any");
  const [ageFilter, setAgeFilter] = useState("any");
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState<"score" | "age" | "revenue">("score");
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<PracticeProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [monitored, setMonitored] = useState<string[]>(() => getMonitored());
  const [addedToPipeline, setAddedToPipeline] = useState<Set<string>>(new Set());

  async function doSearch(newSkip = 0) {
    if (newSkip === 0) {
      setLoading(true);
      setProfiles([]);
      setTotal(0);
      setError(null);
    }
    try {
      const { total: t, profiles: p } = await searchHealthcareProviders({
        specialtyKey: selectedSpecialty,
        state: stateFilter,
        city: city.trim() || undefined,
        limit: 25,
        skip: newSkip,
      });
      if (newSkip === 0) {
        setProfiles(p);
        setTotal(t);
        setSkip(0);
      } else {
        setProfiles((prev) => [...prev, ...p]);
        setSkip(newSkip);
      }
    } catch (err) {
      setError("NPI Registry unavailable — try again in a moment.");
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
    addMonitored(profile.provider.name);
    setMonitored(getMonitored());
  }

  const benchmark = SPECIALTY_BENCHMARKS[selectedSpecialty];

  // ---------------------------------------------------------------------------
  // Sidebar label style
  // ---------------------------------------------------------------------------
  const labelStyle: React.CSSProperties = {
    fontSize: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    fontWeight: 600,
    color: "#9CA3AF",
    marginBottom: "6px",
    display: "block",
  };

  const selectStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    borderRadius: "7px",
    border: "1px solid #D1D5DB",
    background: "#FFFFFF",
    color: "#111111",
    fontSize: "13px",
    outline: "none",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F9FAFB",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#111111",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Black top bar */}
      <div
        style={{
          background: "#000000",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <HeartPulse size={18} color="#FFFFFF" />
            <span
              style={{
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: "15px",
                letterSpacing: "0.02em",
              }}
            >
              DEALNEXA Healthcare
            </span>
          </div>
          <span
            style={{
              width: "1px",
              height: "16px",
              background: "rgba(255,255,255,0.2)",
            }}
          />
          <span
            style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "0.04em",
            }}
          >
            Proprietary Off-Market Deal Flow
          </span>
        </div>
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "12px",
            color: "rgba(255,255,255,0.5)",
            textDecoration: "none",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLAnchorElement).style.color = "#FFFFFF")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLAnchorElement).style.color =
              "rgba(255,255,255,0.5)")
          }
        >
          <ArrowLeft size={13} />
          Back to platform
        </Link>
      </div>

      {/* Body: sidebar + main */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", height: "calc(100vh - 56px)" }}>
        {/* LEFT SIDEBAR */}
        <div
          style={{
            width: "300px",
            flexShrink: 0,
            background: "#F3F4F6",
            borderRight: "1px solid #E5E7EB",
            padding: "20px",
            overflowY: "auto",
          }}
        >
          {/* VERTICAL */}
          <div>
            <span style={labelStyle}>Vertical</span>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "6px",
              }}
            >
              {Object.entries(SPECIALTY_BENCHMARKS).map(([key, spec]) => {
                const selected = selectedSpecialty === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedSpecialty(key)}
                    style={{
                      padding: "10px 6px",
                      borderRadius: "8px",
                      border: `1px solid ${selected ? "#000000" : "#E5E7EB"}`,
                      background: selected ? "#000000" : "#FFFFFF",
                      color: selected ? "#FFFFFF" : "#374151",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ fontSize: "18px", lineHeight: 1 }}>{spec.icon}</div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 500,
                        marginTop: "4px",
                        lineHeight: "1.2",
                      }}
                    >
                      {spec.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* GEOGRAPHY */}
          <div style={{ marginTop: "20px" }}>
            <span style={labelStyle}>Geography</span>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              style={selectStyle}
            >
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Any city (optional)"
              style={{
                ...selectStyle,
                marginTop: "8px",
              }}
            />
          </div>

          {/* ESTIMATED REVENUE */}
          <div style={{ marginTop: "20px" }}>
            <span style={labelStyle}>Estimated Revenue</span>
            <select
              value={revenueFilter}
              onChange={(e) => setRevenueFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="any">Any size</option>
              <option value="under1m">Under $1M</option>
              <option value="1m_3m">$1M – $3M</option>
              <option value="3m_10m">$3M – $10M</option>
              <option value="10m_30m">$10M – $30M</option>
              <option value="30m_plus">$30M+</option>
            </select>
          </div>

          {/* PRACTICE AGE */}
          <div style={{ marginTop: "20px" }}>
            <span style={labelStyle}>Practice Age</span>
            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="any">Any age</option>
              <option value="7">7+ years</option>
              <option value="10">10+ years</option>
              <option value="15">15+ years</option>
              <option value="20">20+ years</option>
            </select>
          </div>

          {/* READINESS SCORE */}
          <div style={{ marginTop: "20px" }}>
            <span style={labelStyle}>Readiness Score</span>
            <div style={{ fontSize: "12px", color: "#374151", marginBottom: "8px" }}>
              Min score:{" "}
              <strong style={{ fontFamily: "monospace" }}>{minScore}</strong>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              style={{
                width: "100%",
                accentColor: "#000000",
                cursor: "pointer",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "10px",
                color: "#9CA3AF",
                marginTop: "3px",
              }}
            >
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>

          {/* SORT BY */}
          <div style={{ marginTop: "20px" }}>
            <span style={labelStyle}>Sort By</span>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "score" | "age" | "revenue")
              }
              style={selectStyle}
            >
              <option value="score">Readiness Score</option>
              <option value="age">Practice Age</option>
              <option value="revenue">Estimated Revenue</option>
            </select>
          </div>

          {/* SEARCH BUTTON */}
          <button
            onClick={() => doSearch(0)}
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "24px",
              padding: "12px 0",
              background: loading ? "#4B5563" : "#000000",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "13px",
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: "0.02em",
              transition: "background 0.15s",
            }}
          >
            {loading ? "Searching..." : "Find Opportunities"}
          </button>

          <div
            style={{
              marginTop: "10px",
              textAlign: "center",
              fontSize: "9px",
              color: "#9CA3AF",
              lineHeight: "1.5",
            }}
          >
            Powered by CMS NPI Registry · 7.5M providers · Updated daily
          </div>

          {/* Benchmark context box */}
          {benchmark && (
            <div
              style={{
                marginTop: "20px",
                padding: "12px",
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#9CA3AF",
                  marginBottom: "6px",
                }}
              >
                {benchmark.label} Benchmarks
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                }}
              >
                {[
                  {
                    label: "Rev/Provider",
                    value: fmtMoney(benchmark.revenuePerProvider),
                  },
                  {
                    label: "EBITDA Margin",
                    value: `${Math.round(benchmark.ebitdaMarginLow * 100)}–${Math.round(benchmark.ebitdaMarginHigh * 100)}%`,
                  },
                  {
                    label: "EV Multiple",
                    value: `${benchmark.multipleLow}–${benchmark.multipleHigh}x`,
                  },
                ].map((b) => (
                  <div key={b.label}>
                    <div
                      style={{
                        fontSize: "9px",
                        color: "#9CA3AF",
                        textTransform: "uppercase",
                      }}
                    >
                      {b.label}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        fontFamily: "monospace",
                        color: "#111111",
                      }}
                    >
                      {b.value}
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "11px",
                  color: "#6B7280",
                  lineHeight: "1.5",
                }}
              >
                {benchmark.marketContext}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT MAIN */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
          }}
        >
          {/* Error banner */}
          {error && (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px 16px",
                background: "#FEF2F2",
                border: "1px solid #DC2626",
                borderRadius: "8px",
                color: "#DC2626",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          {/* Empty state — no search yet */}
          {!hasSearched && !loading && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "60vh",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "56px" }}>⚕️</div>
              <h1
                style={{
                  fontWeight: 700,
                  fontSize: "24px",
                  color: "#111111",
                  marginTop: "16px",
                  marginBottom: 0,
                }}
              >
                Healthcare Deal Engine
              </h1>
              <p
                style={{
                  fontSize: "14px",
                  color: "#6B7280",
                  marginTop: "8px",
                  maxWidth: "440px",
                  lineHeight: "1.6",
                }}
              >
                Search 7.5 million healthcare providers across all specialties.
                Find independent practices before a banker does.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginTop: "28px",
                }}
              >
                {[
                  { label: "7.5M", sub: "Providers" },
                  { label: "All 50", sub: "States" },
                  { label: "Real-Time", sub: "NPI Data" },
                ].map((s) => (
                  <div
                    key={s.sub}
                    style={{
                      padding: "16px 24px",
                      background: "#FFFFFF",
                      border: "1px solid #000000",
                      borderRadius: "10px",
                      textAlign: "center",
                      minWidth: "110px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: 800,
                        fontFamily: "monospace",
                        color: "#111111",
                      }}
                    >
                      {s.label}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "3px" }}>
                      {s.sub}
                    </div>
                  </div>
                ))}
              </div>

              <p
                style={{
                  marginTop: "28px",
                  fontSize: "12px",
                  color: "#9CA3AF",
                }}
              >
                Select a vertical and state in the sidebar, then click{" "}
                <strong style={{ color: "#111111" }}>Find Opportunities</strong>
              </p>
            </div>
          )}

          {/* Loading skeletons */}
          {loading && (
            <div>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E5E7EB",
                    borderRadius: "12px",
                    padding: "20px",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginBottom: "12px",
                      alignItems: "center",
                    }}
                  >
                    <div
                      className="animate-pulse"
                      style={{
                        width: "44px",
                        height: "28px",
                        borderRadius: "6px",
                        background: "#E5E7EB",
                      }}
                    />
                    <div
                      className="animate-pulse"
                      style={{
                        flex: 1,
                        height: "20px",
                        borderRadius: "4px",
                        background: "#E5E7EB",
                      }}
                    />
                    <div
                      className="animate-pulse"
                      style={{
                        width: "80px",
                        height: "20px",
                        borderRadius: "4px",
                        background: "#E5E7EB",
                      }}
                    />
                  </div>
                  <div
                    className="animate-pulse"
                    style={{
                      height: "52px",
                      borderRadius: "8px",
                      background: "#F3F4F6",
                      marginBottom: "12px",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                    }}
                  >
                    {[1, 2].map((j) => (
                      <div key={j} style={{ flex: 1 }}>
                        <div
                          className="animate-pulse"
                          style={{
                            height: "10px",
                            borderRadius: "4px",
                            background: "#E5E7EB",
                            marginBottom: "6px",
                            width: "60px",
                          }}
                        />
                        <div
                          className="animate-pulse"
                          style={{
                            height: "48px",
                            borderRadius: "4px",
                            background: "#F3F4F6",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results */}
          {hasSearched && !loading && filteredProfiles.length > 0 && (
            <div>
              {/* Stats bar */}
              <div
                style={{
                  marginBottom: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#111111",
                    }}
                  >
                    {filteredProfiles.length} practice{filteredProfiles.length !== 1 ? "s" : ""} found
                    {" · "}
                    <span style={{ color: "#6B7280", fontWeight: 400 }}>
                      {benchmark?.label ?? selectedSpecialty} in {stateFilter}
                      {city ? `, ${city}` : ""}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#9CA3AF",
                      marginTop: "3px",
                    }}
                  >
                    Showing practices independent sponsors and PE firms are actively targeting.
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "12px",
                    color: "#6B7280",
                  }}
                >
                  <span>Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as "score" | "age" | "revenue")
                    }
                    style={{
                      padding: "5px 8px",
                      borderRadius: "6px",
                      border: "1px solid #D1D5DB",
                      background: "#FFFFFF",
                      color: "#111111",
                      fontSize: "12px",
                      outline: "none",
                    }}
                  >
                    <option value="score">Readiness Score</option>
                    <option value="age">Practice Age</option>
                    <option value="revenue">Est. Revenue</option>
                  </select>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      background: "#F3F4F6",
                      fontSize: "11px",
                      color: "#374151",
                    }}
                  >
                    {total > profiles.length
                      ? `${profiles.length} of ${total.toLocaleString()} total`
                      : `${total.toLocaleString()} total`}
                  </span>
                </div>
              </div>

              {/* Cards list */}
              {filteredProfiles.map((profile) => (
                <PracticeCard
                  key={profile.provider.npi}
                  profile={profile}
                  isMonitored={monitored.includes(profile.provider.name)}
                  isInPipeline={addedToPipeline.has(profile.provider.npi)}
                  onAddPipeline={handleAddPipeline}
                  onMonitor={handleMonitor}
                />
              ))}

              {/* Load more */}
              {total > profiles.length && (
                <div style={{ textAlign: "center", marginTop: "16px" }}>
                  <button
                    onClick={() => doSearch(profiles.length)}
                    style={{
                      padding: "10px 28px",
                      background: "#FFFFFF",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      color: "#374151",
                      fontSize: "13px",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    Load {Math.min(25, total - profiles.length)} more practices
                  </button>
                </div>
              )}
            </div>
          )}

          {/* No results after search */}
          {hasSearched && !loading && filteredProfiles.length === 0 && profiles.length === 0 && !error && (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "#6B7280",
              }}
            >
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
              <div style={{ fontSize: "16px", fontWeight: 600, color: "#374151" }}>
                No practices found
              </div>
              <div style={{ fontSize: "13px", marginTop: "6px" }}>
                Try a different state, city, or specialty.
              </div>
            </div>
          )}

          {/* Results exist but filtered down to zero */}
          {hasSearched && !loading && filteredProfiles.length === 0 && profiles.length > 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "#6B7280",
              }}
            >
              <div style={{ fontSize: "30px", marginBottom: "10px" }}>🔎</div>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "#374151" }}>
                Filters too narrow
              </div>
              <div style={{ fontSize: "13px", marginTop: "6px" }}>
                {profiles.length} practice{profiles.length !== 1 ? "s" : ""} fetched but none match the current filters. Relax a filter to see results.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
