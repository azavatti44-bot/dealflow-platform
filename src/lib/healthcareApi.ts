// Healthcare Deal Engine — NPI Registry API module
// NPI API is NOT CORS-enabled from localhost; we chain public CORS proxies.

export interface NPIProvider {
  npi: string;
  name: string;
  enumType: "NPI-1" | "NPI-2";
  specialty: string;
  taxonomyCode: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  contactName: string;
  contactTitle: string;
  foundingYear: number;
  lastUpdated: string;
  licenseState: string;
  dba: string;       // "Doing Business As" brand name (real NPI other_names data)
  website: string;   // only populated if NPI carries a URL endpoint (rare)
}

export interface PracticeProfile {
  provider: NPIProvider;
  estimatedProviders: number;
  revenueRangeLow: number;
  revenueRangeHigh: number;
  ebitdaRangeLow: number;
  ebitdaRangeHigh: number;
  impliedMultipleLow: number;
  impliedMultipleHigh: number;
  acquisitionScore: number;
  scoreLabel: "High Readiness" | "Worth Watching" | "Emerging";
  practiceAge: number;
  thesis: string;
  approachAngle: string;
  signals: string[];
  specialtyKey: string;
}

export interface SpecialtyBenchmark {
  label: string;
  taxonomyQuery: string;
  revenuePerProvider: number;
  ebitdaMarginLow: number;
  ebitdaMarginHigh: number;
  multipleLow: number;
  multipleHigh: number;
  marketContext: string;
  icon: string;
}

