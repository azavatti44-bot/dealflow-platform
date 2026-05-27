import { Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { DataProvider } from "./lib/DataContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import CommandCenter from "./pages/CommandCenter";
import CompanyDetail from "./pages/CompanyDetail";
import SignalLibrary from "./pages/SignalLibrary";
import SettingsPage from "./pages/SettingsPage";
import AdvisorGraph from "./pages/AdvisorGraph";
import OutreachHub from "./pages/OutreachHub";
import Watchlists from "./pages/Watchlists";
import PrivateDealFinder from "./pages/PrivateDealFinder";
import MarketSignalScanner from "./pages/MarketSignalScanner";
import HealthcareDealEngine from "./pages/HealthcareDealEngine";

function AuthenticatedApp() {
  const { user } = useAuth();

  if (!user) return <Landing />;

  // key={user.id} forces DataProvider to fully remount when user changes,
  // so all state reinitialises from that user's namespaced localStorage keys.
  return (
    <DataProvider key={user.id} userId={user.id}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/"                   element={<CommandCenter />} />
          <Route path="/company/:id"        element={<CompanyDetail />} />
          <Route path="/settings"           element={<SettingsPage />} />
          <Route path="/advisors"           element={<AdvisorGraph />} />
          <Route path="/outreach"           element={<OutreachHub />} />
          <Route path="/watchlists"         element={<Watchlists />} />
          <Route path="/signals"            element={<SignalLibrary />} />
          <Route path="/private-finder"     element={<PrivateDealFinder />} />
          <Route path="/market-signals"     element={<MarketSignalScanner />} />
          <Route path="/healthcare"         element={<HealthcareDealEngine />} />
        </Route>
      </Routes>
    </DataProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
