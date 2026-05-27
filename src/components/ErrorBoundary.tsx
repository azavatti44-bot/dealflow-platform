import { Component, type ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0B1A0E" }}>
          <div className="max-w-lg w-full space-y-4">
            <h1 className="font-serif text-2xl font-bold" style={{ color: "#C9A0A0" }}>Runtime Error</h1>
            <div className="rounded-lg p-4 font-mono text-xs overflow-auto" style={{ background: "#132A1A", color: "#F5F0E6", border: "1px solid rgba(139,58,58,0.3)" }}>
              <p style={{ color: "#C9A0A0" }}>{this.state.error?.name}: {this.state.error?.message}</p>
              <pre className="mt-2" style={{ color: "#8A7D6B" }}>{this.state.error?.stack}</pre>
            </div>
            <button onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "#B8860B", color: "#0B1A0E" }}>
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
