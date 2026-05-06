/**
 * Backend for Supplier Comparison Visualizer.
 * Serves static files and optional /api/preview. No auth. Target response under 3s.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3024;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

const MODES = ['hardware', 'play', 'idea', 'team', 'marketplace', 'build'];
const SUPPLIER_TEMPLATES = {
  hardware: [
    { name: 'PCB Fab EU', leadTime: '5–7 days', minOrder: 10, costTier: 'Mid', region: 'EU' },
    { name: 'Component Distributor A', leadTime: '3–5 days', minOrder: 1, costTier: 'Low', region: 'Global' },
    { name: 'Enclosure Supplier', leadTime: '14–21 days', minOrder: 50, costTier: 'Mid', region: 'Asia' }
  ],
  play: [
    { name: 'Backline Rental Partner', leadTime: '1–2 days', minOrder: 1, costTier: 'Variable', region: 'Local' },
    { name: 'Instrument Vendor', leadTime: '5–10 days', minOrder: 1, costTier: 'Mid', region: 'Regional' },
    { name: 'Studio Gear Supplier', leadTime: '3–7 days', minOrder: 1, costTier: 'High', region: 'Global' }
  ],
  idea: [
    { name: 'Research / Concept Partner', leadTime: '1–2 weeks', minOrder: 1, costTier: 'Variable', region: 'Remote' },
    { name: 'Prototype Shop', leadTime: '2–4 weeks', minOrder: 1, costTier: 'Mid', region: 'Regional' },
    { name: 'IP / Licensing Advisor', leadTime: '2–6 weeks', minOrder: 1, costTier: 'High', region: 'Global' }
  ],
  team: [
    { name: 'Collaboration Platform', leadTime: 'Immediate', minOrder: 1, costTier: 'Low', region: 'Cloud' },
    { name: 'Contract / Freelance Pool', leadTime: '1–2 weeks', minOrder: 1, costTier: 'Variable', region: 'Remote' },
    { name: 'Agency / Studio', leadTime: '2–4 weeks', minOrder: 1, costTier: 'High', region: 'Regional' }
  ],
  marketplace: [
    { name: 'API / Integration Provider', leadTime: '1–7 days', minOrder: 1, costTier: 'Usage-based', region: 'Global' },
    { name: 'Listing / Distribution', leadTime: '1–3 days', minOrder: 1, costTier: 'Low', region: 'Cloud' },
    { name: 'Publishing Partner', leadTime: '1–2 weeks', minOrder: 1, costTier: 'Variable', region: 'Global' }
  ],
  build: [
    { name: 'Digital Fabrication', leadTime: '3–7 days', minOrder: 1, costTier: 'Mid', region: 'Local' },
    { name: 'Physical Assembly Partner', leadTime: '7–14 days', minOrder: 10, costTier: 'Mid', region: 'Regional' },
    { name: 'Full B.U.I.L.D. Pipeline', leadTime: '2–4 weeks', minOrder: 1, costTier: 'Variable', region: 'Hybrid' }
  ]
};

const mappingByMode = {
  hardware: 'This comparison step is from Svivva’s Hardware pipeline: part and vendor options for your build.',
  play: 'This maps to Svivva Play performance modes: backline, instruments, and gear options.',
  idea: 'This is from the Idea Engine: concept and prototype partner comparison.',
  team: 'This step is from collaboration & permissions: team and partner options.',
  marketplace: 'This maps to API Marketplace publishing: integration and distribution options.',
  build: 'This is from B.U.I.L.D. digital/physical flows: fabrication and assembly options.'
};

function runPreview(description, mode, constraints) {
  const trimmed = (description || '').trim();
  const suppliers = SUPPLIER_TEMPLATES[mode] || SUPPLIER_TEMPLATES.hardware;
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  let readiness = 40;
  if (wordCount >= 5) readiness = 65;
  if (wordCount >= 10) readiness = 85;
  if (wordCount >= 15 && (constraints.budget || constraints.region)) readiness = 95;
  const readinessLabel = readiness >= 80 ? 'Ready for next step' : readiness >= 50 ? 'Good for preview' : 'Add more detail for better comparison';
  return {
    suppliers,
    readiness,
    readinessLabel,
    mappingText: mappingByMode[mode] || mappingByMode.hardware
  };
}

function serveStatic(filePath, res) {
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

  if (req.method === 'POST' && pathname === '/api/preview') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { description = '', mode = 'hardware', constraints = {} } = JSON.parse(body);
        const result = runPreview(description, MODES.includes(mode) ? mode : 'hardware', constraints || {});
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
  console.log('Supplier Comparison Visualizer running:');
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
