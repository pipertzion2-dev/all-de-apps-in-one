import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(join(__dirname, 'public')));

/**
 * Model Switch Simulator analysis:
 * Given prompt/schema/config, simulate compatibility, token estimates, and cost across models.
 * Runtime kept under 3 seconds.
 */
function runModelSwitchAnalysis(body) {
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
  ];

  const toSimulate = selectedModels.length
    ? models.filter((m) => selectedModels.includes(m.id))
    : models;

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
    summary: {
      promptLength: length,
      wordCount,
      hasSchema: schema.length > 0,
      hasApiConfig: apiConfig.length > 0,
      modelsAnalyzed: results.length,
    },
    results,
    generatedAt: new Date().toISOString(),
  };
}

app.post('/api/analyze', (req, res) => {
  try {
    const analysis = runModelSwitchAnalysis(req.body);
    res.json(analysis);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Analysis failed' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Model Switch Simulator running at http://localhost:${PORT}`);
});
