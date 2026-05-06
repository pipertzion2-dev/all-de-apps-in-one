(function () {
  'use strict';

  const ACCENT = '#2563EB';
  const MODE_LABELS = {
    hardware: 'Hardware pipeline',
    play: 'Svivva Play',
    idea: 'Idea Engine',
    team: 'Collaboration & permissions',
    marketplace: 'API Marketplace',
    build: 'B.U.I.L.D. flows'
  };

  const MODE_MAPPING = {
    hardware: 'Concept → schematic/BOM preview. Next: design iteration, BOM costing, 3D/mechanical, manufacturing prep.',
    play: 'Concept → performance setup map / audio preview. Next: routing, presets, live modes, export stems.',
    idea: 'Concept → idea score & feasibility. Next: refinement, validation, roadmap, collaboration.',
    team: 'Concept → collaboration flow. Next: roles, permissions, shared assets, versioning.',
    marketplace: 'Concept → publish readiness. Next: API packaging, docs, listing, versioning.',
    build: 'Concept → digital/physical flow. Next: build steps, materials, costing, export.'
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
    const step = MODE_LABELS[mode] || 'B.U.I.L.D. flows';
    return 'This preview is one step from Svivva\'s ' + step + '. In the full workflow you get versioning, collaboration, cost tracking, and production-ready exports.';
  }

  function updateRightPanelMapping(mode) {
    const step = MODE_LABELS[mode] || 'B.U.I.L.D. flows';
    const next = MODE_MAPPING[mode] || MODE_MAPPING.build;
    mappingCopy.innerHTML = 'This tool runs <strong>one isolated step</strong> of Svivva\'s ' + step + ': ' + next + ' In the full platform you get versioning, multi-step flows, cost tracking, collaboration, and production-ready exports.';
  }

  // --- Artifact renderers (BUILD system end-to-end demo) ---

  function renderSchematicBOM(desc, mode) {
    const words = desc.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
    const components = ['IC', 'Resistor', 'Capacitor', 'Potentiometer', 'Jack', 'Switch', 'LED', 'Enclosure', 'PCB', 'Battery'];
    const n = Math.min(4 + (words.length % 4), 8);
    const bom = [];
    for (let i = 0; i < n; i++) {
      const ref = String.fromCharCode(65 + (i % 3)) + (i + 1);
      const part = components[(words.length + i) % components.length];
      const val = i === 0 && words.length ? words[0] : (i % 2 ? '10k' : '100nF');
      bom.push({ ref, part, value: val, qty: 1 });
    }
    const w = 320;
    const h = 180;
    const blocks = Math.min(4 + (desc.length % 4), 6);
    let svg = ['<svg class="schematic-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="100%">'];
    const bw = 48;
    const bh = 32;
    const gap = 24;
    const startX = 20;
    const startY = 20;
    for (let i = 0; i < blocks; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const x = startX + col * (bw + gap);
      const y = startY + row * (bh + gap);
      svg.push('<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + bh + '" fill="none" stroke="' + ACCENT + '" stroke-width="1.5" rx="2"/>');
      svg.push('<text x="' + (x + bw / 2) + '" y="' + (y + bh / 2 + 4) + '" text-anchor="middle" fill="' + ACCENT + '" font-family="monospace" font-size="10">U' + (i + 1) + '</text>');
    }
    for (let i = 0; i < blocks - 1; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const x1 = startX + col * (bw + gap) + bw;
      const y1 = startY + row * (bh + gap) + bh / 2;
      const nextCol = (i + 1) % 3;
      const nextRow = Math.floor((i + 1) / 3);
      const x2 = startX + nextCol * (bw + gap);
      const y2 = startY + nextRow * (bh + gap) + bh / 2;
      svg.push('<path d="M' + x1 + ',' + y1 + ' L' + ((x1 + x2) / 2) + ',' + y1 + ' L' + ((x1 + x2) / 2) + ',' + y2 + ' L' + x2 + ',' + y2 + '" fill="none" stroke="' + ACCENT + '" stroke-width="1" opacity="0.8"/>');
    }
    svg.push('</svg>');
    let html = '<div class="schematic-wrap">' + svg.join('') + '</div><div class="bom-wrap"><strong>BOM (preview)</strong><table><thead><tr><th>Ref</th><th>Part</th><th>Value</th><th>Qty</th></tr></thead><tbody>';
    bom.forEach(function (r) {
      html += '<tr><td>' + r.ref + '</td><td>' + r.part + '</td><td>' + r.value + '</td><td>' + r.qty + '</td></tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  function renderPlaceholder3D(desc, constraints) {
    const w = 200;
    const h = 140;
    const svg = '<svg class="schematic-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="100%">' +
      '<path d="M40,100 L40,40 L100,20 L100,80 Z" fill="none" stroke="' + ACCENT + '" stroke-width="1.5"/>' +
      '<path d="M100,20 L160,40 L160,100 L100,80 Z" fill="none" stroke="' + ACCENT + '" stroke-width="1.5"/>' +
      '<path d="M40,40 L100,20 L160,40 L100,80 Z" fill="none" stroke="' + ACCENT + '" stroke-width="1" opacity="0.7"/>' +
      '<text x="' + (w/2) + '" y="' + (h - 10) + '" text-anchor="middle" fill="' + ACCENT + '" font-family="monospace" font-size="10">3D preview placeholder</text>' +
      '</svg>';
    return '<div class="placeholder-3d"><strong>3D preview (placeholder)</strong><div class="box-3d">' + svg + '</div><p>In Svivva you get full 3D/mechanical and manufacturing prep.</p></div>';
  }

  function renderPlaceholderAudio(desc, constraints) {
    const bars = 24;
    let path = 'M 0 40';
    for (var i = 0; i < bars; i++) {
      var x = 8 + i * 12;
      var h = 20 + (desc.length + i * 3) % 50;
      path += ' L' + x + ' ' + (40 - h) + ' L' + (x + 6) + ' ' + (40 - h) + ' L' + (x + 6) + ' ' + (40 + h) + ' L' + (x + 12) + ' ' + (40 + h);
    }
    const svg = '<svg class="flow-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 80" width="100%">' +
      '<path d="' + path + '" fill="none" stroke="' + ACCENT + '" stroke-width="1.5"/>' +
      '<text x="150" y="72" text-anchor="middle" fill="' + ACCENT + '" font-family="monospace" font-size="9">Audio clip preview</text>' +
      '</svg>';
    return '<div class="placeholder-audio"><strong>Audio clip (preview)</strong><div class="waveform">' + svg + '</div><p>In Svivva Play you get full routing, stems, and export.</p></div>';
  }

  function renderFlowGraph(desc, mode) {
    const w = 320;
    const h = 160;
    const nodes = mode === 'team' ? ['Concept', 'Roles', 'Share', 'Ship'] : ['Concept', 'Design', 'Build', 'Export'];
    const n = nodes.length;
    const r = 28;
    const step = (w - 80) / (n - 1);
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
    return '<div class="schematic-wrap">' + svg.join('') + '</div><p><strong>Flow (preview)</strong> — In Svivva you get the full pipeline with versioning and exports.</p>';
  }

  function renderIdeaReport(desc, constraints, confidence) {
    const feasibility = [
      constraints.budget ? 'Budget constraint applied' : 'Budget not specified',
      constraints.materials ? 'Materials scope defined' : 'Materials open',
      constraints.region ? 'Region considered' : 'Region agnostic',
      desc.length >= 30 ? 'Concept detail sufficient for scoring' : 'Add more detail for higher confidence'
    ].filter(Boolean);
    let html = '<div class="idea-report"><strong>Idea score (preview)</strong>';
    html += '<div class="score-row">Feasibility: ' + confidence + '% readiness</div>';
    html += '<ul>';
    feasibility.forEach(function (f) { html += '<li>' + f + '</li>'; });
    html += '</ul><strong>Summary</strong><p>This preview maps to one Idea Engine stage. In Svivva you get full scoring, validation, and roadmap steps.</p></div>';
    return html;
  }

  function renderSetupMap(desc, constraints) {
    const items = ['Input', 'Process', 'Output'];
    if (constraints.genre) items.push('Style: ' + constraints.genre);
    let html = '<div class="setup-map"><strong>Performance setup (preview)</strong><table><thead><tr><th>Stage</th><th>Role</th></tr></thead><tbody>';
    items.forEach(function (item, i) {
      html += '<tr><td>' + (i + 1) + '</td><td>' + item + '</td></tr>';
    });
    html += '</tbody></table><p>In Svivva Play you get full routing, presets, and export.</p></div>';
    return html;
  }

  function renderMarketplaceReadiness(desc, confidence) {
    const checks = [
      { name: 'Concept defined', ok: desc.length >= 10 },
      { name: 'Scope scorable', ok: desc.length >= 20 },
      { name: 'Publish-ready (preview)', ok: confidence >= 50 }
    ];
    let html = '<div class="idea-report"><strong>Publish readiness (preview)</strong><table><thead><tr><th>Check</th><th>Status</th></tr></thead><tbody>';
    checks.forEach(function (c) {
      html += '<tr><td>' + c.name + '</td><td>' + (c.ok ? 'OK' : '—') + '</td></tr>';
    });
    html += '</tbody></table><p>In the API Marketplace you get packaging, docs, and versioning.</p></div>';
    return html;
  }

  function buildArtifact(desc, mode, constraints, confidence) {
    switch (mode) {
      case 'hardware':
        return renderSchematicBOM(desc, mode);
      case 'play':
        return renderPlaceholderAudio(desc, constraints);
      case 'idea':
        return renderIdeaReport(desc, constraints, confidence);
      case 'team':
        return renderFlowGraph(desc, mode);
      case 'build':
        return renderPlaceholder3D(desc, constraints);
      case 'marketplace':
        return renderMarketplaceReadiness(desc, confidence);
      default:
        return renderFlowGraph(desc, 'build');
    }
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
