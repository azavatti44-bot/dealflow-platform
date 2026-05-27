import { useState, useCallback, useEffect } from "react";
import { FolderPlus, Star, X, Eye } from "lucide-react";
import { useData } from "@/lib/DataContext";
import { useNavigate } from "react-router-dom";

const card = { background: "#132A1A", border: "1px solid rgba(212,197,169,0.12)" };

export default function Watchlists() {
  const { companies, watchlists, removeFromWatchlist } = useData();
  const navigate = useNavigate();
  const [active, setActive] = useState<string>("");
  const [newName, setNewName] = useState("");
  const [lists, setLists] = useState(watchlists);

  // Sync local list state when context changes (e.g. addToWatchlist creates a new list)
  useEffect(() => { setLists(watchlists); }, [watchlists]);

  // Keep active valid whenever lists change
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
          <h1 className="font-serif text-2xl font-bold" style={{ color: "#F5F0E6" }}>Watchlists</h1>
          <p className="text-xs mt-1" style={{ color: "#8A7D6B" }}>{lists.length} watchlist{lists.length !== 1 ? "s" : ""} · {totalEntries} compan{totalEntries !== 1 ? "ies" : "y"}</p>
        </div>
      </div>

      {/* Tabs + new list input */}
      <div className="flex flex-wrap gap-2 items-center">
        {lists.map(l => (
          <button key={l.id} onClick={() => setActive(l.id)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors"
            style={{ background: active === l.id ? "rgba(184,134,11,0.12)" : "#132A1A", color: active === l.id ? "#B8860B" : "#8A7D6B", border: "1px solid rgba(212,197,169,0.12)" }}>
            <Star size={12} style={{ fill: active === l.id ? "#B8860B" : "none" }} />
            {l.name} ({l.companies.length})
            {lists.length > 1 && (
              <span onClick={e => { e.stopPropagation(); removeList(l.id); }}
                className="ml-1 cursor-pointer hover:opacity-80 transition-opacity"
                style={{ color: "#5A4D3A" }}>
                <X size={10} />
              </span>
            )}
          </button>
        ))}
        <div className="flex items-center gap-1">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New watchlist..."
            className="px-2.5 py-2 rounded-lg text-xs outline-none w-40"
            style={{ background: "#1A351F", color: "#F5F0E6", border: "1px solid rgba(212,197,169,0.15)" }}
            onKeyDown={e => e.key === "Enter" && addList()} />
          <button onClick={addList} className="p-2 rounded-lg" style={{ background: "#B8860B", color: "#0B1A0E" }}>
            <FolderPlus size={14} />
          </button>
        </div>
      </div>

      {/* Entries */}
      {watchedNames.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {watchedNames.map((name, i) => {
            const profile = profileMap.get(name);

            if (profile) {
              // Full dossier card — clickable
              return (
                <div key={i}
                  onClick={() => navigate(`/company/${encodeURIComponent(profile.name)}`)}
                  className="rounded-lg p-4 cursor-pointer transition-all hover:-translate-y-0.5 relative group" style={card}>
                  {/* Remove button (shows on hover) */}
                  <button
                    onClick={e => { e.stopPropagation(); if (activeList) removeFromWatchlist(name, activeList.id); }}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-80 transition-opacity"
                    style={{ color: "#5A4D3A" }}>
                    <X size={12} />
                  </button>
                  <div className="flex items-center justify-between pr-5">
                    <span className="font-serif text-sm font-semibold" style={{ color: "#F5F0E6" }}>{profile.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: profile.tier === "hot" ? "rgba(184,134,11,0.12)" : "rgba(212,197,169,0.06)", color: profile.tier === "hot" ? "#B8860B" : "#8A7D6B" }}>
                      {profile.tier} {profile.score}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px]" style={{ color: "#5A4D3A" }}>
                    <span>{profile.signals.length} signals</span>
                    <span>{profile.sec_filings.length} filings</span>
                    <span>{profile.fetched_at?.slice(0, 10)}</span>
                  </div>
                  {profile.signals.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {profile.signals.slice(0, 3).map((s, j) => (
                        <div key={j} className="flex items-center gap-2 text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: s.confidence === "high" ? "#B8860B" : s.confidence === "medium" ? "#4A7C59" : "#5A4D3A" }} />
                          <span style={{ color: "#8A7D6B" }}>{s.signal_type.replace(/_/g, " ")}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            // Lightweight entry — no dossier yet
            return (
              <div key={i} className="rounded-lg p-4 flex items-center gap-3 group" style={card}>
                <div className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center"
                  style={{ background: "rgba(184,134,11,0.08)" }}>
                  <Eye size={13} style={{ color: "#B8860B" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold font-serif truncate" style={{ color: "#F5F0E6" }}>{name}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#5A4D3A" }}>Monitored · no dossier yet</p>
                </div>
                <button
                  onClick={() => { if (activeList) removeFromWatchlist(name, activeList.id); }}
                  className="shrink-0 opacity-30 group-hover:opacity-80 transition-opacity"
                  style={{ color: "#8A7D6B" }}>
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 rounded-xl" style={card}>
          <Star className="mx-auto mb-3" size={28} style={{ color: "#5A4D3A" }} />
          <p className="text-sm" style={{ color: "#8A7D6B" }}>No companies in this watchlist yet.</p>
          <p className="text-xs mt-1" style={{ color: "#5A4D3A" }}>
            Use the <strong style={{ color: "#F5F0E6" }}>Monitor</strong> button on Deal Finder, Market Signals, or Healthcare to add companies here.
          </p>
        </div>
      )}
    </div>
  );
}
