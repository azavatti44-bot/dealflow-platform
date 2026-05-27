// CORS Proxy Configuration
// In production, you must provide a backend proxy for SEC EDGAR and NPI Registry APIs
// or use the fallback chain (slower, rate-limited, unreliable)

export const Config = {
  // Set VITE_PROXY_URL=https://your-backend.com/proxy during build for production
  // Expected proxy format: GET /proxy?url=<encoded-url>
  proxyUrl: import.meta.env.VITE_PROXY_URL || "",

  // Fallback public CORS proxies (rate-limited, unreliable, should not be used in production)
  fallbackProxies: [
    "https://corsproxy.io",
    "https://api.codetabs.com/v1/proxy",
    "https://api.allorigins.win/get",
  ],

  // API endpoints (rewrite paths for dev proxy)
  secArchives: {
    dev: "/sec-arch",
    prod: "https://www.sec.gov/Archives",
  },
  secFiles: {
    dev: "/sec-files",
    prod: "https://www.sec.gov/files",
  },
  npiRegistry: {
    dev: "/npi-api",
    prod: "https://npiregistry.cms.hhs.gov",
  },
};

export function isDev(): boolean {
  return import.meta.env.DEV;
}

export function getBaseUrl(endpoint: "secArchives" | "secFiles" | "npiRegistry"): string {
  if (isDev()) {
    return Config[endpoint].dev;
  }
  return Config[endpoint].prod;
}
