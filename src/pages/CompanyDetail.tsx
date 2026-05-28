import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Scale, Lightbulb, Building, Star, Loader2 } from "lucide-react";
import { searchCompany, searchFormDByCompany, type CompanyResult, type FormDRecord } from "@/lib/api";
import { useData } from "@/lib/DataContext";

const card = { background: "var(--bg-surface)", border: "1px solid rgba(0,0,0,0.08)" };
const tabBtn = (active: boolean) => ({
  background: active ? "rgba(27,67,50,0.10)" : "transparent",
  color: active ? "var(--accent)" : "var(--text-secondary)",
  borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
});

export default function CompanyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { companies, watchlists, toggleWatchlist } = useData();
  const [company, setCompany] = useState<CompanyResult | null>(null);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [formDResults, setFormDResults] = useState<FormDRecord[]>([]);
  const [formDLoading, setFormDLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const name = decodeURIComponent(id);
    const fromCtx = companies.find(c => c.name === name);
    if (fromCtx) { setCompany(fromCtx); return; }
    setLoading(true);
    searchCompany(name).then(d => { setCompany(d); }).catch(() => setLoading(false)).finally(() => setLoading(false));
  }, [id, companies]);

  const inWl = (wid: string) => company ? watchlists.find(w => w.id === wid)?.companies.includes(company.name) : false;

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-12 text-center"><Loader2 className="animate-spin inline mr-2" style={{ color: "var(--accent)" }} /><span style={{ color: "var(--text-secondary)" }}>Loading...</span></div>;
  if (!company) return <div className="max-w-6xl mx-auto px-4 py-12 text-center" style={{ color: "var(--text-secondary)" }}>Company not found.</div>;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "signals", label: "Signals" },
    { id: "filings", label: "SEC Filings" },
    { id: "court", label: "Court Cases" },
    { id: "patents", label: "Patents" },
    { id: "state", label: "State Records" },
    { id: "form_d", label: "Form D" },
    { id: "sba", label: "Size Data" },
  ];

  const formDData = formDResults.length > 0 ? formDResults : (company?.form_d_records || []);

  async function handleSearchFormD() {
    if (!company) return;
    setFormDLoading(true);
    try {
      const results = await searchFormDByCompany(company.name);
      setFormDResults(results);
    } finally {
      setFormDLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-xs" style={{ color: "var(--text-secondary)" }}><ArrowLeft size={14} />Back</button>

      <div className="rounded-xl p-5" style={card}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{company.name}</h1>
            <div className="flex items-center gap-3 mt-2 text-[10px] font-mono" style={{ color: "var(--text-secondary)" }}>
              {company.ticker && <span>{company.ticker}</span>}
              {company.cik && <span>CIK: {company.cik}</span>}
              <span className="px-2 py-0.5 rounded-full font-bold" style={{ background: company.tier === "hot" ? "rgba(27,67,50,0.12)" : "rgba(0,0,0,0.04)", color: company.tier === "hot" ? "var(--accent)" : "var(--text-secondary)" }}>
                {company.tier.toUpperCase()} {company.score}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {watchlists.map(w => (
              <button key={w.id} onClick={() => toggleWatchlist(company.name, w.id)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] transition-colors"
                style={{ background: inWl(w.id) ? "rgba(27,67,50,0.10)" : "rgba(0,0,0,0.04)", color: inWl(w.id) ? "var(--accent)" : "var(--text-secondary)" }}>
                <Star size={10} style={{ fill: inWl(w.id) ? "var(--accent)" : "none" }} />{w.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-0 border-b overflow-x-auto" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors"
            style={tabBtn(tab === t.id)}>{t.label}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: FileText, label: "SEC Filings", value: company.sec_filings.length },
              { icon: Scale, label: "Court Cases", value: company.court_cases.length },
              { icon: Lightbulb, label: "Patents", value: company.patents.length },
              { icon: Building, label: "State Records", value: company.sos_records.length },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-lg p-4 text-center" style={card}>
                <Icon className="mx-auto mb-1.5" size={16} style={{ color: "var(--accent)" }} />
                <p className="text-xl font-bold font-mono" style={{ color: "var(--text-primary)" }}>{value}</p>
                <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{label}</p>
              </div>
            ))}
          </div>
          {company.signals.length > 0 && (
            <div className="rounded-xl p-4" style={card}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Detected Signals ({company.signals.length})</h3>
              {company.signals.map((s, i) => (
                <div key={i} className="flex items-start gap-3 py-2" style={{ borderBottom: i < company.signals.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                  <span className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: s.confidence === "high" ? "var(--accent)" : s.confidence === "medium" ? "var(--accent-hover)" : "var(--text-secondary)" }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{s.signal_type.replace(/_/g, " ")}</p>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.description}</p>
                    <p className="text-[10px] font-mono mt-0.5" style={{ color: "var(--text-secondary)" }}>{s.evidence}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "signals" && (
        <div className="space-y-2">
          {company.signals.length === 0 && <p className="text-sm text-center py-8" style={{ color: "var(--text-secondary)" }}>No signals detected.</p>}
          {company.signals.map((s, i) => (
            <div key={i} className="rounded-lg p-4" style={card}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ background: s.confidence === "high" ? "rgba(27,67,50,0.10)" : s.confidence === "medium" ? "rgba(27,67,50,0.12)" : "rgba(0,0,0,0.04)", color: s.confidence === "high" ? "var(--accent)" : s.confidence === "medium" ? "var(--accent-hover)" : "var(--text-secondary)" }}>{s.confidence}</span>
                <span className="text-[10px] font-mono" style={{ color: "var(--text-secondary)" }}>+{s.score_impact} pts</span>
              </div>
              <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{s.signal_type.replace(/_/g, " ")}</h4>
              <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{s.description}</p>
              <p className="text-[10px] font-mono mt-1" style={{ color: "var(--text-secondary)" }}>{s.evidence}</p>
              <p className="text-[10px] mt-1" style={{ color: "var(--accent)" }}>{s.source}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "filings" && (
        <div className="rounded-xl p-4" style={card}>
          {company.sec_filings.length === 0 && <p className="text-sm text-center py-8" style={{ color: "var(--text-secondary)" }}>No filings found.</p>}
          <table className="w-full text-xs">
            <thead><tr style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
              <th className="text-left py-2 px-2" style={{ color: "var(--text-secondary)" }}>Form</th>
              <th className="text-left py-2 px-2" style={{ color: "var(--text-secondary)" }}>Filed</th>
              <th className="text-left py-2 px-2" style={{ color: "var(--text-secondary)" }}>Description</th>
              <th className="text-left py-2 px-2" style={{ color: "var(--text-secondary)" }}>Items</th>
            </tr></thead>
            <tbody>{company.sec_filings.map((f, i) => (
              <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                <td className="py-2 px-2"><span className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ background: "rgba(27,67,50,0.08)", color: "var(--accent)" }}>{f.form_type}</span></td>
                <td className="py-2 px-2 font-mono" style={{ color: "var(--text-secondary)" }}>{f.filed_at}</td>
                <td className="py-2 px-2" style={{ color: "var(--text-primary)" }}>{f.description}</td>
                <td className="py-2 px-2">{f.items?.map(item => <span key={item} className="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono mr-1" style={{ background: "rgba(139,58,58,0.15)", color: "#C9A0A0" }}>{item}</span>)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === "court" && (
        <div className="rounded-xl p-4" style={card}>
          {company.court_cases.length === 0 && <p className="text-sm text-center py-8" style={{ color: "var(--text-secondary)" }}>No court cases found.</p>}
          {company.court_cases.map((c, i) => (
            <div key={i} className="py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ background: c.case_type === "bankruptcy" ? "rgba(139,58,58,0.15)" : "rgba(0,0,0,0.04)", color: c.case_type === "bankruptcy" ? "#C9A0A0" : "var(--text-secondary)" }}>{c.case_type}</span>
                <span className="text-[10px] font-mono" style={{ color: "var(--text-secondary)" }}>{c.docket_number}</span>
              </div>
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>{c.case_name}</p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{c.court} · {c.date_filed}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "patents" && (
        <div className="rounded-xl p-4" style={card}>
          {company.patents.length === 0 && <p className="text-sm text-center py-8" style={{ color: "var(--text-secondary)" }}>No patents found.</p>}
          {company.patents.map((p, i) => (
            <div key={i} className="py-2 flex items-start gap-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded shrink-0" style={{ background: "rgba(27,67,50,0.10)", color: "var(--accent-hover)" }}>{p.number}</span>
              <div><p className="text-sm" style={{ color: "var(--text-primary)" }}>{p.title}</p><p className="text-[10px] font-mono" style={{ color: "var(--text-secondary)" }}>{p.date}</p></div>
            </div>
          ))}
        </div>
      )}

      {tab === "state" && (
        <div className="rounded-xl p-4" style={card}>
          {company.sos_records.length === 0 && <p className="text-sm text-center py-8" style={{ color: "var(--text-secondary)" }}>No state records found.</p>}
          {company.sos_records.map((r, i) => (
            <div key={i} className="py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{r.entity_name}</p>
              <div className="flex items-center gap-3 mt-1 text-[10px]" style={{ color: "var(--text-secondary)" }}>
                <span>{r.jurisdiction}</span><span>{r.status}</span><span className="font-mono">{r.entity_number}</span>
              </div>
              {r.officers.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {r.officers.slice(0, 5).map((o, j) => (
                    <span key={j} className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ background: "var(--bg-surface-alt)", color: "var(--text-secondary)" }}>{o.name} — {o.position}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "form_d" && (
        <div className="rounded-xl p-4 space-y-4" style={card}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Reg D Filings</h3>
            <button
              onClick={handleSearchFormD}
              disabled={formDLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-opacity disabled:opacity-60"
              style={{ background: "var(--accent)", color: "#FFFFFF" }}
            >
              {formDLoading ? <Loader2 size={11} className="animate-spin" /> : null}
              Search Form D
            </button>
          </div>
          {formDData.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "var(--text-secondary)" }}>
              No Reg D filings found — likely founder-owned or pre-institutional
            </p>
          ) : (
            <table className="w-full text-xs">
              <thead><tr style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                <th className="text-left py-2 px-2" style={{ color: "var(--text-secondary)" }}>Company</th>
                <th className="text-left py-2 px-2" style={{ color: "var(--text-secondary)" }}>State</th>
                <th className="text-left py-2 px-2" style={{ color: "var(--text-secondary)" }}>Filed</th>
                <th className="text-left py-2 px-2" style={{ color: "var(--text-secondary)" }}>Type</th>
              </tr></thead>
              <tbody>
                {formDData.map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                    <td className="py-2 px-2" style={{ color: "var(--text-primary)" }}>{r.company_name}</td>
                    <td className="py-2 px-2 font-mono" style={{ color: "var(--text-secondary)" }}>{r.state}</td>
                    <td className="py-2 px-2 font-mono" style={{ color: "var(--text-secondary)" }}>{r.date_filed}</td>
                    <td className="py-2 px-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                        style={r.form_type === "D/A"
                          ? { background: "rgba(90,77,58,0.3)", color: "var(--text-secondary)" }
                          : { background: "rgba(27,67,50,0.10)", color: "var(--accent)" }}>
                        {r.form_type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "sba" && (() => {
        const sba = company.sba_data;
        if (!sba) return (
          <div className="rounded-xl p-6 text-center" style={card}>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No SBA PPP data found — company may be too large, too small, or did not participate</p>
            <p className="text-xs mt-3 px-4" style={{ color: "var(--text-secondary)" }}>Revenue/EBITDA are estimates based on employee count × industry benchmarks. Not audited financials.</p>
          </div>
        );
        const revLow = sba.jobs_reported * 150000;
        const revHigh = sba.jobs_reported * 220000;
        const ebitdaLow = revLow * 0.08;
        const ebitdaHigh = revHigh * 0.16;
        const fmt = (n: number) => n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : `$${(n / 1000).toFixed(0)}K`;
        return (
          <div className="space-y-4">
            <div className="rounded-xl p-5" style={card}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>SBA PPP Size Data</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: "Employees", value: sba.jobs_reported.toLocaleString(), mono: true },
                  { label: "PPP Loan Amount", value: `$${sba.loan_amount.toLocaleString()}`, mono: true },
                  { label: "NAICS Code", value: sba.naics_code, mono: true },
                  { label: "Business Type", value: sba.business_type, mono: false },
                  { label: "Location", value: `${sba.city}, ${sba.state}`, mono: false },
                  { label: "Borrower Name", value: sba.borrower_name, mono: false },
                ].map(d => (
                  <div key={d.label} className="rounded-lg p-3" style={{ background: "var(--bg-surface-alt)" }}>
                    <p className={`text-sm font-bold ${d.mono ? "font-mono" : ""}`} style={{ color: "var(--text-primary)" }}>{d.value || "—"}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text-secondary)" }}>{d.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl p-5" style={card}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Estimated Financials</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="rounded-lg p-3" style={{ background: "var(--bg-surface-alt)" }}>
                  <p className="text-sm font-bold font-mono" style={{ color: "var(--accent)" }}>{fmt(revLow)} – {fmt(revHigh)}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--text-secondary)" }}>Revenue Estimate</p>
                </div>
                <div className="rounded-lg p-3" style={{ background: "var(--bg-surface-alt)" }}>
                  <p className="text-sm font-bold font-mono" style={{ color: "var(--accent-hover)" }}>{fmt(ebitdaLow)} – {fmt(ebitdaHigh)}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--text-secondary)" }}>EBITDA Estimate</p>
                </div>
              </div>
              <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>Revenue/EBITDA are estimates based on employee count × industry benchmarks. Not audited financials.</p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
