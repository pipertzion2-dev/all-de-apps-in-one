(function () {
  'use strict';

  const ACCENT = '#2563EB';
  const promptEl = document.getElementById('prompt');
  const schemaEl = document.getElementById('schema');
  const modelEl = document.getElementById('model');
  const analyzeBtn = document.getElementById('analyze');
  const resultsPlaceholder = document.getElementById('results-placeholder');
  const resultsEl = document.getElementById('results');
  const scoreValueEl = document.getElementById('score-value');
  const barChartEl = document.getElementById('bar-chart');
  const coverageTbody = document.getElementById('coverage-tbody');
  const guidanceDefault = document.getElementById('guidance-default');
  const guidanceInterpret = document.getElementById('guidance-interpret');
  const interpretSummary = document.getElementById('interpret-summary');
  const interpretActions = document.getElementById('interpret-actions');

  function extractSchemaKeys(schemaStr) {
    if (!schemaStr || !schemaStr.trim()) return [];
    try {
      const o = typeof schemaStr === 'string' ? JSON.parse(schemaStr) : schemaStr;
      const keys = new Set();
      function walk(obj, prefix) {
        prefix = prefix || '';
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) {
          obj.forEach((v, i) => walk(v, prefix + '[' + i + ']'));
          return;
        }
        for (const k of Object.keys(obj)) {
          const path = prefix ? prefix + '.' + k : k;
          keys.add(path);
          const v = obj[k];
          if (v && typeof v === 'object' && !Array.isArray(v)) walk(v, path);
        }
      }
      walk(o);
      return Array.from(keys);
    } catch (_) {
      return schemaStr.split(/\s+/).filter(Boolean).slice(0, 100);
    }
  }

  function computeCoverage(prompt, keys) {
    const lower = (prompt || '').toLowerCase();
    const items = keys.map(function (key) {
      const keyLower = key.toLowerCase();
      const direct = lower.includes(keyLower);
      const parts = key.split(/[.\[]/).filter(function (p) { return p.length > 2; });
      const implied = parts.some(function (part) { return lower.includes(part.toLowerCase()); });
      return { key: key, covered: direct || implied };
    });
    const covered = items.filter(function (i) { return i.covered; }).length;
    const total = items.length || 1;
    const score = Math.round((covered / total) * 100);
    return { score: score, total: total, covered: covered, items: items };
  }

  function renderResults(data) {
    scoreValueEl.textContent = data.score + '%';
    barChartEl.innerHTML = '';
    coverageTbody.innerHTML = '';
    data.items.forEach(function (item) {
      var row = document.createElement('tr');
      row.innerHTML =
        '<td>' + escapeHtml(item.key) + '</td>' +
        '<td><span class="badge ' + (item.covered ? 'yes' : 'no') + '">' + (item.covered ? 'Yes' : 'No') + '</span></td>';
      coverageTbody.appendChild(row);

      var barRow = document.createElement('div');
      barRow.className = 'bar-row';
      barRow.innerHTML =
        '<span class="bar-label" title="' + escapeHtml(item.key) + '">' + escapeHtml(item.key) + '</span>' +
        '<div class="bar-track"><div class="bar-fill ' + (item.covered ? 'covered' : 'missing') + '" style="width:' + (item.covered ? 100 : 0) + '%"></div></div>';
      barChartEl.appendChild(barRow);
    });
    resultsPlaceholder.classList.add('hidden');
    resultsEl.classList.remove('hidden');

    var summary = 'Your prompt covers ' + data.covered + ' of ' + data.total + ' schema elements (' + data.score + '%).';
    if (data.score >= 80) {
      summary += ' Strong alignment with your schema.';
    } else if (data.score >= 50) {
      summary += ' Consider mentioning more required fields explicitly.';
    } else {
      summary += ' Add clear instructions for missing fields to improve reliability.';
    }
    interpretSummary.textContent = summary;
    interpretActions.textContent = 'In production, use schema enforcement and automated evaluations (e.g. with Svivva) to keep prompts and outputs aligned over time.';
    guidanceDefault.classList.add('hidden');
    guidanceInterpret.classList.remove('hidden');
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function runAnalysis() {
    var prompt = promptEl.value.trim();
    var schema = schemaEl.value.trim();
    var model = modelEl.value;
    var keys = extractSchemaKeys(schema);
    if (!keys.length && schema) {
      keys = schema.split(/\n/).map(function (l) { return l.trim(); }).filter(Boolean);
    }
    if (!keys.length) {
      resultsPlaceholder.classList.remove('hidden');
      resultsEl.classList.add('hidden');
      guidanceInterpret.classList.add('hidden');
      guidanceDefault.classList.remove('hidden');
      resultsPlaceholder.innerHTML = '<p>Enter a prompt and a JSON schema (or a list of field names) above, then click <strong>Analyze coverage</strong> to see how well your prompt covers the schema.</p><p>Example schema: <code>{"name": "string", "age": "number"}</code></p>';
      return;
    }
    var result = computeCoverage(prompt, keys);
    result.model = model;
    renderResults(result);
  }

  function debounce(fn, ms) {
    var t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  }
  var runDebounced = debounce(runAnalysis, 350);

  analyzeBtn.addEventListener('click', runAnalysis);
  promptEl.addEventListener('input', runDebounced);
  schemaEl.addEventListener('input', runDebounced);

  if (promptEl.value || schemaEl.value) runAnalysis();
})();
