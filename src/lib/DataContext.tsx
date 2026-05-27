import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { CompanyResult } from "./api";

interface Watchlist { id: string; name: string; companies: string[]; created: string; }

interface DataCtx {
  companies: CompanyResult[];
  watchlists: Watchlist[];
  selectedCompany: CompanyResult | null;
  addCompany: (c: CompanyResult) => void;
  toggleWatchlist: (name: string, wid: string) => void;
  selectCompany: (c: CompanyResult | null) => void;
}

const Ctx = createContext<DataCtx | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<CompanyResult[]>(() => {
    try { const r = localStorage.getItem("stc_companies"); return r ? JSON.parse(r) : []; } catch { return []; }
  });
  const [watchlists, setWatchlists] = useState<Watchlist[]>(() => {
    try {
      const r = localStorage.getItem("stc_watchlists");
      if (r) return JSON.parse(r);
    } catch {}
    return [
      { id: "1", name: "Insurance Distribution", companies: [], created: "2026-05-01" },
      { id: "2", name: "PE-Backed Services", companies: [], created: "2026-05-10" },
      { id: "3", name: "Founder Transition Ready", companies: [], created: "2026-05-15" },
    ];
  });
  const [selectedCompany, setSelected] = useState<CompanyResult | null>(null);

  const addCompany = useCallback((c: CompanyResult) => {
    setCompanies(prev => {
      const next = prev.some(x => x.name === c.name) ? prev.map(x => x.name === c.name ? c : x) : [c, ...prev].slice(0, 50);
      try { localStorage.setItem("stc_companies", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const toggleWatchlist = useCallback((name: string, wid: string) => {
    setWatchlists(prev => {
      const next = prev.map(w => w.id === wid ? { ...w, companies: w.companies.includes(name) ? w.companies.filter(c => c !== name) : [...w.companies, name] } : w);
      try { localStorage.setItem("stc_watchlists", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return (
    <Ctx.Provider value={{ companies, watchlists, selectedCompany, addCompany, toggleWatchlist, selectCompany: setSelected }}>
      {children}
    </Ctx.Provider>
  );
}

export function useData() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useData must be in DataProvider");
  return c;
}
