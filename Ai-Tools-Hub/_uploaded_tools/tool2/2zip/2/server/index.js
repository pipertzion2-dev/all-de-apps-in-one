import express from 'express';
import cors from 'cors';
import { analyzeSchemaFieldImpact } from './analyzer.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.post('/api/analyze', (req, res) => {
  const start = Date.now();
  try {
    const { schema, prompt, apiDefinition, modelPreference } = req.body;
    const result = analyzeSchemaFieldImpact({ schema, prompt, apiDefinition, modelPreference });
    result._meta = { durationMs: Date.now() - start };
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message, _meta: { durationMs: Date.now() - start } });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Schema Field Impact Analyzer running at http://localhost:${PORT}`);
  console.log(`Also try: http://127.0.0.1:${PORT}`);
});
