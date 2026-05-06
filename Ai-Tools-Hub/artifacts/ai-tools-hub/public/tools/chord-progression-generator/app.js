/**
 * Svivva Play Chord Generator Tool
 * No login. One step of the pipeline → production-style chord preview.
 * Analytics: preview_generated, cta_click, module_interest.
 */

(function () {
  'use strict';

  const PREVIEW_URL = 'https://svivva.com';
  const PROJECT_URL = 'https://svivva.com/projects';
  const PLAY_MODULE_URL = 'https://svivva.com/play';

  // Chord palettes by vibe (derived from brief keywords)
  const CHORD_SETS = {
    upbeat: ['C', 'G', 'Am', 'F'],
    moody: ['Am', 'F', 'C', 'G'],
    pop: ['C', 'G/B', 'Am', 'F'],
    jazz: ['Dm7', 'G7', 'Cmaj7', 'A7'],
    electronic: ['Em', 'C', 'G', 'D'],
    default: ['C', 'Am', 'F', 'G'],
  };

  const MODES = ['hardware', 'play', 'idea', 'team', 'marketplace', 'build'];

  function getChordsForBrief(description, mode, genre) {
    const text = [description, genre].filter(Boolean).join(' ').toLowerCase();
    if (/upbeat|happy|bright|pop/i.test(text)) return CHORD_SETS.upbeat;
    if (/moody|sad|minor|dark/i.test(text)) return CHORD_SETS.moody;
    if (/jazz|swing|blues/i.test(text)) return CHORD_SETS.jazz;
    if (/electronic|edm|synth|tech/i.test(text)) return CHORD_SETS.electronic;
    if (/pop|chorus|hook/i.test(text)) return CHORD_SETS.pop;
    return CHORD_SETS.default;
  }

  function estimateConfidence(description, mode) {
    const hasDescription = description && description.trim().length >= 10;
    const base = hasDescription ? 75 : 55;
    const modeBonus = mode === 'play' ? 10 : 5;
    return Math.min(95, base + modeBonus);
  }

  function getExplanation(mode) {
    const steps = {
      play: 'This chord set is the first step in Svivva Play: from your brief to a playable progression. Next steps include arrangement, tempo, and export.',
      hardware: 'Generated for a hardware context; in Svivva you can tie this to device presets and BOM alignment.',
      idea: 'Idea Engine step: chords from concept. Full workflow adds validation and idea branching.',
      team: 'Team mode preview; in Svivva you can share this with collaborators and lock permissions.',
      marketplace: 'Marketplace-style output; in Svivva you can publish and version this for API consumers.',
      build: 'B.U.I.L.D. flow preview; in Svivva this connects to digital and physical build steps.',
    };
    return steps[mode] || steps.play;
  }

  function renderChordFlow(chords) {
    return chords.map((c, i) => {
      const node = `<span class="chord-node" data-chord="${c}">${c}</span>`;
      const arrow = i < chords.length - 1 ? '<span class="chord-arrow">→</span>' : '';
      return node + arrow;
    }).join('');
  }

  function track(eventName, payload) {
    if (typeof window.analytics !== 'undefined') {
      window.analytics.track(eventName, payload);
    }
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', eventName, payload);
    }
    console.log('[Svivva analytics]', eventName, payload);
  }

  function showPreview(result) {
    const placeholder = document.getElementById('preview-placeholder');
    const content = document.getElementById('preview-content');
    const artifact = document.getElementById('preview-artifact');
    const confidenceFill = document.getElementById('confidence-fill');
    const confidenceValue = document.getElementById('confidence-value');
    const explanation = document.getElementById('preview-explanation');
    const ctaBlock = document.getElementById('cta-block');

    placeholder.classList.add('hidden');
    content.classList.remove('hidden');
    ctaBlock.classList.remove('hidden');

    artifact.innerHTML = `<div class="chord-flow">${renderChordFlow(result.chords)}</div>`;
    confidenceFill.style.width = result.confidence + '%';
    confidenceValue.textContent = result.confidence + '%';
    explanation.textContent = result.explanation;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const description = (form.querySelector('#description') || {}).value || '';
    const mode = (form.querySelector('#mode') || {}).value || 'play';
    const genre = (form.querySelector('#genre') || {}).value || '';

    const btn = form.querySelector('#generate-btn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Generating…';
    }

    track('module_interest', { module: mode });

    setTimeout(function () {
      const chords = getChordsForBrief(description, mode, genre);
      const confidence = estimateConfidence(description, mode);
      const explanation = getExplanation(mode);

      showPreview({
        chords,
        confidence,
        explanation,
      });

      track('preview_generated', {
        mode,
        chord_count: chords.length,
        confidence,
      });

      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Generate preview';
      }
    }, 800);
  }

  function bindCta() {
    function handleCtaClick(e) {
      track('cta_click', { target: e.currentTarget.id || 'sticky_cta', href: e.currentTarget.href });
    }

    const primary = document.getElementById('cta-primary');
    const secondary = document.getElementById('cta-secondary');
    const sticky = document.getElementById('sticky-cta');

    if (primary) primary.addEventListener('click', handleCtaClick);
    if (secondary) secondary.addEventListener('click', handleCtaClick);
    if (sticky) sticky.addEventListener('click', handleCtaClick);
  }

  function init() {
    const form = document.getElementById('brief-form');
    if (form) form.addEventListener('submit', handleSubmit);
    bindCta();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
