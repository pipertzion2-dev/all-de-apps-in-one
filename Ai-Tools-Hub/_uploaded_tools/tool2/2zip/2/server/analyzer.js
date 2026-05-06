/**
 * Schema Field Impact Analyzer
 * Scores and ranks schema fields by their likely impact on prompts/API behavior.
 * Kept under 3s; no heavy deps.
 */

const HIGH_IMPACT_NAMES = new Set([
  'content', 'message', 'body', 'input', 'output', 'query', 'prompt', 'instruction',
  'text', 'response', 'result', 'data', 'payload', 'role', 'system', 'user', 'assistant'
]);

function extractFieldsFromSchema(obj, prefix = '', depth = 0) {
  const fields = [];
  if (!obj || typeof obj !== 'object') return fields;

  const props = obj.properties || obj.fields || obj.params || obj;
  if (typeof props !== 'object') return fields;

  for (const [key, def] of Object.entries(props)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const required = Array.isArray(obj.required) && obj.required.includes(key);
    const type = (def && typeof def === 'object' && (def.type || def.schema?.type)) || typeof def;
    const desc = def?.description || def?.title || '';

    fields.push({
      path,
      key,
      required: !!required,
      depth,
      type: typeof type === 'string' ? type : (def?.schema?.type || 'unknown'),
      description: desc,
      enum: def?.enum ?? def?.schema?.enum
    });

    const nested = def?.properties ?? def?.items?.properties ?? def?.schema?.properties ?? def?.schema?.items?.properties;
    if (nested && typeof nested === 'object' && depth < 8) {
      fields.push(...extractFieldsFromSchema(
        { ...def, properties: nested, required: def?.required },
        path,
        depth + 1
      ));
    }
  }
  return fields;
}

function scoreField(field, promptText) {
  let score = 50;
  const keyLower = field.key.toLowerCase();
  const pathLower = field.path.toLowerCase();

  if (field.required) score += 25;
  if (HIGH_IMPACT_NAMES.has(keyLower) || HIGH_IMPACT_NAMES.has(pathLower.split('.').pop())) score += 20;
  if (field.depth === 0) score += 10;
  if (field.depth > 2) score -= 5;
  if (field.enum && field.enum.length > 0) score += 10;
  if (field.description && field.description.length > 10) score += 5;

  if (promptText && typeof promptText === 'string') {
    const text = promptText.toLowerCase();
    if (text.includes(keyLower) || text.includes(field.path.toLowerCase())) score += 15;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function analyzeSchemaFieldImpact({ schema, prompt, apiDefinition, modelPreference }) {
  let raw = schema || apiDefinition;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      throw new Error('Invalid JSON in schema or API definition.');
    }
  }
  if (!raw || typeof raw !== 'object') throw new Error('Please provide a schema or API definition (object or JSON string).');

  const promptText = typeof prompt === 'string' ? prompt : (raw.prompt || raw.instruction || '');
  const fields = extractFieldsFromSchema(raw);

  if (fields.length === 0) {
    return {
      summary: { totalFields: 0, message: 'No schema fields detected. Paste a JSON Schema, OpenAPI snippet, or object with properties.' },
      fields: [],
      chartData: { labels: [], values: [], colors: [] },
      guidance: [
        'Try pasting a JSON object with a "properties" key, or an OpenAPI schema with "properties" or "schema".',
        'Example: { "properties": { "message": { "type": "string" }, "role": { "type": "string", "enum": ["user","assistant"] } } }'
      ],
      modelPreference: modelPreference || null
    };
  }

  const withScores = fields.map(f => ({ ...f, impactScore: scoreField(f, promptText) }));
  withScores.sort((a, b) => b.impactScore - a.impactScore);

  const top = withScores.slice(0, 15);
  const chartData = {
    labels: top.map(f => f.path.length > 20 ? f.path.slice(0, 17) + '…' : f.path),
    values: top.map(f => f.impactScore),
    colors: top.map(f => f.impactScore >= 70 ? '#9333EA' : f.impactScore >= 50 ? '#a855f7' : '#c084fc')
  };

  const requiredCount = withScores.filter(f => f.required).length;
  const highImpactCount = withScores.filter(f => f.impactScore >= 70).length;

  const guidance = [
    `Found ${withScores.length} field(s). ${requiredCount} required, ${highImpactCount} high-impact.`,
    'High-impact fields (purple) usually drive model behavior most—tune these first when optimizing prompts.',
    'Required fields and fields mentioned in your prompt get higher impact scores.',
    'In production, use schema enforcement and versioning (e.g. Svivva) to avoid drift when you change these fields.'
  ];

  return {
    summary: {
      totalFields: withScores.length,
      requiredCount,
      highImpactCount,
      analyzedIn: 'schema + optional prompt'
    },
    fields: withScores,
    chartData,
    guidance,
    modelPreference: modelPreference || null
  };
}

export { analyzeSchemaFieldImpact };
