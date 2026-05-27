import { CIK_MAP } from "./cik-map";

export interface Signal {
  signal_type: string; confidence: "high" | "medium" | "emerging";
  description: string; evidence: string; score_impact: number; source: string; detected_at: string;
}
export interface SecFiling { form_type: string; filed_at: string; accession_number: string; primary_document: string; description: string; cik: string; company_name: string; items: string[]; is_ownership_filing?: boolean; }
export interface CourtCase { case_name: string; docket_number: string; court: string; date_filed: string; nature_of_suit: string; case_type: string; }
export interface Patent { type: string; number: string; title: string; date: string; assignee: string; }
export interface SosRecord { entity_name: string; entity_number: string; status: string; jurisdiction: string; incorporation_date: string; officers: { name: string; position: string; start_date: string }[]; }
export interface FormDRecord {
  company_name: string;
  cik: string;
  state: string;
  date_filed: string;
  form_type: string;
  accession_no: string;
  amount_raised?: number;
  industry?: string;
}

export interface EDGARTextHit {
  entity_name: string;
  form_type: string;
  file_date: string;
  accession_no: string;
  excerpt?: string;
}

export interface SBARecord {
  borrower_name: string;
  jobs_reported: number;
  loan_amount: number;
  naics_code: string;
  business_type: string;
  city: string;
  state: string;
}

export interface WARNRecord {
  company: string;
  date: string;
  employees_affected: number;
  city: string;
  state: string;
  reason?: string;
}

export interface CompTransaction {
  target: string;
  acquirer?: string;
  date_filed: string;
  form_type: string;
  accession_no: string;
  entity_name: string;
}

export interface AdvisorRecord {
  firm_name: string;
  cik: string;
  state: string;
  date_filed: string;
  accession_no: string;
}

export interface CompanyResult {
  name: string; cik?: string; ticker?: string; score: number; tier: string;
  signals: Signal[]; sec_filings: SecFiling[]; court_cases: CourtCase[]; patents: Patent[]; sos_records: SosRecord[];
  api_errors: string[]; fetched_at: string;
  form_d_records?: FormDRecord[];
  sba_data?: SBARecord | null;
  warn_signals?: WARNRecord[];
}

function getCache(key: string): any | null {
  try { const raw = localStorage.getItem(`stc_cache_${key}`); if (!raw) return null; const parsed = JSON.parse(raw); if (Date.now() - parsed.ts > 3600000) return null; return parsed.data; } catch { return null; }
}
function setCache(key: string, data: any) {
  try { localStorage.setItem(`stc_cache_${key}`, JSON.stringify({ ts: Date.now(), data })); } catch { /* quota */ }
}

function fetchWithTimeout(url: string, opts: RequestInit = {}, ms = 15000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(id));
}

export async function fetchProxied(url: string): Promise<any> {
  const parseJSON = async (res: Response): Promise<any> => {
    const text = await res.text();
    if (text.trim().startsWith("<")) throw new Error("HTML response");
    return JSON.parse(text);
  };
  const res = await fetchWithTimeout(url, {}, 15000);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parseJSON(res);
}

