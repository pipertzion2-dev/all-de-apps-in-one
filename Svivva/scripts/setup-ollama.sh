#!/usr/bin/env bash
# Local Ollama for Svivva Play scale lookup + Orbit free AI.
set -euo pipefail

MODEL="${OLLAMA_MODEL:-llama3.1}"

if ! command -v ollama >/dev/null 2>&1; then
  echo "Install Ollama: https://ollama.com/download"
  exit 1
fi

echo "Pulling model: $MODEL"
ollama pull "$MODEL"

echo "Starting ollama serve (if not already running)..."
if ! curl -sf "http://127.0.0.1:11434/api/tags" >/dev/null 2>&1; then
  ollama serve &
  sleep 2
fi

ENV_FILE="$(dirname "$0")/../.env.local"
if [[ ! -f "$ENV_FILE" ]]; then
  touch "$ENV_FILE"
fi

grep -q '^OLLAMA_URL=' "$ENV_FILE" 2>/dev/null || echo 'OLLAMA_URL=http://127.0.0.1:11434' >>"$ENV_FILE"
grep -q '^OLLAMA_MODEL=' "$ENV_FILE" 2>/dev/null || echo "OLLAMA_MODEL=$MODEL" >>"$ENV_FILE"

echo ""
echo "Done. Add to Vercel (production) only if Ollama is reachable from the internet:"
echo "  OLLAMA_URL=https://your-ollama-host"
echo "  OLLAMA_MODEL=$MODEL"
echo ""
echo "Test scale lookup: npm run dev — Play → scale search with an obscure prompt."
