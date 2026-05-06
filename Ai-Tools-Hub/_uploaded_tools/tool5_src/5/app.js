/**
 * AI Test Case Explorer — frontend
 * Fast, no login. Results in under 3s (client-side or backend).
 */

(function () {
  'use strict';

  const CTA_URL = '#'; // Replace with Svivva Mini App #15: AI Test Case Explorer URL

  const inputType = document.getElementById('input-type');
  const model = document.getElementById('model');
  const content = document.getElementById('content');
  const analyzeBtn = document.getElementById('analyze-btn');
  const resultsPlaceholder = document.getElementById('results-placeholder');
  const results = document.getElementById('results');
  const scoreCards = document.getElementById('score-cards');
  const resultsTableWrap = document.getElementById('results-table-wrap');
  const resultsViz = document.getElementById('results-viz');
  const guidanceDynamic = document.getElementById('guidance-dynamic');
  const ctaLink = document.getElementById('cta-link');

  if (ctaLink) ctaLink.href = CTA_URL;

  function getPlaceholders(text) {
    const placeholders = [];
    const re = /\{\{([^}]+)\}\}|%\{([^}]+)\}|<\s*([^>]+)\s*>/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      const name = (m[1] || m[2] || m[3] || '').trim();
      if (name && !placeholders.includes(name)) placeholders.push(name);
    }
    return placeholders;
  }

  function parseJsonSchema(text) {
    try {
      const o = typeof text === 'string' ? JSON.parse(text) : text;
      const required = Array.isArray(o.required) ? o.required : [];
      const props = o.properties || {};
      const keys = Object.keys(props);
      return { required, properties: props, keys };
    } catch (_) {
      return { required: [], properties: {}, keys: [] };
    }
  }

  function scoreTestability(inputTypeVal, contentVal) {
    const raw = String(contentVal || '').trim();
    let score = 50;
    let reasons = [];

    if (inputTypeVal === 'prompt') {
      const placeholders = getPlaceholders(raw);
      if (placeholders.length > 0) {
        score += Math.min(25, placeholders.length * 5);
        reasons.push('Placeholders found: good for parameterized tests.');
      }
      if (raw.length > 100) score += 10;
      if (raw.length > 500) score += 5;
      if (/step|instruction|task|output/i.test(raw)) reasons.push('Task-like structure helps test design.');
    } else if (inputTypeVal === 'schema') {
      const { required, keys } = parseJsonSchema(raw);
      if (keys.length > 0) {
        score += 20;
        reasons.push('Schema structure enables assertion generation.');
      }
      if (required.length > 0) score += 10;
    } else if (inputTypeVal === 'api') {
      if (/paths:|openapi:|swagger:/i.test(raw)) {
        score += 25;
        reasons.push('API definition supports path/parameter tests.');
      }
    }

    if (raw.length === 0) {
      score = 0;
      reasons = ['No content provided.'];
    }

    return { score: Math.min(100, Math.max(0, score)), reasons };
  }

  function buildTestCases(inputTypeVal, contentVal) {
    const raw = String(contentVal || '').trim();
    const cases = [];

    if (inputTypeVal === 'prompt') {
      const placeholders = getPlaceholders(raw);
      placeholders.slice(0, 8).forEach((name, i) => {
        cases.push({
          id: `tc-${i + 1}`,
          type: 'Variable',
          target: name,
          suggestion: `Set "${name}" to boundary and typical values.`,
        });
      });
      if (cases.length === 0 && raw.length > 20) {
        cases.push({
          id: 'tc-1',
          type: 'Smoke',
          target: 'Full prompt',
          suggestion: 'Run once with a representative input and check format.',
        });
      }
    } else if (inputTypeVal === 'schema') {
      const { required, keys } = parseJsonSchema(raw);
      keys.slice(0, 6).forEach((key, i) => {
        cases.push({
          id: `tc-${i + 1}`,
          type: required.includes(key) ? 'Required' : 'Optional',
          target: key,
          suggestion: `Valid value, null/empty, and type violation.`,
        });
      });
    } else if (inputTypeVal === 'api') {
      cases.push(
        { id: 'tc-1', type: 'Endpoint', target: 'Paths', suggestion: 'Test each path with valid and invalid payloads.' },
        { id: 'tc-2', type: 'Status', target: 'Responses', suggestion: 'Assert 2xx, 4xx, 5xx where documented.' }
      );
    }

    return cases;
  }

  function analyze() {
    const inputTypeVal = inputType.value;
    const contentVal = content.value;

    const { score, reasons } = scoreTestability(inputTypeVal, contentVal);
    const testCases = buildTestCases(inputTypeVal, contentVal);

    const payload = {
      inputType: inputTypeVal,
      model: model.value,
      scores: { testability: score },
      testCases,
      reasons,
      placeholders: inputTypeVal === 'prompt' ? getPlaceholders(contentVal) : [],
      schemaKeys: inputTypeVal === 'schema' ? parseJsonSchema(contentVal).keys : [],
    };

    renderResults(payload);
    renderGuidance(payload);
  }

  function renderResults(payload) {
    resultsPlaceholder.hidden = true;
    results.hidden = false;

    scoreCards.innerHTML = `
      <div class="score-card">
        <div class="value">${payload.scores.testability}</div>
        <div class="label">Testability score</div>
      </div>
    `;

    if (payload.testCases.length === 0) {
      resultsTableWrap.innerHTML = '<p class="results-placeholder">No test case suggestions for this input. Add a prompt with placeholders or a valid schema/API snippet.</p>';
    } else {
      resultsTableWrap.innerHTML = `
        <table>
          <thead>
            <tr><th>Type</th><th>Target</th><th>Suggestion</th></tr>
          </thead>
          <tbody>
            ${payload.testCases.map(tc => `
              <tr>
                <td>${escapeHtml(tc.type)}</td>
                <td>${escapeHtml(tc.target)}</td>
                <td>${escapeHtml(tc.suggestion)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    const vizParts = [];
    if (payload.placeholders.length > 0) {
      vizParts.push('<p><strong>Variables / placeholders</strong></p><ul><li>' + payload.placeholders.map(escapeHtml).join('</li><li>') + '</li></ul>');
    }
    if (payload.schemaKeys.length > 0) {
      vizParts.push('<p><strong>Schema fields</strong></p><ul><li>' + payload.schemaKeys.map(escapeHtml).join('</li><li>') + '</li></ul>');
    }
    if (payload.reasons.length > 0) {
      vizParts.push('<p><strong>Notes</strong></p><ul><li>' + payload.reasons.map(escapeHtml).join('</li><li>') + '</li></ul>');
    }
    resultsViz.innerHTML = vizParts.length ? vizParts.join('') : '';
  }

  function renderGuidance(payload) {
    let html = '';
    if (payload.scores.testability >= 70) {
      html = '<p><strong>Good testability.</strong> Consider adding automated runs and versioning (e.g. in Svivva) to keep quality stable as you change prompts or schemas.</p>';
    } else if (payload.scores.testability >= 40) {
      html = '<p><strong>Moderate testability.</strong> Add clear variables or a schema to improve automated test generation and regression coverage.</p>';
    } else {
      html = '<p><strong>Improve testability.</strong> Use placeholders like <code>{{variable}}</code> or attach a JSON Schema so the explorer can suggest concrete test cases.</p>';
    }
    guidanceDynamic.innerHTML = html;
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  analyzeBtn.addEventListener('click', function () {
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyzing…';
    setTimeout(function () {
      try {
        analyze();
      } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Analyze';
      }
    }, 80);
  });

  content.addEventListener('input', function () {
    if (document.getElementById('results') && !results.hidden) {
      analyze();
    }
  });
})();