async function searchSEC(name: string, ticker?: string, cik?: string): Promise<SecFiling[]> {
  if (!cik && ticker) {
    const upper = ticker.toUpperCase();
    if (CIK_MAP[upper]) cik = CIK_MAP[upper];
    else {
      try {
        // SEC EDGAR's company_tickers.json supports CORS — fetch directly, no proxy needed
        const res = await fetchWithTimeout("/api/sec-files/company_tickers.json", { headers: { "User-Agent": "DealflowPlatform admin@example.com" } }, 10000);
        if (res.ok) {
          const tickers = await res.json();
          for (const entry of Object.values(tickers)) {
            if ((entry as any).ticker?.toUpperCase() === upper) { cik = String((entry as any).cik_str).padStart(10, "0"); break; }
          }
        }
      } catch { /* no CIK */ }
    }
  }
  if (!cik) throw new Error("No CIK found for ticker");
  const data = await fetchWithTimeout(`/api/data-sec/submissions/CIK${cik}.json`, {}, 45000).then(r => r.json());
  const recent = data.filings?.recent || {};
  const forms: string[] = recent.form || [];
  const dates: string[] = recent.filingDate || [];
  const accs: string[] = recent.accessionNumber || [];
  const docs: string[] = recent.primaryDocument || [];
  const descs: string[] = recent.primaryDocDescription || [];
  const filings: SecFiling[] = [];
  for (let i = 0; i < forms.length && filings.length < 30; i++) {
    if (["8-K","8-K/A","SC 13D","SC 13D/A","SC 13G","S-4","S-4/A"].includes(forms[i])) {
      filings.push({ form_type: forms[i], filed_at: dates[i]||"", accession_number: accs[i]||"", primary_document: docs[i]||"", description: descs[i]||forms[i], cik, company_name: data.name||name, items: [], is_ownership_filing: forms[i].startsWith("SC 13") });
    }
  }
  const eightKs = filings.filter(x => x.form_type === "8-K").slice(0, 5);
  for (const f of eightKs) {
    try { f.items = await extract8kItems(f.accession_number, f.primary_document, cik!); } catch { /* */ }
  }
  return filings;
}

async function extract8kItems(acc: string, doc: string, cik: string): Promise<string[]> {
  if (!acc || !doc) return [];
  const accClean = acc.replace(/-/g, "");
  const cikClean = cik.replace(/^0+/, "");
  let text = "";

  try {
    const res = await fetchWithTimeout(`/api/sec-arch/edgar/data/${cikClean}/${accClean}/${doc}`, {}, 6000);
    if (res.ok) { const t = await res.text(); text = t.toUpperCase(); }
  } catch { /* */ }

  if (!text) return [];
  const found: string[] = [];
  for (const item of ["4.01","4.02","5.02","5.03","2.01","1.01"]) {
    if ([`>ITEM ${item}`,`ITEM ${item}<`,`ITEM ${item}`].some(p => text.includes(p))) found.push(item);
  }
  return found;
}

async function searchCourt(name: string): Promise<CourtCase[]> {
  try {
    // CourtListener API uses snake_case fields; court field is a resource URL, court_id is the short code
    const res = await fetchWithTimeout(`/api/courtlistener/api/rest/v4/dockets/?party_name=${encodeURIComponent(name)}&page_size=20`, {}, 15000);
    if (!res.ok) throw new Error(`CourtListener HTTP ${res.status}`);
    const data = await res.json();
    return (data.results || []).map((x: any) => {
      const caseName = x.case_name || "";
      const suit = x.nature_of_suit || "";
      return {
        case_name: caseName,
        docket_number: x.docket_number || "",
        court: x.court_id || x.court || "",
        date_filed: x.date_filed || "",
        nature_of_suit: suit,
        case_type: caseName.toLowerCase().includes("bankruptcy") ? "bankruptcy" : (suit.toLowerCase().includes("breach") ? "commercial_dispute" : (caseName.toLowerCase().includes("merger") ? "ma_related" : "other")),
      };
    });
  } catch { return []; }
}

async function searchUSPTO(name: string): Promise<Patent[]> {
  try {
    // PatentsView migrated to search.patentsview.org with a new query format
    const q = encodeURIComponent(JSON.stringify({ "_text_any": { "assignee_organization": name } }));
    const f = encodeURIComponent(JSON.stringify(["patent_id", "patent_date", "patent_title", "assignees.assignee_organization"]));
    const s = encodeURIComponent(JSON.stringify([{ "patent_date": "desc" }]));
    const pvUrl = `/api/patentsview/api/v1/patents/?q=${q}&f=${f}&per_page=50&sort=${s}`;
    const res = await fetchWithTimeout(pvUrl, {}, 15000);
    if (!res.ok) throw new Error(`PatentsView HTTP ${res.status}`);
    const data = await res.json();
    return (data.patents || []).map((p: any) => ({
      type: "patent",
      number: p.patent_id || "",
      title: p.patent_title || "",
      date: p.patent_date || "",
      assignee: p.assignees?.[0]?.assignee_organization || name,
    }));
  } catch { return []; }
}

