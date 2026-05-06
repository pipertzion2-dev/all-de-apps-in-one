import type { Connect } from "vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Replit sets PORT; fall back to 5000 (matches .replit port forward). */
const port = Number(process.env.PORT) || 5000;

function mountAiInsightMiddleware(server: { middlewares: Connect.Server }) {
  server.middlewares.use("/api/ai-insight", (req, res, next) => {
    if (req.method !== "POST") return next();
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", async () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        const json = JSON.parse(raw || "{}");
        const { getAiInsight } = await import("./server/aiInsight.mjs");
        const out = await getAiInsight(json, process.env);
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(out));
      } catch {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ source: "error", text: null }));
      }
    });
  });
}

function aiInsightPlugin() {
  return {
    name: "ai-insight-api",
    configureServer(server) {
      mountAiInsightMiddleware(server);
    },
    configurePreviewServer(server) {
      mountAiInsightMiddleware(server);
    },
  };
}

export default defineConfig({
  plugins: [react(), aiInsightPlugin()],
  appType: "spa",
  server: {
    host: "0.0.0.0",
    port,
    strictPort: true,
    allowedHosts: true,
    watch: {
      usePolling: true,
    },
  },
  preview: {
    host: "0.0.0.0",
    port,
    strictPort: true,
    allowedHosts: true,
  },
});
