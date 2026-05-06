/**
 * Hardware Cost Estimator Sandbox — client-side generation, <3s target.
 * Analytics: preview_generated, cta_click, module_interest.
 */

(function () {
  const SVIVVA_URL = 'https://svivva.com';

  const MODE_CONFIG = {
    hardware: {
      stepName: 'Hardware pipeline — cost estimate',
      steps: ['Concept input', 'Cost estimate (this preview)', 'BOM generation', 'Schematic layout', 'Cost tracking', 'Export'],
      artifactType: 'BOM + cost estimate',
    },
    play: {
      stepName: 'Svivva Play — setup match',
      steps: ['Intent input', 'Setup / cost match (this preview)', 'Performance modes', 'Routing & FX', 'Session export'],
      artifactType: 'Setup map',
    },
    idea: {
      stepName: 'Idea Engine — concept match',
      steps: ['Idea input', 'Concept / cost scope (this preview)', 'Stage expansion', 'Validation', 'Report export'],
      artifactType: 'Idea report',
    },
    team: {
      stepName: 'Collaboration — scope match',
      steps: ['Scenario input', 'Scope / cost match (this preview)', 'Permissions', 'Versioning', 'Handoff'],
      artifactType: 'Setup map',
    },
    marketplace: {
      stepName: 'API Marketplace — publish match',
      steps: ['Product idea', 'Cost / publish match (this preview)', 'API config', 'Listing', 'Distribution'],
      artifactType: 'Flow graph',
    },
    build: {
      stepName: 'B.U.I.L.D. — digital/physical match',
      steps: ['Build input', 'Cost estimate (this preview)', 'Digital twin', 'Physical flow', 'Production export'],
      artifactType: 'BOM + flow',
    },
  };

  function track(event, data) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', event, data);
    }
    if (typeof window.analytics !== 'undefined' && window.analytics.track) {
      window.analytics.track(event, data);
    }
    console.log('[Analytics]', event, data);
  }

  function getFormData() {
    const form = document.getElementById('brief-form');
    return {
      description: (form.querySelector('#description') || {}).value?.trim() || '',
      mode: (form.querySelector('#mode') || {}).value || 'hardware',
      budget: (form.querySelector('#budget') || {}).value?.trim() || '',
      genre: (form.querySelector('#genre') || {}).value?.trim() || '',
      materials: (form.querySelector('#materials') || {}).value?.trim() || '',
      region: (form.querySelector('#region') || {}).value?.trim() || '',
      collabSize: (form.querySelector('#collab-size') || {}).value?.trim() || '',
    };
  }

  function generatePreview(data) {
    const mode = data.mode || 'hardware';
    const desc = data.description || 'No description';
    const config = MODE_CONFIG[mode] || MODE_CONFIG.hardware;
    const hasBudget = !!data.budget;

    let html = '';
    let confidence = 58 + Math.floor(Math.random() * 32);
    if (hasBudget) confidence = Math.min(92, confidence + 5);

    if (mode === 'hardware' || mode === 'build') {
      const rows = [
        { item: 'Enclosure', part: 'Birch ply / aluminum', cost: 24, qty: 1 },
        { item: 'PCB', part: '2-layer FR4', cost: 12, qty: 1 },
        { item: 'Connectors', part: '3.5mm jacks, power', cost: 8, qty: 1 },
        { item: 'Controls', part: 'Pots, switches', cost: 18, qty: 1 },
        { item: 'MCU / USB', part: 'USB-C, MCU', cost: 14, qty: 1 },
      ];
      const subtotal = rows.reduce(function (sum, r) { return sum + r.cost * r.qty; }, 0);
      const estTotal = subtotal + Math.floor(subtotal * 0.15);
      html =
        '<div class="preview-title">' + config.artifactType + ' preview</div>' +
        '<p>Concept: ' + escapeHtml(desc) + '</p>' +
        '<table><thead><tr><th>Item</th><th>Part / material</th><th>Est. unit</th><th>Qty</th></tr></thead><tbody>';
      rows.forEach(function (r) {
        html += '<tr><td>' + escapeHtml(r.item) + '</td><td>' + escapeHtml(r.part) + '</td><td>$' + r.cost + '</td><td>' + r.qty + '</td></tr>';
      });
      html += '</tbody></table>' +
        '<p class="cost-total">Estimated BOM total (preview): ~$' + estTotal + ' <span style="font-weight:400;color:var(--text-muted)">(+ contingency)</span></p>' +
        (data.budget ? '<p><strong>Your budget constraint:</strong> ' + escapeHtml(data.budget) + '</p>' : '') +
        '<div class="schematic-placeholder">Schematic placeholder — In Svivva you get full schematic layout and versioning.</div>';
    } else if (mode === 'play') {
      html =
        '<div class="preview-title">' + config.artifactType + ' preview</div>' +
        '<p>Intent: ' + escapeHtml(desc) + '</p>' +
        '<ul style="margin:0.5rem 0 0 1rem; padding:0;">' +
        '<li>Input chain: mic/line → preamp → match</li>' +
        '<li>FX chain: reverb, delay (matched to genre)</li>' +
        '<li>Output: stereo bus</li></ul>' +
        (data.genre ? '<p><strong>Genre:</strong> ' + escapeHtml(data.genre) + '</p>' : '');
    } else if (mode === 'idea') {
      html =
        '<div class="preview-title">' + config.artifactType + ' preview</div>' +
        '<p>Idea: ' + escapeHtml(desc) + '</p>' +
        '<p><strong>Match summary:</strong> Concept aligns with cost and feasibility scope. Next in Svivva: expand stages, validate assumptions, and export idea report.</p>';
    } else if (mode === 'team') {
      html =
        '<div class="preview-title">' + config.artifactType + ' preview</div>' +
        '<p>Scenario: ' + escapeHtml(desc) + '</p>' +
        '<p><strong>Scope:</strong> Collaboration size and cost scope matched. In full Svivva: set permissions, versioning, and handoff workflows.</p>' +
        (data.collabSize ? '<p><strong>Collaboration size:</strong> ' + escapeHtml(data.collabSize) + '</p>' : '');
    } else {
      html =
        '<div class="preview-title">' + config.artifactType + ' preview</div>' +
        '<p>Product idea: ' + escapeHtml(desc) + '</p>' +
        '<p><strong>Publish path:</strong> Cost / material match → API config → Listing → Distribution. This preview is step one.</p>';
    }

    return { html: html, confidence: confidence, config: config };
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function updateMappingPanel(config) {
    const explainer = document.getElementById('mapping-explainer');
    const stepsEl = document.getElementById('mapping-steps');
    if (!explainer || !stepsEl) return;
    var stepPart = (config.stepName || '').split('\u2014')[1];
    var stepLabel = stepPart ? stepPart.trim() : config.stepName;
    explainer.textContent = 'This preview is the "' + stepLabel + '" step. In Svivva, the full flow includes:';
    stepsEl.innerHTML = config.steps.map(function (s) {
      return '<li>' + escapeHtml(s) + '</li>';
    }).join('');
  }

  function showPreview(result) {
    const placeholder = document.getElementById('preview-placeholder');
    const output = document.getElementById('preview-output');
    const confidenceBar = document.getElementById('confidence-bar');
    const confidenceFill = document.getElementById('confidence-fill');
    const confidenceValue = document.getElementById('confidence-value');
    const ctaBlock = document.getElementById('cta-below-preview');

    if (placeholder) placeholder.hidden = true;
    if (output) {
      output.hidden = false;
      output.innerHTML = result.html;
    }
    if (confidenceBar) {
      confidenceBar.hidden = false;
      if (confidenceFill) confidenceFill.style.width = result.confidence + '%';
      if (confidenceValue) confidenceValue.textContent = result.confidence + '%';
    }
    if (ctaBlock) ctaBlock.hidden = false;
    updateMappingPanel(result.config);
  }

  function handleSubmit(e) {
    e.preventDefault();
    var data = getFormData();
    if (!data.description) return;

    var btn = document.getElementById('submit-btn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Generating…';
    }

    track('module_interest', { module: data.mode });

    setTimeout(function () {
      var result = generatePreview(data);
      showPreview(result);
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Generate cost estimate';
      }
      track('preview_generated', {
        mode: data.mode,
        has_budget: !!data.budget,
        has_constraints: !!(data.genre || data.materials || data.region || data.collabSize),
      });
    }, 700);
  }

  function bindCtaClick(id, label) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', function () {
      track('cta_click', { location: label });
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    });
  }

  function init() {
    var form = document.getElementById('brief-form');
    if (form) form.addEventListener('submit', handleSubmit);

    bindCtaClick('cta-primary', 'below_preview_primary');
    bindCtaClick('cta-secondary', 'below_preview_secondary');
    bindCtaClick('sticky-cta', 'sticky_bar');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
