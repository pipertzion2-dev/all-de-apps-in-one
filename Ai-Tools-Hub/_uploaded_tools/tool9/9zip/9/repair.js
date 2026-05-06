/**
 * JSON Repair — client-side repair for common malformed JSON.
 * Used by JSON Repair Playground. Runtime kept under 3s (effectively instant).
 */

(function (global) {
  'use strict';

  function repairJSON(input) {
    var fixes = [];
    if (typeof input !== 'string') return { repaired: '', fixes: [], valid: false, error: 'Input must be a string' };

    var s = input.trim();
    if (!s) return { repaired: '{}', fixes: [], valid: true };

    // 1) Strip single-line and multi-line comments
    var beforeComments = s;
    s = s.replace(/\/\*[\s\S]*?\*\//g, '');
    s = s.replace(/\/\/[^\n]*/g, '');
    if (s !== beforeComments) fixes.push({ type: 'comments', message: 'Removed // and /* */ comments' });

    // 2) Replace single-quoted strings with double-quoted (simple heuristic: '...' -> "...")
    var beforeQuotes = s;
    s = replaceSingleQuotedStrings(s);
    if (s !== beforeQuotes) fixes.push({ type: 'quotes', message: 'Replaced single-quoted strings with double quotes' });

    // 3) Quote unquoted object keys (word characters before colon)
    var beforeKeys = s;
    s = quoteUnquotedKeys(s);
    if (s !== beforeKeys) fixes.push({ type: 'keys', message: 'Quoted unquoted object keys' });

    // 4) Remove trailing commas before ] or }
    var beforeTrailing = s;
    s = s.replace(/,(\s*[}\]])/g, '$1');
    if (s !== beforeTrailing) fixes.push({ type: 'trailing', message: 'Removed trailing commas' });

    // 5) Try parse
    try {
      JSON.parse(s);
      return { repaired: prettyPrint(s), fixes: fixes, valid: true };
    } catch (e) {
      return { repaired: s, fixes: fixes, valid: false, error: e.message };
    }
  }

  function replaceSingleQuotedStrings(str) {
    var result = '';
    var i = 0;
    var inDouble = false;
    var inSingle = false;
    var escape = false;
    var start = 0;

    while (i < str.length) {
      var c = str[i];

      if (escape) {
        escape = false;
        result += c;
        i++;
        continue;
      }
      if (c === '\\' && (inDouble || inSingle)) {
        escape = true;
        result += c;
        i++;
        continue;
      }
      if (c === '"' && !inSingle) {
        inDouble = !inDouble;
        result += c;
        i++;
        continue;
      }
      if (inDouble) {
        result += c;
        i++;
        continue;
      }
      if (c === "'" && !inDouble) {
        if (!inSingle) {
          inSingle = true;
          result += '"';
          start = i + 1;
        } else {
          inSingle = false;
          var inner = str.slice(start, i).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
          result += inner + '"';
        }
        i++;
        continue;
      }
      if (!inSingle) result += c;
      i++;
    }
    if (inSingle) result += str.slice(start).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
    return result;
  }

  function quoteUnquotedKeys(str) {
    return str.replace(/(\{|,)\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
  }

  function prettyPrint(str) {
    try {
      return JSON.stringify(JSON.parse(str), null, 2);
    } catch (_) {
      return str;
    }
  }

  global.JSONRepair = { repair: repairJSON };
})(typeof window !== 'undefined' ? window : this);
