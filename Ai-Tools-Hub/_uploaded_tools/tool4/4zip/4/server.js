/**
 * API Latency Forecaster - backend template
 * Single analysis endpoint; runtime kept under 3 seconds.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';
const ACCENT = '#B45309';

function getMimeType(ext) {
  const map = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.txt': 'text/plain', '.xml': 'application/xml' };
  return map[ext] || 'application/octet-stream';
}

function serveStatic(url, res) {
  const file = path.join(__dirname, 'public', url === '/' ? 'index.html' : url);
  const ext = path.extname(file);
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return false;
  res.setHeader('Content-Type', getMimeType(ext));
  res.end(fs.readFileSync(file));
  return true;
}

/**
 * Latency forecaster analysis logic (swap this for other mini-apps).
 * Input: { prompt, schema, apiConfig, model }
 * Output: { score, breakdown, chartData, summary, tips }
 */
function runLatencyAnalysis(body) {
  const prompt = (body.prompt || '').trim();
  const schema = typeof body.schema === 'string' ? body.schema : JSON.stringify(body.schema || {});
  const apiConfig = body.apiConfig || {};
  const model = (body.model || 'gpt-4').toLowerCase();

  const promptLen = prompt.length;
  const schemaLen = schema.length;
  const hasSchema = schemaLen > 2;

  // Simulated latency components (ms) - deterministic for demo
  const inputTokens = Math.ceil((promptLen + schemaLen) / 4);
  const outputTokensEst = Math.min(500, Math.ceil(inputTokens * 0.5));
  const networkRtt = 20 + (inputTokens % 30);
  const serialization = 5 + Math.ceil(schemaLen / 500);
  const modelInference = model.includes('gpt-4') ? 80 + inputTokens * 0.4 : 40 + inputTokens * 0.2;
  const totalMs = Math.round(networkRtt + serialization + modelInference);

  const score = Math.min(100, Math.max(0, 100 - Math.ceil(totalMs / 4)));
  const breakdown = [
    { label: 'Network RTT', ms: networkRtt, pct: Math.round((networkRtt / totalMs) * 100) },
    { label: 'Serialization', ms: serialization, pct: Math.round((serialization / totalMs) * 100) },
    { label: 'Model inference', ms: Math.round(modelInference), pct: Math.round((modelInference / totalMs) * 100) },
  ];
  const chartData = breakdown.map((b, i) => ({ name: b.label, value: b.ms, fill: [ACCENT, '#8B6914', '#6B4A0A'][i] || ACCENT }));

  const summary = `Estimated end-to-end latency: ${totalMs} ms (p95-style). Input ~${inputTokens} tokens; output ~${outputTokensEst} tokens.`;
  const tips = [];
  if (promptLen > 2000) tips.push('Shorten the system prompt or move static context to a cached prefix to reduce input tokens.');
  if (hasSchema && schemaLen > 2000) tips.push('Simplify the response schema or split into smaller calls to lower serialization and inference time.');
  if (model.includes('gpt-4')) tips.push('Consider a smaller/faster model for latency-sensitive paths if quality allows.');

  return {
    score,
    totalMs,
    inputTokens,
    outputTokensEst,
    breakdown,
    chartData,
    summary,
    tips: tips.length ? tips : ['Your current setup is within typical latency ranges. Monitor p95 in production.'],
  };
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (req.method === 'GET' && (url === '/' || url === '/index.html' || url.endsWith('.css') || url.endsWith('.js') || url.endsWith('.woff2') || url.endsWith('.woff') || url.endsWith('.ttf') || url === '/robots.txt' || url === '/sitemap.xml')) {
    if (serveStatic(url === '/' ? '/index.html' : url, res)) return;
  }

  if (req.method === 'POST' && url === '/api/analyze') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const result = runLatencyAnalysis(data);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      } catch (e) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Invalid request', message: e.message }));
      }
    });
    return;
  }

  res.statusCode = 404;
  res.end('Not found');
});

server.listen(PORT, HOST, () => console.log(`API Latency Forecaster running at http://${HOST}:${PORT}`));
