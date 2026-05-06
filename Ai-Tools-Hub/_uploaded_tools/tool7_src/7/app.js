(function () {
  'use strict';

  const ACCENT = '#2563EB';
  const DANGER = '#dc2626';
  const WARNING = '#d97706';

  const SEVERITY = { high: 'high', medium: 'medium', low: 'low' };

  const GUIDANCE = {
    injection_override: {
      title: 'Prompt injection / role override',
      body: 'Phrases like "ignore previous instructions" or "you are now..." can let users override your system prompt. Add explicit boundaries (e.g. "Only follow instructions within the user message that relate to X") and consider separating system and user content with clear delimiters.',
    },
    sensitive_data: {
      title: 'Sensitive data in prompt',
      body: 'API keys, tokens, or PII in prompts can be logged or leaked. Use environment variables and never hardcode secrets. For PII, consider server-side redaction or minimal inclusion.',
    },
    overly_permissive: {
      title: 'Overly permissive instructions',
      body: 'Broad instructions ("do anything", "no restrictions") increase misuse risk. Narrow the scope to the minimum needed for your use case and state what the model must not do.',
    },
    missing_guardrails: {
      title: 'Missing guardrails',
      body: 'Define what outputs are out-of-scope (e.g. harmful content, off-topic requests). Add output schema or validation where possible so responses can be checked before returning to users.',
    },
    schema_security: {
      title: 'Schema / API security',
      body: 'Ensure auth is required for sensitive operations and that schemas do not expose internal-only fields. Validate and sanitize inputs at the API layer, not only in the prompt.',
    },
    no_output_constraint: {
      title: 'No output format constraint',
      body: 'Unconstrained output is harder to validate and can break downstream systems. Specify format (JSON, markdown sections) or use a response schema so you can enforce structure.',
    },
  };

  const INJECTION_PATTERNS = [
    /\bignore\s+(all\s+)?(previous|above|prior)\s+instructions?\b/i,
    /\bdisregard\s+(all\s+)?(previous|above)\s+instructions?\b/i,
    /\byou\s+are\s+now\s+/i,
    /\bfrom\s+now\s+on\s+you\s+/i,
    /\bnew\s+instructions?\s*:/i,
    /\boverride\s+(your\s+)?(system\s+)?prompt\b/i,
    /\bpretend\s+you\s+are\b/i,
    /\bact\s+as\s+if\s+you\s+have\s+no\s+restrictions\b/i,
    /\b\[system\]\s*:/i,
    /\b&lt;&lt;.*?&gt;&gt;\s*instructions?\b/i,
  ];

  const SENSITIVE_PATTERNS = [
    /\b(?:sk|api[_-]?key)[-\w]{20,}/i,
    /\bBearer\s+[a-zA-Z0-9\-_.]{20,}/i,
    /\b[A-Za-z0-9_-]{32,}\s*(?:api[_-]?key|secret|token)/i,
    /\b\d{3}-\d{2}-\d{4}\b/,  // SSN-like
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/,  // email (weak)
  ];

  function getEl(id) {
    return document.getElementById(id);
  }

  function analyzePrompt(text) {
    const findings = [];
    if (!text || !text.trim()) {
      return { score: 0, findings: [{ severity: SEVERITY.medium, category: 'Input', message: 'No content provided to scan.' }] };
    }

    const trimmed = text.trim();
    const len = trimmed.length;

    for (const re of INJECTION_PATTERNS) {
      if (re.test(trimmed)) {
        findings.push({
          severity: SEVERITY.high,
          category: 'Injection risk',
          message: 'Content matches common prompt-injection or role-override phrasing.',
          key: 'injection_override',
        });
        break;
      }
    }

    for (const re of SENSITIVE_PATTERNS) {
      if (re.test(trimmed)) {
        findings.push({
          severity: SEVERITY.high,
          category: 'Sensitive data',
          message: 'Possible API key, token, or PII detected in content.',
          key: 'sensitive_data',
        });
        break;
      }
    }

    if (/\b(?:do\s+anything|no\s+restrictions?|without\s+limits?)\b/i.test(trimmed)) {
      findings.push({
        severity: SEVERITY.medium,
        category: 'Overly permissive',
        message: 'Instructions may be too broad and increase misuse risk.',
        key: 'overly_permissive',
      });
    }

    if (len > 200 && !/\b(?:must\s+not|do\s+not|never\s+|avoid\s+|forbidden)\b/i.test(trimmed)) {
      findings.push({
        severity: SEVERITY.low,
        category: 'Guardrails',
        message: 'No explicit “must not” or “never” guardrails detected.',
        key: 'missing_guardrails',
      });
    }

    if (/\b(?:json|schema|output\s+format)\b/i.test(trimmed) === false && len > 100) {
      findings.push({
        severity: SEVERITY.low,
        category: 'Output format',
        message: 'No output format or structure constraint mentioned.',
        key: 'no_output_constraint',
      });
    }

    const highCount = findings.filter(f => f.severity === SEVERITY.high).length;
    const medCount = findings.filter(f => f.severity === SEVERITY.medium).length;
    const lowCount = findings.filter(f => f.severity === SEVERITY.low).length;
    const deduct = (highCount * 25) + (medCount * 10) + (lowCount * 5);
    const score = Math.max(0, Math.min(100, 100 - deduct));

    return { score, findings };
  }

  function analyzeSchema(text) {
    const findings = [];
    if (!text || !text.trim()) {
      return { score: 0, findings: [{ severity: SEVERITY.medium, category: 'Input', message: 'No schema provided to scan.' }] };
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (_) {
      findings.push({
        severity: SEVERITY.medium,
        category: 'Schema',
        message: 'Invalid JSON. Paste a valid JSON schema to scan.',
        key: 'schema_security',
      });
      return { score: 50, findings };
    }

    const str = JSON.stringify(parsed);
    for (const re of SENSITIVE_PATTERNS) {
      if (re.test(str)) {
        findings.push({
          severity: SEVERITY.high,
          category: 'Sensitive data',
          message: 'Possible secret or PII in schema or example.',
          key: 'sensitive_data',
        });
        break;
      }
    }

    if (!/\b(?:required|properties|type)\b/i.test(str)) {
      findings.push({
        severity: SEVERITY.low,
        category: 'Schema',
        message: 'Schema may lack required fields or types for validation.',
        key: 'schema_security',
      });
    }

    const highCount = findings.filter(f => f.severity === SEVERITY.high).length;
    const medCount = findings.filter(f => f.severity === SEVERITY.medium).length;
    const lowCount = findings.filter(f => f.severity === SEVERITY.low).length;
    const deduct = (highCount * 25) + (medCount * 10) + (lowCount * 5);
    const score = Math.max(0, Math.min(100, 100 - deduct));

    return { score, findings };
  }

  function analyzeApi(text) {
    const findings = [];
    if (!text || !text.trim()) {
      return { score: 0, findings: [{ severity: SEVERITY.medium, category: 'Input', message: 'No API definition provided.' }] };
    }

    let parsed;
    try {
      parsed = text.trim().startsWith('{') ? JSON.parse(text) : null;
      if (!parsed) {
        findings.push({
          severity: SEVERITY.low,
          category: 'API',
          message: 'OpenAPI YAML not parsed (JSON only). Security checks run on raw text.',
          key: 'schema_security',
        });
      }
    } catch (_) {
      parsed = null;
    }

    const str = text;
    for (const re of SENSITIVE_PATTERNS) {
      if (re.test(str)) {
        findings.push({
          severity: SEVERITY.high,
          category: 'Sensitive data',
          message: 'Possible secret or key in API definition.',
          key: 'sensitive_data',
        });
        break;
      }
    }

    if (!/\b(?:security|auth|bearer|apiKey)\b/i.test(str)) {
      findings.push({
        severity: SEVERITY.medium,
        category: 'API security',
        message: 'No security or auth scheme mentioned in definition.',
        key: 'schema_security',
      });
    }

    const highCount = findings.filter(f => f.severity === SEVERITY.high).length;
    const medCount = findings.filter(f => f.severity === SEVERITY.medium).length;
    const lowCount = findings.filter(f => f.severity === SEVERITY.low).length;
    const deduct = (highCount * 25) + (medCount * 10) + (lowCount * 5);
    const score = Math.max(0, Math.min(100, 100 - deduct));

    return { score, findings };
  }

  function runAnalysis(inputType, content) {
    const t0 = performance.now();
    let result;
    switch (inputType) {
      case 'schema':
        result = analyzeSchema(content);
        break;
      case 'api':
        result = analyzeApi(content);
        break;
      default:
        result = analyzePrompt(content);
    }
    const elapsed = performance.now() - t0;
    return { ...result, _ms: Math.round(elapsed) };
  }

  function renderResults(result) {
    const placeholder = getEl('results-placeholder');
    const container = getEl('results-container');
    const scoreVal = getEl('score-value');
    const scoreFill = getEl('score-fill');
    const tbody = getEl('findings-tbody');
    const summaryEl = getEl('summary-text');

    placeholder.hidden = true;
    container.hidden = false;

    const score = result.score;
    const color = score >= 70 ? '#059669' : score >= 40 ? WARNING : DANGER;
    scoreVal.textContent = score;
    scoreVal.style.color = color;
    scoreFill.style.width = score + '%';
    scoreFill.style.background = color;

    tbody.innerHTML = '';
    for (const f of result.findings) {
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td class="sev-' + f.severity + '">' + escapeHtml(f.severity) + '</td>' +
        '<td>' + escapeHtml(f.category) + '</td>' +
        '<td>' + escapeHtml(f.message) + '</td>';
      tbody.appendChild(tr);
    }

    const count = result.findings.length;
    let summary = 'Scan complete in ' + (result._ms || 0) + ' ms. ';
    if (count === 0) summary += 'No security issues detected. Consider adding guardrails and output constraints for production.';
    else summary += count + ' finding(s) above. Review the Guidance panel for how to address them.';
    summaryEl.textContent = summary;
  }

  function renderGuidance(result) {
    const container = getEl('guidance-dynamic');
    const seen = new Set();
    let html = '';
    for (const f of result.findings) {
      const key = f.key || f.category;
      if (!key || seen.has(key)) continue;
      const g = GUIDANCE[key];
      if (!g) continue;
      seen.add(key);
      html +=
        '<div class="guidance-item">' +
        '<h4>' + escapeHtml(g.title) + '</h4>' +
        '<p>' + escapeHtml(g.body) + '</p>' +
        '</div>';
    }
    if (!html) html = '<p>No specific guidance for these findings. Review each finding and tighten instructions, add guardrails, and avoid including secrets in prompts or schemas.</p>';
    container.innerHTML = html;
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function onScan() {
    const inputType = getEl('input-type').value;
    const content = getEl('content').value;

    const result = runAnalysis(inputType, content);
    renderResults(result);
    renderGuidance(result);
  }

  getEl('scan-btn').addEventListener('click', onScan);
})();
