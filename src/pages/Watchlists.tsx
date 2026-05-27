import { useState } from "react";
import { FolderPlus, Star, X } from "lucide-react";
import { useData } from "@/lib/DataContext";
import { useNavigate } from "react-router-dom";

const card = { background: "#132A1A", border: "1px solid rgba(212,197,169,0.12)" };

export default function Watchlists() {
  const { companies, watchlists } = useData();
  const navigate = useNavigate();
  const [active, setActive] = useState("1");
  const [newName, setNewName] = useState("");
  const [lists, setLists] = useState(watchlists);

  const addList = () => {
    if (!newName.trim()) return;
    setLists([...lists, { id: Date.now().toString(), name: newName, companies: [], created: new Date().toISOString().slice(0, 10) }]);
    setNewName("");
  };

  const removeList = (id: string) => setLists(lists.filter(l => l.id !== id));
  const activeList = lists.find(l => l.id === active);
  const activeCompanies = activeList ? companies.filter(c => activeList.companies.includes(c.name)) : [];

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold" style={{ color: "#F5F0E6" }}>Watchlists</h1>
          <p className="text-xs mt-1" style={{ color: "#8A7D6B" }}>{lists.length} watchlists · {activeCompanies.length} companies</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {lists.map(l => (
          <button key={l.id} onClick={() => setActive(l.id)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors"
            style={{ background: active === l.id ? "rgba(184,134,11,0.12)" : "#132A1A", color: active === l.id ? "#B8860B" : "#8A7D6B", border: "1px solid rgba(212,197,169,0.12)" }}>
            <Star size={12} style={{ fill: active === l.id ? "#B8860B" : "none" }} />
            {l.name} ({l.companies.length})
            {lists.length > 1 && (
              <span onClick={e => { e.stopPropagation(); removeList(l.id); }} className="ml-1 cursor-pointer hover:text-red-400"><X size={10} /></span>
            )}
          </button>
        ))}
        <div className="flex items-center gap-1">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New watchlist..."
            className="px-2.5 py-2 rounded-lg text-xs outline-none w-40"
            style={{ background: "#1A351F", color: "#F5F0E6", border: "1px solid rgba(212,197,169,0.15)" }}
            onKeyDown={e => e.key === "Enter" && addList()} />
          <button onClick={addList} className="p-2 rounded-lg" style={{ background: "#B8860B", color: "#0B1A0E" }}><FolderPlus size={14} /></button>
        </div>
      </div>

      {activeCompanies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activeCompanies.map((c, i) => (
            <div key={i} onClick={() => navigate(`/company/${encodeURIComponent(c.name)}`)}
              className="rounded-lg p-4 cursor-pointer transition-all hover:-translate-y-0.5" style={card}>
              <div className="flex items-center justify-between">
                <span className="font-serif text-sm font-semibold" style={{ color: "#F5F0E6" }}>{c.name}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: c.tier === "hot" ? "rgba(184,134,11,0.12)" : "rgba(212,197,169,0.06)", color: c.tier === "hot" ? "#B8860B" : "#8A7D6B" }}>
                  {c.tier} {c.score}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-2 text-[10px]" style={{ color: "#5A4D3A" }}>
                <span>{c.signals.length} signals</span>
                <span>{c.sec_filings.length} filings</span>
                <span>{c.fetched_at?.slice(0, 10)}</span>
              </div>
              {c.signals.length > 0 && (
                <div className="mt-2 space-y-1">
                  {c.signals.slice(0, 3).map((s, j) => (
                    <div key={j} className="flex items-center gap-2 text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.confidence === "high" ? "#B8860B" : s.confidence === "medium" ? "#4A7C59" : "#5A4D3A" }} />
                      <span style={{ color: "#8A7D6B" }}>{s.signal_type.replace(/_/g, " ")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-xl" style={card}>
          <Star className="mx-auto mb-3" size={28} style={{ color: "#5A4D3A" }} />
          <p className="text-sm" style={{ color: "#8A7D6B" }}>No companies in this watchlist yet.</p>
          <p className="text-xs mt-1" style={{ color: "#5A4D3A" }}>Search companies and add them from the dossier page.</p>
        </div>
      )}
    </div>
  );
}
