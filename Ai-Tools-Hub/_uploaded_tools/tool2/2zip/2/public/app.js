(function () {
  const schemaInput = document.getElementById('schema-input');
  const promptInput = document.getElementById('prompt-input');
  const modelPref = document.getElementById('model-pref');
  const analyzeBtn = document.getElementById('analyze-btn');
  const resultsPlaceholder = document.getElementById('results-placeholder');
  const resultsContainer = document.getElementById('results-container');
  const summaryEl = document.getElementById('summary');
  const fieldsTbody = document.getElementById('fields-tbody');
  const metaTiming = document.getElementById('meta-timing');
  const guidancePlaceholder = document.getElementById('guidance-placeholder');
  const guidanceList = document.getElementById('guidance-list');
  const chartCanvas = document.getElementById('impact-chart');

  let chartInstance = null;

  function showError(message) {
    resultsPlaceholder.innerHTML = '<p class="error-message">' + escapeHtml(message) + '</p>';
    resultsPlaceholder.classList.remove('hidden');
    resultsContainer.classList.add('hidden');
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function drawBarChart(labels, values, colors) {
    const ctx = chartCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = chartCanvas.getBoundingClientRect();
    chartCanvas.width = rect.width * dpr;
    chartCanvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;
    const max = Math.max(...values, 1);
    const barH = Math.max(14, (h - 40) / labels.length - 4);
    const barMaxW = w - 120;
    labels.forEach((label, i) => {
      const x = 0;
      const y = 24 + i * (barH + 4);
      const bw = (values[i] / max) * barMaxW;
      ctx.fillStyle = colors[i] || '#9333EA';
      ctx.fillRect(100, y, bw, barH);
      ctx.fillStyle = '#e4e4e7';
      ctx.font = '12px zc, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(label, 96, y + barH / 2 + 4);
      ctx.textAlign = 'left';
      ctx.fillText(String(values[i]), 106 + bw, y + barH / 2 + 4);
    });
  }

  function renderResults(data) {
    resultsPlaceholder.classList.add('hidden');
    resultsContainer.classList.remove('hidden');

    const s = data.summary;
    summaryEl.textContent = [
      s.totalFields !== undefined && `Total fields: ${s.totalFields}`,
      s.requiredCount !== undefined && `Required: ${s.requiredCount}`,
      s.highImpactCount !== undefined && `High impact: ${s.highImpactCount}`
    ].filter(Boolean).join(' · ') || (s.message || 'Analysis complete.');

    if (data.chartData && data.chartData.labels && data.chartData.labels.length) {
      drawBarChart(data.chartData.labels, data.chartData.values, data.chartData.colors || []);
    }

    fieldsTbody.innerHTML = '';
    (data.fields || []).slice(0, 25).forEach(f => {
      const tr = document.createElement('tr');
      const impactClass = f.impactScore >= 70 ? 'impact-high' : f.impactScore >= 50 ? 'impact-mid' : 'impact-low';
      tr.innerHTML =
        '<td>' + escapeHtml(f.path) + '</td>' +
        '<td class="' + impactClass + '">' + (f.impactScore != null ? f.impactScore : '—') + '</td>' +
        '<td>' + (f.required ? 'Yes' : 'No') + '</td>' +
        '<td>' + escapeHtml(f.type || '—') + '</td>';
      fieldsTbody.appendChild(tr);
    });

    if (data._meta && data._meta.durationMs != null) {
      metaTiming.textContent = 'Analysis took ' + data._meta.durationMs + ' ms.';
    } else {
      metaTiming.textContent = '';
    }

    guidanceList.innerHTML = '';
    if (data.guidance && data.guidance.length) {
      guidancePlaceholder.classList.add('hidden');
      guidanceList.classList.remove('hidden');
      data.guidance.forEach(text => {
        const li = document.createElement('li');
        li.textContent = text;
        guidanceList.appendChild(li);
      });
    } else {
      guidancePlaceholder.classList.remove('hidden');
      guidanceList.classList.add('hidden');
    }
  }

  analyzeBtn.addEventListener('click', async function () {
    const schemaRaw = schemaInput.value.trim();
    if (!schemaRaw) {
      showError('Please paste a schema or API definition (JSON).');
      return;
    }
    analyzeBtn.disabled = true;
    resultsPlaceholder.innerHTML = '<p class="zc-font">Analyzing…</p>';
    resultsPlaceholder.classList.remove('hidden');
    resultsContainer.classList.add('hidden');
    try {
      const body = {
        schema: schemaRaw,
        prompt: promptInput.value.trim() || undefined,
        modelPreference: modelPref.value || undefined
      };
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error || 'Analysis failed.');
        return;
      }
      renderResults(data);
    } catch (e) {
      showError('Network error. Is the server running?');
    } finally {
      analyzeBtn.disabled = false;
    }
  });
})();
