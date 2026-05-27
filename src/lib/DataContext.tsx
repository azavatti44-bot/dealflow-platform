import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { CompanyResult } from "./api";

interface Watchlist { id: string; name: string; companies: string[]; created: string; }

interface DataCtx {
  companies: CompanyResult[];
  watchlists: Watchlist[];
  selectedCompany: CompanyResult | null;
  addCompany: (c: CompanyResult) => void;
  toggleWatchlist: (name: string, wid: string) => void;
  addToWatchlist: (name: string, watchlistName: string) => void;
  removeFromWatchlist: (name: string, watchlistId: string) => void;
  selectCompany: (c: CompanyResult | null) => void;
}

const Ctx = createContext<DataCtx | null>(null);

// DataProvider is keyed on userId in App.tsx so it fully remounts on login/logout,
// reinitialising all state from that user's namespaced localStorage keys.
export function DataProvider({ children, userId }: { children: ReactNode; userId: string }) {
  // Namespace every key so each user's data is fully isolated
  const k = (base: string) => `${base}_${userId}`;

  const [companies, setCompanies] = useState<CompanyResult[]>(() => {
    try { const r = localStorage.getItem(k("stc_companies")); return r ? JSON.parse(r) : []; } catch { return []; }
  });

  const [watchlists, setWatchlists] = useState<Watchlist[]>(() => {
    try {
      const r = localStorage.getItem(k("stc_watchlists"));
      if (r) return JSON.parse(r);
    } catch {}
    return [
      { id: "1", name: "Insurance Distribution", companies: [], created: "2026-05-01" },
      { id: "2", name: "PE-Backed Services",      companies: [], created: "2026-05-10" },
      { id: "3", name: "Founder Transition Ready", companies: [], created: "2026-05-15" },
    ];
  });

  const [selectedCompany, setSelected] = useState<CompanyResult | null>(null);

  const addCompany = useCallback((c: CompanyResult) => {
    setCompanies(prev => {
      const next = prev.some(x => x.name === c.name)
        ? prev.map(x => x.name === c.name ? c : x)
        : [c, ...prev].slice(0, 50);
      try { localStorage.setItem(k("stc_companies"), JSON.stringify(next)); } catch {}
      return next;
    });
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleWatchlist = useCallback((name: string, wid: string) => {
    setWatchlists(prev => {
      const next = prev.map(w =>
        w.id === wid
          ? { ...w, companies: w.companies.includes(name) ? w.companies.filter(c => c !== name) : [...w.companies, name] }
          : w
      );
      try { localStorage.setItem(k("stc_watchlists"), JSON.stringify(next)); } catch {}
      return next;
    });
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const addToWatchlist = useCallback((name: string, watchlistName: string) => {
    setWatchlists(prev => {
      const existing = prev.find(w => w.name === watchlistName);
      let next: Watchlist[];
      if (existing) {
        if (existing.companies.includes(name)) return prev;
        next = prev.map(w => w.id === existing.id ? { ...w, companies: [...w.companies, name] } : w);
      } else {
        next = [...prev, {
          id: `wl_${Date.now()}`,
          name: watchlistName,
          companies: [name],
          created: new Date().toISOString().slice(0, 10),
        }];
      }
      try { localStorage.setItem(k("stc_watchlists"), JSON.stringify(next)); } catch {}
      return next;
    });
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const removeFromWatchlist = useCallback((name: string, watchlistId: string) => {
    setWatchlists(prev => {
      const next = prev.map(w =>
        w.id === watchlistId ? { ...w, companies: w.companies.filter(c => c !== name) } : w
      );
      try { localStorage.setItem(k("stc_watchlists"), JSON.stringify(next)); } catch {}
      return next;
    });
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Ctx.Provider value={{ companies, watchlists, selectedCompany, addCompany, toggleWatchlist, addToWatchlist, removeFromWatchlist, selectCompany: setSelected }}>
      {children}
    </Ctx.Provider>
  );
}

export function useData() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useData must be in DataProvider");
  return c;
}
