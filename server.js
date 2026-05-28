import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies
app.use(express.json());

// ---------------------------------------------------------------------------
// API Proxy Routes
// ---------------------------------------------------------------------------

// NPI Registry
app.use(
  "/api/npi",
  createProxyMiddleware({
    target: "https://npiregistry.cms.hhs.gov",
    changeOrigin: true,
    pathRewrite: { "^/api/npi": "" },
  })
);

// SEC EDGAR Full-Text Search
app.use(
  "/api/efts",
  createProxyMiddleware({
    target: "https://efts.sec.gov",
    changeOrigin: true,
    pathRewrite: { "^/api/efts": "" },
    on: {
      proxyReq: (proxyReq) => {
        proxyReq.setHeader("User-Agent", "DealflowPlatform/1.0 admin@saintthomascapital.com");
      },
    },
  })
);

// SEC Data API
app.use(
  "/api/data-sec",
  createProxyMiddleware({
    target: "https://data.sec.gov",
    changeOrigin: true,
    pathRewrite: { "^/api/data-sec": "" },
    onProxyReq: (proxyReq) => {
      proxyReq.setHeader("User-Agent", "DealflowPlatform admin@example.com");
    },
  })
);

// SEC Files
app.use(
  "/api/sec-files",
  createProxyMiddleware({
    target: "https://www.sec.gov",
    changeOrigin: true,
    pathRewrite: { "^/api/sec-files": "/files" },
    onProxyReq: (proxyReq) => {
      proxyReq.setHeader("User-Agent", "DealflowPlatform admin@example.com");
    },
  })
);

// SEC Archives
app.use(
  "/api/sec-arch",
  createProxyMiddleware({
    target: "https://www.sec.gov",
    changeOrigin: true,
    pathRewrite: { "^/api/sec-arch": "/Archives" },
    onProxyReq: (proxyReq) => {
      proxyReq.setHeader("User-Agent", "DealflowPlatform admin@example.com");
    },
  })
);

// CourtListener
app.use(
  "/api/courtlistener",
  createProxyMiddleware({
    target: "https://www.courtlistener.com",
    changeOrigin: true,
    pathRewrite: { "^/api/courtlistener": "" },
  })
);

// PatentsView
app.use(
  "/api/patentsview",
  createProxyMiddleware({
    target: "https://search.patentsview.org",
    changeOrigin: true,
    pathRewrite: { "^/api/patentsview": "" },
  })
);

// OpenCorporates
app.use(
  "/api/opencorporates",
  createProxyMiddleware({
    target: "https://api.opencorporates.com",
    changeOrigin: true,
    pathRewrite: { "^/api/opencorporates": "" },
  })
);

// SBA Data
app.use(
  "/api/sba",
  createProxyMiddleware({
    target: "https://data.sba.gov",
    changeOrigin: true,
    pathRewrite: { "^/api/sba": "" },
  })
);

// ---------------------------------------------------------------------------
// Broker Listings — Synergy BB + Accelerated MFG
// ---------------------------------------------------------------------------

const listingsCache = new Map();
const CACHE_TTL_MS  = 30 * 60 * 1000; // 30 min

async function cachedFetch(key, fetchFn) {
  const hit = listingsCache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL_MS) return hit.data;
  const data = await fetchFn();
  listingsCache.set(key, { data, ts: Date.now() });
  return data;
}

const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function strip(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
}

function tagText(html, tag) {
  const m = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? strip(m[1]) : "";
}

function slugToTitle(slug) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseNum(str) {
  if (!str) return null;
  const n = parseInt(str.replace(/[^0-9]/g, ""), 10);
  return isNaN(n) ? null : n;
}

// Fetch sitemap and return [{url, lastmod}] sorted newest-first, filtered by urlPredicate
async function fetchSitemapEntries(sitemapUrl, urlPredicate, max = 20) {
  const res = await fetch(sitemapUrl, {
    headers: { "User-Agent": BROWSER_UA },
    signal: AbortSignal.timeout(10000),
  });
  const xml = await res.text();

  const entries = [];
  const rx = /<url>([\s\S]*?)<\/url>/gi;
  let m;
  while ((m = rx.exec(xml)) !== null) {
    const locM     = m[1].match(/<loc>([^<]+)<\/loc>/i);
    const lastmodM = m[1].match(/<lastmod>([^<]+)<\/lastmod>/i);
    if (locM && urlPredicate(locM[1].trim())) {
      entries.push({ url: locM[1].trim(), lastmod: lastmodM ? lastmodM[1] : "" });
    }
  }
  entries.sort((a, b) => b.lastmod.localeCompare(a.lastmod));
  return entries.slice(0, max);
}

