import { useState, useCallback, useEffect } from "react";
import { FolderPlus, Star, X, Eye } from "lucide-react";
import { useData } from "@/lib/DataContext";
import { useNavigate } from "react-router-dom";

const card = { background: "var(--bg-surface)", border: "1px solid rgba(0,0,0,0.08)" };

export default function Watchlists() {
  const { companies, watchlists, removeFromWatchlist } = useData();
  const navigate = useNavigate();
  const [active, setActive] = useState<string>("");
  const [newName, setNewName] = useState("");
  const [lists, setLists] = useState(watchlists);

  useEffect(() => { setLists(watchlists); }, [watchlists]);

  useEffect(() => {
    if (lists.length === 0) return;
    if (!lists.find(l => l.id === active)) setActive(lists[0].id);
  }, [lists, active]);

  const addList = useCallback(() => {
    if (!newName.trim()) return;
    const newList = { id: Date.now().toString(), name: newName.trim(), companies: [], created: new Date().toISOString().slice(0, 10) };
    const updated = [...lists, newList];
    setLists(updated);
    try { localStorage.setItem("stc_watchlists", JSON.stringify(updated)); } catch {}
    setNewName("");
    setActive(newList.id);
  }, [newName, lists]);

  const removeList = useCallback((id: string) => {
    const updated = lists.filter(l => l.id !== id);
    setLists(updated);
    try { localStorage.setItem("stc_watchlists", JSON.stringify(updated)); } catch {}
    if (active === id) setActive(updated[0]?.id || "");
  }, [lists, active]);

  const activeList = lists.find(l => l.id === active);
  const watchedNames = activeList?.companies || [];
  const profileMap = new Map(companies.map(c => [c.name, c]));
  const totalEntries = lists.reduce((s, l) => s + l.companies.length, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Watchlists</h1>
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{lists.length} watchlist{lists.length !== 1 ? "s" : ""} · {totalEntries} compan{totalEntries !== 1 ? "ies" : "y"}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {lists.map(l => (
          <button key={l.id} onClick={() => setActive(l.id)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors"
            style={{ background: active === l.id ? "rgba(27,67,50,0.10)" : "var(--bg-surface)", color: active === l.id ? "var(--accent)" : "var(--text-secondary)", border: "1px solid rgba(0,0,0,0.08)" }}>
            <Star size={12} style={{ fill: active === l.id ? "var(--accent)" : "none" }} />
            {l.name} ({l.companies.length})
            {lists.length > 1 && (
              <span onClick={e => { e.stopPropagation(); removeList(l.id); }}
                className="ml-1 cursor-pointer hover:opacity-80 transition-opacity"
                style={{ color: "var(--text-secondary)" }}>
                <X size={10} />
              </span>
            )}
          </button>
        ))}
        <div className="flex items-center gap-1">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New watchlist..."
            className="px-2.5 py-2 rounded-lg text-xs outline-none w-40"
            style={{ background: "var(--bg-surface-alt)", color: "var(--text-primary)", border: "1px solid rgba(0,0,0,0.1)" }}
            onKeyDown={e => e.key === "Enter" && addList()} />
          <button onClick={addList} className="p-2 rounded-lg" style={{ background: "var(--accent)", color: "#FFFFFF" }}>
            <FolderPlus size={14} />
          </button>
        </div>
      </div>

      {watchedNames.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {watchedNames.map((name, i) => {
            const profile = profileMap.get(name);

            if (profile) {
              return (
                <div key={i}
                  onClick={() => navigate(`/company/${encodeURIComponent(profile.name)}`)}
                  className="rounded-lg p-4 cursor-pointer transition-all hover:-translate-y-0.5 relative group" style={card}>
                  <button
                    onClick={e => { e.stopPropagation(); if (activeList) removeFromWatchlist(name, activeList.id); }}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-80 transition-opacity"
                    style={{ color: "var(--text-secondary)" }}>
                    <X size={12} />
                  </button>
                  <div className="flex items-center justify-between pr-5">
                    <span className="font-serif text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{profile.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: profile.tier === "hot" ? "rgba(27,67,50,0.10)" : "rgba(0,0,0,0.04)", color: profile.tier === "hot" ? "var(--accent)" : "var(--text-secondary)" }}>
                      {profile.tier} {profile.score}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px]" style={{ color: "var(--text-secondary)" }}>
                    <span>{profile.signals.length} signals</span>
                    <span>{profile.sec_filings.length} filings</span>
                    <span>{profile.fetched_at?.slice(0, 10)}</span>
                  </div>
                  {profile.signals.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {profile.signals.slice(0, 3).map((s, j) => (
                        <div key={j} className="flex items-center gap-2 text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: s.confidence === "high" ? "var(--accent)" : s.confidence === "medium" ? "var(--accent-hover)" : "var(--text-secondary)" }} />
                          <span style={{ color: "var(--text-secondary)" }}>{s.signal_type.replace(/_/g, " ")}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={i} className="rounded-lg p-4 flex items-center gap-3 group" style={card}>
                <div className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center"
                  style={{ background: "rgba(27,67,50,0.06)" }}>
                  <Eye size={13} style={{ color: "var(--accent)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold font-serif truncate" style={{ color: "var(--text-primary)" }}>{name}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--text-secondary)" }}>Monitored · no dossier yet</p>
                </div>
                <button
                  onClick={() => { if (activeList) removeFromWatchlist(name, activeList.id); }}
                  className="shrink-0 opacity-30 group-hover:opacity-80 transition-opacity"
                  style={{ color: "var(--text-secondary)" }}>
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 rounded-xl" style={card}>
          <Star className="mx-auto mb-3" size={28} style={{ color: "var(--text-secondary)" }} />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No companies in this watchlist yet.</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
            Use the <strong style={{ color: "var(--text-primary)" }}>Monitor</strong> button on Deal Finder, Market Signals, or Healthcare to add companies here.
          </p>
        </div>
      )}
    </div>
  );
}
