(function () {
  'use strict';

  const ACCENT = '#7C3AED';
  const MODE_LABELS = {
    hardware: 'Hardware pipeline',
    play: 'Svivva Play',
    idea: 'Idea Engine',
    team: 'Collaboration & permissions',
    marketplace: 'API Marketplace',
    build: 'B.U.I.L.D. flows'
  };

  const MODE_MAPPING = {
    hardware: 'Concept → idea history & schematic/BOM comparison. Next: design iteration, BOM costing, 3D/mechanical, manufacturing prep.',
    play: 'Concept → idea history & performance setup comparison. Next: routing, presets, live modes, export stems.',
    idea: 'Concept → idea history & comparison. Next: refinement, validation, roadmap, collaboration.',
    team: 'Concept → idea history & collaboration flow comparison. Next: roles, permissions, shared assets, versioning.',
    marketplace: 'Concept → idea history & publish readiness comparison. Next: API packaging, docs, listing, versioning.',
    build: 'Concept → idea history & digital/physical flow comparison. Next: build steps, materials, costing, export.'
  };

  const form = document.getElementById('preview-form');
  const description = document.getElementById('description');
  const modeSelect = document.getElementById('mode');
  const placeholder = document.getElementById('preview-placeholder');
  const output = document.getElementById('preview-output');
  const artifactEl = document.getElementById('preview-artifact');
  const confidenceFill = document.getElementById('confidence-fill');
  const confidenceValue = document.getElementById('confidence-value');
  const explanationEl = document.getElementById('preview-explanation');
  const mappingCopy = document.getElementById('mapping-copy');
  const btnGenerate = document.getElementById('btn-generate');

  function track(event, data) {
    if (typeof window.analytics !== 'undefined') {
      window.analytics.track(event, data);
    }
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', event, data);
    }
    console.log('[Analytics]', event, data);
  }

  function getConstraints() {
    return {
      budget: document.getElementById('budget').value.trim(),
      genre: document.getElementById('genre').value.trim(),
      materials: document.getElementById('materials').value.trim(),
      region: document.getElementById('region').value.trim(),
      collab_size: document.getElementById('collab_size').value.trim()
    };
  }

  function computeConfidence(desc, constraints) {
    let score = 40;
    if (desc.length >= 20) score += 20;
    if (desc.length >= 50) score += 15;
    const filled = [constraints.budget, constraints.genre, constraints.materials, constraints.region, constraints.collab_size].filter(Boolean).length;
    score += filled * 5;
    return Math.min(95, Math.max(35, score));
  }

  function getExplanation(mode) {
    const step = MODE_LABELS[mode] || 'Idea Engine';
    return 'This preview is one step from Svivva\'s ' + step + ': idea history & comparison. In the full workflow you get full versioning, collaboration, cost tracking, and production-ready exports.';
  }

  function updateRightPanelMapping(mode) {
    const step = MODE_LABELS[mode] || 'Idea Engine';
    const next = MODE_MAPPING[mode] || MODE_MAPPING.idea;
    mappingCopy.innerHTML = 'This tool runs <strong>one isolated step</strong> of Svivva\'s ' + step + ': ' + next + ' In the full platform you get versioning, multi-step flows, cost tracking, collaboration, and production-ready exports.';
  }

  // --- Idea History & Comparison Viewer artifact renderers ---

  function renderIdeaHistoryTimeline(desc, mode, constraints) {
    const words = desc.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
    const stages = ['Draft', 'Refined', 'Validated', 'Scoped'];
    const n = Math.min(3 + (words.length % 2), 4);
    let html = '<div class="history-timeline"><strong>Idea history (preview)</strong>';
    for (let i = 0; i < n; i++) {
      const label = stages[i] + (i === 0 ? ' — ' + (desc.slice(0, 30) + (desc.length > 30 ? '…' : '')) : '');
      html += '<div class="timeline-row"><span class="timeline-dot"></span><span>' + label + '</span></div>';
    }
    html += '</div>';
    return html;
  }

  function renderComparisonTable(desc, mode, constraints, confidence) {
    const words = desc.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
    const variants = [
      { name: 'Variant A', focus: words[0] || 'core', readiness: confidence },
      { name: 'Variant B', focus: words[1] || 'scope', readiness: Math.min(90, confidence + 10) },
      { name: 'Variant C', focus: words[2] || 'detail', readiness: Math.min(85, confidence + 5) }
    ];
    let html = '<div class="comparison-section"><strong>Comparison (preview)</strong>';
    html += '<table><thead><tr><th>Version</th><th>Focus</th><th>Readiness</th></tr></thead><tbody>';
    variants.forEach(function (v) {
      html += '<tr><td>' + v.name + '</td><td>' + v.focus + '</td><td>' + v.readiness + '%</td></tr>';
    });
    html += '</tbody></table><p>In Svivva you get full version history, diff views, and side-by-side comparison.</p></div>';
    return html;
  }

  function renderFlowGraph(desc, mode) {
    const w = 320;
    const h = 160;
    const nodes = ['History', 'Compare', 'Export'];
    const n = nodes.length;
    const step = (w - 80) / (n - 1);
    const r = 28;
    const svg = ['<svg class="flow-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="100%">'];
    for (let i = 0; i < n; i++) {
      const x = 40 + i * step;
      const y = h / 2;
      svg.push('<circle class="flow-node" cx="' + x + '" cy="' + y + '" r="' + r + '" stroke-width="1.5"/>');
      svg.push('<text x="' + x + '" y="' + (y + 4) + '" text-anchor="middle" fill="' + ACCENT + '" font-family="monospace" font-size="9">' + nodes[i] + '</text>');
      if (i < n - 1) {
        svg.push('<path class="flow-edge" d="M' + (x + r) + ',' + y + ' L' + (x + step - r) + ',' + y + '" stroke-width="1"/>');
      }
    }
    svg.push('</svg>');
    return '<div class="schematic-wrap">' + svg.join('') + '</div><p><strong>Idea history & comparison flow (preview)</strong> — In Svivva you get the full pipeline with versioning and exports.</p>';
  }

  function buildArtifact(desc, mode, constraints, confidence) {
    const historyHtml = renderIdeaHistoryTimeline(desc, mode, constraints);
    const comparisonHtml = renderComparisonTable(desc, mode, constraints, confidence);
    if (mode === 'team' || mode === 'build') {
      return historyHtml + renderFlowGraph(desc, mode);
    }
    return historyHtml + comparisonHtml;
  }

  function showPreview(result) {
    placeholder.hidden = true;
    output.hidden = false;
    artifactEl.innerHTML = result.artifact;
    const pct = result.confidence;
    confidenceFill.style.width = pct + '%';
    confidenceValue.textContent = pct + '%';
    explanationEl.textContent = result.explanation;
    updateRightPanelMapping(result.mode);
  }

  function generatePreview() {
    const desc = description.value.trim();
    if (!desc) return;

    btnGenerate.disabled = true;
    const mode = modeSelect.value;
    const constraints = getConstraints();

    track('module_interest', { module: mode });

    const start = performance.now();
    const confidence = computeConfidence(desc, constraints);
    const artifact = buildArtifact(desc, mode, constraints, confidence);
    const explanation = getExplanation(mode);
    const result = { artifact, confidence, explanation, mode };
    const elapsed = performance.now() - start;

    if (elapsed < 80) {
      setTimeout(function () {
        showPreview(result);
        track('preview_generated', { mode, confidence, has_constraints: Object.values(constraints).some(Boolean) });
        btnGenerate.disabled = false;
      }, 60);
    } else {
      showPreview(result);
      track('preview_generated', { mode, confidence, has_constraints: Object.values(constraints).some(Boolean) });
      btnGenerate.disabled = false;
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    generatePreview();
  });

  function bindCta(id, eventName) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('click', function () { track(eventName, { source: id }); });
  }

  bindCta('cta-primary', 'cta_click');
  bindCta('cta-secondary', 'cta_click');
  bindCta('sticky-cta', 'cta_click');
})();
