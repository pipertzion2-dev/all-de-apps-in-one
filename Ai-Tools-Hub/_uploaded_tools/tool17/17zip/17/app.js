(function () {
  'use strict';

  const ACCENT = '#0F766E';
  const MODE_LABELS = {
    hardware: 'Hardware pipeline',
    play: 'Svivva Play',
    idea: 'Idea Engine',
    team: 'Collaboration & permissions',
    marketplace: 'API Marketplace',
    build: 'B.U.I.L.D. flows'
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

  function deriveBOM(desc, mode) {
    const words = desc.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
    const bom = [];
    const components = ['IC', 'Resistor', 'Capacitor', 'Potentiometer', 'Jack', 'Switch', 'LED', 'Enclosure', 'PCB', 'Battery', 'Transformer', 'Op-amp'];
    const n = Math.min(4 + (words.length % 4), 8);
    for (let i = 0; i < n; i++) {
      const ref = String.fromCharCode(65 + (i % 3)) + (i + 1);
      const part = components[(words.length + i) % components.length];
      const val = i === 0 && words.length ? words[0] : (i % 2 ? '10k' : '100nF');
      bom.push({ ref, part, value: val, qty: 1 });
    }
    return bom;
  }

  function renderSchematicSVG(desc) {
    const w = 320;
    const h = 180;
    const blocks = Math.min(4 + (desc.length % 4), 6);
    const svg = ['<svg class="schematic-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="100%">'];
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
    return svg.join('');
  }

  function renderBOMTable(bom) {
    let html = '<table><thead><tr><th>Ref</th><th>Part</th><th>Value</th><th>Qty</th></tr></thead><tbody>';
    bom.forEach(function (r) {
      html += '<tr><td>' + r.ref + '</td><td>' + r.part + '</td><td>' + r.value + '</td><td>' + r.qty + '</td></tr>';
    });
    html += '</tbody></table>';
    return html;
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
    const step = MODE_LABELS[mode] || 'Hardware pipeline';
    return 'This preview is one step from Svivva's ' + step + '. In the full workflow you get versioning, collaboration, cost tracking, and production-ready exports.';
  }

  function updateRightPanelMapping(mode) {
    const step = MODE_LABELS[mode] || 'Hardware pipeline';
    mappingCopy.innerHTML = 'This tool runs <strong>one isolated step</strong> of Svivva's ' + step + ': concept → schematic/BOM preview. In the full platform you get versioning, multi-step flows, cost tracking, collaboration, and production-ready exports.';
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
    const bom = deriveBOM(desc, mode);
    const svg = renderSchematicSVG(desc);
    const bomTable = renderBOMTable(bom);
    const confidence = computeConfidence(desc, constraints);
    const explanation = getExplanation(mode);

    const artifact = '<div class="schematic-wrap">' + svg + '</div><div class="bom-wrap"><strong>BOM (preview)</strong>' + bomTable + '</div>';
    const result = { artifact, confidence, explanation, mode };

    const elapsed = performance.now() - start;
    if (elapsed < 100) {
      setTimeout(function () {
        showPreview(result);
        track('preview_generated', { mode, confidence, has_constraints: Object.values(constraints).some(Boolean) });
        btnGenerate.disabled = false;
      }, 120);
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
