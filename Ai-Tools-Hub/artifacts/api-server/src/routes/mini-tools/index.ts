import { Router, type IRouter } from "express";

const router: IRouter = Router();

// ─── Tool 8: AI Model Comparison ─────────────────────────────────────────────
function runModelSwitchAnalysis(body: any) {
  const { prompt = '', schema = '', apiConfig = '', selectedModels = [] } = body;
  const text = [prompt, schema, apiConfig].filter(Boolean).join('\n');
  const length = text.length;
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  const models = [
    { id: 'gpt-4o', name: 'GPT-4o', tier: 'premium', inputPerM: 2.5, outputPerM: 10 },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', tier: 'standard', inputPerM: 0.15, outputPerM: 0.6 },
    { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', tier: 'premium', inputPerM: 3, outputPerM: 15 },
    { id: 'claude-3-haiku', name: 'Claude 3 Haiku', tier: 'efficient', inputPerM: 0.25, outputPerM: 1.25 },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', tier: 'premium', inputPerM: 1.25, outputPerM: 5 },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', tier: 'efficient', inputPerM: 0.075, outputPerM: 0.3 },
  ] as const;

  const toSimulate = (selectedModels as string[]).length
    ? models.filter((m) => (selectedModels as string[]).includes(m.id))
    : [...models];

  const charsPerToken = 4;
  const estInputTokens = Math.ceil(length / charsPerToken);
  const estOutputTokens = Math.ceil(estInputTokens * 0.5);

  const results = toSimulate.map((m) => {
    const inputCost = (estInputTokens / 1_000_000) * m.inputPerM;
    const outputCost = (estOutputTokens / 1_000_000) * m.outputPerM;
    const totalCost = inputCost + outputCost;
    const schemaStrict = schema.length > 0;
    const compatibility = schemaStrict
      ? (m.tier === 'premium' ? 98 : m.tier === 'standard' ? 92 : 85)
      : 100;
    return {
      modelId: m.id,
      modelName: m.name,
      tier: m.tier,
      estInputTokens,
      estOutputTokens,
      estTotalTokens: estInputTokens + estOutputTokens,
      estCostPerCall: Math.round(totalCost * 1e6) / 1e6,
      compatibilityScore: compatibility,
      schemaFriendly: schemaStrict ? (m.tier !== 'efficient') : true,
    };
  });

  return {
    summary: { promptLength: length, wordCount, hasSchema: schema.length > 0, hasApiConfig: apiConfig.length > 0, modelsAnalyzed: results.length },
    results,
    generatedAt: new Date().toISOString(),
  };
}

router.post('/ai-model-comparison/analyze', (req, res) => {
  try {
    res.json(runModelSwitchAnalysis(req.body));
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Analysis failed' });
  }
});

