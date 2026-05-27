import { useState } from "react";
import { Send, Copy, Check, Mail, Clock, Zap, TrendingUp } from "lucide-react";

interface Template { id: string; name: string; category: string; signal_trigger: string; subject: string; body: string; channel: string; usage_count: number; conversion_rate: string; }

const TEMPLATES: Template[] = [
  { id: "1", name: "Executive Departure", category: "Signal-Triggered", signal_trigger: "key_executive_departure", subject: "Thoughts on the recent leadership transition at {{company}}", body: "Hi {{first_name}},\n\nI noticed the recent {{role}} departure at {{company}}. Leadership transitions often prompt boards to evaluate strategic alternatives — especially when paired with a strong operational foundation.\n\nWe've helped several companies in {{industry}} navigate similar transitions, including two that resulted in successful exits at premium multiples.\n\nWorth a brief conversation?\n\nBest,\nThomas", channel: "email", usage_count: 24, conversion_rate: "18%" },
  { id: "2", name: "Auditor Change", category: "Signal-Triggered", signal_trigger: "advisor_engagement", subject: "Auditor changes often signal preparation for transaction", body: "Hi {{first_name}},\n\nThe auditor change at {{company}} (Item 4.01) caught our attention. In our experience, this frequently precedes a QoE engagement and formal sale process.\n\nSaint Thomas Capital Partners specializes in founder-led and family-owned business exits in the {{industry}} space.\n\nIf the company is exploring strategic options, I'd welcome the opportunity to discuss how we can help maximize value.\n\nRegards,\nThomas", channel: "email", usage_count: 31, conversion_rate: "22%" },
  { id: "3", name: "8-K Elevated Activity", category: "Signal-Triggered", signal_trigger: "elevated_filing_activity", subject: "{{company}} — observing increased disclosure activity", body: "Hi {{first_name}},\n\nWe've been tracking {{company}}'s recent SEC filings — {{count}} 8-Ks in the past several months suggests significant corporate activity.\n\nThis pattern often correlates with companies preparing for or executing strategic transactions.\n\nI'd welcome a brief call to share what we're seeing across the {{industry}} landscape.\n\nBest,\nThomas", channel: "email", usage_count: 18, conversion_rate: "14%" },
  { id: "4", name: "Bankruptcy Opportunity", category: "Signal-Triggered", signal_trigger: "bankruptcy_filing", subject: "Distressed opportunity: {{company}}", body: "Hi {{first_name}},\n\nI'm reaching out regarding {{company}}'s recent Chapter 11 filing. Saint Thomas Capital has extensive experience advising on distressed M&A and 363 sales.\n\nWe've successfully closed 8 distressed transactions in the past 24 months. Time is critical in these situations.\n\nAre you available for a call this week?\n\nThomas", channel: "email", usage_count: 12, conversion_rate: "28%" },
  { id: "5", name: "No New Patents", category: "Signal-Triggered", signal_trigger: "no_new_ip_filings", subject: "Noticing R&D consolidation at {{company}}", body: "Hi {{first_name}},\n\nOur analysis shows {{company}} hasn't filed new patents in 24+ months. This often indicates a strategic pivot — companies frequently streamline R&D ahead of focusing on monetization or exit.\n\nWe've helped several technology companies transition from growth mode to exit readiness.\n\nBest,\nThomas", channel: "email", usage_count: 9, conversion_rate: "11%" },
  { id: "6", name: "M&A Litigation", category: "Signal-Triggered", signal_trigger: "ma_litigation", subject: "M&A litigation support for {{company}}", body: "Hi {{first_name}},\n\nI saw the litigation activity around {{company}}'s pending transaction. These situations require careful navigation to preserve deal value.\n\nOur team has advised on 15+ contested M&A situations.\n\nCan we discuss how we might support your position?\n\nThomas", channel: "email", usage_count: 7, conversion_rate: "20%" },
  { id: "7", name: "Officer Changes (SOS)", category: "Signal-Triggered", signal_trigger: "officer_changes_detected", subject: "Recent officer changes at {{company}}", body: "Hi {{first_name}},\n\nState records indicate recent officer changes at {{company}} — particularly in key financial and operating roles. This pattern often coincides with ownership transitions or sale preparation.\n\nIf there's a transaction in process or under consideration, we'd welcome the opportunity to discuss.\n\nBest,\nThomas", channel: "email", usage_count: 15, conversion_rate: "16%" },
  { id: "8", name: "Schedule 13D", category: "Signal-Triggered", signal_trigger: "change_of_control", subject: "13D filing — strategic implications for {{company}}", body: "Hi {{first_name}},\n\nThe Schedule 13D filing for {{company}} indicates an activist or strategic investor has crossed the 5% threshold. This frequently catalyzes strategic reviews.\n\nWe've advised targets and buyers in activist-driven situations.\n\nWorth a conversation?\n\nThomas", channel: "email", usage_count: 11, conversion_rate: "25%" },
];

