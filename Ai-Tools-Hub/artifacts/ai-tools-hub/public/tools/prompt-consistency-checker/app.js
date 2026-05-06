(function () {
  const promptEl = document.getElementById('prompt');
  const schemaEl = document.getElementById('schema');
  const modelEl = document.getElementById('model');
  const analyzeBtn = document.getElementById('analyze');
  const stateEmpty = document.getElementById('state-empty');
  const stateLoading = document.getElementById('state-loading');
  const resultsEl = document.getElementById('results');
  const scoreCircle = document.getElementById('score-circle');
  const scoreValue = document.getElementById('score-value');
  const categoryBars = document.getElementById('category-bars');
  const resultsTbody = document.getElementById('results-tbody');
  const issuesList = document.getElementById('issues-list');
  const suggestionsList = document.getElementById('suggestions-list');

  function showEmpty() {
    stateEmpty.style.display = 'block';
    stateLoading.classList.remove('visible');
    resultsEl.style.display = 'none';
  }

  function showLoading() {
    stateEmpty.style.display = 'none';
    stateLoading.classList.add('visible');
    resultsEl.style.display = 'none';
  }

  function showResults(data) {
    stateEmpty.style.display = 'none';
    stateLoading.classList.remove('visible');
    resultsEl.style.display = 'block';

    const score = data.overallScore || 0;
    scoreValue.textContent = score;
    scoreCircle.style.setProperty('--score', score * 3.6);

    categoryBars.innerHTML = '';
    (data.categories || []).forEach(function (cat) {
      const row = document.createElement('div');
      row.className = 'bar-row';
      row.innerHTML =
        '<span>' + escapeHtml(cat.name) + '</span>' +
        '<div class="bar-track"><div class="bar-fill" style="width:' + (cat.score || 0) + '%"></div></div>' +
        '<span class="bar-value">' + (cat.score || 0) + '</span>';
      categoryBars.appendChild(row);
    });

    resultsTbody.innerHTML = '';
    const rows = [
      ['Word count', (data.wordCount || 0).toString()],
      ['Schema checked', data.schemaChecked ? 'Yes' : 'No'],
      ['Response time', (data.responseTimeMs != null ? data.responseTimeMs + ' ms' : '—')]
    ];
    rows.forEach(function (r) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td>' + escapeHtml(r[0]) + '</td><td>' + escapeHtml(r[1]) + '</td>';
      resultsTbody.appendChild(tr);
    });

    issuesList.innerHTML = '';
    (data.issues || []).forEach(function (issue) {
      const li = document.createElement('li');
      li.textContent = issue;
      issuesList.appendChild(li);
    });

    suggestionsList.innerHTML = '';
    (data.suggestions || []).forEach(function (s) {
      const li = document.createElement('li');
      li.textContent = s;
      suggestionsList.appendChild(li);
    });
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  analyzeBtn.addEventListener('click', function () {
    const prompt = (promptEl && promptEl.value) || '';
    const schemaRaw = (schemaEl && schemaEl.value) || '';

    if (!prompt.trim()) {
      showResults({
        overallScore: 0,
        categories: [],
        issues: ['Please enter a prompt to analyze.'],
        suggestions: ['Paste your prompt or API instructions in the left panel and click Score consistency.'],
        wordCount: 0,
        schemaChecked: false
      });
      return;
    }

    showLoading();
    analyzeBtn.disabled = true;

    fetch('/api/tools/prompt-consistency-checker/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt.trim(),
        schema: schemaRaw.trim() || undefined,
        model: (modelEl && modelEl.value) || 'any'
      })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.error) throw new Error(data.message || data.error);
        showResults(data);
      })
      .catch(function (err) {
        showResults({
          overallScore: 0,
          categories: [],
          issues: ['Analysis failed: ' + (err.message || 'Unknown error')],
          suggestions: ['Check your prompt and optional schema, then try again.'],
          wordCount: 0,
          schemaChecked: false
        });
      })
      .finally(function () {
        analyzeBtn.disabled = false;
      });
  });
})();
