/**
 * Backend adapter for AI BOM Generator Playground.
 * Swap this module for your real Svivva pipeline step; keep the response shape.
 * Target: response under 3 seconds.
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;

function getMime(ext) {
  const map = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain', '.json': 'application/json', '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
  return map[ext] || 'application/octet-stream';
}

/**
 * One isolated step of Svivva pipeline: generate preview artifact from brief.
 * Replace this with real BOM/schematic/audio/flow generation.
 */
function generatePreview(body) {
  const { description = '', mode = 'hardware', budget, genre, materials, region, collaborationSize } = body;
  const modes = ['hardware', 'play', 'idea', 'team', 'marketplace', 'build'];
  const m = modes.includes(mode) ? mode : 'hardware';

  const artifacts = {
    hardware: {
      type: 'bom_table',
      title: 'Bill of Materials (Preview)',
      columns: ['Ref', 'Part', 'Value', 'Package', 'Qty', 'Est. cost'],
      rows: [
        ['R1', 'Resistor', '10k', '0603', '1', '$0.02'],
        ['C1', 'Capacitor', '100nF', '0603', '1', '$0.03'],
        ['U1', 'MCU', 'ATSAMD21', 'QFN-32', '1', '$2.50'],
        ['J1', 'Connector', 'USB-C', 'SMD', '1', '$0.45'],
        ['—', 'PCB', '2-layer', '50×30mm', '1', '$1.20'],
      ],
      totalEstimate: '$4.20',
      confidence: 0.82,
      stepLabel: 'Hardware pipeline – BOM extraction',
      fullWorkflowNote: 'In Svivva you get full schematic sync, versioning, and production-ready BOM export.',
    },
    play: {
      type: 'audio_preview',
      title: 'Play mode preview',
      waveform: [0.2, 0.5, 0.8, 0.4, 0.9, 0.3, 0.7, 0.6],
      duration: '0:08',
      confidence: 0.78,
      stepLabel: 'Svivva Play – performance preview',
      fullWorkflowNote: 'In Svivva Play you get full session routing, effects, and multi-track export.',
    },
    idea: {
      type: 'idea_report',
      title: 'Idea report (preview)',
      sections: ['Concept', 'Feasibility', 'Next steps'],
      summary: 'Idea Engine stage: concept validation. Full workflow includes scoring, dependencies, and roadmap.',
      confidence: 0.75,
      stepLabel: 'Idea Engine – concept stage',
      fullWorkflowNote: 'In Svivva you get full Idea Engine stages, scoring, and roadmap linking.',
    },
    team: {
      type: 'setup_map',
      title: 'Collaboration setup (preview)',
      roles: ['Owner', 'Editor', 'Viewer'],
      size: collaborationSize || 'Small team',
      confidence: 0.80,
      stepLabel: 'Collaboration & permissions',
      fullWorkflowNote: 'In Svivva you get real-time collaboration, roles, and project sharing.',
    },
    marketplace: {
      type: 'flow_graph',
      title: 'API Marketplace preview',
      nodes: ['Publish', 'Review', 'Discover'],
      confidence: 0.72,
      stepLabel: 'API Marketplace – publishing flow',
      fullWorkflowNote: 'In Svivva you get full API publishing, versioning, and usage analytics.',
    },
    build: {
      type: 'flow_diagram',
      title: 'B.U.I.L.D. flow (preview)',
      steps: ['Digital design', 'Physical prototype', 'Production'],
      confidence: 0.79,
      stepLabel: 'B.U.I.L.D. – digital/physical flow',
      fullWorkflowNote: 'In Svivva you get full B.U.I.L.D. flows with cost tracking and production exports.',
    },
  };

  const artifact = artifacts[m] || artifacts.hardware;
  return {
    ok: true,
    artifact: { ...artifact, description: description.slice(0, 200) },
    generatedAt: new Date().toISOString(),
  };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  let pathname = url.pathname;
  if (pathname === '/') pathname = '/index.html';
  if (pathname === '/landing' || pathname === '/landing/') pathname = '/landing.html';
  const filePath = path.join(__dirname, pathname);

  if (req.method === 'POST' && pathname === '/api/generate') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const data = body ? JSON.parse(body) : {};
        const result = generatePreview(data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: String(e.message) }));
      }
    });
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (pathname === '/index.html' || pathname === '/') {
        res.writeHead(404);
        res.end('Not found. Ensure index.html exists.');
        return;
      }
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(pathname);
    res.writeHead(200, { 'Content-Type': getMime(ext) });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`AI BOM Generator Playground at http://localhost:${PORT}`);
});
