(function () {
  'use strict';

  const ACCENT = '#0F766E';
  const inputType = document.getElementById('input-type');
  const modelHint = document.getElementById('model-hint');
  const promptText = document.getElementById('prompt-text');
  const btnLint = document.getElementById('btn-lint');
  const resultsPlaceholder = document.getElementById('results-placeholder');
  const resultsContainer = document.getElementById('results-container');
  const overallScoreEl = document.getElementById('overall-score');
  const resultsCharts = document.getElementById('results-charts');
  const resultsTbody = document.getElementById('results-tbody');

  /**
   * LLM Prompt Linter — rules run in under 3s, all client-side for fast load.
   */
  function runLinter(text, type, model) {
    const checks = [];
    let totalScore = 0;
    const maxPerCheck = 100;

    const add = (name, status, detail, score) => {
      checks.push({ name, status, detail, score: score ?? (status === 'ok' ? 100 : status === 'warn' ? 50 : 0) });
      totalScore += checks[checks.length - 1].score;
    };

    const trimmed = (text || '').trim();
    const len = trimmed.length;

    // Length / token estimate (rough: ~4 chars per token)
    const estTokens = Math.ceil(len / 4);
    if (len === 0) {
      add('Has content', 'fail', 'No prompt or schema provided.', 0);
    } else {
      add('Has content', 'ok', `${len} characters, ~${estTokens} tokens (approx).`, 100);
    }

    // Clarity: imperative vs vague
    const imperative = /\b(you must|you should|do not|always|never|list|write|return|output|extract|summarize|classify)\b/i.test(trimmed);
    const vague = /\b(something|somehow|maybe|try to|perhaps|a bit|kind of)\b/i.test(trimmed);
    if (vague && !imperative) {
      add('Clarity', 'warn', 'Prompt uses vague language. Prefer imperative, specific instructions.', 45);
    } else if (imperative) {
      add('Clarity', 'ok', 'Uses clear, imperative instructions.', 100);
    } else if (len > 50) {
      add('Clarity', 'warn', 'Consider adding explicit instructions (e.g. "You must...", "Return...").', 55);
    } else {
      add('Clarity', 'ok', 'Short prompt; add more structure for complex tasks.', 70);
    }

    // Structure: sections / delimiters
    const hasSections = /(^|\n)\s*(#+|===|---|\*\*|Step \d|Part \d|Section)/im.test(trimmed) || /\[.*\]|{.*}/s.test(trimmed);
    if (len > 200 && !hasSections) {
      add('Structure', 'warn', 'Long prompt without clear sections. Use headers or delimiters.', 50);
    } else if (hasSections || len <= 200) {
      add('Structure', 'ok', hasSections ? 'Sections or structure detected.' : 'Length is fine for simple prompts.', 100);
    } else {
      add('Structure', 'ok', 'Structure not assessed.', 80);
    }

    // Safety / injection risk
    const risky = /\b(ignore|forget|override|system prompt|previous instructions|new instructions)\b/i.test(trimmed);
    if (risky) {
      add('Safety', 'warn', 'Phrasing may be vulnerable to prompt injection. Tighten scope.', 40);
    } else {
      add('Safety', 'ok', 'No obvious injection-prone phrasing detected.', 100);
    }

    // JSON / schema validity when type is schema or api
    if ((type === 'schema' || type === 'api') && trimmed) {
      try {
        const parsed = JSON.parse(trimmed);
        const hasProps = typeof parsed === 'object' && (Object.keys(parsed).length > 0 || Array.isArray(parsed));
        add('Schema validity', hasProps ? 'ok' : 'warn', hasProps ? 'Valid JSON with content.' : 'Valid JSON but empty.', hasProps ? 100 : 60);
      } catch (_) {
        add('Schema validity', 'fail', 'Invalid JSON. Check brackets and commas.', 0);
      }
    }

    // Role / system hint
    const hasRole = /\b(you are|act as|role:|system:|assistant)\b/i.test(trimmed);
    if (len > 100 && !hasRole) {
      add('Role clarity', 'warn', 'Consider defining the assistant role (e.g. "You are...").', 60);
    } else {
      add('Role clarity', 'ok', hasRole ? 'Role or system context present.' : 'Acceptable for short prompts.', 100);
    }

    const count = checks.length;
    const overall = count ? Math.round(totalScore / count) : 0;

    return {
      overall: Math.min(100, overall),
      checks,
      metrics: {
        length: len,
        estTokens,
        type,
        model: model || 'any'
      }
    };
  }

  function renderResults(data) {
    overallScoreEl.textContent = data.overall;
    resultsCharts.innerHTML = '';
    const metrics = [
      { label: 'Characters', value: data.metrics.length },
      { label: '~Tokens', value: data.metrics.estTokens },
      { label: 'Checks', value: data.checks.length }
    ];
    metrics.forEach(m => {
      const div = document.createElement('div');
      div.className = 'chart-mini';
      div.innerHTML = `<span class="label">${m.label}</span><span class="value">${m.value}</span>`;
      resultsCharts.appendChild(div);
    });

    resultsTbody.innerHTML = '';
    data.checks.forEach(c => {
      const tr = document.createElement('tr');
      const statusClass = `status-${c.status}`;
      const statusLabel = c.status === 'ok' ? 'Pass' : c.status === 'warn' ? 'Warning' : 'Fail';
      tr.innerHTML = `<td>${escapeHtml(c.name)}</td><td class="${statusClass}">${statusLabel}</td><td>${escapeHtml(c.detail)}</td>`;
      resultsTbody.appendChild(tr);
    });

    resultsPlaceholder.hidden = true;
    resultsContainer.hidden = false;
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function handleLint() {
    const text = promptText.value;
    const type = inputType.value;
    const model = modelHint.value;

    btnLint.disabled = true;
    btnLint.textContent = 'Linting…';

    // Keep UI responsive; run in next tick so "Linting…" shows
    requestAnimationFrame(() => {
      const t0 = performance.now();
      const result = runLinter(text, type, model);
      const elapsed = Math.round(performance.now() - t0);
      if (elapsed > 100) {
        result.checks.push({
          name: 'Runtime',
          status: 'ok',
          detail: `Analysis completed in ${elapsed} ms (under 3s).`,
          score: 100
        });
      }
      renderResults(result);
      btnLint.disabled = false;
      btnLint.textContent = 'Lint prompt';
    });
  }

  btnLint.addEventListener('click', handleLint);

  // Optional: run on paste/change after first run for “real-time” feel (debounced)
  let debounceTimer;
  promptText.addEventListener('input', () => {
    if (!resultsContainer.hidden) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(handleLint, 600);
    }
  });
})();
