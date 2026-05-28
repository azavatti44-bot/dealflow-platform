import { useState } from "react";
import { Loader2, Eye, EyeOff, TrendingUp, Shield, Zap } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const inputStyle = {
  background: "#F0EDE5",
  color: "#1A2416",
  border: "1px solid rgba(0,0,0,0.1)",
};

const features = [
  { icon: TrendingUp, text: "Reg D & EDGAR deal signals in real time" },
  { icon: Shield,     text: "Your pipeline stays private to your account" },
  { icon: Zap,        text: "7.5M+ healthcare practice targets" },
];

export default function Landing() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode]         = useState<"login" | "signup">("login");
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  function switchMode(m: "login" | "signup") {
    setMode(m);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result =
      mode === "login"
        ? await signIn(email, password)
        : await signUp(name, email, password);
    setLoading(false);
    if (result.error) setError(result.error);
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#F7F5EF", color: "#1A2416" }}>

      {/* ── Left branding panel (desktop only) ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-14"
        style={{ borderRight: "1px solid rgba(0,0,0,0.05)" }}
      >
        {/* Logo */}
        <div>
          <div className="flex items-center gap-2.5">
            <span className="font-serif text-2xl font-bold tracking-wide" style={{ color: "#1A2416" }}>
              DEALNEXA
            </span>
            <span className="w-2 h-2 rounded-full" style={{ background: "#16A34A" }} />
          </div>
          <p className="text-[10px] mt-1 font-mono tracking-widest" style={{ color: "#9CA3AF" }}>
            SAINT THOMAS CAPITAL · INTERNAL PLATFORM
          </p>
        </div>

        {/* Headline */}
        <div className="space-y-8">
          <div>
            <h1 className="font-serif text-5xl font-bold leading-[1.15]" style={{ color: "#1A2416" }}>
              Find the deal<br />
              <span style={{ color: "#16A34A" }}>before</span> it's<br />
              a deal.
            </h1>
            <p className="text-sm mt-5 leading-relaxed max-w-xs" style={{ color: "#64748B" }}>
              Private deal intelligence for lower middle market acquisitions.
              Each team member sees only their own pipeline.
            </p>
          </div>

          <div className="space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                  style={{ background: "rgba(22,163,74,0.08)" }}
                >
                  <Icon size={13} style={{ color: "#16A34A" }} />
                </div>
                <span className="text-xs" style={{ color: "#64748B" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px]" style={{ color: "#9CA3AF" }}>
          © 2026 Saint Thomas Capital · Confidential
        </p>
      </div>

      {/* ── Right auth panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">

        {/* Mobile logo */}
        <div className="lg:hidden mb-10 text-center">
          <div className="flex items-center gap-2 justify-center">
            <span className="font-serif text-xl font-bold" style={{ color: "#1A2416" }}>DEALNEXA</span>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#16A34A" }} />
          </div>
          <p className="text-[9px] mt-1 font-mono tracking-widest" style={{ color: "#9CA3AF" }}>
            SAINT THOMAS CAPITAL
          </p>
        </div>

        <div className="w-full max-w-sm space-y-6">

          {/* Tab */}
          <div
            className="flex rounded-xl p-1"
            style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
          >
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className="flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all"
                style={
                  mode === m
                    ? { background: "#16A34A", color: "#FFFFFF" }
                    : { background: "transparent", color: "#64748B" }
                }
              >
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider" style={{ color: "#64748B" }}>
                  Full Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Johnson"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none placeholder:opacity-30"
                  style={inputStyle}
                  required
                  autoComplete="name"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-wider" style={{ color: "#64748B" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@saintthomascapital.com"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none placeholder:opacity-30"
                style={inputStyle}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-wider" style={{ color: "#64748B" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "Min. 6 characters" : "••••••••"}
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none pr-11 placeholder:opacity-30"
                  style={inputStyle}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-100"
                  style={{ color: "#64748B", opacity: 0.5 }}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="px-4 py-2.5 rounded-lg text-xs leading-snug"
                style={{
                  background: "rgba(220,38,38,0.08)",
                  border: "1px solid rgba(220,38,38,0.15)",
                  color: "#DC2626",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              style={{ background: "#16A34A", color: "#FFFFFF" }}
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          {/* Switch link */}
          <p className="text-center text-xs" style={{ color: "#64748B" }}>
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => switchMode("signup")}
                  className="font-semibold transition-opacity hover:opacity-80"
                  style={{ color: "#16A34A" }}
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => switchMode("login")}
                  className="font-semibold transition-opacity hover:opacity-80"
                  style={{ color: "#16A34A" }}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
