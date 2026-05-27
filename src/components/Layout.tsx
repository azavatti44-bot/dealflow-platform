import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0B1A0E", color: "#F5F0E6", fontFamily: "Inter, sans-serif" }}>
      <Navbar />
      <main className="flex-1 pt-14">
        <Outlet />
      </main>
    </div>
  );
}