export const SPECIALTY_BENCHMARKS: Record<string, SpecialtyBenchmark> = {
  all: {
    label: "All Specialties",
    taxonomyQuery: "",
    revenuePerProvider: 500000,
    ebitdaMarginLow: 0.15,
    ebitdaMarginHigh: 0.28,
    multipleLow: 7,
    multipleHigh: 11,
    marketContext:
      "Healthcare remains one of the most defensive, recession-resistant sectors with strong demographic tailwinds and ongoing PE consolidation across all verticals.",
    icon: "⚕️",
  },
  dermatology: {
    label: "Dermatology",
    taxonomyQuery: "Dermatology",
    revenuePerProvider: 850000,
    ebitdaMarginLow: 0.28,
    ebitdaMarginHigh: 0.38,
    multipleLow: 12,
    multipleHigh: 16,
    marketContext:
      "Dermatology commands 12–16x EBITDA driven by high cash-pay mix, recurring patient relationships, and favorable aging demographics.",
    icon: "🔬",
  },
  dental: {
    label: "Dental",
    taxonomyQuery: "Dentist",
    revenuePerProvider: 650000,
    ebitdaMarginLow: 0.20,
    ebitdaMarginHigh: 0.30,
    multipleLow: 8,
    multipleHigh: 12,
    marketContext:
      "DSO consolidation wave ongoing — independent practices trade at 8–12x with significant value creation through operational standardization.",
    icon: "🦷",
  },
  pharmacy: {
    label: "Pharmacy",
    taxonomyQuery: "Pharmacy",
    revenuePerProvider: 2500000,
    ebitdaMarginLow: 0.03,
    ebitdaMarginHigh: 0.08,
    multipleLow: 5,
    multipleHigh: 9,
    marketContext:
      "Specialty and compounding pharmacies command premium multiples — commodity retail pharmacy faces PBM margin pressure.",
    icon: "💊",
  },
  physician: {
    label: "Physician Office",
    taxonomyQuery: "Family Medicine",
    revenuePerProvider: 450000,
    ebitdaMarginLow: 0.10,
    ebitdaMarginHigh: 0.18,
    multipleLow: 6,
    multipleHigh: 9,
    marketContext:
      "Value-based care transition creating margin expansion for well-managed primary care networks with strong panel attribution.",
    icon: "🩺",
  },
  medspa: {
    label: "MedSpa / Aesthetics",
    taxonomyQuery: "Plastic Surgery",
    revenuePerProvider: 620000,
    ebitdaMarginLow: 0.25,
    ebitdaMarginHigh: 0.42,
    multipleLow: 8,
    multipleHigh: 13,
    marketContext:
      "Fastest-growing healthcare subsector — 100% cash-pay, minimal insurance complexity, strong repeat-visit economics.",
    icon: "✨",
  },
  urgent_care: {
    label: "Urgent Care",
    taxonomyQuery: "Emergency Medicine",
    revenuePerProvider: 1400000,
    ebitdaMarginLow: 0.15,
    ebitdaMarginHigh: 0.25,
    multipleLow: 7,
    multipleHigh: 11,
    marketContext:
      "Consumer preference for convenient care driving structural volume shift away from ED and PCP — de novo and tuck-in strategies both active.",
    icon: "🏥",
  },
  behavioral: {
    label: "Behavioral Health",
    taxonomyQuery: "Psychiatry",
    revenuePerProvider: 285000,
    ebitdaMarginLow: 0.15,
    ebitdaMarginHigh: 0.28,
    multipleLow: 8,
    multipleHigh: 13,
    marketContext:
      "Structural demand-supply imbalance, telehealth expansion, and strong government reimbursement make behavioral health one of the most active consolidation verticals.",
    icon: "🧠",
  },
  ophthalmology: {
    label: "Ophthalmology",
    taxonomyQuery: "Ophthalmology",
    revenuePerProvider: 920000,
    ebitdaMarginLow: 0.25,
    ebitdaMarginHigh: 0.38,
    multipleLow: 10,
    multipleHigh: 14,
    marketContext:
      "High surgical volume, premium cash-pay cataract and LASIK mix, strong ASC complement — ophthalmology platforms are among the most actively sought by PE.",
    icon: "👁️",
  },
  orthopedic: {
    label: "Orthopedics",
    taxonomyQuery: "Orthopedic Surgery",
    revenuePerProvider: 1100000,
    ebitdaMarginLow: 0.20,
    ebitdaMarginHigh: 0.35,
    multipleLow: 10,
    multipleHigh: 14,
    marketContext:
      "Aging demographic drives structural demand — ASC integration with orthopedic practices creates significant EBITDA expansion and multiple arbitrage.",
    icon: "🦴",
  },
  home_health: {
    label: "Home Health",
    taxonomyQuery: "Home Health",
    revenuePerProvider: 320000,
    ebitdaMarginLow: 0.08,
    ebitdaMarginHigh: 0.15,
    multipleLow: 6,
    multipleHigh: 10,
    marketContext:
      "Aging population creates secular volume growth — home health is the lowest-cost care setting and benefits from ongoing CMS site-of-care incentives.",
    icon: "🏠",
  },
  ent: {
    label: "Otolaryngology (ENT)",
    taxonomyQuery: "Otolaryngology",
    revenuePerProvider: 780000,
    ebitdaMarginLow: 0.22,
    ebitdaMarginHigh: 0.32,
    multipleLow: 9,
    multipleHigh: 13,
    marketContext:
      "ENT practices benefit from high-margin in-office procedures and strong ancillary revenue from allergy and audiology services.",
    icon: "👂",
  },
  geriatric: {
    label: "Geriatric Medicine",
    taxonomyQuery: "Geriatric Medicine",
    revenuePerProvider: 420000,
    ebitdaMarginLow: 0.12,
    ebitdaMarginHigh: 0.20,
    multipleLow: 6,
    multipleHigh: 9,
    marketContext:
      "Fastest-growing patient demographic with favorable Medicare reimbursement — ideal tuck-in for primary care platforms pursuing value-based contracts.",
    icon: "🧓",
  },
  surgery: {
    label: "Surgery",
    taxonomyQuery: "Surgery",
    revenuePerProvider: 950000,
    ebitdaMarginLow: 0.22,
    ebitdaMarginHigh: 0.35,
    multipleLow: 9,
    multipleHigh: 14,
    marketContext:
      "Surgical practices with ASC ownership trade at significant premiums — outpatient shift and payer preference for lower-cost settings drive demand.",
    icon: "🪡",
  },
  physical_therapy: {
    label: "Physical Therapy",
    taxonomyQuery: "Physical Therapist",
    revenuePerProvider: 250000,
    ebitdaMarginLow: 0.12,
    ebitdaMarginHigh: 0.20,
    multipleLow: 5,
    multipleHigh: 8,
    marketContext:
      "Outpatient physical therapy is in an active MSO roll-up cycle — recurring visit volume, aging-population and sports-medicine demand, and fragmented single-clinic ownership make it a favored platform-and-tuck-in vertical across the Southeast.",
    icon: "🏃",
  },
  mental_health: {
    label: "Mental Health",
    taxonomyQuery: "Mental Health*",
    revenuePerProvider: 200000,
    ebitdaMarginLow: 0.15,
    ebitdaMarginHigh: 0.26,
    multipleLow: 6,
    multipleHigh: 10,
    marketContext:
      "Structural demand-supply imbalance, telehealth expansion, and improving commercial reimbursement make outpatient mental health one of the most active consolidation verticals — counselor, psychologist, and group-practice models all in play.",
    icon: "🧠",
  },
  substance_use: {
    label: "Substance Use",
    taxonomyQuery: "Substance Abuse*",
    revenuePerProvider: 550000,
    ebitdaMarginLow: 0.18,
    ebitdaMarginHigh: 0.30,
    multipleLow: 7,
    multipleHigh: 11,
    marketContext:
      "Outpatient, in-network substance-use treatment with a commercial-payer mix offers recurring census and durable demand — the network-contracted outpatient model is favored over cash-pay residential for predictable cash flow.",
    icon: "♻️",
  },
  womens_health: {
    label: "Women's Health",
    taxonomyQuery: "Obstetrics & Gynecology",
    revenuePerProvider: 700000,
    ebitdaMarginLow: 0.18,
    ebitdaMarginHigh: 0.28,
    multipleLow: 7,
    multipleHigh: 11,
    marketContext:
      "Women's health services command premium multiples on a strong cash-pay component and fertility-adjacent demand growth — broad OB/GYN and women's-services platforms (distinct from single-service fertility clinics) are actively sought.",
    icon: "🌸",
  },
  infusion: {
    label: "Infusion",
    taxonomyQuery: "Infusion*",
    revenuePerProvider: 1800000,
    ebitdaMarginLow: 0.16,
    ebitdaMarginHigh: 0.26,
    multipleLow: 8,
    multipleHigh: 12,
    marketContext:
      "Community and ambulatory infusion benefits from the site-of-care shift away from hospital outpatient departments — high per-patient revenue, recurring chronic-care census, and payer cost-steering drive strong platform economics.",
    icon: "💉",
  },
};

