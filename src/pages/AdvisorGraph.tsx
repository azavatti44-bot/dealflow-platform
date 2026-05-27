import { useState } from "react";
import { Briefcase, Users, MapPin, Plus, X, ChevronDown, ChevronUp, Trash2, Phone, Mail } from "lucide-react";

const card = { background: "#132A1A", border: "1px solid rgba(212,197,169,0.12)" };
const input = { background: "#1A351F", color: "#F5F0E6", border: "1px solid rgba(212,197,169,0.15)" };

interface Contact { name: string; role: string; email: string; phone: string; }
interface Advisor {
  id: string; name: string; category: string; specialty: string; location: string;
  notes: string; contacts: Contact[]; added: string;
}

const CATEGORIES = ["Investment Bank", "Boutique IB", "Big 4 / Accounting", "Law Firm", "Lender / Debt", "Operating Partner", "Other"];
const STORAGE_KEY = "stc_advisors";

function load(): Advisor[] {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}
function save(advisors: Advisor[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(advisors)); } catch {}
}

const emptyAdvisor = () => ({ id: "", name: "", category: CATEGORIES[0], specialty: "", location: "", notes: "", contacts: [], added: "" });
const emptyContact = (): Contact => ({ name: "", role: "", email: "", phone: "" });

export default function AdvisorGraph() {
  const [advisors, setAdvisors] = useState<Advisor[]>(load);
  const [filter, setFilter] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Advisor, "id" | "added">>(emptyAdvisor());
  const [contactDraft, setContactDraft] = useState<Contact>(emptyContact());
  const [addingContactFor, setAddingContactFor] = useState<string | null>(null);

  const categories = ["All", ...CATEGORIES];
  const filtered = advisors.filter(a => filter === "All" || a.category === filter);

  function persist(next: Advisor[]) { setAdvisors(next); save(next); }

  function addAdvisor() {
    if (!form.name.trim()) return;
    const next = [{ ...form, id: Date.now().toString(), added: new Date().toISOString().slice(0, 10) }, ...advisors];
    persist(next);
    setForm(emptyAdvisor());
    setShowForm(false);
  }

  function removeAdvisor(id: string) { persist(advisors.filter(a => a.id !== id)); }

  function addContact(advisorId: string) {
    if (!contactDraft.name.trim()) return;
    const next = advisors.map(a => a.id === advisorId ? { ...a, contacts: [...a.contacts, { ...contactDraft }] } : a);
    persist(next);
    setContactDraft(emptyContact());
    setAddingContactFor(null);
  }

  function removeContact(advisorId: string, idx: number) {
    const next = advisors.map(a => a.id === advisorId ? { ...a, contacts: a.contacts.filter((_, i) => i !== idx) } : a);
    persist(next);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg" style={{ background: "rgba(184,134,11,0.1)" }}>
            <Briefcase size={20} style={{ color: "#B8860B" }} />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold" style={{ color: "#F5F0E6" }}>Advisor Network</h1>
            <p className="text-xs mt-0.5" style={{ color: "#8A7D6B" }}>
              {advisors.length} firm{advisors.length !== 1 ? "s" : ""} · {advisors.reduce((s, a) => s + a.contacts.length, 0)} contacts
            </p>
          </div>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
          style={{ background: "#B8860B", color: "#0B1A0E" }}>
          <Plus size={13} /> Add Advisor
        </button>
      </div>

      {/* Add advisor form */}
      {showForm && (
        <div className="rounded-xl p-5 space-y-4" style={card}>
          <p className="text-xs font-semibold" style={{ color: "#F5F0E6" }}>New Advisor</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5A4D3A" }}>Firm Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Lincoln International"
                className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={input} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5A4D3A" }}>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={input}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5A4D3A" }}>Specialty / Focus</label>
              <input value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
                placeholder="e.g. Founder-led LMM exits, Business Services"
                className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={input} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5A4D3A" }}>Location</label>
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Chicago, IL"
                className="w-full px-3 py-2 rounded-lg text-xs outline-none" style={input} />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5A4D3A" }}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Deal flow quality, relationship history, sectors they cover..."
                rows={2} className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none" style={input} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addAdvisor} disabled={!form.name.trim()}
              className="px-5 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
              style={{ background: "#B8860B", color: "#0B1A0E" }}>
              Save Advisor
            </button>
            <button onClick={() => { setShowForm(false); setForm(emptyAdvisor()); }}
              className="px-4 py-2 rounded-lg text-xs"
              style={{ background: "#1A351F", color: "#8A7D6B", border: "1px solid rgba(212,197,169,0.1)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className="px-3 py-1.5 rounded-full text-xs transition-colors"
            style={filter === c
              ? { background: "#B8860B", color: "#0B1A0E", fontWeight: 600 }
              : { background: "#1A351F", color: "#8A7D6B", border: "1px solid rgba(212,197,169,0.1)" }}>
            {c}
          </button>
        ))}
      </div>

      {/* Advisor list */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map(a => (
            <div key={a.id} className="rounded-lg" style={card}>
              {/* Main row */}
              <div className="p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif text-base font-semibold" style={{ color: "#F5F0E6" }}>{a.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: "rgba(184,134,11,0.1)", color: "#B8860B" }}>{a.category}</span>
                  </div>
                  {a.specialty && <p className="text-xs mt-0.5" style={{ color: "#8A7D6B" }}>{a.specialty}</p>}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px]" style={{ color: "#5A4D3A" }}>
                    {a.location && <span className="flex items-center gap-1"><MapPin size={10} />{a.location}</span>}
                    <span className="flex items-center gap-1"><Users size={10} />{a.contacts.length} contact{a.contacts.length !== 1 ? "s" : ""}</span>
                    <span>Added {a.added}</span>
                  </div>
                  {a.notes && <p className="text-[11px] mt-2 italic" style={{ color: "#5A4D3A" }}>{a.notes}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                    className="p-1.5 rounded-md transition-colors"
                    style={{ color: "#8A7D6B" }}>
                    {expanded === a.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <button onClick={() => removeAdvisor(a.id)}
                    className="p-1.5 rounded-md transition-colors hover:opacity-80"
                    style={{ color: "#5A4D3A" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Expanded contacts panel */}
              {expanded === a.id && (
                <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid rgba(212,197,169,0.08)" }}>
                  <div className="pt-3 flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5A4D3A" }}>Contacts</p>
                    <button onClick={() => setAddingContactFor(addingContactFor === a.id ? null : a.id)}
                      className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-md"
                      style={{ background: "rgba(184,134,11,0.1)", color: "#B8860B" }}>
                      <Plus size={10} /> Add Contact
                    </button>
                  </div>

                  {/* Add contact form */}
                  {addingContactFor === a.id && (
                    <div className="rounded-lg p-3 space-y-2" style={{ background: "#0F2214", border: "1px solid rgba(212,197,169,0.08)" }}>
                      <div className="grid grid-cols-2 gap-2">
                        <input value={contactDraft.name} onChange={e => setContactDraft(c => ({ ...c, name: e.target.value }))}
                          placeholder="Full name *" className="px-2.5 py-1.5 rounded-md text-xs outline-none" style={input} />
                        <input value={contactDraft.role} onChange={e => setContactDraft(c => ({ ...c, role: e.target.value }))}
                          placeholder="Title / role" className="px-2.5 py-1.5 rounded-md text-xs outline-none" style={input} />
                        <input value={contactDraft.email} onChange={e => setContactDraft(c => ({ ...c, email: e.target.value }))}
                          placeholder="Email" className="px-2.5 py-1.5 rounded-md text-xs outline-none" style={input} />
                        <input value={contactDraft.phone} onChange={e => setContactDraft(c => ({ ...c, phone: e.target.value }))}
                          placeholder="Phone" className="px-2.5 py-1.5 rounded-md text-xs outline-none" style={input} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => addContact(a.id)} disabled={!contactDraft.name.trim()}
                          className="px-3 py-1 rounded-md text-[10px] font-semibold disabled:opacity-50"
                          style={{ background: "#B8860B", color: "#0B1A0E" }}>Save</button>
                        <button onClick={() => { setAddingContactFor(null); setContactDraft(emptyContact()); }}
                          className="px-3 py-1 rounded-md text-[10px]"
                          style={{ background: "#1A351F", color: "#8A7D6B" }}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {/* Contact cards */}
                  {a.contacts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {a.contacts.map((c, i) => (
                        <div key={i} className="rounded-md p-3 flex items-start justify-between gap-2"
                          style={{ background: "#1A351F" }}>
                          <div className="min-w-0">
                            <p className="text-sm font-medium" style={{ color: "#F5F0E6" }}>{c.name}</p>
                            {c.role && <p className="text-[10px]" style={{ color: "#8A7D6B" }}>{c.role}</p>}
                            <div className="flex flex-wrap gap-2 mt-1.5">
                              {c.email && (
                                <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-[10px] hover:opacity-80"
                                  style={{ color: "#B8860B" }}>
                                  <Mail size={9} />{c.email}
                                </a>
                              )}
                              {c.phone && (
                                <span className="flex items-center gap-1 text-[10px]" style={{ color: "#5A4D3A" }}>
                                  <Phone size={9} />{c.phone}
                                </span>
                              )}
                            </div>
                          </div>
                          <button onClick={() => removeContact(a.id, i)}
                            className="shrink-0 opacity-40 hover:opacity-80 transition-opacity"
                            style={{ color: "#8A7D6B" }}>
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] py-2" style={{ color: "#5A4D3A" }}>No contacts yet — click Add Contact above.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl py-20 text-center" style={card}>
          <Briefcase size={32} className="mx-auto mb-3 opacity-20" style={{ color: "#B8860B" }} />
          <p className="text-sm" style={{ color: "#8A7D6B" }}>
            {advisors.length === 0 ? "No advisors added yet." : "No advisors in this category."}
          </p>
          {advisors.length === 0 && (
            <button onClick={() => setShowForm(true)}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold mx-auto"
              style={{ background: "#B8860B", color: "#0B1A0E" }}>
              <Plus size={13} /> Add Your First Advisor
            </button>
          )}
        </div>
      )}
    </div>
  );
}
