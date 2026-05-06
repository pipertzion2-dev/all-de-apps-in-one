/**
 * Optional backend template for AI Output Diff Visualizer.
 * Reuse this and swap the analysis logic for other mini-apps. Keeps runtime under 3s.
 */
const http = require('http');

function lineDiff(textA, textB) {
  const linesA = textA ? textA.split(/\r?\n/) : [];
  const linesB = textB ? textB.split(/\r?\n/) : [];
  const result = [];
  const m = linesA.length, n = linesB.length;
  const lcs = lcsLength(linesA, linesB);
  let i = 0, j = 0;
  while (i < m || j < n) {
    if (i < m && j < n && linesA[i] === linesB[j]) {
      result.push({ type: 'unchanged', a: linesA[i], b: linesB[j] });
      i++; j++;
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
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? 1 + dp[i + 1][j + 1] : Math.max(dp[i + 1][j], dp[i][j + 1]);
  return dp;
}

function similarity(lines) {
  let same = 0;
  for (const item of lines) if (item.type === 'unchanged') same++;
  return lines.length === 0 ? 100 : Math.round((same / lines.length) * 100);
}

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }
  if (req.method !== 'POST' || req.url !== '/diff') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    try {
      const { outputA = '', outputB = '' } = JSON.parse(body);
      const start = Date.now();
      const lines = lineDiff(outputA, outputB);
      const sim = similarity(lines);
      const additions = lines.filter(l => l.type === 'add').length;
      const deletions = lines.filter(l => l.type === 'del').length;
      const elapsed = Date.now() - start;
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        diff: lines,
        similarity: sim,
        additions,
        deletions,
        timeMs: elapsed
      }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid JSON or missing outputA/outputB' }));
    }
  });
});

server.listen(PORT, () => console.log('Diff API on http://localhost:' + PORT + ' (POST /diff)'));
