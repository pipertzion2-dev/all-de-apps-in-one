/**
 * Backend template for LLM Prompt Linter.
 * Reuse this and swap only the analysis logic in runLinter().
 * Response kept under 3 seconds.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 5000;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.ico': 'image/x-icon'
};

function runLinter(text, type, model) {
  const checks = [];
  let totalScore = 0;
  const trimmed = (text || '').trim();
  const len = trimmed.length;
  const estTokens = Math.ceil(len / 4);

  const add = (name, status, detail, score) => {
    const s = score ?? (status === 'ok' ? 100 : status === 'warn' ? 50 : 0);
    checks.push({ name, status, detail, score: s });
    totalScore += s;
  };

  if (len === 0) {
    add('Has content', 'fail', 'No prompt or schema provided.', 0);
  } else {
    add('Has content', 'ok', `${len} characters, ~${estTokens} tokens (approx).`, 100);
  }

  const imperative = /\b(you must|you should|do not|always|never|list|write|return|output|extract|summarize|classify)\b/i.test(trimmed);
  const vague = /\b(something|somehow|maybe|try to|perhaps|a bit|kind of)\b/i.test(trimmed);
  if (vague && !imperative) {
    add('Clarity', 'warn', 'Prompt uses vague language. Prefer imperative, specific instructions.', 45);
  } else if (imperative) {
    add('Clarity', 'ok', 'Uses clear, imperative instructions.', 100);
  } else if (len > 50) {
    add('Clarity', 'warn', 'Consider adding explicit instructions (e.g. "You must...", "Return...").', 55);
  } else {
    add('Clarity', 'ok', 'Short prompt; add more structure for complex tasks.', 70);
  }

  const hasSections = /(^|\n)\s*(#+|===|---|\*\*|Step \d|Part \d|Section)/im.test(trimmed) || /\[.*\]|{.*}/s.test(trimmed);
  if (len > 200 && !hasSections) {
    add('Structure', 'warn', 'Long prompt without clear sections. Use headers or delimiters.', 50);
  } else {
    add('Structure', 'ok', hasSections ? 'Sections or structure detected.' : 'Length is fine for simple prompts.', 100);
  }

  const risky = /\b(ignore|forget|override|system prompt|previous instructions|new instructions)\b/i.test(trimmed);
  if (risky) {
    add('Safety', 'warn', 'Phrasing may be vulnerable to prompt injection. Tighten scope.', 40);
  } else {
    add('Safety', 'ok', 'No obvious injection-prone phrasing detected.', 100);
  }

  if ((type === 'schema' || type === 'api') && trimmed) {
    try {
      const parsed = JSON.parse(trimmed);
      const hasProps = typeof parsed === 'object' && (Object.keys(parsed).length > 0 || Array.isArray(parsed));
      add('Schema validity', hasProps ? 'ok' : 'warn', hasProps ? 'Valid JSON with content.' : 'Valid JSON but empty.', hasProps ? 100 : 60);
    } catch (_) {
      add('Schema validity', 'fail', 'Invalid JSON. Check brackets and commas.', 0);
    }
  }

  const hasRole = /\b(you are|act as|role:|system:|assistant)\b/i.test(trimmed);
  if (len > 100 && !hasRole) {
    add('Role clarity', 'warn', 'Consider defining the assistant role (e.g. "You are...").', 60);
  } else {
    add('Role clarity', 'ok', hasRole ? 'Role or system context present.' : 'Acceptable for short prompts.', 100);
  }

  const count = checks.length;
  const overall = count ? Math.round(totalScore / count) : 0;

  return {
    overall: Math.min(100, overall),
    checks,
    metrics: { length: len, estTokens, type: type || 'prompt', model: model || 'any' }
  };
}

function serveStatic(filePath, res) {
  // Strip query/hash so Safari and others don't break on ? or #
  const pathname = filePath.replace(/[#?].*$/, '').replace(/\/$/, '') || '/';
  const toServe = pathname === '/' ? '/index.html' : pathname;
  const ext = path.extname(toServe);
  const fullPath = path.resolve(__dirname, toServe.startsWith('/') ? toServe.slice(1) : toServe);
  if (!fullPath.startsWith(__dirname + path.sep) && fullPath !== __dirname) {
    res.writeHead(403);
    res.end();
    return;
  }
  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url || '/', false);
  const pathname = parsed.pathname || '/';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && pathname === '/api/lint') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { text = '', type = 'prompt', model = '' } = JSON.parse(body);
        const result = runLinter(text, type, model);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (_) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    return;
  }

  serveStatic(pathname, res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`LLM Prompt Linter running:`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  http://127.0.0.1:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is in use. Try: PORT=${PORT + 1} node server.js`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
