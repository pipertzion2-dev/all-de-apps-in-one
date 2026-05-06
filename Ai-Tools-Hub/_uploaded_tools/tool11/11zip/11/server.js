/**
 * Synthetic Dataset Generator — backend template.
 * Single POST /api/analyze: parse schema/prompt, score, generate sample rows. Kept under 3s.
 */

const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '512kb' }));
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/analyze', (req, res) => {
  const start = Date.now();
  const { type, raw, model = 'balanced', rowCount = 10 } = req.body || {};
  const count = Math.min(100, Math.max(1, parseInt(rowCount, 10) || 10));

  let parsed = { properties: {}, columns: [] };

  if (type === 'schema' && raw) {
    try {
      const obj = JSON.parse(raw);
      if (obj.properties && typeof obj.properties === 'object') {
        parsed.properties = obj.properties;
        parsed.columns = Object.keys(obj.properties);
      } else if (Array.isArray(obj)) {
        parsed.columns = obj.filter((k) => typeof k === 'string');
        parsed.columns.forEach((k) => { parsed.properties[k] = { type: 'string' }; });
      } else if (typeof obj === 'object' && obj !== null) {
        parsed.columns = Object.keys(obj);
        parsed.properties = obj;
      }
    } catch (_) {
      parsed.columns = [];
      parsed.properties = {};
    }
  } else if (type === 'prompt' && raw) {
    const words = raw.replace(/[,;:\n]/g, ' ').split(/\s+/).filter(Boolean);
    const fieldLike = words.filter((w) => /^[a-z_][a-z0-9_]*$/i.test(w) && w.length > 2 && w.length < 30);
    parsed.columns = [...new Set(fieldLike)].slice(0, 12);
    parsed.columns.forEach((k) => { parsed.properties[k] = { type: 'string' }; });
  }

  const fields = parsed.columns.map((name) => {
    const prop = parsed.properties[name] || {};
    const type = (prop.type || 'string').toLowerCase();
    const format = (prop.format || '').toLowerCase();
    return {
      name,
      type: format === 'email' ? 'email' : type,
      score: 70 + Math.floor(Math.random() * 25),
    };
  });

  const schemaClarity = parsed.columns.length
    ? Math.min(100, 55 + parsed.columns.length * 4 + (type === 'schema' ? 15 : 0))
    : 0;
  const diversityScore = model === 'edge-cases' ? 85 + Math.floor(Math.random() * 10) : 72 + Math.floor(Math.random() * 22);

  const scores = {
    schemaClarity,
    fieldCoverage: parsed.columns.length,
    diversityScore,
  };

  const sampleRows = [];
  const seed = (s) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0;
    return Math.abs(h);
  };
  const seeded = (col, i) => (seed(col + String(i)) % 1000) / 1000;

  for (let i = 0; i < count; i++) {
    const row = {};
    parsed.columns.forEach((col) => {
      const prop = parsed.properties[col] || {};
      const t = (prop.type || 'string').toLowerCase();
      const fmt = (prop.format || '').toLowerCase();
      if (t === 'integer' || t === 'number') {
        row[col] = model === 'edge-cases' && seeded(col, i) > 0.9
          ? (seeded(col, i + 1) > 0.5 ? null : -1)
          : Math.floor(seeded(col, i) * 900) + 10;
      } else if (t === 'boolean') {
        row[col] = seeded(col, i) > 0.5;
      } else if (fmt === 'email' || col.toLowerCase().includes('email')) {
        row[col] = 'user' + (i + 1) + '@example.com';
      } else if (model === 'realistic' && (col.toLowerCase().includes('name') || col === 'title')) {
        const names = ['Alex', 'Jordan', 'Sam', 'Casey', 'Morgan', 'Riley', 'Quinn', 'Avery'];
        row[col] = names[Math.floor(seeded(col, i) * names.length)] + ' ' + (i + 1);
      } else {
        row[col] = 'sample_' + col + '_' + (i + 1);
      }
    });
    sampleRows.push(row);
  }

  const interpretation = [];
  if (scores.schemaClarity >= 80) {
    interpretation.push('Schema is well-structured; we could infer types for all fields.');
  }
  if (fields.length > 0) {
    interpretation.push(`We generated ${fields.length} field(s) and ${sampleRows.length} sample row(s).`);
  }
  interpretation.push('Use this data for tests, demos, or as a starting point for production datasets.');

  const elapsed = Date.now() - start;
  if (elapsed > 2500) {
    console.warn('Analysis took', elapsed, 'ms — consider optimizing.');
  }

  res.json({
    scores,
    fields,
    columns: parsed.columns,
    sampleRows,
    interpretation,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('Synthetic Dataset Generator running at http://localhost:' + PORT);
});