async function searchSOS(name: string): Promise<SosRecord[]> {
  const ocUrl = `/api/opencorporates/v0.4/companies/search?q=${encodeURIComponent(name)}&per_page=10`;
  const parse = (data: any): SosRecord[] =>
    (data.results?.companies || []).map((c: any) => {
      const co = c.company || {};
      return {
        entity_name: co.name || "",
        entity_number: co.company_number || "",
        status: co.current_status || "",
        jurisdiction: co.jurisdiction_code || "",
        incorporation_date: co.incorporation_date || "",
        officers: (co.officers || []).map((o: any) => ({ name: o.officer?.name || "", position: o.officer?.position || "", start_date: o.officer?.start_date || "" })),
      };
    });
  try {
    const res = await fetchWithTimeout(ocUrl, {}, 10000);
    if (res.ok) return parse(await res.json());
  } catch { /* try proxy */ }
  try { return parse(await fetchProxied(ocUrl)); } catch { return []; }
}

function detectSignals(sec: SecFiling[], court: CourtCase[], patents: Patent[], sos: SosRecord[]): Signal[] {
  const signals: Signal[] = []; const seen = new Set<string>(); const now = new Date().toISOString();
  const add = (type: string, conf: "high"|"medium"|"emerging", desc: string, ev: string, impact: number, src: string) => { const key = type + ev.slice(0, 50); if (seen.has(key)) return; seen.add(key); signals.push({ signal_type: type, confidence: conf, description: desc, evidence: ev, score_impact: impact, source: src, detected_at: now }); };
  const ITEM_MAP: Record<string, [string, "high"|"medium", number, string]> = {
    "4.01": ["advisor_engagement","high",18,"Auditor change — often precedes QoE review or sale prep"],
    "4.02": ["financial_restatement","medium",12,"Financial restatement — non-reliance on prior financials"],
    "5.02": ["key_executive_departure","high",16,"Director/officer departure — strong sell signal"],
    "5.03": ["governance_change","medium",8,"Amendment to articles — may indicate reorganization for sale"],
    "2.01": ["ma_activity","high",15,"Acquisition/disposition — actively transacting"],
    "1.01": ["material_agreement","medium",8,"Material agreement — could be IB engagement letter"],
  };
  for (const f of sec) {
    for (const item of f.items || []) { if (ITEM_MAP[item]) { const [t,c,i,d] = ITEM_MAP[item]; add(t,c,d,`8-K ${f.filed_at} Item ${item}`,i,"SEC EDGAR"); } }
    if (f.is_ownership_filing) add("change_of_control","high","Schedule 13D — beneficial ownership over 5%",`${f.form_type} ${f.filed_at}`,16,"SEC EDGAR");
  }
  const r8k = sec.filter(f => f.form_type?.startsWith("8-K") && f.filed_at >= "2025-06-01");
  if (r8k.length >= 3) add("elevated_filing_activity","medium",`${r8k.length} recent 8-K filings — elevated disclosure`,`${r8k.length} 8-Ks`,6,"SEC EDGAR");
  const bk = court.filter(c => c.case_type === "bankruptcy"); if (bk.length) add("bankruptcy_filing","high",`${bk.length} bankruptcy proceeding(s)`,`${bk[0].case_name}`,20,"CourtListener");
  const disp = court.filter(c => c.case_type === "commercial_dispute"); if (disp.length >= 2) add("litigation_exposure","medium",`${disp.length} commercial disputes`,`${disp[0].case_name}`,8,"CourtListener");
  const ma = court.filter(c => c.case_type === "ma_related"); if (ma.length) add("ma_litigation","high","M&A litigation — appraisal or deal challenge",ma[0].case_name,15,"CourtListener");
  const dates = patents.filter(p => p.date).map(p => new Date(p.date));
  if (dates.length >= 3) { dates.sort((a,b) => b.getTime()-a.getTime()); const twoY = new Date(); twoY.setFullYear(twoY.getFullYear()-2); if (dates[0] < twoY) add("no_new_ip_filings","medium","No new patents in 24+ months — R&D cutback",`Last: ${dates[0].toISOString().slice(0,10)}`,8,"USPTO"); }
  if (patents.length <= 2 && patents.length > 0) add("low_innovation_activity","emerging","Minimal patent portfolio",`${patents.length} patents`,4,"USPTO");
  const officers = sos.flatMap(r => r.officers || []);
  const kc = officers.filter(o => { if (!o.start_date || o.start_date < "2024-01-01") return false; const p = (o.position||"").toLowerCase(); return ["cfo","chief financial","coo","chief operating","general counsel"].some(k => p.includes(k)); });
  if (kc.length) add("officer_changes_detected","medium",`${kc.length} recent officer change(s) in key positions`,kc.map(o=>o.name).slice(0,3).join(", "),8,"State SOS");
  return signals;
}

