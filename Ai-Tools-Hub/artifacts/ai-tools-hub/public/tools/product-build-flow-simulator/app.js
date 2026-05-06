/**
 * Product Build Flow Simulator
 * No login; one primary CTA to Svivva; analytics: preview generated, CTA click, module interest
 */

(function () {
  const form = document.getElementById('brief-form');
  const description = document.getElementById('description');
  const modeSelect = document.getElementById('mode');
  const submitBtn = document.getElementById('submit-btn');
  const previewPlaceholder = document.getElementById('preview-placeholder');
  const previewContainer = document.getElementById('preview-container');
  const previewArtifact = document.getElementById('preview-artifact');
  const confidenceEl = document.getElementById('confidence');
  const explanationEl = document.getElementById('preview-explanation');
  const mappingDefault = document.getElementById('mapping-default');
  const mappingDynamic = document.getElementById('mapping-dynamic');
  const mappingTitle = document.getElementById('mapping-title');
  const mappingBody = document.getElementById('mapping-body');
  const ctaPrimary = document.getElementById('cta-primary');
  const ctaSecondary = document.getElementById('cta-secondary');
  const ctaBar = document.getElementById('cta-bar');

  const MODES = {
    hardware: {
      label: 'Hardware',
      step: 'Schematic / BOM preview',
      mappingTitle: 'Hardware pipeline step',
      mappingBody: 'You just previewed the schematic & BOM generation step from Svivva’s hardware pipeline. In the full workflow you get versioning, part sourcing, cost rollups, and production-ready exports.',
    },
    play: {
      label: 'Play',
      step: 'Performance / audio preview',
      mappingTitle: 'Svivva Play performance step',
      mappingBody: 'You previewed one Play performance mode output. The full Svivva Play workflow adds multi-track versioning, collaboration on sets, and export to stems or live rigs.',
    },
    idea: {
      label: 'Idea',
      step: 'Idea Engine stage report',
      mappingTitle: 'Idea Engine stage',
      mappingBody: 'This is one stage of the Idea Engine. In Svivva you run the full idea pipeline with validation, scoring, and handoff to hardware or build flows.',
    },
    team: {
      label: 'Team',
      step: 'Collaboration / setup map',
      mappingTitle: 'Collaboration & permissions',
      mappingBody: 'You saw a preview of team setup and roles. The full platform adds granular permissions, activity logs, and shared project versioning.',
    },
    marketplace: {
      label: 'Marketplace',
      step: 'API / publish preview',
      mappingTitle: 'API Marketplace publishing',
      mappingBody: 'This step mirrors the publish preview from Svivva’s API Marketplace. The full workflow includes versioning, docs, and usage tracking.',
    },
    build: {
      label: 'Build',
      step: 'Digital / physical flow',
      mappingTitle: 'B.U.I.L.D. digital / physical flows',
      mappingBody: 'You previewed one step of the B.U.I.L.D. flow. In Svivva you get the full digital-to-physical pipeline with cost tracking and production exports.',
    },
  };

  function track(event, data) {
    if (typeof window.analytics !== 'undefined') {
      window.analytics.track(event, data);
    }
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', event, data);
    }
    console.log('[Analytics]', event, data);
  }

  function renderArtifact(mode, brief, constraints) {
    const artifact = previewArtifact;
    artifact.className = 'preview-artifact ' + mode;
    artifact.innerHTML = '';

    switch (mode) {
      case 'hardware':
        artifact.innerHTML = `
          <pre>${escapeHtml(`
Schematic preview — ${brief.slice(0, 60)}...
────────────────────────────────────
Block: Power → MCU → DAC → Output
I/O: 4x CV, 2x Gate, 1x MIDI
Footprint: Estimated 80×60mm
          `)}</pre>
          <table class="bom-preview">
            <thead><tr><th>Ref</th><th>Part</th><th>Qty</th><th>Notes</th></tr></thead>
            <tbody>
              <tr><td>U1</td><td>MCU (STM32)</td><td>1</td><td>3.3V</td></tr>
              <tr><td>U2</td><td>DAC</td><td>1</td><td>12-bit</td></tr>
              <tr><td>R1–R8</td><td>10k</td><td>8</td><td>1%</td></tr>
            </tbody>
          </table>`;
        break;
      case 'play':
        const bars = Array.from({ length: 24 }, () => Math.floor(Math.random() * 60 + 20));
        artifact.innerHTML = `<div class="waveform-bars">${bars.map(h => `<span style="height:${h}%"></span>`).join('')}</div><p style="margin:0.5rem 0 0;font-size:0.75rem;color:var(--text-muted)">Audio preview (4 bars) — ${escapeHtml(brief.slice(0, 40))}...</p>`;
        break;
      case 'idea':
        artifact.innerHTML = `
          <h4 style="margin:0 0 0.5rem;font-size:0.9375rem">Idea report</h4>
          <p style="margin:0;font-size:0.8125rem;color:var(--text-muted)">${escapeHtml(brief)}</p>
          <ul style="margin:0.75rem 0 0;padding-left:1.25rem;font-size:0.8125rem">
            <li>Stage: Concept → Validation</li>
            <li>Readiness: Draft</li>
            <li>Next: Refine scope or handoff to Build</li>
          </ul>`;
        break;
      case 'team':
        artifact.innerHTML = `
          <pre style="margin:0;font-size:0.8125rem">${escapeHtml(`
Team setup map
────────────────
Roles: 1 Owner, 2 Editors (suggested)
Collaboration size: ${constraints.collab_size || '—'}
Region: ${constraints.region || '—'}
Preview: Permissions and invite flow
          `)}</pre>`;
        break;
      case 'marketplace':
        artifact.innerHTML = `
          <pre style="margin:0;font-size:0.8125rem">${escapeHtml(`
API Publish preview
───────────────────
Package: ${brief.slice(0, 30)}...
Visibility: Public
Endpoints: 1 preview (read-only)
Docs: Auto-generated from schema
          `)}</pre>`;
        break;
      case 'build':
        artifact.innerHTML = `
          <pre style="margin:0;font-size:0.8125rem">${escapeHtml(`
B.U.I.L.D. flow (one step)
─────────────────────────
Concept: ${brief.slice(0, 50)}...
Materials: ${constraints.materials || '—'}
Budget: ${constraints.budget || '—'}
Step: Digital spec → Physical build preview
          `)}</pre>`;
        break;
      default:
        artifact.textContent = 'Preview not available for this mode.';
    }
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function runPipeline(brief, mode, constraints) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const conf = 72 + Math.floor(Math.random() * 18);
        const step = MODES[mode].step;
        resolve({
          confidence: conf,
          explanation: `This preview is the “${step}” step of Svivva’s pipeline. Your brief was used to generate a production-style artifact. In the full platform you run the entire workflow with versioning, collaboration, and exports.`,
          mode,
        });
      }, 700);
    });
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const brief = (description.value || '').trim();
    if (!brief) return;

    const mode = modeSelect.value;
    const constraints = {
      budget: document.getElementById('budget').value.trim(),
      genre: document.getElementById('genre').value.trim(),
      materials: document.getElementById('materials').value.trim(),
      region: document.getElementById('region').value.trim(),
      collab_size: document.getElementById('collab-size').value.trim(),
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Generating…';

    const start = Date.now();
    const result = await runPipeline(brief, mode, constraints);
    const elapsed = Date.now() - start;

    renderArtifact(mode, brief, constraints);
    confidenceEl.textContent = `Readiness: ${result.confidence}%`;
    explanationEl.textContent = result.explanation;

    previewPlaceholder.hidden = true;
    previewContainer.hidden = false;

    mappingDefault.hidden = true;
    mappingDynamic.hidden = false;
    mappingTitle.textContent = MODES[mode].mappingTitle;
    mappingBody.textContent = MODES[mode].mappingBody;

    submitBtn.disabled = false;
    submitBtn.textContent = 'Generate preview';

    track('preview generated', { mode, elapsed });
    track('module interest', { module: mode });
  });

  function handleCtaClick(which) {
    track('CTA click', { cta: which });
  }

  if (ctaPrimary) ctaPrimary.addEventListener('click', () => handleCtaClick('primary'));
  if (ctaSecondary) ctaSecondary.addEventListener('click', () => handleCtaClick('secondary'));
  if (ctaBar) ctaBar.addEventListener('click', () => handleCtaClick('sticky_bar'));
})();
