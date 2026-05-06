(function () {
  const promptEl = document.getElementById('prompt');
  const outputAEl = document.getElementById('output-a');
  const outputBEl = document.getElementById('output-b');
  const schemaEl = document.getElementById('schema');
  const runBtn = document.getElementById('run-diff');
  const clearBtn = document.getElementById('clear-all');
  const diffContainer = document.getElementById('diff-container');
  const diffPlaceholder = document.getElementById('diff-placeholder');
  const diffOutput = document.getElementById('diff-output');
  const statsBar = document.getElementById('stats-bar');
  const statSimilarity = document.getElementById('stat-similarity');
  const statAdditions = document.getElementById('stat-additions');
  const statDeletions = document.getElementById('stat-deletions');
  const statTime = document.getElementById('stat-time');
  const interpretationText = document.getElementById('interpretation-text');
  const modeRadios = document.querySelectorAll('input[name="diff-mode"]');

  function getMode() {
    const checked = document.querySelector('input[name="diff-mode"]:checked');
    return checked ? checked.value : 'unified';
  }

  function runDiff() {
    const textA = (outputAEl && outputAEl.value) || '';
    const textB = (outputBEl && outputBEl.value) || '';
    const start = performance.now();

    if (!textA.trim() && !textB.trim()) {
      diffPlaceholder.hidden = false;
      diffOutput.hidden = true;
      statsBar.hidden = true;
      if (interpretationText) interpretationText.textContent = 'Add Output A and/or Output B to run the diff.';
      return;
    }

    const mode = getMode();
    let diffResult;
    let additions = 0, deletions = 0;

    if (mode === 'words') {
      const wordResult = window.AIOutputDiff && AIOutputDiff.wordDiff(textA, textB);
      if (wordResult) {
        const rendered = AIOutputDiff.renderWords(wordResult);
        diffResult = rendered.fragment;
        additions = rendered.additions;
        deletions = rendered.deletions;
      }
    } else {
      const lineResult = window.AIOutputDiff && AIOutputDiff.lineDiff(textA, textB);
      if (lineResult) {
        if (mode === 'side-by-side') {
          const rendered = AIOutputDiff.renderSideBySide(lineResult);
          diffResult = rendered.fragment;
          additions = rendered.additions;
          deletions = rendered.deletions;
        } else {
          const rendered = AIOutputDiff.renderUnified(lineResult);
          diffResult = rendered.fragment;
          additions = rendered.additions;
          deletions = rendered.deletions;
        }
      }
    }

    const elapsed = performance.now() - start;
    const sim = window.AIOutputDiff ? AIOutputDiff.similarity(textA, textB) : 0;

    diffPlaceholder.hidden = true;
    diffOutput.hidden = false;
    diffOutput.innerHTML = '';
    diffOutput.className = 'diff-output' + (mode === 'side-by-side' ? ' side-by-side' : '');
    if (diffResult) diffOutput.appendChild(diffResult);

    statSimilarity.textContent = 'Similarity: ' + sim + '%';
    statAdditions.textContent = 'Additions: ' + additions;
    statDeletions.textContent = 'Deletions: ' + deletions;
    statTime.textContent = 'Time: ' + (elapsed < 1000 ? '<1s' : (elapsed / 1000).toFixed(2) + 's');
    statsBar.hidden = false;

    if (interpretationText) {
      if (sim >= 90) {
        interpretationText.textContent = 'Outputs are very similar. Minor wording or formatting differences only. Good for consistency checks.';
      } else if (sim >= 60) {
        interpretationText.textContent = 'Moderate differences. Review additions and deletions to see where the models or versions diverge—useful for prompt tuning.';
      } else if (sim >= 30) {
        interpretationText.textContent = 'Significant differences. Consider which structure or tone you want; use this to compare model behavior or prompt variants.';
      } else {
        interpretationText.textContent = 'Outputs differ substantially. Check that both responses address the same prompt; useful for A/B testing models or prompts.';
      }
    }
  }

  function clearAll() {
    if (promptEl) promptEl.value = '';
    if (outputAEl) outputAEl.value = '';
    if (outputBEl) outputBEl.value = '';
    if (schemaEl) schemaEl.value = '';
    const apiConfigEl = document.getElementById('api-config');
    if (apiConfigEl) apiConfigEl.value = '';
    diffPlaceholder.hidden = false;
    diffOutput.hidden = true;
    diffOutput.innerHTML = '';
    statsBar.hidden = true;
    if (interpretationText) interpretationText.textContent = 'Run a diff to see interpretation and tips here.';
  }

  if (runBtn) runBtn.addEventListener('click', runDiff);
  if (clearBtn) clearBtn.addEventListener('click', clearAll);

  modeRadios.forEach(function (radio) {
    radio.addEventListener('change', function () {
      if (!diffOutput.hidden && outputAEl && outputBEl && (outputAEl.value.trim() || outputBEl.value.trim())) {
        runDiff();
      }
    });
  });

  [outputAEl, outputBEl].forEach(function (el) {
    if (el) {
      el.addEventListener('input', function () {
        if (outputAEl.value.trim() || outputBEl.value.trim()) {
          runDiff();
        } else {
          diffPlaceholder.hidden = false;
          diffOutput.hidden = true;
          statsBar.hidden = true;
        }
      });
    }
  });
})();
