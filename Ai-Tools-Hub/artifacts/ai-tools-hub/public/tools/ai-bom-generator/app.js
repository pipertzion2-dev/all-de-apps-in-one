/**
 * AI BOM Generator Playground — frontend.
 * Calls backend adapter /api/generate; renders preview and tracks analytics.
 */

const form = document.getElementById('brief-form');
const description = document.getElementById('description');
const mode = document.getElementById('mode');
const generateBtn = document.getElementById('generate-btn');
const placeholder = document.getElementById('preview-placeholder');
const output = document.getElementById('preview-output');
const artifactEl = document.getElementById('preview-artifact');
const confidenceFill = document.getElementById('confidence-fill');
const confidenceValue = document.getElementById('confidence-value');
const previewExplanation = document.getElementById('preview-explanation');
const ctaPrimary = document.getElementById('cta-primary');
const ctaSecondary = document.getElementById('cta-secondary');
const ctaBarLink = document.getElementById('cta-bar-link');

// Analytics (replace with your implementation)
function track(event, data = {}) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', event, data);
  }
  if (typeof window.analytics !== 'undefined' && window.analytics.track) {
    window.analytics.track(event, data);
  }
  console.log('[Analytics]', event, data);
}

function renderBomTable(artifact) {
  const { columns = [], rows = [], totalEstimate, title } = artifact;
  let html = `<div class="artifact-title">${escapeHtml(title)}</div>`;
  html += '<table class="bom-table"><thead><tr>';
  columns.forEach((c) => { html += `<th>${escapeHtml(c)}</th>`; });
  html += '</tr></thead><tbody>';
  rows.forEach((row) => {
    html += '<tr>';
    row.forEach((cell) => { html += `<td>${escapeHtml(String(cell))}</td>`; });
    html += '</tr>';
  });
  html += '</tbody></table>';
  if (totalEstimate) html += `<div class="bom-total">Total (est.): ${escapeHtml(totalEstimate)}</div>`;
  return html;
}

function renderWaveform(artifact) {
  const { title, waveform = [], duration } = artifact;
  let html = `<div class="artifact-title">${escapeHtml(title)}</div>`;
  if (duration) html += `<div style="font-size:0.8rem;color:var(--text-muted)">${escapeHtml(duration)}</div>`;
  html += '<div class="waveform">';
  waveform.forEach((v) => {
    const h = Math.max(4, Math.round(Number(v) * 40));
    html += `<span style="height:${h}px" title="${v}"></span>`;
  });
  html += '</div>';
  return html;
}

function renderFlowNodes(artifact) {
  const { title, nodes = [], steps } = artifact;
  const list = nodes.length ? nodes : steps || [];
  let html = `<div class="artifact-title">${escapeHtml(title)}</div>`;
  html += '<div class="flow-nodes">';
  list.forEach((n) => { html += `<span class="flow-node">${escapeHtml(String(n))}</span>`; });
  html += '</div>';
  return html;
}

function renderIdeaReport(artifact) {
  const { title, sections = [], summary } = artifact;
  let html = `<div class="artifact-title">${escapeHtml(title)}</div>`;
  if (sections.length) {
    html += '<ul style="margin:0.5rem 0;padding-left:1.25rem">';
    sections.forEach((s) => { html += `<li>${escapeHtml(s)}</li>`; });
    html += '</ul>';
  }
  if (summary) html += `<p style="margin:0.5rem 0;font-size:0.875rem;color:var(--text-muted)">${escapeHtml(summary)}</p>`;
  return html;
}

function renderSetupMap(artifact) {
  const { title, roles = [], size } = artifact;
  let html = `<div class="artifact-title">${escapeHtml(title)}</div>`;
  if (roles.length) {
    html += '<ul style="margin:0.5rem 0;padding-left:1.25rem">';
    roles.forEach((r) => { html += `<li>${escapeHtml(r)}</li>`; });
    html += '</ul>';
  }
  if (size) html += `<p style="margin:0.5rem 0;font-size:0.875rem">Size: ${escapeHtml(size)}</p>`;
  return html;
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

/** Client-side fallback when server is not available (e.g. static hosting). Same shape as server. */
function mockPreview(payload) {
  const { mode = 'hardware', collaborationSize } = payload;
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
      confidence: 0.8,
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
  return artifacts[mode] || artifacts.hardware;
}

function renderArtifact(artifact) {
  const type = artifact.type || 'bom_table';
  switch (type) {
    case 'bom_table':
      return renderBomTable(artifact);
    case 'audio_preview':
      return renderWaveform(artifact);
    case 'flow_graph':
    case 'flow_diagram':
      return renderFlowNodes(artifact);
    case 'idea_report':
      return renderIdeaReport(artifact);
    case 'setup_map':
      return renderSetupMap(artifact);
    default:
      return `<div class="artifact-title">${escapeHtml(artifact.title || 'Preview')}</div><pre style="font-size:0.8rem;overflow:auto">${escapeHtml(JSON.stringify(artifact, null, 2))}</pre>`;
  }
}

async function generate() {
  const payload = {
    description: description.value.trim(),
    mode: mode.value,
    budget: document.getElementById('budget').value.trim() || undefined,
    genre: document.getElementById('genre').value.trim() || undefined,
    materials: document.getElementById('materials').value.trim() || undefined,
    region: document.getElementById('region').value.trim() || undefined,
    collaborationSize: document.getElementById('collaborationSize').value.trim() || undefined,
  };

  generateBtn.disabled = true;
  const start = Date.now();

  try {
    let data;
    try {
      const res = await fetch('/api/tools/ai-bom-generator/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      data = await res.json();
      if (!res.ok) data = { ok: false, error: data.error || 'Generation failed' };
    } catch (_) {
      data = { ok: true, artifact: mockPreview(payload) };
    }
    const elapsed = Date.now() - start;

    if (!data.ok) {
      throw new Error(data.error || 'Generation failed');
    }

    const art = data.artifact || {};
    artifactEl.innerHTML = renderArtifact(art);
    const confidence = Math.round((art.confidence ?? 0) * 100);
    confidenceFill.style.width = `${confidence}%`;
    confidenceValue.textContent = `${confidence}%`;
    previewExplanation.textContent = art.fullWorkflowNote || art.stepLabel || '';

    placeholder.hidden = true;
    output.hidden = false;

    track('preview_generated', {
      mode: payload.mode,
      elapsed_ms: elapsed,
      confidence,
    });
    track('module_interest', { module: payload.mode });
  } catch (e) {
    artifactEl.innerHTML = `<p style="color:#b91c1c">${escapeHtml(e.message)}</p>`;
    confidenceFill.style.width = '0%';
    confidenceValue.textContent = '—%';
    previewExplanation.textContent = '';
    placeholder.hidden = true;
    output.hidden = false;
  } finally {
    generateBtn.disabled = false;
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  generate();
});

function bindCta(id, eventName) {
  const el = document.getElementById(id);
  if (el && el.tagName === 'A') {
    el.addEventListener('click', () => track(eventName, { cta: id }));
  }
}

bindCta('cta-primary', 'cta_click');
bindCta('cta-secondary', 'cta_click');
bindCta('cta-bar-link', 'cta_click');