const card = { background: "#132A1A", border: "1px solid rgba(212,197,169,0.12)" };

export default function OutreachHub() {
  const [selected, setSelected] = useState<Template | null>(null);
  const [filter, setFilter] = useState("all");
  const [copied, setCopied] = useState(false);
  const categories = ["all", "Signal-Triggered"];
  const filtered = TEMPLATES.filter(t => filter === "all" || t.category === filter);

  const copy = (text: string) => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };
  const totalSent = TEMPLATES.reduce((s, t) => s + t.usage_count, 0);
  const avgConv = (TEMPLATES.reduce((s, t) => s + parseFloat(t.conversion_rate), 0) / TEMPLATES.length).toFixed(1);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-4">
      <div>
        <h1 className="font-serif text-2xl font-bold" style={{ color: "#F5F0E6" }}>Outreach Hub</h1>
        <p className="text-xs mt-1" style={{ color: "#8A7D6B" }}>Signal-triggered email templates</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Send, label: "Templates", value: TEMPLATES.length },
          { icon: Mail, label: "Sent (All Time)", value: totalSent },
          { icon: TrendingUp, label: "Avg Conversion", value: `${avgConv}%` },
          { icon: Zap, label: "Signal Triggers", value: 8 },
        ].map(s => (
          <div key={s.label} className="rounded-lg p-3 text-center" style={card}>
            <s.icon className="mx-auto mb-1" size={16} style={{ color: "#B8860B" }} />
            <p className="text-lg font-bold font-mono" style={{ color: "#F5F0E6" }}>{s.value}</p>
            <p className="text-[10px]" style={{ color: "#8A7D6B" }}>{s.label}</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {filtered.map(t => (
          <div key={t.id} onClick={() => setSelected(t)}
            className="rounded-lg p-4 cursor-pointer transition-all hover:-translate-y-0.5" style={card}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Mail size={13} style={{ color: "#B8860B" }} />
                <h3 className="text-sm font-semibold" style={{ color: "#F5F0E6" }}>{t.name}</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(184,134,11,0.1)", color: "#B8860B" }}>{t.channel}</span>
            </div>
            <p className="text-xs line-clamp-2 mb-2" style={{ color: "#8A7D6B" }}>{t.subject}</p>
            <div className="flex items-center gap-3 text-[10px]" style={{ color: "#5A4D3A" }}>
              <span className="flex items-center gap-1"><Send size={9} />{t.usage_count}</span>
              <span className="flex items-center gap-1"><TrendingUp size={9} />{t.conversion_rate}</span>
              <span className="flex items-center gap-1" style={{ color: "#B8860B" }}><Zap size={9} />{t.signal_trigger.replace(/_/g, " ")}</span>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setSelected(null)}>
          <div className="rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6" style={{ background: "#132A1A", border: "1px solid rgba(212,197,169,0.2)" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold font-serif" style={{ color: "#F5F0E6" }}>{selected.name}</h2>
              <button onClick={() => setSelected(null)} className="text-xs" style={{ color: "#8A7D6B" }}>Close</button>
            </div>

            {selected.subject && (
              <div className="rounded-lg p-3 mb-3" style={{ background: "#1A351F" }}>
                <p className="text-[10px] mb-1" style={{ color: "#5A4D3A" }}>Subject</p>
                <p className="text-sm font-mono" style={{ color: "#F5F0E6" }}>{selected.subject}</p>
              </div>
            )}

            <div className="rounded-lg p-4 mb-4" style={{ background: "#1A351F" }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px]" style={{ color: "#5A4D3A" }}>Body</p>
                <button onClick={() => copy(selected.body)} className="text-[10px] flex items-center gap-1" style={{ color: "#B8860B" }}>
                  {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                </button>
              </div>
              <pre className="text-sm whitespace-pre-wrap" style={{ color: "#8A7D6B", fontFamily: "Inter, sans-serif", lineHeight: 1.6 }}>{selected.body}</pre>
            </div>

            <div className="flex items-center gap-4 text-[10px]" style={{ color: "#5A4D3A" }}>
              <span className="flex items-center gap-1"><Send size={11} />{selected.usage_count} used</span>
              <span className="flex items-center gap-1"><TrendingUp size={11} />{selected.conversion_rate} conv</span>
              <span className="flex items-center gap-1"><Clock size={11} />~3 min</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
