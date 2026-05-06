/**
 * Backend template for AI Test Case Explorer.
 * Swap only the analysis logic in runAnalysis(); keep runtime under 3 seconds.
 */

const http = require('http');

const PORT = process.env.PORT || 5000;

function getPlaceholders(text) {
  const placeholders = [];
  const re = /\{\{([^}]+)\}\}|%\{([^}]+)\}|<\s*([^>]+)\s*>/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const name = (m[1] || m[2] || m[3] || '').trim();
    if (name && !placeholders.includes(name)) placeholders.push(name);
  }
  return placeholders;
}

function parseJsonSchema(text) {
  try {
    const o = typeof text === 'string' ? JSON.parse(text) : text;
    const required = Array.isArray(o.required) ? o.required : [];
    const props = o.properties || {};
    return { required, keys: Object.keys(props), properties: props };
  } catch (_) {
    return { required: [], keys: [], properties: {} };
  }
}

/** Swap analysis logic here; keep under 3s. */
function runAnalysis(body) {
  const { inputType = 'prompt', content = '' } = body;
  const raw = String(content).trim();

  let score = 50;
  const reasons = [];

  if (inputType === 'prompt') {
    const placeholders = getPlaceholders(raw);
    if (placeholders.length > 0) {
      score += Math.min(25, placeholders.length * 5);
      reasons.push('Placeholders found: good for parameterized tests.');
    }
    if (raw.length > 100) score += 10;
    if (raw.length > 500) score += 5;
    if (/step|instruction|task|output/i.test(raw)) reasons.push('Task-like structure helps test design.');
  } else if (inputType === 'schema') {
    const { required, keys } = parseJsonSchema(raw);
    if (keys.length > 0) {
      score += 20;
      reasons.push('Schema structure enables assertion generation.');
    }
    if (required.length > 0) score += 10;
  } else if (inputType === 'api') {
    if (/paths:|openapi:|swagger:/i.test(raw)) {
      score += 25;
      reasons.push('API definition supports path/parameter tests.');
    }
  }

  if (raw.length === 0) {
    score = 0;
    reasons.length = 0;
    reasons.push('No content provided.');
  }

  const testability = Math.min(100, Math.max(0, score));

  const testCases = [];
  if (inputType === 'prompt') {
    getPlaceholders(raw).slice(0, 8).forEach((name, i) => {
      testCases.push({
        id: `tc-${i + 1}`,
        type: 'Variable',
        target: name,
        suggestion: `Set "${name}" to boundary and typical values.`,
      });
    });
    if (testCases.length === 0 && raw.length > 20) {
      testCases.push({
        id: 'tc-1',
        type: 'Smoke',
        target: 'Full prompt',
        suggestion: 'Run once with a representative input and check format.',
      });
    }
  } else if (inputType === 'schema') {
    const { required, keys } = parseJsonSchema(raw);
    keys.slice(0, 6).forEach((key, i) => {
      testCases.push({
        id: `tc-${i + 1}`,
        type: required.includes(key) ? 'Required' : 'Optional',
        target: key,
        suggestion: 'Valid value, null/empty, and type violation.',
      });
    });
  } else if (inputType === 'api') {
    testCases.push(
      { id: 'tc-1', type: 'Endpoint', target: 'Paths', suggestion: 'Test each path with valid and invalid payloads.' },
      { id: 'tc-2', type: 'Status', target: 'Responses', suggestion: 'Assert 2xx, 4xx, 5xx where documented.' }
    );
  }

  const placeholders = inputType === 'prompt' ? getPlaceholders(raw) : [];
  const schemaKeys = inputType === 'schema' ? parseJsonSchema(raw).keys : [];

  return {
    inputType: body.inputType || inputType,
    model: body.model || 'generic',
    scores: { testability },
    testCases,
    reasons,
    placeholders,
    schemaKeys,
  };
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (ch) => { data += ch; });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = req.url || '';
  const method = req.method || '';

  if (method === 'GET') {
    const fs = require('fs');
    const path = require('path');
    const base = url.split('?')[0];
    const filePath = base === '/' || base === '/index.html' ? 'index.html' : base.slice(1);
    const allowed = ['index.html', 'styles.css', 'app.js', 'font-embed.css', 'robots.txt'];
    const isFont = filePath.startsWith('fonts/') && (filePath.endsWith('.ttf') || filePath.endsWith('.woff2') || filePath.endsWith('.woff'));
    if (!allowed.some((f) => filePath === f) && !isFont) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const file = path.join(__dirname, filePath);
    fs.readFile(file, (err, body) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const isHtml = filePath === 'index.html';
      let contentType = 'application/octet-stream';
      if (isHtml) contentType = 'text/html';
      else if (filePath === 'styles.css' || filePath === 'font-embed.css') contentType = 'text/css';
      else if (filePath === 'app.js') contentType = 'application/javascript';
      else if (filePath === 'robots.txt') contentType = 'text/plain';
      else if (filePath.endsWith('.ttf')) contentType = 'font/ttf';
      else if (filePath.endsWith('.woff2')) contentType = 'font/woff2';
      else if (filePath.endsWith('.woff')) contentType = 'font/woff';
      const cacheControl = isHtml ? 'no-store, no-cache, must-revalidate' : 'max-age=0, must-revalidate';
      const headers = {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
      };
      if (isFont) headers['Access-Control-Allow-Origin'] = '*';
      res.writeHead(200, headers);
      res.end(body);
    });
    return;
  }

  if (method === 'POST' && url === '/analyze') {
    let body;
    try {
      body = await parseBody(req);
    } catch (_) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      return;
    }
    const result = runAnalysis(body);
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify(result));
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`AI Test Case Explorer at http://localhost:${PORT}`);
});
