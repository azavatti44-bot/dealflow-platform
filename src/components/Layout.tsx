import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F7F5EF", color: "#1A2416", fontFamily: "Inter, sans-serif" }}>
      <Navbar />
      <main className="flex-1 pt-14">
        <Outlet />
      </main>
    </div>
  );
}
