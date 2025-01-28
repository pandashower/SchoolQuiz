import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [react(), runtimeErrorOverlay(), themePlugin()],
  resolve: {
    alias: {
      "@db": path.resolve(__dirname, "db"),
      "@": path.resolve(__dirname, "client", "src"),
    },
  },
  root: "client", // To powinno wskazywać na katalog, gdzie jest `index.html`
  build: {
    outDir: "dist", // Zmiana na domyślny folder `dist/`
    emptyOutDir: true,
  },
  base: "./", // Zapewnia poprawne ładowanie zasobów w Vercel
});
