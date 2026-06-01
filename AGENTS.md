# DealNexa — Agent Guide

> Signal intelligence platform for proprietary M&A deal sourcing. Built for Saint Thomas Capital Partners as an internal team tool.

## Project Overview

DealNexa is a single-page React application that aggregates public data sources to surface acquisition signals for private-market investors. It searches SEC EDGAR filings, federal court dockets, USPTO patents, state corporate records, the NPI healthcare provider registry, SBA loan data, and business-broker listings to score companies and generate outreach triggers.

The app is **client-side only** after build — there is no database. All user data (auth, pipelines, watchlists, alerts, advisor contacts) persists to `localStorage` and is namespaced by user ID so multiple people can use the same browser without collision.

An Express proxy server is bundled to route cross-origin API requests during both development and production, and it also hosts a server-side scraping endpoint for business-broker listings.

## Technology Stack

| Layer | Tech |
|-------|------|
| Framework | React 19 + TypeScript 5.9 |
| Bundler | Vite 7 |
| Router | React Router 7 (`HashRouter`) |
| Styling | Tailwind CSS 3.4 + shadcn/ui (New York style) |
| UI Primitives | Radix UI + `class-variance-authority` + `tailwind-merge` |
| Forms | `react-hook-form` + Zod |
| Charts | Recharts |
| Animation | Framer Motion |
| Notifications | Browser `Notification` API + Sonner toasts |
| Icons | Lucide React |
| Proxy Server | Express 5 + `http-proxy-middleware` |
| Dates | date-fns |
| Test Runner | Playwright 1.60 (installed, no tests written yet) |

## Directory Structure

```
src/
  components/
    ui/              # shadcn/ui primitives (50+ components)
    Layout.tsx       # Shell with Navbar + <Outlet />
    Navbar.tsx       # Top nav, alert bell, user avatar menu
    Footer.tsx       # Marketing footer
    AlertBell.tsx    # Dropdown for filing alerts
    ErrorBoundary.tsx
  hooks/
    use-mobile.ts    # Match-media hook for responsive checks
  lib/
    api.ts           # SEC EDGAR, CourtListener, USPTO, OpenCorporates, SBA APIs
    healthcareApi.ts # NPI Registry search + specialty benchmarks
    alertEngine.ts   # Background polling for new filings; alert CRUD
    auth.ts          # LocalStorage auth (register, login, djb2 hash)
    AuthContext.tsx  # React context for session
    DataContext.tsx  # React context for companies + watchlists
    config.ts        # CORS proxy configuration
    utils.ts         # `cn()` Tailwind helper
    cik-map.ts       # Static ticker → CIK lookup table
    bizBuySellApi.ts # Broker-listing API client (Synergy BB + Accelerated MFG)
  pages/
    Landing.tsx           # Login / signup split screen
    CommandCenter.tsx     # Main company search dashboard
    CompanyDetail.tsx     # Deep-dive profile (signals, filings, courts, patents)
    Watchlists.tsx        # Saved company lists
    PrivateDealFinder.tsx # Form D / Reg D browse & filter
    MarketSignalScanner.tsx # Preset EDGAR full-text searches
    SignalLibrary.tsx     # Reference catalog of all signals
    OutreachHub.tsx       # Signal-triggered email templates
    AdvisorGraph.tsx      # Manual CRM for bankers / advisors
    HealthcareDealEngine.tsx # NPI provider search for healthcare targets
    SettingsPage.tsx      # API status, notification toggles, account
  App.tsx            # Route map + providers
  main.tsx           # Entry point (HashRouter)
  index.css          # Global styles + CSS custom properties
```

## Build & Run Commands

```bash
# Install dependencies
npm install

# Development — runs Express proxy server (port 3000) + Vite (port 5173) concurrently
npm run dev

# Vite only (client dev server; API calls will 404 without the proxy)
npm run dev:client

# Express proxy server only
npm run dev:server

# Production build (outputs to dist/)
npm run build

# Production server (serves dist/ + API proxies)
npm start

# Lint
npm run lint

# Preview production build locally
npm run preview
```

Vite dev server proxies `/api/*` to `http://localhost:3000`. The Express server then rewrites and forwards those requests to the real upstream APIs. The Vite config uses `base: './'` so assets load with relative paths.

## Code Style Guidelines