function computeScore(signals: Signal[]) {
  const W: Record<string,number> = { advisor_engagement:18,key_executive_departure:16,bankruptcy_filing:20,ma_litigation:15,ma_activity:15,change_of_control:16,elevated_filing_activity:6,entity_status_change:14,no_new_ip_filings:8,litigation_exposure:8,officer_changes_detected:8,financial_restatement:12,governance_change:8,material_agreement:8,low_innovation_activity:4 };
  const M: Record<string,number> = { high:1.0,medium:0.6,emerging:0.3 };
  let total = 0, maxP = 0; const seen = new Set<string>(); let high=0,med=0,em=0;
  for (const s of signals) { if (seen.has(s.signal_type)) continue; seen.add(s.signal_type); const w=W[s.signal_type]||5; total += w*(M[s.confidence]||0.3); maxP += w; if (s.confidence==="high") high++; else if (s.confidence==="medium") med++; else em++; }
  const composite = Math.min(100, Math.round((total/Math.max(maxP*0.4,1))*100));
  let tier = "cold"; if (composite>=80) tier="hot"; else if (composite>=65) tier="warm"; else if (composite>=50) tier="watch";
  return { composite, tier, high, med, em };
}

export async function searchFormDByCompany(name: string): Promise<FormDRecord[]> {
  try {
    const url = `/api/efts/LATEST/search-index?q=${encodeURIComponent(name)}&forms=D&dateRange=custom&startdt=2018-01-01`;
    const data = await fetchProxied(url);
    const hits: unknown[] = data?.hits?.hits || [];
    return hits.slice(0, 10).map((h: unknown) => {
      const src = (h as Record<string, unknown>)._source as Record<string, unknown> || {};
      return {
        company_name: extractEntityName(src),
        cik: Array.isArray(src.ciks) && src.ciks.length ? String(src.ciks[0]) : "",
        state: Array.isArray(src.biz_states) && src.biz_states.length ? String(src.biz_states[0]) : "",
        date_filed: String(src.file_date || ""),
        form_type: String(src.form || "D"),
        accession_no: String(src.adsh || ""),
      };
    });
  } catch { return []; }
}

// EDGAR EFTS returns entity names as display_names: string[] e.g. "Acme Corp  (ACME)  (CIK 0001234567)"
function extractEntityName(src: Record<string, unknown>): string {
  if (Array.isArray(src.display_names) && src.display_names.length > 0) {
    return String(src.display_names[0])
      .replace(/\s*\([A-Z0-9.]+\)\s*\(CIK\s*\d+\)\s*$/, "")  // strip "(TICKER) (CIK XXXXXXXXXX)"
      .replace(/\s*\(CIK\s*\d+\)\s*$/, "")                    // strip just "(CIK XXXXXXXXXX)"
      .trim();
  }
  return "";
}

