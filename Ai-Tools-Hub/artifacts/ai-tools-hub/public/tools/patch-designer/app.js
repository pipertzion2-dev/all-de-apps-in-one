(function () {
  'use strict';

  var PATCH_TYPES = {
    drone: {
      label: 'Drone / Ambient Patch',
      description: 'A sustained texture patch with slow modulation, layered oscillators, and atmospheric effects.',
      svivvaAdds: 'In Svivva Play: save drone presets, automate filter sweeps over time, sync pads across multiple devices, and export the full patch to your DAW or hardware.',
      modules: [
        { name: 'Oscillator 1', type: 'VCO', role: 'Primary tone - saw/triangle, detuned' },
        { name: 'Oscillator 2', type: 'VCO', role: 'Secondary tone - sine/sub, slight detune' },
        { name: 'Low-Pass Filter', type: 'VCF', role: 'Slow cutoff sweep for movement' },
        { name: 'LFO', type: 'Modulation', role: 'Modulates filter cutoff (0.1-0.5 Hz)' },
        { name: 'Reverb', type: 'FX', role: 'Large hall / shimmer reverb' },
        { name: 'Delay', type: 'FX', role: 'Long feedback delay for depth' },
        { name: 'VCA', type: 'Amp', role: 'Slow attack/release envelope' },
        { name: 'Mixer', type: 'Utility', role: 'Blend oscillators before filter' },
      ],
      chain: '[OSC 1 + OSC 2] --> [Mixer] --> [VCF (LFO mod)] --> [VCA] --> [Reverb] --> [Delay] --> [Out]',
    },
    sequence: {
      label: 'Sequence / Pattern Patch',
      description: 'A rhythmic patch driven by a step sequencer, with gated amplitude and synced modulation.',
      svivvaAdds: 'In Svivva Play: store sequence patterns with version history, sync multiple sequencers across devices, swap patterns live, and export MIDI or CV sequences.',
      modules: [
        { name: 'Step Sequencer', type: 'Control', role: 'Pitch CV - 8 or 16 steps' },
        { name: 'Clock', type: 'Control', role: 'Master tempo and clock division' },
        { name: 'Oscillator', type: 'VCO', role: 'Main voice - saw/pulse wave' },
        { name: 'Filter', type: 'VCF', role: 'Resonant low-pass, accent sweep' },
        { name: 'Envelope', type: 'EG', role: 'Short decay for gated hits' },
        { name: 'VCA', type: 'Amp', role: 'Envelope-controlled amplitude' },
        { name: 'Distortion', type: 'FX', role: 'Light saturation / overdrive' },
      ],
      chain: '[Clock] --> [Sequencer] --> [VCO] --> [VCF] --> [VCA (EG)] --> [Distortion] --> [Out]',
    },
    bass: {
      label: 'Bass / Lead Patch',
      description: 'A monophonic synth voice for bass or lead lines, with filter envelope and drive.',
      svivvaAdds: 'In Svivva Play: version your bass presets, A/B test patches live, layer multiple voices, and export directly to your hardware synth or DAW preset format.',
      modules: [
        { name: 'Oscillator 1', type: 'VCO', role: 'Primary - saw or square wave' },
        { name: 'Oscillator 2', type: 'VCO', role: 'Sub oscillator - sine, -1 octave' },
        { name: 'Filter', type: 'VCF', role: 'Low-pass with resonance, envelope-driven' },
        { name: 'Filter Envelope', type: 'EG', role: 'Fast attack, medium decay for pluck' },
        { name: 'Amp Envelope', type: 'EG', role: 'Shapes note dynamics' },
        { name: 'VCA', type: 'Amp', role: 'Amp envelope-controlled output' },
        { name: 'Drive / Saturation', type: 'FX', role: 'Adds harmonic warmth' },
      ],
      chain: '[OSC 1 + OSC 2] --> [VCF (Filter EG)] --> [VCA (Amp EG)] --> [Drive] --> [Out]',
    },
    fx: {
      label: 'Effects Chain Patch',
      description: 'A signal processing chain for transforming an input source with layered effects.',
      svivvaAdds: 'In Svivva Play: save effects chains as reusable presets, route any source through them live, automate effect parameters over time, and share chains with collaborators.',
      modules: [
        { name: 'Input Source', type: 'Input', role: 'Audio in (synth, guitar, mic, etc.)' },
        { name: 'EQ / Tone', type: 'FX', role: 'Shape frequency balance' },
        { name: 'Compressor', type: 'FX', role: 'Dynamic range control' },
        { name: 'Distortion / Wavefolder', type: 'FX', role: 'Harmonic saturation' },
        { name: 'Chorus / Flanger', type: 'FX', role: 'Modulation and width' },
        { name: 'Delay', type: 'FX', role: 'Rhythmic repeats or tape echo' },
        { name: 'Reverb', type: 'FX', role: 'Space and ambience' },
        { name: 'Output Mixer', type: 'Utility', role: 'Dry/wet balance and level' },
      ],
      chain: '[Input] --> [EQ] --> [Compressor] --> [Distortion] --> [Chorus] --> [Delay] --> [Reverb] --> [Output Mix]',
    },
    live: {
      label: 'Live Performance Patch',
      description: 'A multi-source routing setup for live jams, with mixer, effects sends, and performer assignments.',
      svivvaAdds: 'In Svivva Play: route between hardware and software in real time, sync tempo across all players, recall entire performance setups instantly, and record multi-track sessions.',
      modules: [
        { name: 'Source 1', type: 'Input', role: 'Synth / instrument (Player 1)' },
        { name: 'Source 2', type: 'Input', role: 'Synth / instrument (Player 2)' },
        { name: 'Drum Machine', type: 'Input', role: 'Rhythmic backbone' },
        { name: 'Mixer', type: 'Utility', role: 'Level balance and panning' },
        { name: 'Send FX: Delay', type: 'FX', role: 'Shared delay on aux send' },
        { name: 'Send FX: Reverb', type: 'FX', role: 'Shared reverb on aux send' },
        { name: 'Master Compressor', type: 'FX', role: 'Glue compression on master bus' },
        { name: 'Master Output', type: 'Output', role: 'Final stereo output' },
      ],
      chain: '[Source 1 + Source 2 + Drums] --> [Mixer (sends to Delay/Reverb)] --> [Master Comp] --> [Out]',
    },
    generative: {
      label: 'Generative / Aleatoric Patch',
      description: 'A self-playing patch that uses random voltages, probability gates, and feedback loops to create evolving sound.',
      svivvaAdds: 'In Svivva Play: record generative sessions, set probability rules with version history, create evolving patches that run for hours, and share generative systems with other musicians.',
      modules: [
        { name: 'Random CV / S&H', type: 'Control', role: 'Random pitch and modulation source' },
        { name: 'Clock + Divider', type: 'Control', role: 'Irregular timing and probability gates' },
        { name: 'Oscillator', type: 'VCO', role: 'Pitched voice driven by random CV' },
        { name: 'Quantizer', type: 'Utility', role: 'Locks random CV to musical scale' },
        { name: 'Filter', type: 'VCF', role: 'Randomly modulated cutoff' },
        { name: 'Delay (feedback)', type: 'FX', role: 'Creates layered echoes and evolution' },
        { name: 'Reverb', type: 'FX', role: 'Space and wash' },
        { name: 'VCA', type: 'Amp', role: 'Probability-gated amplitude' },
      ],
      chain: '[Random CV] --> [Quantizer] --> [VCO] --> [VCF (random mod)] --> [VCA (prob gate)] --> [Delay] --> [Reverb] --> [Out]',
    },
  };

  function emit(name, data) {
    if (typeof window.analytics !== 'undefined' && window.analytics.track) {
      window.analytics.track(name, data);
    }
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, data);
    }
    console.log('[Svivva Play Patch Designer]', name, data);
  }

  function generateArtifact(description, mode, constraints) {
    var patch = PATCH_TYPES[mode] || PATCH_TYPES.drone;
    var seed = (description + mode + JSON.stringify(constraints)).length;
    var confidence = Math.min(95, 45 + (seed % 45));

    var html = '';
    html += '<div class="artifact-header">' + patch.label + '</div>\n';
    html += patch.description + '\n\n';

    if (constraints.genre) html += '<strong>Genre:</strong> ' + constraints.genre + '\n';
    if (constraints.gear) html += '<strong>Gear:</strong> ' + constraints.gear + '\n';
    if (constraints.budget) html += '<strong>Budget:</strong> ' + constraints.budget + '\n';
    if (constraints.voices) html += '<strong>Voices:</strong> ' + constraints.voices + '\n';
    if (constraints.players) html += '<strong>Players:</strong> ' + constraints.players + '\n';

    html += '\n<strong>Signal Chain:</strong>\n' + patch.chain + '\n\n';

    html += '<div class="artifact-table"><table><thead><tr><th>Module</th><th>Type</th><th>Role in this patch</th></tr></thead><tbody>';
    patch.modules.forEach(function (m) {
      html += '<tr><td>' + m.name + '</td><td>' + m.type + '</td><td>' + m.role + '</td></tr>';
    });
    html += '</tbody></table></div>\n';

    html += '\n<strong>Your description:</strong> ' + (description.slice(0, 150) || '(none)') + '\n';

    return { html: html, confidence: confidence, patch: patch };
  }

  function showPreview(artifact) {
    var placeholder = document.getElementById('preview-placeholder');
    var result = document.getElementById('preview-result');
    var artifactEl = document.getElementById('preview-artifact');
    var fill = document.getElementById('confidence-fill');
    var value = document.getElementById('confidence-value');
    var mappingStatic = document.getElementById('mapping-copy');
    var mappingDynamic = document.getElementById('mapping-dynamic');

    placeholder.classList.add('hidden');
    result.classList.remove('hidden');
    artifactEl.innerHTML = artifact.html;
    artifactEl.className = 'preview-artifact';
    fill.style.width = artifact.confidence + '%';
    value.textContent = artifact.confidence + '%';

    mappingStatic.classList.add('hidden');
    mappingDynamic.classList.remove('hidden');
    mappingDynamic.innerHTML =
      '<p><strong>Patch type:</strong> ' + artifact.patch.label + '</p>' +
      '<p>' + artifact.patch.svivvaAdds + '</p>';
  }

  function getConstraints() {
    return {
      genre: document.getElementById('constraint-genre').value.trim(),
      gear: document.getElementById('constraint-gear').value.trim(),
      budget: document.getElementById('constraint-budget').value.trim(),
      voices: document.getElementById('constraint-voices').value.trim(),
      players: document.getElementById('constraint-players').value.trim(),
    };
  }

  document.getElementById('brief-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var description = document.getElementById('description').value.trim();
    var mode = document.getElementById('mode').value;
    var btn = document.getElementById('btn-generate');

    if (!description) return;

    btn.disabled = true;
    btn.textContent = 'Designing patch...';
    emit('patch_interest', { patchType: mode });

    setTimeout(function () {
      var constraints = getConstraints();
      var artifact = generateArtifact(description, mode, constraints);
      showPreview(artifact);
      btn.disabled = false;
      btn.textContent = 'Design patch';
      emit('patch_generated', { patchType: mode, confidence: artifact.confidence });
    }, 1200);
  });

  function ctaClick(label) {
    return function () {
      emit('cta_click', { label: label });
    };
  }

  document.getElementById('cta-primary').addEventListener('click', ctaClick('primary_below_preview'));
  document.getElementById('cta-secondary').addEventListener('click', ctaClick('secondary_open_in_svivva'));
  document.getElementById('cta-bar').addEventListener('click', ctaClick('sticky_bar'));
})();
