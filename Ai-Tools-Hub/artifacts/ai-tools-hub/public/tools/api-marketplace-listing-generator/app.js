(function () {
  'use strict';

  const ACCENT = '#B45309';
  const MODE_LABELS = {
    hardware: 'Hardware pipeline',
    play: 'Svivva Play',
    idea: 'Idea Engine',
    team: 'Collaboration & permissions',
    marketplace: 'API Marketplace',
    build: 'B.U.I.L.D. flows'
  };

  const MODE_MAPPING = {
    hardware: 'Concept → listing-style preview for hardware APIs. Next: design iteration, BOM costing, 3D/mechanical, manufacturing prep.',
    play: 'Concept → listing preview for performance/play APIs. Next: routing, presets, live modes, export stems.',
    idea: 'Concept → listing preview for idea/validation APIs. Next: refinement, validation, roadmap, collaboration.',
    team: 'Concept → listing preview for collaboration APIs. Next: roles, permissions, shared assets, versioning.',
    marketplace: 'Concept → API marketplace listing preview. Next: API packaging, docs, listing publish, versioning.',
    build: 'Concept → listing preview for build/digital-physical APIs. Next: build steps, materials, costing, export.'
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
    const step = MODE_LABELS[mode] || 'API Marketplace';
    return 'This preview is one step from Svivva\'s ' + step + ': API marketplace listing draft. In the full workflow you get API packaging, docs, versioning, and production-ready publish.';
  }

  function updateRightPanelMapping(mode) {
    const step = MODE_LABELS[mode] || 'API Marketplace';
    const next = MODE_MAPPING[mode] || MODE_MAPPING.marketplace;
    mappingCopy.innerHTML = 'This tool runs <strong>one isolated step</strong> of Svivva\'s ' + step + ': ' + next + ' In the full platform you get versioning, multi-step flows, cost tracking, collaboration, and production-ready exports.';
  }

  // --- API Marketplace Listing Generator artifact ---

  function toTitle(desc) {
    const s = desc.trim();
    if (s.length <= 50) return s.charAt(0).toUpperCase() + s.slice(1);
    const first = s.slice(0, 47).trim();
    const last = first.lastIndexOf(' ');
    const title = last > 20 ? first.slice(0, last) : first;
    return (title.charAt(0).toUpperCase() + title.slice(1)) + '…';
  }

  function toSlug(desc) {
    return desc.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 40);
  }

  function deriveEndpoints(desc, mode) {
    const words = desc.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
    const base = words[0] || 'api';
    const endpoints = [
      { method: 'GET', path: '/' + base, brief: 'List or search' },
      { method: 'GET', path: '/' + base + '/:id', brief: 'Get single item' },
      { method: 'POST', path: '/' + base, brief: 'Create' }
    ];
    if (words.length > 2) {
      endpoints.push({ method: 'PATCH', path: '/' + base + '/:id', brief: 'Update' });
    }
    return endpoints;
  }

  function deriveTags(desc, constraints) {
    const tags = [];
    const combined = [desc, constraints.genre, constraints.region].filter(Boolean).join(' ').toLowerCase();
    const pool = ['REST', 'API', 'synth', 'hardware', 'play', 'idea', 'team', 'marketplace', 'build', 'discovery', 'search', 'preset', 'export'];
    const used = new Set();
    for (const t of pool) {
      if (combined.indexOf(t) !== -1 && !used.has(t)) {
        used.add(t);
        tags.push(t);
      }
      if (tags.length >= 5) break;
    }
    if (tags.length < 3) {
      tags.push('API', 'marketplace');
      if (!tags.includes('REST')) tags.push('REST');
    }
    return tags.slice(0, 6);
  }

  function renderListingPreview(desc, mode, constraints, confidence) {
    const title = toTitle(desc);
    const slug = toSlug(desc);
    const descSnippet = desc.length > 120 ? desc.slice(0, 117).trim() + '…' : desc;
    const endpoints = deriveEndpoints(desc, mode);
    const tags = deriveTags(desc, constraints);
    const tier = constraints.budget ? 'Pro' : (confidence >= 70 ? 'Pro' : 'Free');

    let html = '<div class="listing-preview">';
    html += '<strong>Listing preview</strong>';
    html += '<div class="listing-title">' + escapeHtml(title) + '</div>';
    html += '<div class="listing-desc">' + escapeHtml(descSnippet) + '</div>';
    html += '<div class="listing-meta"><strong>Slug</strong> ' + escapeHtml(slug) + ' &nbsp;|&nbsp; <strong>Tier</strong> ' + tier + '</div>';
    html += '<div class="listing-tags">';
    tags.forEach(function (t) {
      html += '<span>' + escapeHtml(t) + '</span>';
    });
    html += '</div>';
    html += '<div class="listing-endpoints"><strong>Endpoints (preview)</strong>';
    html += '<table><thead><tr><th>Method</th><th>Path</th><th>Brief</th></tr></thead><tbody>';
    endpoints.forEach(function (e) {
      html += '<tr><td>' + escapeHtml(e.method) + '</td><td><code>' + escapeHtml(e.path) + '</code></td><td>' + escapeHtml(e.brief) + '</td></tr>';
    });
    html += '</tbody></table></div>';
    html += '<p class="listing-note">In Svivva you get full API packaging, docs, versioning, and one-click publish to the marketplace.</p>';
    html += '</div>';
    return html;
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function buildArtifact(desc, mode, constraints, confidence) {
    return renderListingPreview(desc, mode, constraints, confidence);
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
