import { FileText, Scale, Lightbulb, Building, Activity, Database } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t" style={{ background: "var(--bg-surface-alt)", borderColor: "rgba(0,0,0,0.07)" }}>
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-bold text-sm tracking-tight" style={{ color: "var(--text-primary)" }}>DEALNEXA</span>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }}></span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>Signal intelligence for proprietary deal sourcing. Saint Thomas Capital Partners.</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-primary)" }}>Platform</h4>
            <ul className="space-y-2">
              <li><span className="text-xs cursor-pointer transition-colors" style={{ color: "var(--text-secondary)" }}>Company Search</span></li>
              <li><span className="text-xs cursor-pointer transition-colors" style={{ color: "var(--text-secondary)" }}>Signal Engine</span></li>
              <li><span className="text-xs cursor-pointer transition-colors" style={{ color: "var(--text-secondary)" }}>Outreach Hub</span></li>
              <li><span className="text-xs cursor-pointer transition-colors" style={{ color: "var(--text-secondary)" }}>API Console</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-primary)" }}>Data Sources</h4>
            <ul className="space-y-2">
              {[{icon: FileText, label: "SEC EDGAR"}, {icon: Scale, label: "CourtListener"}, {icon: Lightbulb, label: "USPTO"}, {icon: Building, label: "OpenCorporates"}, {icon: Activity, label: "State Filings"}, {icon: Database, label: "Census/BLS"}].map(({icon: Icon, label}) => (
                <li key={label} className="flex items-center gap-1.5"><Icon size={10} style={{ color: "#A8A29E" }} /><span className="text-xs" style={{ color: "var(--text-secondary)" }}>{label}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-primary)" }}>Resources</h4>
            <ul className="space-y-2">
              <li><span className="text-xs cursor-pointer transition-colors" style={{ color: "var(--text-secondary)" }}>Signal Library</span></li>
              <li><span className="text-xs cursor-pointer transition-colors" style={{ color: "var(--text-secondary)" }}>Documentation</span></li>
              <li><span className="text-xs cursor-pointer transition-colors" style={{ color: "var(--text-secondary)" }}>API Status</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-primary)" }}>Company</h4>
            <ul className="space-y-2">
              <li><span className="text-xs cursor-pointer transition-colors" style={{ color: "var(--text-secondary)" }}>About STC</span></li>
              <li><span className="text-xs cursor-pointer transition-colors" style={{ color: "var(--text-secondary)" }}>Contact</span></li>
              <li><span className="text-xs cursor-pointer transition-colors" style={{ color: "var(--text-secondary)" }}>Privacy</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
          <p className="text-[10px]" style={{ color: "#A8A29E" }}>2026 Saint Thomas Capital Partners. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="text-[10px] cursor-pointer" style={{ color: "#A8A29E" }}>Privacy Policy</span>
            <span className="text-[10px] cursor-pointer" style={{ color: "#A8A29E" }}>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