- **Path alias**: use `@/` for everything under `src/`. Example: `import { cn } from "@/lib/utils"`.
- **shadcn/ui pattern**: components live in `src/components/ui/`. Each exports a base component and usually a `*Variants` helper from `class-variance-authority`. Compose classes with `cn()`.
- **Theming**: the app uses a warm beige / deep green palette defined as CSS custom properties in `src/index.css`:
  - `--bg-page: #F5F1EB`
  - `--bg-surface: #FDFCFA`
  - `--bg-surface-alt: #EDE9E1`
  - `--accent: #1B4332`
  - `--accent-hover: #2D6A4F`
  - `--text-primary: #1C1917`
  - `--text-secondary: #78716C`
- **Card pattern**: most cards reuse an inline style object:
  ```tsx
  const card = { background: "var(--bg-surface)", border: "1px solid rgba(0,0,0,0.08)" };
  ```
- **Typography**: Outfit is the primary typeface; JetBrains Mono is used for data/mono labels.
- **No `any` abuse**: TypeScript is strict (`strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`, `verbatimModuleSyntax: true`, `erasableSyntaxOnly: true`). Avoid adding `@ts-ignore` unless there is no other way.

## Data & State Conventions

- **All persistence is `localStorage`**. Every key must be prefixed with `stc_` and namespaced by the current user's ID (`userKey(base, userId)` or `k("stc_companies")` inside `DataProvider`).
- **AuthContext** holds the logged-in user. `Landing.tsx` renders when `user` is `null`.
- **DataProvider** is keyed on `user.id` in `App.tsx` so it fully remounts on login/logout, reinitialising state from that user's keys.
- **Alert engine** polls every 30 minutes for new filings on monitored companies. It dispatches a custom `stc:alert` event that `AlertBell.tsx` listens for.
- **Max cache age**: API results are cached in `localStorage` for 1 hour (`3600000` ms).

## External APIs & Proxy Routes

The Express server (`server.js`) exposes these proxy prefixes:

| Prefix | Upstream | Notes |
|--------|----------|-------|
| `/api/npi` | `npiregistry.cms.hhs.gov` | NPI healthcare provider registry |
| `/api/efts` | `efts.sec.gov` | SEC EDGAR full-text search |
| `/api/data-sec` | `data.sec.gov` | SEC structured data (submissions, tickers) |
| `/api/sec-files` | `www.sec.gov/files` | SEC static files |
| `/api/sec-arch` | `www.sec.gov/Archives` | SEC document archive |
| `/api/courtlistener` | `www.courtlistener.com` | Federal court dockets |
| `/api/patentsview` | `search.patentsview.org` | USPTO patent search |
| `/api/opencorporates` | `api.opencorporates.com` | State SOS records |
| `/api/sba` | `data.sba.gov` | SBA loan data |
| `/api/broker-listings` | *server-side scraper* | Synergy Business Brokers & Accelerated MFG Brokers sitemaps |

All SEC proxy routes add the required `User-Agent` header. The broker-listings route scrapes XML sitemaps and HTML pages server-side with a 30-minute in-memory cache.

## Testing

- **No tests exist yet.** Playwright is installed in `dependencies` but there are no `.spec.` or `.test.` files and no Playwright configuration file.
- ESLint is the only automated quality gate. Run `npm run lint` before committing.

## Security Considerations

- Auth is **client-side only** with a djb2 hash and no salt rotation. This is acceptable for an internal tool but must not be exposed to the public internet without an additional auth layer (e.g., Basic Auth at the reverse-proxy level).
- All user data lives in `localStorage` unencrypted. Browser profile compromise = data compromise.
- The production Express server forwards arbitrary API requests and scrapes third-party sites. It should be deployed behind a firewall/VPN or have IP-based rate limiting.
- `VITE_PROXY_URL` can be set at build time for a custom CORS proxy in production. If unset, the app falls back to public CORS proxies (unreliable and rate-limited).

## Deployment

A `render.yaml` is included for Render.com:
- **Build**: `npm install --include=dev && npm run build`
- **Start**: `npm start`
- The server serves the static `dist/` folder and handles SPA fallback to `index.html`.

For other hosts, the general rule is:
1. Run `npm run build` to produce `dist/`.
2. Start `node server.js` (or `npm start`) so API proxies, broker scraping, and the SPA fallback are available.

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `PORT` | Express server port (default `3000`) |
| `VITE_PROXY_URL` | Optional external CORS proxy for production static builds |

Copy `.env.example` to `.env` and fill values as needed. `.env` is gitignored.