// ---------------------------------------------------------------------------
// Backend proxy helpers
// ---------------------------------------------------------------------------

async function fetchWithTimeout(
  target: string | Request | URL,
  ms: number,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(target, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

function getNpiUrl(pathAndQuery: string): string {
  return `/api/npi${pathAndQuery}`;
}

async function fetchWithBackendProxy(url: string, ms = 15000): Promise<Response> {
  const res = await fetchWithTimeout(url, ms);
  if (res.ok) return res;
  throw new Error(`NPI API error: ${res.status}`);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function estimateProviderCount(provider: NPIProvider): number {
  if (provider.enumType === "NPI-1") return 1;
  const n = provider.name.toLowerCase();
  if (n.includes("solo") || n.includes("individual")) return 1;
  if (n.includes("group") || n.includes("associates") || n.includes("partners")) return 4;
  if (n.includes("center") || n.includes("clinic") || n.includes("institute")) return 3;
  if (n.includes("system") || n.includes("network") || n.includes("health")) return 8;
  return 2;
}

const HIGH_VALUE_SPECIALTIES = new Set([
  "dermatology",
  "ophthalmology",
  "orthopedic",
  "medspa",
  "surgery",
  "ent",
  "urgent_care",
]);

const SUNBELT_STATES = new Set([
  "TX", "FL", "GA", "NC", "TN", "AZ", "CO", "OH", "SC", "VA", "NV",
]);

function calculateScore(
  provider: NPIProvider,
  age: number,
  estimatedProviders: number,
  specialtyKey: string,
): number {
  let score = 0;

  // Age scoring — early-stage preferred (growth runway, founder still operating)
  if (age === 0) score += 12;        // unknown founding date — neutral
  else if (age <= 3) score += 30;    // very early stage — top preference
  else if (age <= 6) score += 24;
  else if (age <= 10) score += 16;
  else if (age <= 15) score += 10;
  else score += 5;                   // long-established — lower fit for early-stage thesis

  // Specialty scoring
  if (HIGH_VALUE_SPECIALTIES.has(specialtyKey)) score += 25;
  else score += 12;

  // Entity type
  if (provider.enumType === "NPI-2") score += 15;
  else score += 8;

  // Provider count (PE sweet spot = 2–8)
  if (estimatedProviders >= 2 && estimatedProviders <= 8) score += 20;
  else score += 10;

  // Geography
  if (SUNBELT_STATES.has(provider.state)) score += 10;
  else score += 5;

  return Math.min(100, score);
}

function generateThesis(
  _provider: NPIProvider,
  age: number,
  estimatedProviders: number,
  benchmark: SpecialtyBenchmark,
): string {
  let s1: string;
  if (age > 0 && age <= 4) {
    s1 = `An early-stage practice (${age} yr${age !== 1 ? "s" : ""}) with significant growth runway — the kind of platform a flexible, well-capitalized partner can scale before it reaches full maturity.`;
  } else if (age > 0 && age <= 10) {
    s1 = `With ${age} years of operating history, this practice has proven unit economics while retaining meaningful growth runway ahead.`;
  } else if (age > 15) {
    s1 = `A ${age}-year established practice with deeply entrenched community relationships and a patient base compounded over multiple care cycles.`;
  } else {
    s1 = "An established practice with a demonstrated operating track record in a consolidating vertical.";
  }

  let s2: string;
  if (estimatedProviders === 1) {
    s2 = "A solo practitioner represents a classic anchor asset — ideal as a de novo platform or geographic tuck-in for an existing portfolio company.";
  } else if (estimatedProviders <= 6) {
    s2 = `A ${estimatedProviders}-provider group hits the PE acquisition sweet spot — scaled enough for operational leverage, small enough for clean integration.`;
  } else {
    s2 = `A ${estimatedProviders}+ provider group offers immediate scale with established workflows and payer relationships.`;
  }

  const s3 = benchmark.marketContext;

  return [s1, s2, s3].join(" ");
}

function generateApproachAngle(age: number, estimatedProviders: number, _specialty: string): string {
  if (age > 0 && age <= 5) {
    return "Early-stage practice — lead with growth capital and partnership: funding for new locations, providers, and back-office scale. Position as an accelerator that lets the founder keep operating and growing, not an exit.";
  } else if (age >= 15) {
    return `Founder has operated for ${age} years — lead with succession planning and legacy preservation, not a sale. Open with: 'We partner with tenured physicians who want to ensure continuity for their patients and staff.'`;
  } else if (estimatedProviders === 1) {
    return "Solo practitioner — lead with operational relief: staffing, billing, compliance, and administrative burden. Frame partnership as joining a clinical network, not a transaction.";
  } else if (estimatedProviders >= 5) {
    return "Multi-physician group — identify the managing partner or founder directly and lead with growth capital and geographic expansion. Position as acceleration, not exit.";
  } else {
    return "Independent practice facing rising overhead and payer pressure — open with operational support narrative. Position as a solution to shared industry headwinds before a competitor does.";
  }
}

function generateSignals(
  provider: NPIProvider,
  age: number,
  estimatedProviders: number,
): string[] {
  const signals: string[] = [];

  if (age > 0 && age <= 4) {
    signals.push(`🟢 Early-stage practice (${age} yr${age !== 1 ? "s" : ""}) — growth runway with founder still operating`);
  } else if (age > 0 && age <= 8) {
    signals.push(`🟢 ${age}-year practice — established but early, room to scale`);
  } else if (age >= 15) {
    signals.push(`🟡 ${age}-year operating history — succession / transition candidate`);
  } else if (age >= 10) {
    signals.push(`🟡 ${age}-year practice — approaching transition window`);
  }

  if (estimatedProviders >= 2 && estimatedProviders <= 8) {
    signals.push(`✅ ${estimatedProviders}-provider group — PE acquisition sweet spot`);
  } else if (estimatedProviders === 1) {
    signals.push("📍 Solo practitioner — platform anchor or tuck-in candidate");
  }

  if (provider.enumType === "NPI-2") {
    signals.push("✅ Incorporated entity — clean acquisition structure");
  }

  signals.push("✅ Independent — no institutional capital identified");

  if (provider.phone) {
    signals.push("📞 Direct contact available");
  }

  return signals;
}

function buildProfilesFromResults(
  results: unknown[],
  benchmark: SpecialtyBenchmark,
  specialtyKey: string,
  fallbackState?: string,
): PracticeProfile[] {
  const currentYear = new Date().getFullYear();
  const profiles: PracticeProfile[] = [];

  for (const result of results) {
    const r = result as Record<string, unknown>;
    const basic = (r.basic as Record<string, unknown>) || {};
    const addresses: unknown[] = (r.addresses as unknown[]) || [];
    const taxonomies: unknown[] = (r.taxonomies as unknown[]) || [];
    const enumType = String(r.enumeration_type || "NPI-2") as "NPI-1" | "NPI-2";

    const locationAddr =
      (addresses.find((a) => {
        const addr = a as Record<string, unknown>;
        return addr.address_purpose === "LOCATION";
      }) as Record<string, unknown>) ||
      (addresses[0] as Record<string, unknown>) ||
      {};

    const taxonomy0 = (taxonomies[0] as Record<string, unknown>) || {};

    const rawName =
      String(basic.organization_name || "").trim() ||
      `${String(basic.first_name || "")} ${String(basic.last_name || "")}`.trim();

    if (!rawName) continue;

    // "Doing Business As" brand name — real NPI other_names data
    const otherNames: unknown[] = (r.other_names as unknown[]) || [];
    const dbaEntry = otherNames.find((o) => {
      const on = o as Record<string, unknown>;
      return String(on.type || "").toLowerCase().includes("doing business");
    }) as Record<string, unknown> | undefined;
    const dba = dbaEntry
      ? String(dbaEntry.organization_name || dbaEntry.name || "").trim()
      : "";

    // Website — only if NPI carries a URL-type endpoint (almost always empty)
    const endpoints: unknown[] = (r.endpoints as unknown[]) || [];
    const website =
      endpoints
        .map((e) => String((e as Record<string, unknown>).endpoint || ""))
        .find((s) => /^https?:\/\//i.test(s)) || "";

    const createdEpoch = r.created_epoch ? Number(r.created_epoch) : 0;
    const lastUpdatedEpoch = r.last_updated_epoch ? Number(r.last_updated_epoch) : 0;

    const provider: NPIProvider = {
      npi: String(r.number || ""),
      name: rawName,
      enumType,
      specialty: String(taxonomy0.desc || benchmark.label),
      taxonomyCode: String(taxonomy0.code || ""),
      address: String(locationAddr.address_1 || ""),
      city: String(locationAddr.city || ""),
      state: String(locationAddr.state || fallbackState || ""),
      zip: String(locationAddr.postal_code || ""),
      phone: String(locationAddr.telephone_number || ""),
      contactName: `${String(basic.authorized_official_first_name || basic.first_name || "")} ${String(basic.authorized_official_last_name || basic.last_name || "")}`.trim(),
      contactTitle: String(basic.authorized_official_title_or_position || basic.credential || ""),
      foundingYear: createdEpoch > 0 ? new Date(createdEpoch * 1000).getFullYear() : 0,
      lastUpdated: lastUpdatedEpoch > 0 ? new Date(lastUpdatedEpoch * 1000).toISOString().slice(0, 10) : "",
      licenseState: String(taxonomy0.state || fallbackState || ""),
      dba,
      website,
    };

    const practiceAge = provider.foundingYear > 0 ? currentYear - provider.foundingYear : 0;
    const estimatedProviders = estimateProviderCount(provider);

    const revenueRangeLow = estimatedProviders * benchmark.revenuePerProvider * 0.75;
    const revenueRangeHigh = estimatedProviders * benchmark.revenuePerProvider * 1.25;
    const ebitdaRangeLow = revenueRangeLow * benchmark.ebitdaMarginLow;
    const ebitdaRangeHigh = revenueRangeHigh * benchmark.ebitdaMarginHigh;

    const acquisitionScore = calculateScore(provider, practiceAge, estimatedProviders, specialtyKey);
    const scoreLabel: PracticeProfile["scoreLabel"] =
      acquisitionScore >= 80
        ? "High Readiness"
        : acquisitionScore >= 60
        ? "Worth Watching"
        : "Emerging";

    profiles.push({
      provider,
      estimatedProviders,
      revenueRangeLow,
      revenueRangeHigh,
      ebitdaRangeLow,
      ebitdaRangeHigh,
      impliedMultipleLow: benchmark.multipleLow,
      impliedMultipleHigh: benchmark.multipleHigh,
      acquisitionScore,
      scoreLabel,
      practiceAge,
      thesis: generateThesis(provider, practiceAge, estimatedProviders, benchmark),
      approachAngle: generateApproachAngle(practiceAge, estimatedProviders, specialtyKey),
      signals: generateSignals(provider, practiceAge, estimatedProviders),
      specialtyKey,
    });
  }

  profiles.sort((a, b) => b.acquisitionScore - a.acquisitionScore);
  return profiles;
}

// ---------------------------------------------------------------------------
// Main exported functions
// ---------------------------------------------------------------------------

export async function searchHealthcareProviders(opts: {
  specialtyKey: string;
  state: string;
  city?: string;
  limit?: number;
  skip?: number;
  entityType?: "NPI-1" | "NPI-2" | "all";
  orgName?: string;
  lastName?: string;
}): Promise<{ total: number; profiles: PracticeProfile[] }> {
  const benchmark = SPECIALTY_BENCHMARKS[opts.specialtyKey] || SPECIALTY_BENCHMARKS.all;

  const limit = opts.limit || 25;
  const skip = opts.skip || 0;

  let url =
    getNpiUrl(`/api/?version=2.1`) +
    `&limit=${limit}` +
    `&skip=${skip}`;

  if (opts.entityType && opts.entityType !== "all") {
    url += `&enumeration_type=${opts.entityType}`;
  }

  if (opts.specialtyKey && opts.specialtyKey !== "all" && benchmark.taxonomyQuery) {
    url += `&taxonomy_description=${encodeURIComponent(benchmark.taxonomyQuery)}`;
  }

  if (opts.state && opts.state !== "ALL") {
    url += `&state=${opts.state}`;
  }

  if (opts.city) {
    url += `&city=${encodeURIComponent(opts.city)}`;
  }

  if (opts.orgName) {
    url += `&organization_name=${encodeURIComponent(opts.orgName)}`;
  }

  if (opts.lastName) {
    url += `&last_name=${encodeURIComponent(opts.lastName)}`;
  }

  const res = await fetchWithBackendProxy(url, 20000);
  if (!res.ok) throw new Error(`NPI API error: ${res.status}`);

  const data = await res.json();
  const resultCount: number = data.result_count || 0;
  const results: unknown[] = data.results || [];

  const profiles = buildProfilesFromResults(results, benchmark, opts.specialtyKey || "all", opts.state);

  return { total: resultCount, profiles };
}

// Search several states at once and aggregate. Used when more than one state
// is selected (e.g. a focus vertical spanning NC / SC / MD / VA). Runs the
// per-state queries in parallel, merges, dedupes by NPI, and re-sorts by score.
export async function searchHealthcareProvidersMultiState(opts: {
  specialtyKey: string;
  states: string[];
  city?: string;
  limitPerState?: number;
  entityType?: "NPI-1" | "NPI-2" | "all";
  orgName?: string;
  lastName?: string;
}): Promise<{ total: number; profiles: PracticeProfile[] }> {
  const limitPerState = opts.limitPerState || 20;

  const results = await Promise.all(
    opts.states.map((st) =>
      searchHealthcareProviders({
        specialtyKey: opts.specialtyKey,
        state: st,
        city: opts.city,
        limit: limitPerState,
        skip: 0,
        entityType: opts.entityType,
        orgName: opts.orgName,
        lastName: opts.lastName,
      }).catch(() => ({ total: 0, profiles: [] as PracticeProfile[] })),
    ),
  );

  const total = results.reduce((sum, r) => sum + r.total, 0);

  const seen = new Set<string>();
  const profiles: PracticeProfile[] = [];
  for (const r of results) {
    for (const p of r.profiles) {
      if (seen.has(p.provider.npi)) continue;
      seen.add(p.provider.npi);
      profiles.push(p);
    }
  }

  profiles.sort((a, b) => b.acquisitionScore - a.acquisitionScore);
  return { total, profiles };
}