export async function browseFormD(opts: { state?: string; query?: string; startDate?: string; from?: number; minAmount?: number; maxAmount?: number }): Promise<{ total: number; results: FormDRecord[] }> {
  try {
    let url = `/api/efts/LATEST/search-index?forms=D&dateRange=custom&startdt=${opts.startDate || "2020-01-01"}&from=${opts.from || 0}`;
    if (opts.query) url += `&q=${encodeURIComponent(opts.query)}`;
    if (opts.state) url += `&locationCode=${opts.state}`;
    const data = await fetchProxied(url);
    const total: number = data?.hits?.total?.value || 0;
    const hits: unknown[] = data?.hits?.hits || [];
    const results = hits.slice(0, 20).map((h: unknown) => {
      const src = (h as Record<string, unknown>)._source as Record<string, unknown> || {};
      return {
        company_name: extractEntityName(src),
        cik: Array.isArray(src.ciks) && src.ciks.length ? String(src.ciks[0]) : "",
        state: Array.isArray(src.biz_states) && src.biz_states.length ? String(src.biz_states[0]) : "",
        date_filed: String(src.file_date || ""),
        form_type: String(src.form || "D"),
        accession_no: String(src.adsh || ""),
      };
    });
    return { total, results };
  } catch { return { total: 0, results: [] }; }
}

export async function searchEDGARText(query: string, opts?: { forms?: string; startDate?: string; from?: number }): Promise<{ total: number; results: EDGARTextHit[] }> {
  try {
    let url = `/api/efts/LATEST/search-index?q=${encodeURIComponent(query)}&dateRange=custom&startdt=${opts?.startDate || "2023-01-01"}&from=${opts?.from || 0}`;
    if (opts?.forms) url += `&forms=${encodeURIComponent(opts.forms)}`;
    const data = await fetchProxied(url);
    const total: number = data?.hits?.total?.value || 0;
    const hits: unknown[] = data?.hits?.hits || [];
    const results = hits.map((h: unknown) => {
      const src = (h as Record<string, unknown>)._source as Record<string, unknown> || {};
      return {
        entity_name: extractEntityName(src),
        form_type: String(src.form || ""),
        file_date: String(src.file_date || ""),
        accession_no: String(src.adsh || ""),
      };
    });
    return { total, results };
  } catch { return { total: 0, results: [] }; }
}

export async function searchSBAData(name: string): Promise<SBARecord | null> {
  const parseRecords = (records: unknown[]): SBARecord | null => {
    if (!records || records.length === 0) return null;
    const best = records.reduce((acc: unknown, cur: unknown) => {
      const a = acc as Record<string, unknown>;
      const c = cur as Record<string, unknown>;
      return (Number(c.JobsReported) || 0) > (Number(a.JobsReported) || 0) ? cur : acc;
    });
    const b = best as Record<string, unknown>;
    return {
      borrower_name: String(b.BorrowerName || ""),
      jobs_reported: Number(b.JobsReported) || 0,
      loan_amount: Number(b.CurrentApprovalAmount) || 0,
      naics_code: String(b.NAICSCode || ""),
      business_type: String(b.BusinessType || ""),
      city: String(b.BorrowerCity || ""),
      state: String(b.BorrowerState || ""),
    };
  };
  const sbaUrl = `/api/sba/api/3/action/datastore_search?resource_id=aab8e9f9-36d1-42e1-b3ba-e59c79f1d7f0&q=${encodeURIComponent(name)}&limit=5`;
  try {
    const res = await fetchWithTimeout(sbaUrl, {}, 12000);
    if (res.ok) {
      const data = await res.json();
      const records: unknown[] = data?.result?.records || [];
      return parseRecords(records);
    }
  } catch { /* try proxy */ }
  try {
    const data = await fetchProxied(sbaUrl);
    const records: unknown[] = data?.result?.records || [];
    return parseRecords(records);
  } catch { return null; }
}

