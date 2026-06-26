import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
const rawPort = process.env.PORT || "5175";

const port = Number(rawPort);

const basePath = process.env.BASE_PATH || "/";

export default defineConfig({
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "assets"),
      "@workspace/api-client-react": path.resolve(import.meta.dirname, "src/lib/api-client"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "https://dev.bianettechltd.com",
        changeOrigin: true,
      },
    },
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
  },
});