// ─── Tool 10: Prompt Consistency Checker ─────────────────────────────────────
function analyzePromptConsistency(prompt: string, schemaJson: any) {
  const text = (prompt || '').trim();
  const categories: any[] = [];
  const issues: string[] = [];
  const suggestions: string[] = [];

  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
  const termFreq: Record<string, number> = {};
  words.forEach(w => { termFreq[w] = (termFreq[w] || 0) + 1; });
  const uniqueTerms = Object.keys(termFreq).length;
  const totalWords = words.length;
  const repetitionRatio = totalWords > 0 ? 1 - uniqueTerms / totalWords : 0;
  const termScore = Math.min(100, Math.round(40 + repetitionRatio * 40));
  categories.push({ name: 'Terminology consistency', score: termScore, description: 'Use of consistent terms for the same concepts' });

  const lines = text.split(/\n/).filter((l: string) => l.trim());
  const hasSections = /^(#|\d\.|\*\*|##|-)\s/m.test(text) || lines.length >= 3;
  const structureScore = hasSections ? 85 : Math.min(70, 40 + lines.length * 5);
  categories.push({ name: 'Structure & formatting', score: structureScore, description: 'Clear sections and consistent formatting' });

  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const avgLen = sentences.length ? sentences.reduce((a: number, s: string) => a + s.trim().split(/\s+/).length, 0) / sentences.length : 0;
  const clarityScore = avgLen <= 25 && avgLen >= 5 ? 90 : avgLen < 5 ? 70 : Math.max(50, 90 - (avgLen - 25));
  categories.push({ name: 'Clarity', score: Math.min(100, Math.max(0, Math.round(clarityScore))), description: 'Readable sentence length and clear instructions' });

  let schemaScore: number | null = null;
  if (schemaJson) {
    try {
      const schema = typeof schemaJson === 'string' ? JSON.parse(schemaJson) : schemaJson;
      const schemaStr = JSON.stringify(schema);
      const fieldNames = (schemaStr.match(/"([a-zA-Z_][a-zA-Z0-9_]*)"\s*:/g) || []).map((m: string) => m.replace(/"([^"]+)"\s*:.*/, '$1'));
      const uniqueFields = [...new Set(fieldNames)] as string[];
      let matched = 0;
      uniqueFields.forEach((f: string) => { if (text.toLowerCase().includes(f.toLowerCase())) matched++; });
      schemaScore = uniqueFields.length ? Math.round((matched / uniqueFields.length) * 100) : 80;
      categories.push({ name: 'Schema alignment', score: schemaScore, description: 'Prompt references schema/API fields appropriately' });
    } catch (_) {
      categories.push({ name: 'Schema alignment', score: 0, description: 'Invalid schema JSON' });
    }
  }

  if (termScore < 60) { issues.push('Terminology varies.'); suggestions.push('Pick one term per concept.'); }
  if (structureScore < 60) { issues.push('Prompt lacks clear structure.'); suggestions.push('Use headings or numbered steps.'); }
  if (clarityScore < 60) { issues.push('Sentences may be too long.'); suggestions.push('Aim for 10–25 words per instruction.'); }
  if (schemaScore !== null && schemaScore < 70) { issues.push('Prompt may not align with schema.'); suggestions.push('Mention key field names in prompt.'); }
  if (text.length < 50) { issues.push('Prompt is very short.'); suggestions.push('Add clear instructions to improve scoring.'); }

  const overallScore = Math.round(categories.reduce((a: number, c: any) => a + c.score, 0) / categories.length);
  return {
    overallScore: Math.min(100, Math.max(0, overallScore)),
    categories,
    issues: issues.length ? issues : ['No major consistency issues detected.'],
    suggestions: suggestions.length ? suggestions : ['Keep your current structure and terminology.'],
    wordCount: totalWords,
    schemaChecked: !!schemaJson,
  };
}

router.post('/prompt-consistency-checker/analyze', (req, res) => {
  const start = Date.now();
  try {
    const { prompt, schema } = req.body || {};
    const result = analyzePromptConsistency(prompt, schema);
    (result as any).responseTimeMs = Date.now() - start;
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Analysis failed', message: err.message });
  }
});

// ─── Tool 11: Synthetic Dataset Generator ────────────────────────────────────
router.post('/synthetic-dataset-generator/analyze', (req, res) => {
  const start = Date.now();
  const { type, raw, model = 'balanced', rowCount = 10 } = req.body || {};
  const count = Math.min(100, Math.max(1, parseInt(rowCount, 10) || 10));

  let parsed: { properties: Record<string, any>; columns: string[] } = { properties: {}, columns: [] };

  if (type === 'schema' && raw) {
    try {
      const obj = JSON.parse(raw);
      if (obj.properties && typeof obj.properties === 'object') {
        parsed.properties = obj.properties;
        parsed.columns = Object.keys(obj.properties);
      } else if (Array.isArray(obj)) {
        parsed.columns = obj.filter((k: any) => typeof k === 'string');
        parsed.columns.forEach((k: string) => { parsed.properties[k] = { type: 'string' }; });
      } else if (typeof obj === 'object' && obj !== null) {
        parsed.columns = Object.keys(obj);
        parsed.properties = obj;
      }
    } catch (_) { parsed = { columns: [], properties: {} }; }
  } else if (type === 'prompt' && raw) {
    const words = (raw as string).replace(/[,;:\n]/g, ' ').split(/\s+/).filter(Boolean);
    const fieldLike = words.filter((w: string) => /^[a-z_][a-z0-9_]*$/i.test(w) && w.length > 2 && w.length < 30);
    parsed.columns = [...new Set(fieldLike)].slice(0, 12) as string[];
    parsed.columns.forEach((k: string) => { parsed.properties[k] = { type: 'string' }; });
  }

  const fields = parsed.columns.map((name: string) => {
    const prop = parsed.properties[name] || {};
    const t = (prop.type || 'string').toLowerCase();
    const format = (prop.format || '').toLowerCase();
    return { name, type: format === 'email' ? 'email' : t, score: 70 + Math.floor(Math.random() * 25) };
  });

  const schemaClarity = parsed.columns.length ? Math.min(100, 55 + parsed.columns.length * 4 + (type === 'schema' ? 15 : 0)) : 0;
  const diversityScore = model === 'edge-cases' ? 85 + Math.floor(Math.random() * 10) : 72 + Math.floor(Math.random() * 22);
  const scores = { schemaClarity, fieldCoverage: parsed.columns.length, diversityScore };

  const seed = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0; return Math.abs(h); };
  const seeded = (col: string, i: number) => (seed(col + String(i)) % 1000) / 1000;

  const sampleRows: any[] = [];
  for (let i = 0; i < count; i++) {
    const row: Record<string, any> = {};
    parsed.columns.forEach((col: string) => {
      const prop = parsed.properties[col] || {};
      const t = (prop.type || 'string').toLowerCase();
      const fmt = (prop.format || '').toLowerCase();
      if (t === 'integer' || t === 'number') {
        row[col] = model === 'edge-cases' && seeded(col, i) > 0.9 ? (seeded(col, i + 1) > 0.5 ? null : -1) : Math.floor(seeded(col, i) * 900) + 10;
      } else if (t === 'boolean') {
        row[col] = seeded(col, i) > 0.5;
      } else if (fmt === 'email' || col.toLowerCase().includes('email')) {
        row[col] = 'user' + (i + 1) + '@example.com';
      } else if (model === 'realistic' && (col.toLowerCase().includes('name') || col === 'title')) {
        const names = ['Alex', 'Jordan', 'Sam', 'Casey', 'Morgan', 'Riley', 'Quinn', 'Avery'];
        row[col] = names[Math.floor(seeded(col, i) * names.length)] + ' ' + (i + 1);
      } else {
        row[col] = 'sample_' + col + '_' + (i + 1);
      }
    });
    sampleRows.push(row);
  }

  const interpretation = [];
  if (scores.schemaClarity >= 80) interpretation.push('Schema is well-structured; we could infer types for all fields.');
  if (fields.length > 0) interpretation.push(`Generated ${fields.length} field(s) and ${sampleRows.length} sample row(s).`);
  interpretation.push('Use this data for tests, demos, or as a starting point for production datasets.');

  if (Date.now() - start > 2500) console.warn('Synthetic dataset generation slow:', Date.now() - start, 'ms');

  res.json({ scores, fields, columns: parsed.columns, sampleRows, interpretation });
});

