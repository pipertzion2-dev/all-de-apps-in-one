(function () {
  'use strict';

  const MODES = ['hardware', 'play', 'idea', 'team', 'marketplace', 'build'];

  const LAYER_TEMPLATES = {
    hardware: [
      { layer: 'VCO / Oscillator', role: 'Tone source', output: 'CV / audio', order: 1 },
      { layer: 'Filter', role: 'Tone shaping', output: 'Filtered audio', order: 2 },
      { layer: 'VCA / Amp', role: 'Level / envelope', output: 'Audio out', order: 3 },
      { layer: 'LFO / Mod', role: 'Modulation', output: 'CV', order: 4 }
    ],
    play: [
      { layer: 'Pad / texture', role: 'Bed', output: 'Stereo stem', order: 1 },
      { layer: 'Bass', role: 'Low end', output: 'Mono stem', order: 2 },
      { layer: 'Percussion', role: 'Rhythm', output: 'Stereo stem', order: 3 },
      { layer: 'Lead / hook', role: 'Melody', output: 'Stereo stem', order: 4 }
    ],
    idea: [
      { layer: 'Concept', role: 'Core idea', output: 'Brief', order: 1 },
      { layer: 'Constraints', role: 'Scope', output: 'Spec', order: 2 },
      { layer: 'Prototype', role: 'First pass', output: 'Mock / draft', order: 3 },
      { layer: 'Review', role: 'Feedback', output: 'Iteration', order: 4 }
    ],
    team: [
      { layer: 'Owner', role: 'Decision', output: 'Approvals', order: 1 },
      { layer: 'Contributors', role: 'Execution', output: 'Deliverables', order: 2 },
      { layer: 'Reviewers', role: 'QA', output: 'Sign-off', order: 3 },
      { layer: 'Stakeholders', role: 'Visibility', output: 'Reports', order: 4 }
    ],
    marketplace: [
      { layer: 'API / core', role: 'Backend', output: 'Endpoints', order: 1 },
      { layer: 'Auth & billing', role: 'Access', output: 'Keys / usage', order: 2 },
      { layer: 'Docs & SDK', role: 'Developer UX', output: 'Docs', order: 3 },
      { layer: 'Listing', role: 'Discovery', output: 'Store page', order: 4 }
    ],
    build: [
      { layer: 'Design', role: 'Digital', output: 'Files / BOM', order: 1 },
      { layer: 'Fabrication', role: 'Physical', output: 'Parts / PCBA', order: 2 },
      { layer: 'Assembly', role: 'Integration', output: 'Unit', order: 3 },
      { layer: 'Test & ship', role: 'QA / logistics', output: 'Shipped', order: 4 }
    ]
  };

  const MAPPING_BY_MODE = {
    hardware: 'This ensemble layering step is from Svivva’s Hardware pipeline: signal path and module layers for your build.',
    play: 'This maps to Svivva Play performance modes: track and stem layers for your musical idea.',
    idea: 'This is from the Idea Engine: concept and iteration stages as layers.',
    team: 'This step is from collaboration & permissions: roles and deliverables as layers.',
    marketplace: 'This maps to API Marketplace publishing: service and listing layers.',
    build: 'This is from B.U.I.L.D. digital/physical flows: design → fabrication → assembly → ship as layers.'
  };

  const descriptionEl = document.getElementById('description');
  const modeEl = document.getElementById('mode');
  const btnGenerate = document.getElementById('btn-generate');
  const previewPlaceholder = document.getElementById('preview-placeholder');
  const previewContainer = document.getElementById('preview-container');
  const previewArtifact = document.getElementById('preview-artifact');
  const confidenceValue = document.getElementById('confidence-value');
  const confidenceDesc = document.getElementById('confidence-desc');
  const mappingExplanation = document.getElementById('mapping-explanation');
  const ctaPrimary = document.getElementById('cta-primary');
  const ctaSecondary = document.getElementById('cta-secondary');
  const stickyCtaLink = document.getElementById('sticky-cta-link');

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s == null ? '' : String(s);
    return div.innerHTML;
  }

  function track(name, data) {
    if (typeof gtag !== 'undefined') {
      gtag('event', name, data);
    }
    if (typeof console !== 'undefined' && console.debug) {
      console.debug('Analytics:', name, data);
    }
  }

  function generatePreview(description, mode, constraints) {
    const trimmed = (description || '').trim();
    const layers = LAYER_TEMPLATES[mode] || LAYER_TEMPLATES.hardware;
    const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
    let readiness = 40;
    if (wordCount >= 5) readiness = 65;
    if (wordCount >= 10) readiness = 85;
    if (wordCount >= 15 && (constraints.budget || constraints.region || constraints.genre)) readiness = 95;
    const readinessLabel = readiness >= 80 ? 'Ready for next step' : readiness >= 50 ? 'Good for preview' : 'Add more detail for a richer layering preview';

    return {
      layers,
      mode,
      readiness,
      readinessLabel,
      mappingText: MAPPING_BY_MODE[mode] || MAPPING_BY_MODE.hardware
    };
  }

  function renderPreview(data) {
    const table = document.createElement('table');
    table.setAttribute('role', 'table');
    table.innerHTML = `
      <thead><tr>
        <th>Layer</th>
        <th>Role</th>
        <th>Output</th>
        <th>Order</th>
      </tr></thead>
      <tbody>
        ${data.layers.map(l => `
          <tr>
            <td>${escapeHtml(l.layer)}</td>
            <td>${escapeHtml(l.role)}</td>
            <td>${escapeHtml(l.output)}</td>
            <td>${escapeHtml(String(l.order))}</td>
          </tr>
        `).join('')}
      </tbody>
    `;
    previewArtifact.innerHTML = '';
    previewArtifact.appendChild(table);
    confidenceValue.textContent = data.readiness + '%';
    confidenceDesc.textContent = data.readinessLabel;
    mappingExplanation.textContent = data.mappingText;
    previewPlaceholder.hidden = true;
    previewContainer.hidden = false;
  }

  function getConstraints() {
    return {
      budget: document.getElementById('constraint-budget').value.trim() || undefined,
      genre: document.getElementById('constraint-genre').value.trim() || undefined,
      materials: document.getElementById('constraint-materials').value.trim() || undefined,
      region: document.getElementById('constraint-region').value.trim() || undefined,
      collaborationSize: document.getElementById('constraint-collab').value.trim() || undefined
    };
  }

  function handleGenerate() {
    const description = descriptionEl.value;
    const mode = modeEl.value;
    const constraints = getConstraints();

    btnGenerate.disabled = true;
    btnGenerate.textContent = 'Generating…';

    requestAnimationFrame(() => {
      const t0 = performance.now();
      const result = generatePreview(description, mode, constraints);
      const elapsed = Math.round(performance.now() - t0);
      renderPreview(result);
      btnGenerate.disabled = false;
      btnGenerate.textContent = 'Generate preview';

      track('preview_generated', {
        mode: mode,
        runtime_ms: elapsed,
        has_constraints: !!(constraints.budget || constraints.region || constraints.materials || constraints.genre || constraints.collaborationSize)
      });
      track('module_interest', { module: mode });
    });
  }

  function handleCtaClick(which) {
    track('cta_click', { cta: which });
  }

  btnGenerate.addEventListener('click', handleGenerate);
  ctaPrimary.addEventListener('click', () => handleCtaClick('primary_below_preview'));
  ctaSecondary.addEventListener('click', () => handleCtaClick('secondary_open_in_svivva'));
  stickyCtaLink.addEventListener('click', () => handleCtaClick('sticky_bar'));
})();