export async function searchComps(sector: string): Promise<CompTransaction[]> {
  try {
    const url = `/api/efts/LATEST/search-index?forms=S-4&q=${encodeURIComponent(sector)}&dateRange=custom&startdt=2020-01-01`;
    const data = await fetchProxied(url);
    const hits: unknown[] = data?.hits?.hits || [];
    return hits.slice(0, 15).map((h: unknown) => {
      const src = (h as Record<string, unknown>)._source as Record<string, unknown> || {};
      const name = extractEntityName(src);
      return {
        target: name,
        date_filed: String(src.file_date || ""),
        form_type: String(src.form || "S-4"),
        accession_no: String(src.adsh || ""),
        entity_name: name,
      };
    });
  } catch { return []; }
}

export async function searchAdvisors(query: string): Promise<AdvisorRecord[]> {
  try {
    const url = `/api/efts/LATEST/search-index?forms=ADV&q=${encodeURIComponent(query)}&dateRange=custom&startdt=2023-01-01`;
    const data = await fetchProxied(url);
    const hits: unknown[] = data?.hits?.hits || [];
    return hits.slice(0, 10).map((h: unknown) => {
      const src = (h as Record<string, unknown>)._source as Record<string, unknown> || {};
      return {
        firm_name: extractEntityName(src),
        cik: Array.isArray(src.ciks) && src.ciks.length ? String(src.ciks[0]) : "",
        state: Array.isArray(src.biz_states) && src.biz_states.length ? String(src.biz_states[0]) : "",
        date_filed: String(src.file_date || ""),
        accession_no: String(src.adsh || ""),
      };
    });
  } catch { return []; }
}

export async function searchWARNSignals(name: string): Promise<WARNRecord[]> {
  const { results } = await searchEDGARText(`"${name}" WARN layoff`, {});
  return results.slice(0, 5).map(r => ({
    company: r.entity_name,
    date: r.file_date,
    employees_affected: 0,
    city: "",
    state: "",
  }));
}

export async function searchCompany(name: string, ticker?: string, cik?: string): Promise<CompanyResult> {
  const cacheKey = `${name}_${ticker}_${cik}`; const cached = getCache(cacheKey); if (cached) return cached;
  const errors: string[] = [];
  const [secRes, courtRes, usptoRes, sosRes, formDRes, sbaRes] = await Promise.allSettled([
    searchSEC(name, ticker, cik), searchCourt(name), searchUSPTO(name), searchSOS(name),
    searchFormDByCompany(name), searchSBAData(name),
  ]);
  let secFilings: SecFiling[] = []; if (secRes.status === "fulfilled") secFilings = secRes.value; else errors.push(`SEC EDGAR: ${secRes.reason?.message || "Failed"}`);
  let courtCases: CourtCase[] = []; if (courtRes.status === "fulfilled") courtCases = courtRes.value; else errors.push(`CourtListener: ${courtRes.reason?.message || "Failed"}`);
  let patentList: Patent[] = []; if (usptoRes.status === "fulfilled") patentList = usptoRes.value; else errors.push(`USPTO: ${usptoRes.reason?.message || "Failed"}`);
  let sosRecords: SosRecord[] = []; if (sosRes.status === "fulfilled") sosRecords = sosRes.value; else errors.push(`OpenCorporates: ${sosRes.reason?.message || "Failed"}`);
  const formDRecords: FormDRecord[] = formDRes.status === "fulfilled" ? formDRes.value : [];
  const sbaData: SBARecord | null = sbaRes.status === "fulfilled" ? sbaRes.value : null;
  const signals = detectSignals(secFilings, courtCases, patentList, sosRecords);
  const score = computeScore(signals);
  const result: CompanyResult = { name, cik, ticker, score: score.composite, tier: score.tier, signals, sec_filings: secFilings, court_cases: courtCases, patents: patentList, sos_records: sosRecords, api_errors: errors, fetched_at: new Date().toISOString(), form_d_records: formDRecords, sba_data: sbaData };
  setCache(cacheKey, result); return result;
}