// ─── Tool 18: AI BOM Generator ───────────────────────────────────────────────
function generateBOMPreview(body: any) {
  const { description = '', mode = 'hardware', collaborationSize } = body;
  const modes = ['hardware', 'play', 'idea', 'team', 'marketplace', 'build'];
  const m = modes.includes(mode) ? mode : 'hardware';

  const artifacts: Record<string, any> = {
    hardware: {
      type: 'bom_table', title: 'Bill of Materials (Preview)',
      columns: ['Ref', 'Part', 'Value', 'Package', 'Qty', 'Est. cost'],
      rows: [['R1','Resistor','10k','0603','1','$0.02'],['C1','Capacitor','100nF','0603','1','$0.03'],['U1','MCU','ATSAMD21','QFN-32','1','$2.50'],['J1','Connector','USB-C','SMD','1','$0.45'],['—','PCB','2-layer','50×30mm','1','$1.20']],
      totalEstimate: '$4.20', confidence: 0.82,
      stepLabel: 'Hardware pipeline – BOM extraction',
      fullWorkflowNote: 'In Svivva you get full schematic sync, versioning, and production-ready BOM export.',
    },
    play: {
      type: 'audio_preview', title: 'Play mode preview',
      waveform: [0.2,0.5,0.8,0.4,0.9,0.3,0.7,0.6], duration: '0:08', confidence: 0.78,
      stepLabel: 'Svivva Play – performance preview',
      fullWorkflowNote: 'In Svivva Play you get full session routing, effects, and multi-track export.',
    },
    idea: {
      type: 'idea_report', title: 'Idea report (preview)',
      sections: ['Concept','Feasibility','Next steps'],
      summary: 'Idea Engine stage: concept validation.',
      confidence: 0.75, stepLabel: 'Idea Engine – concept stage',
      fullWorkflowNote: 'In Svivva you get full Idea Engine stages, scoring, and roadmap linking.',
    },
    team: {
      type: 'setup_map', title: 'Collaboration setup (preview)',
      roles: ['Owner','Editor','Viewer'], size: collaborationSize || 'Small team',
      confidence: 0.80, stepLabel: 'Collaboration & permissions',
      fullWorkflowNote: 'In Svivva you get real-time collaboration, roles, and project sharing.',
    },
    marketplace: {
      type: 'flow_graph', title: 'API Marketplace preview',
      nodes: ['Publish','Review','Discover'], confidence: 0.72,
      stepLabel: 'API Marketplace – publishing flow',
      fullWorkflowNote: 'In Svivva you get full API publishing, versioning, and usage analytics.',
    },
    build: {
      type: 'flow_diagram', title: 'B.U.I.L.D. flow (preview)',
      steps: ['Digital design','Physical prototype','Production'], confidence: 0.79,
      stepLabel: 'B.U.I.L.D. – digital/physical flow',
      fullWorkflowNote: 'In Svivva you get full B.U.I.L.D. flows with cost tracking and production exports.',
    },
  };

  const artifact = artifacts[m] || artifacts.hardware;
  return { ok: true, artifact: { ...artifact, description: (description as string).slice(0, 200) }, generatedAt: new Date().toISOString() };
}

router.post('/ai-bom-generator/generate', (req, res) => {
  try {
    res.json(generateBOMPreview(req.body));
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
