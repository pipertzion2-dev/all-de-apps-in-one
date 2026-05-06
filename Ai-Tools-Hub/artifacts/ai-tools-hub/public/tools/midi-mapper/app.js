/**
 * Audio Export & MIDI Mapper — preview tool
 * Auth-free; reuses shell/gateway pattern. Generation runs client-side for <3s.
 */

const ACCENT = '#9333EA';
const SVIVVA_URL = 'https://svivva.com';
const SVIVVA_MODULES = 'https://svivva.com/modules';

// Analytics (stub — replace with your endpoint)
function track(event, data = {}) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', event, data);
  }
  if (typeof window.analytics !== 'undefined') {
    window.analytics.track(event, data);
  }
  console.log('[analytics]', event, data);
}

// DOM
const form = document.getElementById('preview-form');
const descriptionEl = document.getElementById('description');
const modeEl = document.getElementById('mode');
const generateBtn = document.getElementById('generate-btn');
const placeholder = document.getElementById('preview-placeholder');
const output = document.getElementById('preview-output');
const waveformContainer = document.getElementById('waveform-container');
const midiTable = document.getElementById('midi-map-table');
const readinessEl = document.getElementById('readiness');
const mappingExplanation = document.getElementById('mapping-explanation');
const ctaPrimary = document.getElementById('cta-primary');
const ctaSecondary = document.getElementById('cta-secondary');
const ctaBarLink = document.getElementById('cta-bar-link');

// One-step pipeline simulation (swap for real backend adapter)
function runExportAndMidiMapStep(payload) {
  const { description, mode, constraints } = payload;
  const bars = 32 + Math.floor(Math.random() * 32);
  const confidence = 0.72 + Math.random() * 0.2;
  const readiness = confidence >= 0.85 ? 'Production-ready' : confidence >= 0.7 ? 'Ready for review' : 'Draft';

  // Fake waveform heights
  const waveformBars = Array.from({ length: 60 }, () => 0.2 + Math.random() * 0.8);

  // Fake MIDI map rows
  const midiRows = [
    { note: 'C3', cc: '—', target: 'Kick', param: 'Level' },
    { note: 'D3', cc: '—', target: 'Snare', param: 'Level' },
    { note: 'E3', cc: 'CC74', target: 'Filter', param: 'Cutoff' },
    { note: 'F3', cc: 'CC71', target: 'Resonance', param: 'Q' },
    { note: 'G3', cc: '—', target: 'Pad', param: 'Level' },
    { note: 'A3', cc: 'CC10', target: 'Pan', param: '—' },
  ];

  return {
    waveformBars,
    midiRows,
    confidence,
    readiness,
    bars,
    mode,
    explanation: `This preview is the "Export & MIDI map" step: your brief was interpreted as ${bars} bars with a stereo export and the MIDI mapping table above. In Svivva, the next steps include versioning this export, sharing with your team, and pushing to hardware or the API Marketplace.`,
  };
}

function renderWaveform(bars) {
  waveformContainer.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'waveform-bars';
  bars.forEach((h) => {
    const bar = document.createElement('div');
    bar.className = 'waveform-bar';
    bar.style.height = `${Math.max(4, h * 100)}%`;
    wrap.appendChild(bar);
  });
  waveformContainer.appendChild(wrap);
}

function renderMidiTable(rows) {
  midiTable.innerHTML = '';
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Note</th><th>CC</th><th>Target</th><th>Param</th></tr>';
  midiTable.appendChild(thead);
  const tbody = document.createElement('tbody');
  rows.forEach((r) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.note}</td><td>${r.cc}</td><td>${r.target}</td><td>${r.param}</td>`;
    tbody.appendChild(tr);
  });
  midiTable.appendChild(tbody);
}

function showPreview(result) {
  renderWaveform(result.waveformBars);
  renderMidiTable(result.midiRows);
  readinessEl.textContent = `${result.readiness} — ${(result.confidence * 100).toFixed(0)}% confidence`;
  mappingExplanation.textContent = result.explanation;
  placeholder.hidden = true;
  output.hidden = false;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const description = descriptionEl.value.trim();
  const mode = modeEl.value;
  const constraints = {
    budget: document.getElementById('constraint-budget').value.trim(),
    genre: document.getElementById('constraint-genre').value.trim(),
    region: document.getElementById('constraint-region').value.trim(),
    collab: document.getElementById('constraint-collab').value.trim(),
  };

  generateBtn.disabled = true;
  generateBtn.textContent = 'Generating…';

  const start = performance.now();
  const payload = { description, mode, constraints };

  // Simulate network + processing under 3s (replace with real adapter call)
  const result = await new Promise((resolve) => {
    const result = runExportAndMidiMapStep(payload);
    const elapsed = performance.now() - start;
    const delay = Math.max(0, Math.min(2800 - elapsed, 600));
    setTimeout(() => resolve(result), delay);
  });

  showPreview(result);
  generateBtn.disabled = false;
  generateBtn.textContent = 'Generate preview';

  track('preview generated', {
    mode,
    confidence: result.confidence,
    has_constraints: !!(constraints.budget || constraints.genre || constraints.region || constraints.collab),
  });
  track('module interest', { module: mode });
});

// CTA clicks
function trackCtaClick(label, url) {
  track('CTA click', { label, url });
}

ctaPrimary.addEventListener('click', () => trackCtaClick('primary_below_preview', SVIVVA_URL));
ctaSecondary.addEventListener('click', () => trackCtaClick('secondary_open_in_svivva', `${SVIVVA_URL}/open`));
ctaBarLink.addEventListener('click', () => trackCtaClick('sticky_bar', SVIVVA_URL));

// Optional: open CTAs in same tab or new tab
[ctaPrimary, ctaSecondary, ctaBarLink].forEach((a) => {
  if (a && !a.hasAttribute('target')) a.setAttribute('target', '_blank');
});