// Fetch pages in parallel with a concurrency limit
async function fetchPages(entries, concurrency = 5) {
  const results = [];
  for (let i = 0; i < entries.length; i += concurrency) {
    const batch = entries.slice(i, i + concurrency);
    const pages = await Promise.all(
      batch.map(async (e) => {
        try {
          const r = await fetch(e.url, {
            headers: { "User-Agent": BROWSER_UA, Accept: "text/html" },
            signal: AbortSignal.timeout(8000),
          });
          return r.ok ? { html: await r.text(), entry: e } : null;
        } catch {
          return null;
        }
      })
    );
    results.push(...pages.filter(Boolean));
  }
  return results;
}

function parseSynergyPage(html, entry) {
  const title = tagText(html, "h1");
  if (!title) return null;
  if (/accepted.offer|sold|under.contract/i.test(title + entry.url)) return null;

  const text = strip(html);
  const num  = (rx) => { const m = text.match(rx); return m ? parseNum(m[1]) : null; };

  const askingPrice = num(/asking price[:\s]*\$?([\d,]+)/i);
  const revenue     = num(/\brevenue[:\s]*\$?([\d,]+)/i);
  const cashFlow    = num(/(?:cash flow|ncf)[:\s]*\$?([\d,]+)/i);

  // Location from URL slug suffix (-AZ, -FL, etc.)
  const locM    = entry.url.match(/-([a-z]{2})\/?$/i);
  const location = locM ? locM[1].toUpperCase() : null;

  // Broker info
  const brokerSecM = html.match(/broker-info-text[\s\S]{0,600}?<h[^>]*>([^<]+)<\/h/i);
  const brokerName = brokerSecM ? strip(brokerSecM[1]) : "Synergy Business Brokers";
  const phoneM     = html.match(/href="tel:([^"]+)"/i);
  const emailM     = html.match(/href="mailto:([^"]+)"/i);

  return {
    id:                  entry.url,
    title,
    link:                entry.url,
    source:              "synergybb",
    sourceName:          "Synergy Business Brokers",
    location,
    askingPrice,
    cashFlow,
    revenue,
    brokerName,
    brokerPhone:         phoneM ? phoneM[1] : null,
    brokerEmail:         emailM ? emailM[1] : null,
    financialsAvailable: !!(askingPrice || revenue || cashFlow),
    pubDate:             entry.lastmod,
  };
}

function parseAcceleratedSlug(entry) {
  const slug = entry.url.split("/business-listing/")[1]?.replace(/\/$/, "") || "";
  if (!slug) return null;

  const locM    = slug.match(/-([a-z]{2})$/i);
  const location = locM ? locM[1].toUpperCase() : null;
  const cleanSlug = locM ? slug.slice(0, slug.lastIndexOf("-" + locM[1])) : slug;

  return {
    id:                  entry.url,
    title:               slugToTitle(cleanSlug),
    link:                entry.url,
    source:              "accelerated",
    sourceName:          "Accelerated MFG Brokers",
    location,
    askingPrice:         null,
    cashFlow:            null,
    revenue:             null,
    brokerName:          "Accelerated MFG Brokers",
    brokerPhone:         "(908) 387-1000",
    brokerEmail:         "info@acceleratedmfgbrokers.com",
    financialsAvailable: false,
    pubDate:             entry.lastmod,
  };
}

app.get("/api/broker-listings", async (req, res) => {
  const source = String(req.query.source || "synergybb");

  try {
    const data = await cachedFetch(`broker_${source}`, async () => {
      if (source === "synergybb") {
        const entries = await fetchSitemapEntries(
          "https://synergybb.com/listing-sitemap.xml",
          (u) => u.includes("/listings/") && !/accepted.offer|sold/i.test(u),
          20
        );
        const pages = await fetchPages(entries, 5);
        const items = pages
          .map(({ html, entry }) => parseSynergyPage(html, entry))
          .filter(Boolean);
        return { items, fetchedAt: new Date().toISOString() };

      } else if (source === "accelerated") {
        const entries = await fetchSitemapEntries(
          "https://acceleratedmfgbrokers.com/business-listing-sitemap.xml",
          (u) => /\/business-listing\/.+/.test(u),
          40
        );
        const items = entries.map(parseAcceleratedSlug).filter(Boolean);
        return { items, fetchedAt: new Date().toISOString() };

      } else {
        throw new Error("Unknown source");
      }
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: String(err.message || err), items: [] });
  }
});

// ---------------------------------------------------------------------------
// Static Frontend (production build)
// ---------------------------------------------------------------------------
app.use(express.static(path.join(__dirname, "dist")));

// SPA fallback — serve index.html for all non-API routes
app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API route not found" });
  }
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
