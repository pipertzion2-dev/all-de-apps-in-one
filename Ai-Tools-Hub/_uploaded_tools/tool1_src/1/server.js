/**
 * Prompt Coverage Visualizer - minimal backend
 * Serves static frontend; analysis runs client-side for <3s, no login.
 */
const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');

app.use(express.json());
app.use(express.static(PUBLIC));

// Optional: health for deployment
app.get('/health', (_, res) => res.json({ ok: true }));

// Single API route: coverage analysis (keeps runtime under 3s)
app.post('/api/analyze', (req, res) => {
  const t0 = Date.now();
  try {
    const { prompt = '', schema = '', model = 'gpt-4' } = req.body;
    const result = runCoverageAnalysis(prompt, schema, model);
    const elapsed = Date.now() - t0;
    if (elapsed > 3000) console.warn('Analysis exceeded 3s:', elapsed);
    res.json({ ...result, _meta: { ms: elapsed } });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

function runCoverageAnalysis(prompt, schema, model) {
  const schemaKeys = extractSchemaKeys(schema);
  const coverage = computeCoverage(prompt, schemaKeys);
  return {
    score: coverage.score,
    total: coverage.total,
    covered: coverage.covered,
    items: coverage.items,
    model,
  };
}

function extractSchemaKeys(schemaStr) {
  if (!schemaStr || !schemaStr.trim()) return [];
  try {
    const o = typeof schemaStr === 'string' ? JSON.parse(schemaStr) : schemaStr;
    const keys = new Set();
    function walk(obj, prefix = '') {
      if (!obj || typeof obj !== 'object') return;
      if (Array.isArray(obj)) {
        obj.forEach((v, i) => walk(v, `${prefix}[${i}]`));
        return;
      }
      for (const [k, v] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${k}` : k;
        keys.add(path);
        if (v && typeof v === 'object' && !Array.isArray(v)) walk(v, path);
      }
    }
    walk(o);
    return [...keys];
  } catch {
    return schemaStr.split(/\s+/).filter(Boolean).slice(0, 100);
  }
}

function computeCoverage(prompt, keys) {
  const lower = (prompt || '').toLowerCase();
  const items = keys.map((key) => {
    const mentioned = lower.includes(key.toLowerCase()) || key.split(/[.\[]/).some((part) => part.length > 2 && lower.includes(part.toLowerCase()));
    return { key, covered: mentioned };
  });
  const covered = items.filter((i) => i.covered).length;
  const total = items.length || 1;
  const score = Math.round((covered / total) * 100);
  return { score, total, covered, items };
}

app.listen(PORT, () => {
  console.log(`Prompt Coverage Visualizer: http://localhost:${PORT}`);
});
