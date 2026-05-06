(function () {
  'use strict';

  var inputEl = document.getElementById('jsonInput');
  var fileInput = document.getElementById('fileInput');
  var repairedCode = document.getElementById('repairedCode');
  var repairedOutput = document.getElementById('repairedOutput');
  var fixesList = document.getElementById('fixesList');
  var resultStatus = document.getElementById('resultStatus');
  var inputStats = document.getElementById('inputStats');
  var guidanceContent = document.getElementById('guidanceContent');

  var SAMPLE = '{\n  name: "API Response",\n  items: [1, 2, 3,],\n  active: true,\n  // comment\n  meta: \'single-quoted\'\n}';

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function updateInputStats() {
    var v = inputEl.value;
    var lines = v ? v.split(/\n/).length : 0;
    inputStats.textContent = v.length + ' chars, ' + lines + ' lines';
  }

  function runRepair() {
    var raw = inputEl.value;
    if (!raw.trim()) {
      repairedCode.textContent = '—';
      fixesList.innerHTML = '—';
      resultStatus.textContent = '';
      resultStatus.className = 'result-status';
      guidanceContent.innerHTML = '<p class="guidance-placeholder">Paste JSON in the left panel to see repair suggestions and explanations here.</p>';
      return;
    }

    var start = performance.now();
    var result = window.JSONRepair.repair(raw);
    var elapsed = (performance.now() - start).toFixed(0);

    repairedCode.textContent = result.repaired || '—';

    fixesList.innerHTML = '';
    if (result.fixes && result.fixes.length) {
      result.fixes.forEach(function (f) {
        var div = document.createElement('div');
        div.className = 'fix-item';
        div.innerHTML = '<span class="fix-badge">' + escapeHtml(f.type) + '</span> ' + escapeHtml(f.message);
        fixesList.appendChild(div);
      });
    } else {
      fixesList.textContent = result.valid ? 'No fixes needed — valid JSON.' : 'No automatic fixes applied.';
    }

    resultStatus.textContent = result.valid
      ? 'Valid JSON. Repaired in ' + elapsed + ' ms.'
      : 'Repair attempted. Parse error: ' + (result.error || 'Unknown');
    resultStatus.className = 'result-status ' + (result.valid ? 'success' : 'error');

    var guidance = [];
    if (result.valid) {
      guidance.push('<p>Your input was repaired successfully. The output on the left is valid JSON you can use in APIs, configs, or prompt payloads.</p>');
    } else {
      guidance.push('<p>We applied common fixes, but the result still has a parse error. Check brackets, commas, and string escaping (e.g. <code>\\"</code> inside strings).</p>');
    }
    if (result.fixes && result.fixes.length) {
      guidance.push('<p><strong>Applied:</strong> ' + result.fixes.map(function (f) { return f.message; }).join('; ') + '.</p>');
    }
    guidance.push('<p>In production, use schema enforcement and validation (e.g. in Svivva) to catch these issues before they reach your API.</p>');
    guidanceContent.innerHTML = guidance.join('');
  }

  function copyRepaired() {
    var text = repairedCode.textContent;
    if (!text || text === '—') return;
    navigator.clipboard.writeText(text).then(function () {
      var btn = document.getElementById('btnCopy');
      var orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(function () { btn.textContent = orig; }, 1500);
    });
  }

  function setupTabs() {
    document.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var t = tab.getAttribute('data-tab');
        document.querySelectorAll('.tab').forEach(function (x) { x.classList.remove('active'); });
        document.querySelectorAll('.tab-pane').forEach(function (p) { p.classList.remove('active'); });
        tab.classList.add('active');
        var pane = t === 'repaired' ? document.getElementById('repairedPane') : document.getElementById('fixesPane');
        if (pane) pane.classList.add('active');
      });
    });
  }

  inputEl.addEventListener('input', function () {
    updateInputStats();
    runRepair();
  });

  inputEl.addEventListener('paste', function () {
    setTimeout(function () {
      updateInputStats();
      runRepair();
    }, 10);
  });

  fileInput.addEventListener('change', function () {
    var f = fileInput.files && fileInput.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      inputEl.value = r.result;
      updateInputStats();
      runRepair();
    };
    r.readAsText(f);
    fileInput.value = '';
  });

  document.getElementById('btnSample').addEventListener('click', function () {
    inputEl.value = SAMPLE;
    updateInputStats();
    runRepair();
  });

  document.getElementById('btnClear').addEventListener('click', function () {
    inputEl.value = '';
    updateInputStats();
    runRepair();
  });

  document.getElementById('btnCopy').addEventListener('click', copyRepaired);

  setupTabs();
  updateInputStats();
  runRepair();
})();
