(function () {
  const API = '/api/tools/ai-model-comparison/analyze';
  const MODELS = [
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-haiku', name: 'Claude 3 Haiku' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
  ];

  const promptEl = document.getElementById('prompt');
  const schemaEl = document.getElementById('schema');
  const apiConfigEl = document.getElementById('apiConfig');
  const modelCheckboxesEl = document.getElementById('modelCheckboxes');
  const runBtn = document.getElementById('runBtn');
  const resultsPlaceholder = document.getElementById('resultsPlaceholder');
  const resultsContainer = document.getElementById('resultsContainer');
  const summaryCards = document.getElementById('summaryCards');
  const resultsThead = document.getElementById('resultsThead');
  const resultsTbody = document.getElementById('resultsTbody');

  function renderModelCheckboxes() {
    modelCheckboxesEl.innerHTML = MODELS.map(
      (m) =>
        `<label><input type="checkbox" name="model" value="${m.id}" />${m.name}</label>`
    ).join('');
  }

  function getSelectedModels() {
    return Array.from(document.querySelectorAll('input[name="model"]:checked')).map(
      (el) => el.value
    );
  }

  function setLoading(loading) {
    runBtn.disabled = loading;
    runBtn.textContent = loading ? 'Running…' : 'Run simulation';
  }

  function showError(msg) {
    resultsPlaceholder.classList.remove('hidden');
    resultsPlaceholder.innerHTML = `<p><strong>Error:</strong> ${msg}</p>`;
    resultsContainer.classList.add('hidden');
  }

  function renderSummary(summary) {
    summaryCards.innerHTML = `
      <div class="summary-card"><strong>${summary.promptLength}</strong> <span>chars</span></div>
      <div class="summary-card"><strong>${summary.wordCount}</strong> <span>words</span></div>
      <div class="summary-card"><strong>${summary.modelsAnalyzed}</strong> <span>models</span></div>
      <div class="summary-card"><strong>${summary.hasSchema ? 'Yes' : 'No'}</strong> <span>schema</span></div>
    `;
  }

  function renderTable(results) {
    resultsThead.innerHTML = `
      <th>Model</th>
      <th class="tier">Tier</th>
      <th class="num">Est. input tokens</th>
      <th class="num">Est. output tokens</th>
      <th class="num">Est. cost/call</th>
      <th class="num">Compatibility</th>
      <th>Schema-friendly</th>
    `;
    resultsTbody.innerHTML = results
      .map(
        (r) => `
      <tr>
        <td><strong>${r.modelName}</strong></td>
        <td class="tier">${r.tier}</td>
        <td class="num">${r.estInputTokens.toLocaleString()}</td>
        <td class="num">${r.estOutputTokens.toLocaleString()}</td>
        <td class="num">$${r.estCostPerCall.toFixed(6)}</td>
        <td class="num">${r.compatibilityScore}%</td>
        <td class="${r.schemaFriendly ? 'good' : 'warn'}">${r.schemaFriendly ? 'Yes' : 'No'}</td>
      </tr>
    `
      )
      .join('');
  }

  function displayAnalysis(data) {
    renderSummary(data.summary);
    renderTable(data.results);
    resultsPlaceholder.classList.add('hidden');
    resultsPlaceholder.innerHTML = '';
    resultsContainer.classList.remove('hidden');
  }

  async function runSimulation() {
    const prompt = (promptEl && promptEl.value) || '';
    const schema = (schemaEl && schemaEl.value) || '';
    const apiConfig = (apiConfigEl && apiConfigEl.value) || '';
    const selectedModels = getSelectedModels();

    if (!prompt.trim() && !schema.trim() && !apiConfig.trim()) {
      showError('Add at least a prompt, schema, or API config to run the simulation.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          schema: schema.trim(),
          apiConfig: apiConfig.trim(),
          selectedModels,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error || 'Analysis failed');
        return;
      }
      displayAnalysis(data);
    } catch (e) {
      showError(e.message || 'Network error. Is the server running?');
    } finally {
      setLoading(false);
    }
  }

  renderModelCheckboxes();
  runBtn.addEventListener('click', runSimulation);
})();
