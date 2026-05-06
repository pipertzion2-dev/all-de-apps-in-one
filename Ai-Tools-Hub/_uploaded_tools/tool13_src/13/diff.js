/**
 * Lightweight diff for AI output comparison.
 * Line-based and word-based modes; runs in under 3s (client-side, instant).
 */

(function (global) {
  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function lineDiff(textA, textB) {
    const linesA = textA ? textA.split(/\r?\n/) : [];
    const linesB = textB ? textB.split(/\r?\n/) : [];
    const result = [];
    const m = linesA.length;
    const n = linesB.length;
    const lcs = lcsLength(linesA, linesB);

    let i = 0, j = 0;
    while (i < m || j < n) {
      if (i < m && j < n && linesA[i] === linesB[j]) {
        result.push({ type: 'unchanged', a: linesA[i], b: linesB[j] });
        i++;
        j++;
      } else if (j < n && (i >= m || lcs[i][j + 1] >= lcs[i + 1][j])) {
        result.push({ type: 'add', b: linesB[j] });
        j++;
      } else if (i < m) {
        result.push({ type: 'del', a: linesA[i] });
        i++;
      }
    }
    return result;
  }

  function lcsLength(a, b) {
    const m = a.length, n = b.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    for (let i = m - 1; i >= 0; i--) {
      for (let j = n - 1; j >= 0; j--) {
        if (a[i] === b[j]) dp[i][j] = 1 + dp[i + 1][j + 1];
        else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    return dp;
  }

  function wordDiff(textA, textB) {
    const tokensA = tokenizeWords(textA);
    const tokensB = tokenizeWords(textB);
    const result = [];
    const m = tokensA.length, n = tokensB.length;
    const lcs = lcsLength(tokensA, tokensB);

    let i = 0, j = 0;
    while (i < m || j < n) {
      if (i < m && j < n && tokensA[i] === tokensB[j]) {
        result.push({ type: 'unchanged', value: tokensA[i] });
        i++;
        j++;
      } else if (j < n && (i >= m || lcs[i][j + 1] >= lcs[i + 1][j])) {
        result.push({ type: 'add', value: tokensB[j] });
        j++;
      } else if (i < m) {
        result.push({ type: 'del', value: tokensA[i] });
        i++;
      }
    }
    return result;
  }

  function tokenizeWords(s) {
    if (!s || !s.length) return [];
    const parts = [];
    const re = /(\s+|\S+)/g;
    let match;
    while ((match = re.exec(s)) !== null) parts.push(match[1]);
    return parts;
  }

  function renderUnified(diffLines) {
    const frag = document.createDocumentFragment();
    let additions = 0, deletions = 0;
    for (const item of diffLines) {
      const line = document.createElement('div');
      line.className = 'line ' + item.type;
      if (item.type === 'add') {
        line.textContent = '+' + (item.b ?? item.value ?? '');
        additions++;
      } else if (item.type === 'del') {
        line.textContent = '-' + (item.a ?? item.value ?? '');
        deletions++;
      } else {
        line.textContent = ' ' + (item.a ?? item.b ?? item.value ?? '');
      }
      frag.appendChild(line);
    }
    return { fragment: frag, additions, deletions };
  }

  function renderSideBySide(diffLines) {
    const left = document.createElement('div');
    left.className = 'column';
    const right = document.createElement('div');
    right.className = 'column';
    const h4L = document.createElement('h4');
    h4L.textContent = 'Output A';
    const h4R = document.createElement('h4');
    h4R.textContent = 'Output B';
    left.appendChild(h4L);
    right.appendChild(h4R);

    let additions = 0, deletions = 0;
    for (const item of diffLines) {
      const lineL = document.createElement('div');
      const lineR = document.createElement('div');
      lineL.className = 'line ' + (item.type === 'del' ? 'del' : 'unchanged');
      lineR.className = 'line ' + (item.type === 'add' ? 'add' : 'unchanged');
      if (item.type === 'unchanged') {
        lineL.textContent = item.a ?? item.value ?? '';
        lineR.textContent = item.b ?? item.value ?? '';
      } else if (item.type === 'del') {
        lineL.textContent = item.a ?? item.value ?? '';
        lineR.textContent = '\u00a0';
        deletions++;
      } else {
        lineL.textContent = '\u00a0';
        lineR.textContent = item.b ?? item.value ?? '';
        additions++;
      }
      left.appendChild(lineL);
      right.appendChild(lineR);
    }
    const wrapper = document.createElement('div');
    wrapper.className = 'side-by-side-wrapper';
    wrapper.appendChild(left);
    wrapper.appendChild(right);
    return { fragment: wrapper, additions, deletions };
  }

  function renderWords(wordDiffResult) {
    const frag = document.createDocumentFragment();
    let additions = 0, deletions = 0;
    const line = document.createElement('div');
    line.className = 'line';
    for (const item of wordDiffResult) {
      const span = document.createElement('span');
      span.className = item.type;
      span.textContent = item.value ?? '';
      if (item.type === 'add') additions++;
      else if (item.type === 'del') deletions++;
      line.appendChild(span);
    }
    frag.appendChild(line);
    return { fragment: frag, additions, deletions };
  }

  function similarity(textA, textB) {
    if (!textA && !textB) return 100;
    if (!textA || !textB) return 0;
    const a = textA.trim(), b = textB.trim();
    if (!a.length && !b.length) return 100;
    const lineDiffResult = lineDiff(a, b);
    let same = 0, total = 0;
    for (const item of lineDiffResult) {
      if (item.type === 'unchanged') same++;
      total++;
    }
    return total === 0 ? 100 : Math.round((same / total) * 100);
  }

  global.AIOutputDiff = {
    lineDiff,
    wordDiff,
    renderUnified,
    renderSideBySide,
    renderWords,
    similarity
  };
})(typeof window !== 'undefined' ? window : this);
