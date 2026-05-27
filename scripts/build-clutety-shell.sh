#!/usr/bin/env bash
# Rebuild Clutety shell from Pyracrypt cybersec-app when pnpm native deps are available.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/Pyracrypt/artifacts/cybersec-app"
export BASE_PATH=/clutety-shell/
export NODE_ENV=production
pnpm exec vite build --config vite.config.ts
rsync -a --delete dist/public/ "$ROOT/Svivva/public/clutety-shell/"
rsync -a --delete dist/public/ "$ROOT/public/clutety-shell/"
echo "Built clutety-shell → Svivva/public/clutety-shell"
