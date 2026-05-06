(function () {
  'use strict';

  const ACCENT = '#7C3AED';
  const DIMENSIONS = [
    { id: 'clarity', label: 'Clarity', description: 'Intent and instruction clarity' },
    { id: 'specificity', label: 'Specificity', description: 'Concrete examples and constraints' },
    { id: 'structure', label: 'Structure', description: 'Sections, bullets, formatting' },
    { id: 'safety', label: 'Safety & guardrails', description: 'Boundaries and refusal instructions' },
    { id: 'output_shape', label: 'Output shape', description: 'Defined format and length' }
  ];

  function getEl(id) {
    return document.getElementById(id);
  }

  function scoreClarity(text) {
    if (!text || !text.trim()) return 0;
    const t = text.trim();
    const hasQuestion = /\?/.test(t);
    const hasImperative = /^(please|you must|do not|always|never|ensure|make sure)/im.test(t) || /\.\s*$/m.test(t);
    const wordCount = t.split(/\s+/).length;
    const lengthScore = Math.min(1, wordCount / 30) * 40;
    const structureScore = (hasImperative || hasQuestion ? 30 : 0);
    const noVague = (/avoid|don't|do not|never|always|must|should|clearly|specifically/i.test(t) ? 30 : 0);
    return Math.min(100, Math.round(lengthScore + structureScore + noVague));
  }

  function scoreSpecificity(text) {
    if (!text || !text.trim()) return 0;
    const t = text.trim();
    let s = 0;
    if (/\d+/.test(t)) s += 20;
    if (/example|e\.g\.|for instance|such as/i.test(t)) s += 25;
    if (/format|json|list|step|number/i.test(t)) s += 20;
    if (/constraint|limit|max|min|only|exactly/i.test(t)) s += 20;
    if (t.split(/\n/).length >= 2) s += 15;
    return Math.min(100, s);
  }

  function scoreStructure(text) {
    if (!text || !text.trim()) return 0;
    const t = text.trim();
    let s = 0;
    if (/\n\n/.test(t)) s += 25;
    if (/^[-*•]\s/m.test(t) || /^\d+\.\s/m.test(t)) s += 30;
    if (/^#+\s/m.test(t) || /^##\s/m.test(t)) s += 25;
    if (/:\s*$/m.test(t)) s += 20;
    return Math.min(100, s);
  }

  function scoreSafety(text) {
    if (!text || !text.trim()) return 0;
    const t = text.trim();
    let s = 0;
    if (/do not|don't|never|avoid|refuse|reject|if.*then.*refuse/i.test(t)) s += 25;
    if (/safe|appropriate|ethical|harmful|dangerous/i.test(t)) s += 25;
    if (/only|strictly|must not|cannot/i.test(t)) s += 25;
    if (/guardrail|boundary|limit|restrict/i.test(t)) s += 25;
    return Math.min(100, s);
  }

  function scoreOutputShape(text, schemaText, modelType) {
    if (!text && !schemaText) return 0;
    const combined = [text, schemaText].filter(Boolean).join('\n');
    const t = combined.trim();
    let s = 0;
    if (/json|"key"|"value"|\[\]|\{\}/i.test(t)) s += 35;
    if (/schema|type|string|number|array|object/i.test(t)) s += 30;
    if (/list|bullet|numbered|step 1|step 2/i.test(t)) s += 20;
    if (modelType === 'structured') s += 15;
    return Math.min(100, s);
  }

  function analyze(promptText, schemaText, modelType) {
    const scores = {
      clarity: scoreClarity(promptText),
      specificity: scoreSpecificity(promptText + '\n' + (schemaText || '')),
      structure: scoreStructure(promptText),
      safety: scoreSafety(promptText),
      output_shape: scoreOutputShape(promptText, schemaText, modelType)
    };
    return scores;
  }

  function hexToRgb(hex) {
    const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
  }

  function interpolateColor(hex, intensity) {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    const r = Math.round(rgb.r + (255 - rgb.r) * (1 - intensity));
    const g = Math.round(rgb.g + (255 - rgb.g) * (1 - intensity));
    const b = Math.round(rgb.b + (255 - rgb.b) * (1 - intensity));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function renderHeatmap(scores, container) {
    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'heatmap-grid';

    const max = 100;

    const headerRow = document.createElement('div');
    headerRow.style.display = 'grid';
    headerRow.style.gridTemplateColumns = 'repeat(' + (DIMENSIONS.length + 1) + ', 1fr)';
    headerRow.style.gap = '2px';
    const emptyCell = document.createElement('div');
    emptyCell.className = 'heatmap-cell dim-label';
    emptyCell.textContent = '';
    headerRow.appendChild(emptyCell);
    DIMENSIONS.forEach(function (d) {
      const cell = document.createElement('div');
      cell.className = 'heatmap-cell dim-label';
      cell.textContent = d.label;
      headerRow.appendChild(cell);
    });
    grid.appendChild(headerRow);

    const valueRow = document.createElement('div');
    valueRow.style.display = 'grid';
    valueRow.style.gridTemplateColumns = 'repeat(' + (DIMENSIONS.length + 1) + ', 1fr)';
    valueRow.style.gap = '2px';
    const rowLabel = document.createElement('div');
    rowLabel.className = 'heatmap-cell dim-label';
    rowLabel.textContent = 'Score';
    valueRow.appendChild(rowLabel);
    DIMENSIONS.forEach(function (d) {
      const v = scores[d.id];
      const cell = document.createElement('div');
      cell.className = 'heatmap-cell value';
      cell.textContent = v;
      const intensity = Math.max(0.25, v / max);
      cell.style.background = interpolateColor(ACCENT, intensity);
      valueRow.appendChild(cell);
    });
    grid.appendChild(valueRow);

    container.appendChild(grid);
  }

  function renderScoresTable(scores, container) {
    container.innerHTML = '';
    const table = document.createElement('table');
    table.className = 'scores-table';
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Dimension</th><th>Score</th></tr>';
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    DIMENSIONS.forEach(function (d) {
      const v = scores[d.id];
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + d.label + '</td>' +
        '<td><div class="score-bar"><div class="score-fill" style="width:' + v + '%"></div></div> ' + v + '</td>';
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }

  function renderInterpretation(scores, container) {
    const avg = Math.round(
      (scores.clarity + scores.specificity + scores.structure + scores.safety + scores.output_shape) / 5
    );
    let summary = 'Overall confidence: ' + avg + '/100. ';
    if (avg >= 70) {
      summary += 'Your prompt looks strong across dimensions. Consider adding schema enforcement and monitoring in production.';
    } else if (avg >= 45) {
      summary += 'Improve the lowest-scoring dimensions (see heatmap) for more reliable outputs.';
    } else {
      summary += 'Add clearer instructions, structure, and output format to raise confidence.';
    }
    container.textContent = summary;
    container.classList.remove('hidden');
  }

  function runAnalysis() {
    var promptInput = getEl('prompt-input');
    var schemaInput = getEl('schema-input');
    var modelSelect = getEl('model-select');
    var resultsPlaceholder = getEl('results-placeholder');
    var resultsContainer = getEl('results-container');
    var heatmapWrapper = getEl('heatmap-wrapper');
    var scoresTableWrapper = getEl('scores-table-wrapper');
    var interpretation = getEl('interpretation');

    var promptText = (promptInput && promptInput.value) || '';
    var schemaText = (schemaInput && schemaInput.value) || '';
    var modelType = (modelSelect && modelSelect.value) || 'generic';

    var hasInput = (promptText + schemaText).trim().length > 0;
    var scores = analyze(promptText, schemaText, modelType);

    if (!hasInput) {
      if (resultsPlaceholder) resultsPlaceholder.classList.remove('hidden');
      if (resultsContainer) resultsContainer.classList.add('hidden');
      if (interpretation) interpretation.classList.add('hidden');
      return;
    }

    if (resultsPlaceholder) resultsPlaceholder.classList.add('hidden');
    if (resultsContainer) resultsContainer.classList.remove('hidden');

    renderHeatmap(scores, heatmapWrapper);
    renderScoresTable(scores, scoresTableWrapper);
    renderInterpretation(scores, interpretation);
  }

  function init() {
    var analyzeBtn = getEl('analyze-btn');
    var promptInput = getEl('prompt-input');

    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', runAnalysis);
    }

    var debounceTimer;
    if (promptInput) {
      promptInput.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(runAnalysis, 400);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
