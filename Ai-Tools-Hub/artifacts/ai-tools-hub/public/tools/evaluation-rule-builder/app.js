/**
 * Evaluation Rule Builder — client-side analysis.
 * Runs in under 3s; no login required. Results drive center + right panels.
 */

(function () {
  const inputType = document.getElementById('input-type');
  const userInput = document.getElementById('user-input');
  const analyzeBtn = document.getElementById('analyze-btn');
  const resultsPlaceholder = document.getElementById('results-placeholder');
  const resultsContainer = document.getElementById('results');
  const scoreCoverage = document.getElementById('score-coverage');
  const scoreRules = document.getElementById('score-rules');
  const scoreConsistency = document.getElementById('score-consistency');
  const rulesTbody = document.getElementById('rules-tbody');
  const barChart = document.getElementById('bar-chart');
  const guidanceDefault = document.getElementById('guidance-default');
  const guidanceInterpretation = document.getElementById('guidance-interpretation');
  const guidanceContent = document.getElementById('guidance-content');

  const RULE_TYPES = ['format', 'schema', 'safety', 'quality'];
  const PRIORITIES = ['high', 'medium', 'low'];

  function analyze() {
    const raw = (userInput.value || '').trim();
    const type = inputType.value;

    if (!raw) {
      showPlaceholder();
      return;
    }

    const start = performance.now();
    const { rules, coverage, consistency } = runAnalysis(raw, type);
    const elapsed = performance.now() - start;

    renderScores(rules.length, coverage, consistency);
    renderRulesTable(rules);
    renderBarChart(rules);
    renderGuidance(rules, coverage, consistency, type);

    resultsPlaceholder.hidden = true;
    resultsContainer.hidden = false;
    guidanceDefault.hidden = true;
    guidanceInterpretation.hidden = false;

    if (elapsed > 100) {
      console.log('Evaluation rule analysis completed in', Math.round(elapsed), 'ms');
    }
  }

  function runAnalysis(raw, type) {
    let rules = [];

    if (type === 'prompt') {
      rules = analyzePrompt(raw);
    } else if (type === 'schema') {
      rules = analyzeSchema(raw);
    } else {
      rules = analyzeApi(raw);
    }

    const coverage = computeCoverage(rules, raw);
    const consistency = computeConsistency(rules);

    return { rules, coverage, consistency };
  }

  function analyzePrompt(text) {
    const rules = [];
    const lines = text.split(/\n/).filter(Boolean);

    if (text.length > 500) {
      rules.push({ name: 'Max length / chunking', type: 'quality', priority: 'medium' });
    }
    if (/\{\{[^}]+\}\}|\$\{[^}]+\}|<[a-z]+>/i.test(text)) {
      rules.push({ name: 'Template variable presence', type: 'format', priority: 'high' });
    }
    if (/instruction|prompt|answer|output/i.test(text)) {
      rules.push({ name: 'Instruction clarity', type: 'quality', priority: 'high' });
    }
    if (lines.length >= 3) {
      rules.push({ name: 'Structure (multi-step)', type: 'format', priority: 'medium' });
    }
    if (/don't|do not|never|always|must/i.test(text)) {
      rules.push({ name: 'Constraint adherence', type: 'safety', priority: 'high' });
    }
    rules.push({ name: 'Response format check', type: 'format', priority: 'high' });
    rules.push({ name: 'Tone / style match', type: 'quality', priority: 'low' });

    return dedupeRules(rules);
  }

  function analyzeSchema(raw) {
    const rules = [];
    let data;

    try {
      data = JSON.parse(raw);
    } catch (_) {
      rules.push({ name: 'Valid JSON', type: 'format', priority: 'high' });
      return rules;
    }

    const required = data.required || [];
    const props = data.properties || {};
    const keys = Object.keys(props);

    if (required.length > 0) {
      rules.push({ name: 'Required fields present', type: 'schema', priority: 'high' });
    }
    keys.forEach(function (k) {
      const p = props[k];
      if (p && (p.type === 'string' && (p.maxLength != null || p.minLength != null))) {
        rules.push({ name: 'String length: ' + k, type: 'schema', priority: 'medium' });
      }
      if (p && (p.enum != null)) {
        rules.push({ name: 'Enum allowed values: ' + k, type: 'schema', priority: 'high' });
      }
    });
    if (keys.length > 0) {
      rules.push({ name: 'No extra properties (if disallowed)', type: 'schema', priority: 'medium' });
    }
    rules.push({ name: 'Type per property', type: 'schema', priority: 'high' });

    return dedupeRules(rules);
  }

  function analyzeApi(raw) {
    const rules = [];
    let data;

    try {
      data = JSON.parse(raw);
    } catch (_) {
      if (/openapi|swagger|paths|get|post/i.test(raw)) {
        rules.push({ name: 'Valid OpenAPI / spec', type: 'format', priority: 'high' });
        rules.push({ name: 'Endpoint availability', type: 'quality', priority: 'high' });
        rules.push({ name: 'Response schema match', type: 'schema', priority: 'high' });
      }
      return rules.length ? rules : [{ name: 'Valid API spec JSON', type: 'format', priority: 'high' }];
    }

    const paths = data.paths || {};
    const pathKeys = Object.keys(paths);

    if (pathKeys.length > 0) {
      rules.push({ name: 'Response schema per endpoint', type: 'schema', priority: 'high' });
      rules.push({ name: 'Status code handling', type: 'quality', priority: 'medium' });
    }
    if (data.components && data.components.schemas) {
      rules.push({ name: 'Reusable schema compliance', type: 'schema', priority: 'medium' });
    }
    rules.push({ name: 'Rate limit / error handling', type: 'safety', priority: 'medium' });

    return dedupeRules(rules);
  }

  function dedupeRules(rules) {
    const seen = new Set();
    return rules.filter(function (r) {
      const key = r.name + '|' + r.type;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function computeCoverage(rules, raw) {
    if (rules.length === 0) return 0;
    const base = Math.min(100, 40 + rules.length * 12);
    const lengthBonus = raw.length > 200 ? 10 : raw.length > 50 ? 5 : 0;
    return Math.min(100, Math.round(base + lengthBonus));
  }

  function computeConsistency(rules) {
    if (rules.length === 0) return 0;
    const high = rules.filter(function (r) { return r.priority === 'high'; }).length;
    const hasHigh = high >= 1;
    const hasTypes = new Set(rules.map(function (r) { return r.type; })).size >= 2;
    return Math.min(100, 50 + (hasHigh ? 20 : 0) + (hasTypes ? 25 : 0) + Math.min(5, rules.length) * 2);
  }

  function renderScores(ruleCount, coverage, consistency) {
    scoreCoverage.textContent = coverage + '%';
    scoreRules.textContent = ruleCount;
    scoreConsistency.textContent = consistency + '%';
  }

  function renderRulesTable(rules) {
    rulesTbody.innerHTML = '';
    rules.forEach(function (r) {
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + escapeHtml(r.name) + '</td>' +
        '<td><span class="type-badge type-' + r.type + '">' + r.type + '</span></td>' +
        '<td>' + escapeHtml(r.priority) + '</td>';
      rulesTbody.appendChild(tr);
    });
  }

  function renderBarChart(rules) {
    const byType = {};
    RULE_TYPES.forEach(function (t) { byType[t] = 0; });
    rules.forEach(function (r) {
      if (byType[r.type] !== undefined) byType[r.type]++;
    });
    const max = Math.max(1, Math.max.apply(null, Object.values(byType)));

    barChart.innerHTML = '';
    RULE_TYPES.forEach(function (t) {
      const count = byType[t];
      const height = max ? (count / max) * 100 : 0;
      const bar = document.createElement('div');
      bar.className = 'bar-item';
      bar.style.height = height + '%';
      bar.title = t + ': ' + count;
      barChart.appendChild(bar);
    });
  }

  function renderGuidance(rules, coverage, consistency, type) {
    const parts = [];

    parts.push('<p><strong>Coverage (' + coverage + '%)</strong> — How much of your ' + type + ' is covered by suggested rules. Add more detail or schema to improve it.</p>');
    parts.push('<p><strong>Rules suggested (' + rules.length + ')</strong> — Use these as a starting set for automated checks. In Svivva you can enforce them on every request.</p>');
    parts.push('<p><strong>Consistency (' + consistency + '%)</strong> — Balance of rule types and priorities. High-priority rules help catch critical failures first.</p>');
    parts.push('<p>Copy the table into your test suite or connect Svivva for schema enforcement, evaluation generation, versioning, and cost control.</p>');

    guidanceContent.innerHTML = parts.join('');
  }

  function showPlaceholder() {
    resultsPlaceholder.hidden = false;
    resultsContainer.hidden = true;
    guidanceDefault.hidden = false;
    guidanceInterpretation.hidden = true;
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  analyzeBtn.addEventListener('click', analyze);

  userInput.addEventListener('input', function () {
    if (!userInput.value.trim()) {
      showPlaceholder();
    }
  });
})();
