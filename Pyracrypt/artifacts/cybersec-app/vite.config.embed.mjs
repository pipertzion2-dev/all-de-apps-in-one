import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const basePath = process.env.BASE_PATH ?? "/clutety-shell/";

/** Production embed build — no Replit/tailwind Vite plugins (uses prebuilt CSS). */
export default defineConfig({
  base: basePath.endsWith("/") ? basePath : `${basePath}/`,
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(dir, "src"),
      "@assets": path.resolve(dir, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: dir,
  build: {
    outDir: path.resolve(dir, "dist/public"),
    emptyOutDir: true,
    cssCodeSplit: false,
  },
});
