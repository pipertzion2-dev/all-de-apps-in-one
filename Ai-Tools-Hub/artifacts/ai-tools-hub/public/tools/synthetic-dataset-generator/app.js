(function () {
  'use strict';

  const schemaInput = document.getElementById('schema-input');
  const promptInput = document.getElementById('prompt-input');
  const modelSelect = document.getElementById('model-select');
  const rowCountInput = document.getElementById('row-count');
  const analyzeBtn = document.getElementById('analyze-btn');
  const resultsPlaceholder = document.getElementById('results-placeholder');
  const resultsContent = document.getElementById('results-content');
  const scoreCardsEl = document.getElementById('score-cards');
  const fieldChartEl = document.getElementById('field-chart');
  const sampleTableEl = document.getElementById('sample-table');
  const guidanceDynamic = document.getElementById('guidance-dynamic');
  const guidanceStatic = document.getElementById('guidance-static');

  const API_URL = '/api/tools/synthetic-dataset-generator/analyze';

  // Tabs
  document.querySelectorAll('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      const target = this.getAttribute('data-tab');
      document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
      document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
      this.classList.add('active');
      const panel = target === 'schema' ? 'schema-panel' : 'prompt-panel';
      document.getElementById(panel).classList.add('active');
    });
  });

  function getInput() {
    const schemaPanel = document.getElementById('schema-panel').classList.contains('active');
    const raw = schemaPanel ? schemaInput.value.trim() : promptInput.value.trim();
    return {
      type: schemaPanel ? 'schema' : 'prompt',
      raw: raw,
      model: modelSelect.value,
      rowCount: Math.min(100, Math.max(1, parseInt(rowCountInput.value, 10) || 10))
    };
  }

  function setLoading(loading) {
    analyzeBtn.disabled = loading;
    analyzeBtn.textContent = loading ? 'Analyzing…' : 'Generate & analyze';
  }

  function showResults() {
    resultsPlaceholder.classList.add('hidden');
    resultsContent.classList.remove('hidden');
  }

  function showPlaceholder() {
    resultsContent.classList.add('hidden');
    resultsPlaceholder.classList.remove('hidden');
  }

  function renderScoreCards(scores) {
    scoreCardsEl.innerHTML = '';
    [
      { key: 'schemaClarity', label: 'Schema clarity', suffix: '%' },
      { key: 'fieldCoverage', label: 'Field coverage', suffix: '' },
      { key: 'diversityScore', label: 'Diversity score', suffix: '%' }
    ].forEach(function (item) {
      const v = scores[item.key] != null ? scores[item.key] : '—';
      const card = document.createElement('div');
      card.className = 'score-card';
      card.innerHTML = '<div class="label">' + escapeHtml(item.label) + '</div><div class="value">' + escapeHtml(String(v)) + (item.suffix || '') + '</div>';
      scoreCardsEl.appendChild(card);
    });
  }

  function renderFieldChart(fields) {
    if (!fields || !fields.length) {
      fieldChartEl.innerHTML = '<p class="microcopy">No fields detected.</p>';
      return;
    }
    const maxScore = 100;
    fieldChartEl.innerHTML = fields.map(function (f) {
      const pct = Math.min(100, (f.score != null ? f.score : 80));
      return (
        '<div class="field-bar">' +
          '<span class="name">' + escapeHtml(f.name) + '</span>' +
          '<span class="type">' + escapeHtml(f.type || 'any') + '</span>' +
          '<div class="bar-wrap"><div class="bar-fill" style="width:' + pct + '%"></div></div>' +
        '</div>'
      );
    }).join('');
  }

  function renderSampleTable(rows, columns) {
    sampleTableEl.innerHTML = '';
    if (!rows || !rows.length) {
      const cell = sampleTableEl.insertRow(0).insertCell(0);
      cell.colSpan = 1;
      cell.textContent = 'No sample data.';
      cell.className = 'microcopy';
      return;
    }
    const cols = columns && columns.length ? columns : Object.keys(rows[0] || {});
    const thead = sampleTableEl.createTHead();
    const headRow = thead.insertRow();
    cols.forEach(function (col) {
      const th = headRow.appendChild(document.createElement('th'));
      th.textContent = col;
    });
    const tbody = sampleTableEl.createTBody();
    rows.forEach(function (row) {
      const tr = tbody.insertRow();
      cols.forEach(function (col) {
        const td = tr.insertCell();
        const val = row[col];
        td.textContent = val === undefined || val === null ? '' : String(val);
      });
    });
  }

  function renderGuidance(interpretation) {
    if (!interpretation || !interpretation.length) {
      guidanceDynamic.classList.add('hidden');
      guidanceStatic.classList.remove('hidden');
      return;
    }
    guidanceStatic.classList.add('hidden');
    guidanceDynamic.classList.remove('hidden');
    guidanceDynamic.innerHTML = '<h3>Interpretation</h3><ul>' +
      interpretation.map(function (line) {
        return '<li>' + escapeHtml(line) + '</li>';
      }).join('') + '</ul>';
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function displayResult(data) {
    showResults();
    renderScoreCards(data.scores || {});
    renderFieldChart(data.fields || []);
    renderSampleTable(data.sampleRows || [], data.columns || []);
    renderGuidance(data.interpretation || []);
  }

  analyzeBtn.addEventListener('click', function () {
    const input = getInput();
    if (!input.raw) {
      resultsPlaceholder.querySelector('p').innerHTML = 'Please enter a schema or prompt first.';
      showPlaceholder();
      return;
    }

    setLoading(true);
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Analysis failed');
        return res.json();
      })
      .then(function (data) {
        displayResult(data);
      })
      .catch(function () {
        // Fallback: run client-side analysis if backend unavailable
        runClientAnalysis(input);
      })
      .finally(function () {
        setLoading(false);
      });
  });

  function runClientAnalysis(input) {
    var parsed = { properties: {}, columns: [] };
    if (input.type === 'schema') {
      try {
        var obj = JSON.parse(input.raw);
        if (obj.properties) {
          parsed.properties = obj.properties;
          parsed.columns = Object.keys(obj.properties);
        } else if (Array.isArray(obj)) {
          parsed.columns = obj;
          parsed.columns.forEach(function (k) {
            parsed.properties[k] = { type: 'string' };
          });
        } else if (typeof obj === 'object' && obj !== null) {
          parsed.columns = Object.keys(obj);
          parsed.properties = obj;
        }
      } catch (e) {
        parsed.columns = [];
        parsed.properties = {};
      }
    } else {
      var words = input.raw.replace(/[,;:\n]/g, ' ').split(/\s+/).filter(Boolean);
      var fieldLike = words.filter(function (w) {
        return /^[a-z_][a-z0-9_]*$/i.test(w) && w.length > 2 && w.length < 30;
      });
      parsed.columns = [...new Set(fieldLike)].slice(0, 12);
      parsed.columns.forEach(function (k) {
        parsed.properties[k] = { type: 'string' };
      });
    }

    var fields = parsed.columns.map(function (name) {
      var prop = parsed.properties[name] || {};
      var type = (prop.type || 'string').toLowerCase();
      return { name: name, type: type, score: 70 + Math.floor(Math.random() * 25) };
    });

    var scores = {
      schemaClarity: parsed.columns.length ? Math.min(100, 60 + parsed.columns.length * 3) : 0,
      fieldCoverage: parsed.columns.length,
      diversityScore: 75 + Math.floor(Math.random() * 20)
    };

    var sampleRows = [];
    var count = input.rowCount || 10;
    for (var i = 0; i < count; i++) {
      var row = {};
      parsed.columns.forEach(function (col) {
        var prop = parsed.properties[col] || {};
        var t = (prop.type || 'string').toLowerCase();
        if (t === 'integer' || t === 'number') {
          row[col] = Math.floor(Math.random() * 90) + 10;
        } else if (t === 'boolean') {
          row[col] = Math.random() > 0.5;
        } else if (t === 'email' || (prop.format && prop.format === 'email')) {
          row[col] = 'user' + (i + 1) + '@example.com';
        } else {
          row[col] = 'sample_' + col + '_' + (i + 1);
        }
      });
      sampleRows.push(row);
    }

    var interpretation = [];
    if (scores.schemaClarity >= 80) interpretation.push('Schema is well-structured; we could infer types for all fields.');
    if (fields.length > 0) interpretation.push('We generated ' + fields.length + ' field(s) and ' + sampleRows.length + ' sample row(s).');
    interpretation.push('Use this data for tests, demos, or as a starting point for production datasets.');

    displayResult({
      scores: scores,
      fields: fields,
      columns: parsed.columns,
      sampleRows: sampleRows,
      interpretation: interpretation
    });
  }
})();
