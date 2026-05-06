(function () {
  const ACCENT = '#B45309';
  const form = document.getElementById('analyze-form');
  const submitBtn = document.getElementById('submit-btn');
  const resultsPlaceholder = document.getElementById('results-placeholder');
  const resultsContent = document.getElementById('results-content');
  const resultsLoading = document.getElementById('results-loading');
  const resultsError = document.getElementById('results-error');
  const scoreValue = document.getElementById('score-value');
  const totalLatency = document.getElementById('total-latency');
  const chartContainer = document.getElementById('chart-container');
  const breakdownTable = document.getElementById('breakdown-table');
  const guidanceDefault = document.getElementById('guidance-default');
  const guidanceInterpretation = document.getElementById('guidance-interpretation');
  const guidanceSummary = document.getElementById('guidance-summary');
  const guidanceTips = document.getElementById('guidance-tips');

  /** Same logic as server – runs in browser when server is not available */
  function runLatencyAnalysis(body) {
    var prompt = (body.prompt || '').trim();
    var schema = typeof body.schema === 'string' ? body.schema : JSON.stringify(body.schema || {});
    var model = (body.model || 'gpt-4').toLowerCase();
    var promptLen = prompt.length;
    var schemaLen = schema.length;
    var hasSchema = schemaLen > 2;
    var inputTokens = Math.ceil((promptLen + schemaLen) / 4);
    var outputTokensEst = Math.min(500, Math.ceil(inputTokens * 0.5));
    var networkRtt = 20 + (inputTokens % 30);
    var serialization = 5 + Math.ceil(schemaLen / 500);
    var modelInference = model.indexOf('gpt-4') !== -1 ? 80 + inputTokens * 0.4 : 40 + inputTokens * 0.2;
    var totalMs = Math.round(networkRtt + serialization + modelInference);
    var score = Math.min(100, Math.max(0, 100 - Math.ceil(totalMs / 4)));
    var breakdown = [
      { label: 'Network RTT', ms: networkRtt, pct: Math.round((networkRtt / totalMs) * 100) },
      { label: 'Serialization', ms: serialization, pct: Math.round((serialization / totalMs) * 100) },
      { label: 'Model inference', ms: Math.round(modelInference), pct: Math.round((modelInference / totalMs) * 100) },
    ];
    var chartData = breakdown.map(function (b, i) { return { name: b.label, value: b.ms, fill: [ACCENT, '#8B6914', '#6B4A0A'][i] || ACCENT }; });
    var summary = 'Estimated end-to-end latency: ' + totalMs + ' ms (p95-style). Input ~' + inputTokens + ' tokens; output ~' + outputTokensEst + ' tokens.';
    var tips = [];
    if (promptLen > 2000) tips.push('Shorten the system prompt or move static context to a cached prefix to reduce input tokens.');
    if (hasSchema && schemaLen > 2000) tips.push('Simplify the response schema or split into smaller calls to lower serialization and inference time.');
    if (model.indexOf('gpt-4') !== -1) tips.push('Consider a smaller/faster model for latency-sensitive paths if quality allows.');
    if (!tips.length) tips.push('Your current setup is within typical latency ranges. Monitor p95 in production.');
    return { score: score, totalMs: totalMs, inputTokens: inputTokens, outputTokensEst: outputTokensEst, breakdown: breakdown, chartData: chartData, summary: summary, tips: tips };
  }

  function show(el) {
    el.classList.remove('hidden');
  }
  function hide(el) {
    el.classList.add('hidden');
  }

  function setLoading(loading) {
    if (loading) {
      hide(resultsPlaceholder);
      hide(resultsContent);
      hide(resultsError);
      show(resultsLoading);
      submitBtn.disabled = true;
    } else {
      hide(resultsLoading);
      submitBtn.disabled = false;
    }
  }

  function showError(msg) {
    hide(resultsPlaceholder);
    hide(resultsContent);
    hide(resultsLoading);
    resultsError.textContent = msg;
    show(resultsError);
  }

  function renderResults(data) {
    scoreValue.textContent = data.score;
    totalLatency.textContent = 'Estimated end-to-end latency: ' + data.totalMs + ' ms (p95-style). Input ~' + data.inputTokens + ' tokens; output ~' + data.outputTokensEst + ' tokens.';

    const maxMs = Math.max(...data.breakdown.map(function (b) { return b.ms; }), 1);
    chartContainer.innerHTML = '';
    (data.chartData || data.breakdown).forEach(function (d) {
      const name = d.name || d.label;
      const value = d.value != null ? d.value : d.ms;
      const fill = d.fill || '#B45309';
      const wrap = document.createElement('div');
      wrap.className = 'chart-bar-wrap';
      const bar = document.createElement('div');
      bar.className = 'chart-bar';
      bar.style.height = Math.round((value / maxMs) * 100) + '%';
      bar.style.backgroundColor = fill;
      const label = document.createElement('div');
      label.className = 'chart-bar-label';
      label.textContent = name + ' · ' + (typeof value === 'number' ? value + ' ms' : value);
      wrap.appendChild(bar);
      wrap.appendChild(label);
      chartContainer.appendChild(wrap);
    });

    breakdownTable.innerHTML = '<thead><tr><th>Component</th><th>Ms</th><th>%</th></tr></thead><tbody></tbody>';
    const tbody = breakdownTable.querySelector('tbody');
    data.breakdown.forEach(function (b) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td>' + escapeHtml(b.label) + '</td><td>' + b.ms + '</td><td>' + b.pct + '%</td>';
      tbody.appendChild(tr);
    });

    guidanceSummary.textContent = data.summary || ('Estimated latency: ' + data.totalMs + ' ms.');
    guidanceTips.innerHTML = (data.tips || []).map(function (t) { return '<li>' + escapeHtml(t) + '</li>'; }).join('');
    show(guidanceDefault);
    hide(guidanceInterpretation);
    if (data.summary || (data.tips && data.tips.length)) {
      hide(guidanceDefault);
      show(guidanceInterpretation);
    }

    hide(resultsPlaceholder);
    hide(resultsError);
    show(resultsContent);
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const prompt = (document.getElementById('prompt').value || '').trim();
    let schema = document.getElementById('schema').value.trim();
    const model = document.getElementById('model').value;
    const apiConfig = document.getElementById('api-config').value.trim();
    if (schema) {
      try {
        schema = JSON.parse(schema);
      } catch (_) {
        schema = schema;
      }
    } else {
      schema = undefined;
    }

    setLoading(true);
    var payload = {
      prompt: prompt || 'Sample prompt for estimation.',
      schema: schema,
      model: model,
      apiConfig: apiConfig || undefined,
    };
    /* Runs entirely in the browser — no server or connection needed */
    setTimeout(function () {
      renderResults(runLatencyAnalysis(payload));
      setLoading(false);
    }, 200);
  });
})();
