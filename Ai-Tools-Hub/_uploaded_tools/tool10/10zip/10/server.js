/**
 * Prompt Consistency Scorer - backend
 * Single endpoint: POST /api/analyze
 * Runtime target: under 3 seconds. Swap analysis logic here to reuse template.
 */
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 5000;

/**
 * Prompt consistency analysis (swap this logic for other mini-apps)
 * Returns: { overallScore, categories, issues, suggestions }
 */
function analyzePromptConsistency(prompt, schemaJson) {
  const text = (prompt || '').trim();
  const categories = [];
  const issues = [];
  const suggestions = [];

  // 1. Terminology consistency: repeated terms vs scattered synonyms
  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
  const termFreq = {};
  words.forEach(w => { termFreq[w] = (termFreq[w] || 0) + 1; });
  const uniqueTerms = Object.keys(termFreq).length;
  const totalWords = words.length;
  const repetitionRatio = totalWords > 0 ? 1 - uniqueTerms / totalWords : 0;
  const termScore = Math.min(100, Math.round(40 + repetitionRatio * 40)); // some repetition = consistent terms
  categories.push({ name: 'Terminology consistency', score: termScore, description: 'Use of consistent terms for the same concepts' });

  // 2. Structure & formatting
  const lines = text.split(/\n/).filter(l => l.trim());
  const hasSections = /^(#|\d\.|\*\*|##|-)\s/m.test(text) || lines.length >= 3;
  const structureScore = hasSections ? 85 : Math.min(70, 40 + lines.length * 5);
  categories.push({ name: 'Structure & formatting', score: structureScore, description: 'Clear sections and consistent formatting' });

  // 3. Clarity (sentence length, imperatives)
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const avgLen = sentences.length ? sentences.reduce((a, s) => a + s.trim().split(/\s+/).length, 0) / sentences.length : 0;
  const clarityScore = avgLen <= 25 && avgLen >= 5 ? 90 : avgLen < 5 ? 70 : Math.max(50, 90 - (avgLen - 25));
  categories.push({ name: 'Clarity', score: Math.min(100, Math.max(0, Math.round(clarityScore))), description: 'Readable sentence length and clear instructions' });

  // 4. Schema alignment (if schema provided)
  let schemaScore = null;
  if (schemaJson) {
    try {
      const schema = typeof schemaJson === 'string' ? JSON.parse(schemaJson) : schemaJson;
      const schemaStr = JSON.stringify(schema);
      const fieldNames = (schemaStr.match(/"([a-zA-Z_][a-zA-Z0-9_]*)"\s*:/g) || []).map(m => m.replace(/"([^"]+)"\s*:.*/, '$1'));
      const uniqueFields = [...new Set(fieldNames)];
      let matched = 0;
      uniqueFields.forEach(f => { if (text.toLowerCase().includes(f.toLowerCase())) matched++; });
      schemaScore = uniqueFields.length ? Math.round((matched / uniqueFields.length) * 100) : 80;
      categories.push({ name: 'Schema alignment', score: schemaScore, description: 'Prompt references schema/API fields appropriately' });
    } catch (_) {
      categories.push({ name: 'Schema alignment', score: 0, description: 'Invalid schema JSON' });
    }
  }

  // Issues & suggestions
  if (termScore < 60) {
    issues.push('Terminology varies; same concepts may be named differently.');
    suggestions.push('Pick one term per concept and use it throughout (e.g. "user" vs "customer").');
  }
  if (structureScore < 60) {
    issues.push('Prompt lacks clear structure.');
    suggestions.push('Use headings, numbered steps, or bullet points to separate instructions.');
  }
  if (clarityScore < 60) {
    issues.push('Sentences may be too long or too terse.');
    suggestions.push('Aim for 10–25 words per instruction; use one instruction per sentence.');
  }
  if (schemaScore !== null && schemaScore < 70) {
    issues.push('Prompt may not align with your schema or API fields.');
    suggestions.push('Mention key field names from your schema in the prompt so the model uses them.');
  }
  if (text.length < 50) {
    issues.push('Prompt is very short; consistency is harder to evaluate.');
    suggestions.push('Add a few clear instructions or examples to improve consistency scoring.');
  }

  const overallScore = Math.round(
    categories.reduce((a, c) => a + c.score, 0) / categories.length
  );

  return {
    overallScore: Math.min(100, Math.max(0, overallScore)),
    categories,
    issues: issues.length ? issues : ['No major consistency issues detected.'],
    suggestions: suggestions.length ? suggestions : ['Keep your current structure and terminology.'],
    wordCount: totalWords,
    schemaChecked: !!schemaJson
  };
}

app.post('/api/analyze', (req, res) => {
  const start = Date.now();
  try {
    const { prompt, schema } = req.body || {};
    const result = analyzePromptConsistency(prompt, schema);
    result.responseTimeMs = Date.now() - start;
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Analysis failed', message: err.message });
  }
});

app.get('/robots.txt', (_, res) => {
  res.type('text/plain').send(
    'User-agent: *\nAllow: /\nSitemap: https://svivva.com/tools/prompt-consistency-checker/sitemap.xml\n'
  );
});

app.get('/sitemap.xml', (_, res) => {
  res.type('application/xml').send(
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    '  <url>\n' +
    '    <loc>https://svivva.com/tools/prompt-consistency-checker</loc>\n' +
    '    <changefreq>monthly</changefreq>\n' +
    '    <priority>1.0</priority>\n' +
    '  </url>\n' +
    '  <url>\n' +
    '    <loc>https://svivva.com/tools/prompt-consistency-checker/start</loc>\n' +
    '    <changefreq>monthly</changefreq>\n' +
    '    <priority>0.9</priority>\n' +
    '  </url>\n' +
    '</urlset>\n'
  );
});

app.get('/lp', (_, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Prompt Consistency Checker running at http://0.0.0.0:${PORT}`);
});
