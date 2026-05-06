(function () {
  'use strict';

  const MODES = {
    hardware: { artifact: 'schematic', label: 'Hardware pipeline' },
    play: { artifact: 'audio', label: 'Svivva Play performance' },
    idea: { artifact: 'idea-report', label: 'Idea Engine' },
    team: { artifact: 'setup-map', label: 'Collaboration & permissions' },
    marketplace: { artifact: 'flow-graph', label: 'API Marketplace' },
    build: { artifact: 'bom', label: 'B.U.I.L.D. digital/physical' }
  };

  const MAPPING_COPY = {
    hardware: 'This preview is one step from the Hardware pipeline: a schematic/BOM-style output. In Svivva you get full versioning, cost tracking, and production exports.',
    play: 'This preview is one step from Svivva Play: a melody/audio-style idea. In Svivva you get full performance modes, layering, and export.',
    idea: 'This preview is one step from the Idea Engine: a structured idea report. In Svivva you get full staging, branching, and team alignment.',
    team: 'This preview is one step from collaboration: a setup map. In Svivva you get permissions, roles, and shared workflows.',
    marketplace: 'This preview is one step from the API Marketplace: a flow graph. In Svivva you get publishing, versioning, and discovery.',
    build: 'This preview is one step from B.U.I.L.D.: a BOM/digital-physical flow. In Svivva you get full build tracking and production-ready outputs.'
  };

  function track(event, data) {
    if (typeof window.analytics !== 'undefined' && window.analytics.track) {
      window.analytics.track(event, data || {});
    }
    if (typeof window.gtag === 'function') {
      window.gtag('event', event, data || {});
    }
    console.log('[Analytics]', event, data);
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function renderArtifact(mode, description, constraints) {
    const config = MODES[mode] || MODES.play;
    const root = document.getElementById('preview-artifact');
    root.className = 'preview-artifact ' + config.artifact + '-preview';
    root.innerHTML = '';

    const title = document.createElement('div');
    title.style.fontWeight = '600';
    title.style.marginBottom = '0.5rem';
    title.textContent = 'Preview: ' + config.label;
    root.appendChild(title);

    switch (config.artifact) {
      case 'audio':
        var wave = document.createElement('div');
        wave.className = 'waveform-placeholder';
        root.appendChild(wave);
        var summary = document.createElement('p');
        summary.style.margin = '0.5rem 0 0 0';
        summary.style.fontSize = '0.9rem';
        summary.textContent = 'Melody idea: "' + (description.slice(0, 80) + (description.length > 80 ? '\u2026' : '')) + '" \u2014 interpolated phrase ready for the full Play pipeline.';
        root.appendChild(summary);
        break;
      case 'schematic':
        root.appendChild(document.createTextNode('Schematic block: ' + (description.slice(0, 60) + '\u2026')));
        if (constraints.materials) {
          root.appendChild(document.createElement('br'));
          root.appendChild(document.createTextNode('Materials: ' + constraints.materials));
        }
        break;
      case 'idea-report':
        var report = document.createElement('div');
        report.innerHTML = '<p><strong>Concept:</strong> ' + escapeHtml(description.slice(0, 200)) + '</p>' +
          (constraints.genre ? '<p><strong>Genre:</strong> ' + escapeHtml(constraints.genre) + '</p>' : '') +
          '<p>Idea stage: interpolated \u2014 ready for next Idea Engine steps in Svivva.</p>';
        root.appendChild(report);
        break;
      case 'setup-map':
        root.appendChild(document.createTextNode('Setup map: ' + (constraints.collab || 'Team') + ' \u2014 ' + (description.slice(0, 100) + '\u2026')));
        break;
      case 'flow-graph':
        root.appendChild(document.createTextNode('Flow node: "' + (description.slice(0, 50) + '\u2026') + '" \u2014 Marketplace publish preview.'));
        break;
      case 'bom':
        root.appendChild(document.createTextNode('BOM preview: ' + (description.slice(0, 60) + '\u2026')));
        if (constraints.budget) {
          root.appendChild(document.createElement('br'));
          root.appendChild(document.createTextNode('Budget: ' + constraints.budget));
        }
        break;
      default:
        root.appendChild(document.createTextNode('Preview: ' + description.slice(0, 120)));
    }
  }

  function showPreview(mode, description, constraints, confidence) {
    var placeholder = document.getElementById('preview-placeholder');
    var output = document.getElementById('preview-output');
    placeholder.hidden = true;
    output.hidden = false;

    renderArtifact(mode, description, constraints);

    var fill = document.getElementById('confidence-fill');
    var valueEl = document.getElementById('confidence-value');
    var pct = Math.min(100, Math.max(0, confidence));
    fill.style.width = pct + '%';
    valueEl.textContent = pct + '% readiness';

    var note = document.getElementById('mapping-note');
    note.textContent = MAPPING_COPY[mode] || MAPPING_COPY.play;

    var stepCurrent = document.getElementById('step-current');
    if (stepCurrent) {
      stepCurrent.hidden = false;
      stepCurrent.textContent = 'Current step: ' + (MODES[mode] && MODES[mode].label ? MODES[mode].label : mode) + '.';
    }
  }

  function getConstraints() {
    return {
      budget: document.getElementById('constraint-budget').value.trim(),
      genre: document.getElementById('constraint-genre').value.trim(),
      materials: document.getElementById('constraint-materials').value.trim(),
      region: document.getElementById('constraint-region').value.trim(),
      collab: document.getElementById('constraint-collab').value.trim()
    };
  }

  /** Target end-to-end runtime under 3 seconds; simulate fast response (~500\u2013800ms). */
  function generatePreview(description, mode, constraints) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        var confidence = 65 + Math.floor(Math.random() * 25);
        resolve({ mode: mode, confidence: confidence });
      }, 500);
    });
  }

  document.getElementById('brief-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var description = document.getElementById('description').value.trim();
    var mode = document.getElementById('mode').value;
    var constraints = getConstraints();
    var btn = document.getElementById('submit-btn');

    btn.disabled = true;
    btn.textContent = 'Generating\u2026';

    track('module_interest', { module: mode });

    generatePreview(description, mode, constraints).then(function (result) {
      showPreview(mode, description, constraints, result.confidence);
      track('preview_generated', { mode: mode, confidence: result.confidence });
      btn.disabled = false;
      btn.textContent = 'Generate preview';
    }).catch(function () {
      btn.disabled = false;
      btn.textContent = 'Generate preview';
    });
  });

  document.getElementById('cta-primary').addEventListener('click', function () {
    track('cta_click', { cta: 'primary', destination: 'svivva' });
  });

  var ctaSecondary = document.getElementById('cta-secondary');
  if (ctaSecondary) {
    ctaSecondary.addEventListener('click', function () {
      track('cta_click', { cta: 'secondary', destination: 'svivva_projects' });
    });
  }

  var ctaBelowLink = document.getElementById('cta-below-link');
  if (ctaBelowLink) {
    ctaBelowLink.addEventListener('click', function () {
      track('cta_click', { cta: 'primary', destination: 'svivva' });
    });
  }

  var ctaSecondaryLink = document.getElementById('cta-secondary-link');
  if (ctaSecondaryLink) {
    ctaSecondaryLink.addEventListener('click', function () {
      track('cta_click', { cta: 'secondary', destination: 'svivva_projects' });
    });
  }
})();
