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
// Static Frontend (production build)
// ---------------------------------------------------------------------------
app.use(express.static(path.join(__dirname, "dist")));

// SPA fallback — serve index.html for all non-API routes
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API route not found" });
  }
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
