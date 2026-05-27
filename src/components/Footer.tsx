import { FileText, Scale, Lightbulb, Building, Activity, Database } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t" style={{ background: "#111111", borderColor: "rgba(255,255,255,0.08)" }}>
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[#f5f5f5] font-bold text-sm tracking-tight">DEALNEXA</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]"></span>
            </div>
            <p className="text-xs text-[#888] leading-relaxed">Signal intelligence for proprietary deal sourcing. Saint Thomas Capital Partners.</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[#f5f5f5] uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2">
              <li><span className="text-xs text-[#888] hover:text-[#f5f5f5] cursor-pointer transition-colors">Company Search</span></li>
              <li><span className="text-xs text-[#888] hover:text-[#f5f5f5] cursor-pointer transition-colors">Signal Engine</span></li>
              <li><span className="text-xs text-[#888] hover:text-[#f5f5f5] cursor-pointer transition-colors">Outreach Hub</span></li>
              <li><span className="text-xs text-[#888] hover:text-[#f5f5f5] cursor-pointer transition-colors">API Console</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[#f5f5f5] uppercase tracking-wider mb-3">Data Sources</h4>
            <ul className="space-y-2">
              {[{icon: FileText, label: "SEC EDGAR"}, {icon: Scale, label: "CourtListener"}, {icon: Lightbulb, label: "USPTO"}, {icon: Building, label: "OpenCorporates"}, {icon: Activity, label: "State Filings"}, {icon: Database, label: "Census/BLS"}].map(({icon: Icon, label}) => (
                <li key={label} className="flex items-center gap-1.5"><Icon size={10} className="text-[#555]" /><span className="text-xs text-[#888]">{label}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[#f5f5f5] uppercase tracking-wider mb-3">Resources</h4>
            <ul className="space-y-2">
              <li><span className="text-xs text-[#888] hover:text-[#f5f5f5] cursor-pointer transition-colors">Signal Library</span></li>
              <li><span className="text-xs text-[#888] hover:text-[#f5f5f5] cursor-pointer transition-colors">Documentation</span></li>
              <li><span className="text-xs text-[#888] hover:text-[#f5f5f5] cursor-pointer transition-colors">API Status</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[#f5f5f5] uppercase tracking-wider mb-3">Company</h4>
            <ul className="space-y-2">
              <li><span className="text-xs text-[#888] hover:text-[#f5f5f5] cursor-pointer transition-colors">About STC</span></li>
              <li><span className="text-xs text-[#888] hover:text-[#f5f5f5] cursor-pointer transition-colors">Contact</span></li>
              <li><span className="text-xs text-[#888] hover:text-[#f5f5f5] cursor-pointer transition-colors">Privacy</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <p className="text-[10px] text-[#555]">2026 Saint Thomas Capital Partners. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="text-[10px] text-[#555] hover:text-[#888] cursor-pointer">Privacy Policy</span>
            <span className="text-[10px] text-[#555] hover:text-[#888] cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
