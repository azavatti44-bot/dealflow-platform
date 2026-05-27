import { useState } from "react";
import { Briefcase, Users, Star, MapPin, TrendingUp } from "lucide-react";

const card = { background: "#132A1A", border: "1px solid rgba(212,197,169,0.12)" };

interface Advisor {
  id: string; name: string; category: string; specialty: string; location: string;
  deals_12m: number; tier: string; rating: number; contacts: { name: string; role: string }[];
}

const ADVISORS: Advisor[] = [
  { id: "1", name: "Goldman Sachs & Co", category: "Investment Bank", specialty: "M&A — Mid-Market Industrials", location: "New York, NY", deals_12m: 47, tier: "bulge", rating: 4.8, contacts: [{ name: "Sarah Mitchell", role: "MD, Industrials" }, { name: "David Chen", role: "VP, Services" }] },
  { id: "2", name: "Jefferies LLC", category: "Investment Bank", specialty: "Middle-Market M&A", location: "New York, NY", deals_12m: 62, tier: "elite", rating: 4.6, contacts: [{ name: "Michael Torres", role: "MD, Sponsors" }] },
  { id: "3", name: "Houlihan Lokey", category: "Investment Bank", specialty: "Financial Advisory", location: "Los Angeles, CA", deals_12m: 38, tier: "elite", rating: 4.7, contacts: [{ name: "Jennifer Walsh", role: "MD, Corp Fin" }] },
  { id: "4", name: "Lincoln International", category: "Investment Bank", specialty: "Mid-Market, Founder Exits", location: "Chicago, IL", deals_12m: 29, tier: "elite", rating: 4.5, contacts: [{ name: "Robert Klein", role: "Managing Director" }] },
  { id: "5", name: "Piper Sandler", category: "Investment Bank", specialty: "Business Services", location: "Minneapolis, MN", deals_12m: 24, tier: "elite", rating: 4.4, contacts: [{ name: "Amanda Foster", role: "MD, Services" }] },
  { id: "6", name: "KPMG Corporate Finance", category: "Big 4", specialty: "Due Diligence", location: "New York, NY", deals_12m: 31, tier: "bulge", rating: 4.3, contacts: [{ name: "James Park", role: "Partner" }] },
  { id: "7", name: "Deloitte Corporate Finance", category: "Big 4", specialty: "M&A, Carve-Outs", location: "Chicago, IL", deals_12m: 28, tier: "bulge", rating: 4.5, contacts: [{ name: "Lisa Monroe", role: "Principal" }] },
  { id: "8", name: "Founders Advisors", category: "Boutique", specialty: "Founder-Led Sales", location: "Birmingham, AL", deals_12m: 12, tier: "boutique", rating: 4.6, contacts: [{ name: "Tom Bradley", role: "Founding Partner" }] },
  { id: "9", name: "Berkery Noyes", category: "Boutique", specialty: "Info & Software M&A", location: "New York, NY", deals_12m: 15, tier: "boutique", rating: 4.4, contacts: [{ name: "Martin Berkery", role: "Managing Partner" }] },
  { id: "10", name: "Matrix Capital", category: "Boutique", specialty: "Insurance Distribution", location: "Dallas, TX", deals_12m: 18, tier: "boutique", rating: 4.5, contacts: [{ name: "Chris Hendricks", role: "MD" }] },
];

const tierBadge = (t: string) => {
  const m: Record<string, { bg: string; text: string }> = {
    bulge: { bg: "rgba(184,134,11,0.12)", text: "#B8860B" },
    elite: { bg: "rgba(74,124,89,0.12)", text: "#4A7C59" },
    boutique: { bg: "rgba(212,197,169,0.06)", text: "#8A7D6B" },
  };
  return m[t] || m.boutique;
};

export default function AdvisorGraph() {
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const categories = ["all", "Investment Bank", "Big 4", "Boutique"];
  const filtered = ADVISORS.filter(a => filter === "all" || a.category === filter);
  const totalDeals = ADVISORS.reduce((s, a) => s + a.deals_12m, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-4">
      <div>
        <h1 className="font-serif text-2xl font-bold" style={{ color: "#F5F0E6" }}>Advisor Network</h1>
        <p className="text-xs mt-1" style={{ color: "#8A7D6B" }}>{ADVISORS.length} firms · {totalDeals} deals (12M)</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Briefcase, label: "Advisors", value: ADVISORS.length },
          { icon: TrendingUp, label: "Deals (12M)", value: totalDeals },
          { icon: Star, label: "Avg Rating", value: "4.5" },
          { icon: Users, label: "Contacts", value: ADVISORS.reduce((s, a) => s + a.contacts.length, 0) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-lg p-3 text-center" style={card}>
            <Icon className="mx-auto mb-1" size={16} style={{ color: "#B8860B" }} />
            <p className="text-lg font-bold font-mono" style={{ color: "#F5F0E6" }}>{value}</p>
            <p className="text-[10px]" style={{ color: "#8A7D6B" }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className="px-3 py-1.5 rounded-full text-xs transition-colors"
            style={filter === c ? { background: "#B8860B", color: "#0B1A0E", fontWeight: 600 } : { background: "#1A351F", color: "#8A7D6B", border: "1px solid rgba(212,197,169,0.1)" }}>
            {c === "all" ? "All" : c}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(a => (
          <div key={a.id} onClick={() => setExpanded(expanded === a.id ? null : a.id)}
            className="rounded-lg p-4 cursor-pointer transition-all" style={card}>
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-serif text-base font-semibold" style={{ color: "#F5F0E6" }}>{a.name}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: tierBadge(a.tier).bg, color: tierBadge(a.tier).text }}>{a.tier}</span>
                </div>
                <p className="text-xs mt-1" style={{ color: "#8A7D6B" }}>{a.specialty}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px]" style={{ color: "#5A4D3A" }}>
                  <span className="flex items-center gap-1"><MapPin size={10} />{a.location}</span>
                  <span className="flex items-center gap-1"><TrendingUp size={10} />{a.deals_12m} deals</span>
                  <span className="flex items-center gap-1"><Star size={10} />{a.rating}</span>
                  <span className="flex items-center gap-1"><Users size={10} />{a.contacts.length} contacts</span>
                </div>
              </div>
            </div>
            {expanded === a.id && (
              <div className="mt-4 pt-4 grid grid-cols-1 md:grid-cols-2 gap-2" style={{ borderTop: "1px solid rgba(212,197,169,0.08)" }}>
                {a.contacts.map((c, i) => (
                  <div key={i} className="rounded-md p-3" style={{ background: "#1A351F" }}>
                    <p className="text-sm font-medium" style={{ color: "#F5F0E6" }}>{c.name}</p>
                    <p className="text-[10px]" style={{ color: "#8A7D6B" }}>{c.role}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
