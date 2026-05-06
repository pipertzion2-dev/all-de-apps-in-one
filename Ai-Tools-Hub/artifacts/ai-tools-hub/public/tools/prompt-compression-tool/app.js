/**
 * Prompt Compression Tool — client-side analysis (no backend, <3s).
 * Estimates tokens, finds redundancy, suggests compressed prompt.
 */

(function () {
  const CHARS_PER_TOKEN = 4;

  const $ = (id) => document.getElementById(id);
  const promptInput = $('prompt-input');
  const modelSelect = $('model-select');
  const analyzeBtn = $('analyze-btn');
  const resultsPlaceholder = $('results-placeholder');
  const resultsContent = $('results-content');
  const metricTokens = $('metric-tokens');
  const metricScore = $('metric-score');
  const metricSavings = $('metric-savings');
  const compressedOutput = $('compressed-output');
  const redundancyList = $('redundancy-list');
  const copyCompressed = $('copy-compressed');
  const guidanceDefault = $('guidance-default');
  const guidanceDynamic = $('guidance-dynamic');

  function estimateTokens(text) {
    if (!text || !text.trim()) return 0;
    return Math.ceil(text.trim().length / CHARS_PER_TOKEN);
  }

  function findRedundancies(text) {
    const items = [];
    const t = text.replace(/\s+/g, ' ').trim();

    // Repeated phrases (2+ words)
    const words = t.split(' ');
    const seen = new Map();
    for (let i = 0; i < words.length - 1; i++) {
      const two = words[i] + ' ' + words[i + 1];
      const three = i < words.length - 2 ? two + ' ' + words[i + 2] : '';
      for (const phrase of [three, two].filter(Boolean)) {
        if (phrase.length < 8) continue;
        const count = (seen.get(phrase) || 0) + 1;
        seen.set(phrase, count);
        if (count === 2) items.push({ type: 'Repeated phrase', snippet: phrase });
      }
    }

    // Filler patterns
    const fillers = [
      { pattern: /\b(please\s+)?(kindly\s+)?(could you\s+)?(would you\s+)?/gi, label: 'Polite filler' },
      { pattern: /\b(it is\s+)?(important\s+)?(to\s+)?(note that|remember that)\s+/gi, label: 'Verbose intro' },
      { pattern: /\b(in\s+order\s+to\s+)/gi, label: '"in order to" (use "to")' },
      { pattern: /\b(due\s+to\s+the\s+fact\s+that)\s+/gi, label: '"due to the fact that" (use "because")' },
      { pattern: /\b(at\s+this\s+point\s+in\s+time)\b/gi, label: '"at this point in time" (use "now")' },
      { pattern: /\b(a\s+large\s+number\s+of)\b/gi, label: 'Wordy phrase (use "many")' },
      { pattern: /\b(in\s+the\s+event\s+that\s+)/gi, label: '"in the event that" (use "if")' },
      { pattern: /\b(each\s+and\s+every\s+)/gi, label: '"each and every" (use "each" or "every")' },
      { pattern: /\b(very\s+)+(important|critical|essential)\b/gi, label: '"very" + adjective (shorten)' },
      { pattern: /\b(really\s+)+(need|must|should)\b/gi, label: '"really" + verb (shorten)' },
    ];

    for (const { pattern, label } of fillers) {
      const match = t.match(pattern);
      if (match) items.push({ type: label, snippet: match[0].trim().slice(0, 40) });
    }

    // Long sentences (potential for splitting/shortening)
    const sentences = t.split(/(?<=[.!?])\s+/).filter(Boolean);
    const long = sentences.filter(s => s.length > 120);
    if (long.length) items.push({ type: 'Long sentence', snippet: long[0].slice(0, 50) + '…' });

    return items.slice(0, 8);
  }

  function compressPrompt(text) {
    let out = text
      .replace(/\s+/g, ' ')
      .replace(/\s*([.,;:!?])\s*/g, '$1 ')
      .trim();

    out = out
      .replace(/\bplease\s+kindly\s+/gi, '')
      .replace(/\bcould you\s+/gi, '')
      .replace(/\bwould you\s+/gi, '')
      .replace(/\bin order to\s+/gi, 'to ')
      .replace(/\bdue to the fact that\s+/gi, 'because ')
      .replace(/\bat this point in time\b/gi, 'now')
      .replace(/\bin the event that\s+/gi, 'if ')
      .replace(/\beach and every\s+/gi, 'each ')
      .replace(/\bit is important to note that\s+/gi, '')
      .replace(/\b(very\s+)+(important|critical|essential)\b/gi, '$2')
      .replace(/\breally\s+/gi, '');

    out = out.replace(/\s+/g, ' ').trim();
    return out;
  }

  function computeCompressionScore(original, compressed, redundancies) {
    if (!original || !original.trim()) return 0;
    const origLen = original.trim().length;
    const compLen = compressed.length;
    const ratio = origLen > 0 ? (1 - compLen / origLen) : 0;
    const redundancyBonus = Math.min(redundancies.length * 6, 30);
    const score = Math.round(Math.min(100, ratio * 70 + redundancyBonus));
    return Math.max(0, score);
  }

  function runAnalysis() {
    const raw = promptInput.value || '';
    const original = raw.trim();

    if (!original) {
      resultsPlaceholder.hidden = false;
      resultsContent.hidden = true;
      guidanceDynamic.hidden = true;
      guidanceDefault.hidden = false;
      return;
    }

    const start = performance.now();
    const tokens = estimateTokens(original);
    const redundancies = findRedundancies(original);
    const compressed = compressPrompt(original);
    const compressedTokens = estimateTokens(compressed);
    const score = computeCompressionScore(original, compressed, redundancies);
    const savings = original.length > 0
      ? Math.round((1 - compressed.length / original.length) * 100)
      : 0;
    const elapsed = performance.now() - start;

    resultsPlaceholder.hidden = true;
    resultsContent.hidden = false;

    metricTokens.textContent = tokens.toLocaleString();
    metricScore.textContent = score + '/100';
    metricSavings.textContent = (savings > 0 ? '~' : '') + savings + '%';

    compressedOutput.textContent = compressed || '(no change after cleanup)';
    compressedOutput.dataset.value = compressed;

    redundancyList.innerHTML = '';
    if (redundancies.length) {
      redundancies.forEach(({ type, snippet }) => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="highlight">${type}</span>: ${escapeHtml(snippet.slice(0, 50))}${snippet.length > 50 ? '…' : ''}`;
        redundancyList.appendChild(li);
      });
    } else {
      const li = document.createElement('li');
      li.textContent = 'No obvious redundancy detected.';
      redundancyList.appendChild(li);
    }

    guidanceDynamic.hidden = false;
    guidanceDefault.hidden = true;
    guidanceDynamic.innerHTML = `
      <p><strong>Interpretation</strong></p>
      <p>Your prompt is ~${tokens.toLocaleString()} tokens (${original.length} chars). Compression score ${score}/100. ${savings > 0 ? 'You can save ~' + savings + '% length with the suggested version.' : 'Already fairly concise.'}</p>
      <p><strong>Next step</strong></p>
      <p>Copy the compressed prompt and test it. In production, use Svivva for versioning, tests, and cost control.</p>
    `;

    if (elapsed > 100) console.debug('Analysis took', Math.round(elapsed), 'ms');
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  let inputDebounce;
  function scheduleAnalysis() {
    clearTimeout(inputDebounce);
    inputDebounce = setTimeout(() => {
      if (promptInput.value.trim()) runAnalysis();
      else {
        resultsPlaceholder.hidden = false;
        resultsContent.hidden = true;
        guidanceDynamic.hidden = true;
        guidanceDefault.hidden = false;
      }
    }, 400);
  }

  analyzeBtn.addEventListener('click', runAnalysis);
  promptInput.addEventListener('input', scheduleAnalysis);
  promptInput.addEventListener('paste', () => setTimeout(scheduleAnalysis, 50));

  copyCompressed.addEventListener('click', () => {
    const text = compressedOutput.dataset.value || compressedOutput.textContent || '';
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      const label = copyCompressed.textContent;
      copyCompressed.textContent = 'Copied';
      copyCompressed.disabled = true;
      setTimeout(() => {
        copyCompressed.textContent = label;
        copyCompressed.disabled = false;
      }, 1500);
    });
  });

  // Optional: run on load if there is initial content (e.g. from URL hash)
  if (promptInput.value.trim()) runAnalysis();
})();
