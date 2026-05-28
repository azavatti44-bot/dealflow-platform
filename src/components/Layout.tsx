import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-page)", color: "var(--text-primary)" }}>
      <Navbar />
      <main className="flex-1 pt-14">
        <Outlet />
      </main>
    </div>
  );
}
