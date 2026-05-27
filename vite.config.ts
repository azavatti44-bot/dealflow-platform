import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'plugin-inspect-react-code'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [inspectAttr(), react()],
  server: {
    port: 3000,
    proxy: {
      "/sec-files": { target: "https://www.sec.gov", changeOrigin: true, rewrite: (p) => p.replace(/^\/sec-files/, "/files") },
      "/sec-arch": { target: "https://www.sec.gov", changeOrigin: true, rewrite: (p) => p.replace(/^\/sec-arch/, "/Archives") },
      "/npi-api": { target: "https://npiregistry.cms.hhs.gov", changeOrigin: true, rewrite: (p) => p.replace(/^\/npi-api/, "") },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
