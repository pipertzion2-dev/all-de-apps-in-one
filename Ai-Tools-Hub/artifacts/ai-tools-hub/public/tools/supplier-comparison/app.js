(function () {
  'use strict';

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
    const suppliers = SUPPLIER_TEMPLATES[mode] || SUPPLIER_TEMPLATES.hardware;
    const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
    let readiness = 40;
    if (wordCount >= 5) readiness = 65;
    if (wordCount >= 10) readiness = 85;
    if (wordCount >= 15 && (constraints.budget || constraints.region)) readiness = 95;
    const readinessLabel = readiness >= 80 ? 'Ready for next step' : readiness >= 50 ? 'Good for preview' : 'Add more detail for better comparison';

    const mappingByMode = {
      hardware: 'This comparison step is from Svivva’s Hardware pipeline: part and vendor options for your build.',
      play: 'This maps to Svivva Play performance modes: backline, instruments, and gear options.',
      idea: 'This is from the Idea Engine: concept and prototype partner comparison.',
      team: 'This step is from collaboration & permissions: team and partner options.',
      marketplace: 'This maps to API Marketplace publishing: integration and distribution options.',
      build: 'This is from B.U.I.L.D. digital/physical flows: fabrication and assembly options.'
    };

    return {
      suppliers,
      readiness,
      readinessLabel,
      mappingText: mappingByMode[mode] || mappingByMode.hardware
    };
  }

  function renderPreview(data) {
    const table = document.createElement('table');
    table.setAttribute('role', 'table');
    table.innerHTML = `
      <thead><tr>
        <th>Supplier / option</th>
        <th>Lead time</th>
        <th>Min order</th>
        <th>Cost tier</th>
        <th>Region</th>
      </tr></thead>
      <tbody>
        ${data.suppliers.map(s => `
          <tr>
            <td>${escapeHtml(s.name)}</td>
            <td>${escapeHtml(s.leadTime)}</td>
            <td>${escapeHtml(s.minOrder)}</td>
            <td>${escapeHtml(s.costTier)}</td>
            <td>${escapeHtml(s.region)}</td>
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
    btnGenerate.textContent = 'Comparing…';

    requestAnimationFrame(() => {
      const t0 = performance.now();
      const result = generatePreview(description, mode, constraints);
      const elapsed = Math.round(performance.now() - t0);
      renderPreview(result);
      btnGenerate.disabled = false;
      btnGenerate.textContent = 'Compare suppliers';

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
