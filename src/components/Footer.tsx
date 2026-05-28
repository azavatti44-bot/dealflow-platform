import { FileText, Scale, Lightbulb, Building, Activity, Database } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t" style={{ background: "#F0EDE5", borderColor: "rgba(0,0,0,0.08)" }}>
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-bold text-sm tracking-tight" style={{ color: "#1A2416" }}>DEALNEXA</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]"></span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "#64748B" }}>Signal intelligence for proprietary deal sourcing. Saint Thomas Capital Partners.</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#1A2416" }}>Platform</h4>
            <ul className="space-y-2">
              <li><span className="text-xs cursor-pointer transition-colors" style={{ color: "#64748B" }}>Company Search</span></li>
              <li><span className="text-xs cursor-pointer transition-colors" style={{ color: "#64748B" }}>Signal Engine</span></li>
              <li><span className="text-xs cursor-pointer transition-colors" style={{ color: "#64748B" }}>Outreach Hub</span></li>
              <li><span className="text-xs cursor-pointer transition-colors" style={{ color: "#64748B" }}>API Console</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#1A2416" }}>Data Sources</h4>
            <ul className="space-y-2">
              {[{icon: FileText, label: "SEC EDGAR"}, {icon: Scale, label: "CourtListener"}, {icon: Lightbulb, label: "USPTO"}, {icon: Building, label: "OpenCorporates"}, {icon: Activity, label: "State Filings"}, {icon: Database, label: "Census/BLS"}].map(({icon: Icon, label}) => (
                <li key={label} className="flex items-center gap-1.5"><Icon size={10} style={{ color: "#94A3B8" }} /><span className="text-xs" style={{ color: "#64748B" }}>{label}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#1A2416" }}>Resources</h4>
            <ul className="space-y-2">
              <li><span className="text-xs cursor-pointer transition-colors" style={{ color: "#64748B" }}>Signal Library</span></li>
              <li><span className="text-xs cursor-pointer transition-colors" style={{ color: "#64748B" }}>Documentation</span></li>
              <li><span className="text-xs cursor-pointer transition-colors" style={{ color: "#64748B" }}>API Status</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#1A2416" }}>Company</h4>
            <ul className="space-y-2">
              <li><span className="text-xs cursor-pointer transition-colors" style={{ color: "#64748B" }}>About STC</span></li>
              <li><span className="text-xs cursor-pointer transition-colors" style={{ color: "#64748B" }}>Contact</span></li>
              <li><span className="text-xs cursor-pointer transition-colors" style={{ color: "#64748B" }}>Privacy</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          <p className="text-[10px]" style={{ color: "#94A3B8" }}>2026 Saint Thomas Capital Partners. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="text-[10px] cursor-pointer" style={{ color: "#94A3B8" }}>Privacy Policy</span>
            <span className="text-[10px] cursor-pointer" style={{ color: "#94A3B8" }}>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
