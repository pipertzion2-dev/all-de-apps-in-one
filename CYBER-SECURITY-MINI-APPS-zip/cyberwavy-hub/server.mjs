import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { getAiInsight } from "./server/aiInsight.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, "dist");
const port = Number(process.env.PORT) || 5000;

const app = express();
app.use(express.json({ limit: "32kb" }));

app.post("/api/ai-insight", async (req, res) => {
  try {
    const out = await getAiInsight(req.body, process.env);
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ source: "error", text: null });
  }
});

app.use(express.static(dist));

app.get("*", (req, res) => {
  res.sendFile(path.join(dist, "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`[cyberwavy-hub] listening on ${port}`);
});
