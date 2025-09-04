// vite.config.ts (or vite.config.js)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Forward /api to your Render backend in dev
      "/api": {
        target: "https://lync-backend-gghg.onrender.com",
        changeOrigin: true,
        secure: true, // Render is HTTPS
        // No rewrite because your backend already uses /api/*
      },

      // Optional: local auth server (only if you run one on :4000)
      "/auth": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
        // If your local server does NOT have the /auth prefix, uncomment:
        // rewrite: (path) => path.replace(/^\/auth/, ""),
      },
    },
  },
}));
