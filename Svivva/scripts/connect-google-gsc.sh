#!/usr/bin/env bash
# One-command Google Search Console wiring for zzaizzai.com production.
#
# Prereq (the ONE human step — Google's security model, no API can skip it):
#   1. Go to https://console.cloud.google.com/apis/credentials
#   2. Create an OAuth client ID → type "Web application"
#   3. Authorized redirect URI:  https://zzaizzai.com/api/gsc/oauth/callback
#   4. Copy the Client ID and Client Secret.
#   5. Also enable these APIs for the project:
#        - "Google Search Console API"  (Webmasters)
#        - "Web Search Indexing API"     (Indexing)
#
# Then run (from Svivva/):
#   bash scripts/connect-google-gsc.sh <CLIENT_ID> <CLIENT_SECRET>
#
# Targets Vercel team zzai-zzai / project all-de-apps-in-one (see vercel-canonical.json).
# After deploy, open https://zzaizzai.com/dashboard/gsc-connect and click Connect with Google.
set -euo pipefail

DOMAIN="zzaizzai.com"
SCOPE_ARGS=(--scope zzai-zzai --project all-de-apps-in-one)

CID="${1:-${GOOGLE_GSC_CLIENT_ID:-}}"
CSEC="${2:-${GOOGLE_GSC_CLIENT_SECRET:-}}"

if [[ -z "$CID" || -z "$CSEC" ]]; then
  echo "usage: bash scripts/connect-google-gsc.sh <CLIENT_ID> <CLIENT_SECRET>" >&2
  exit 1
fi

cd "$(dirname "${BASH_SOURCE[0]}")/.."

set_var() {
  local name="$1" value="$2"
  vercel env rm "$name" production -y "${SCOPE_ARGS[@]}" >/dev/null 2>&1 || true
  printf "%s" "$value" | vercel env add "$name" production "${SCOPE_ARGS[@]}" >/dev/null
  echo "  ✓ set $name (production)"
}

echo "Wiring Google Search Console OAuth into Vercel production (zzai-zzai/all-de-apps-in-one)…"
set_var GOOGLE_GSC_CLIENT_ID "$CID"
set_var GOOGLE_GSC_CLIENT_SECRET "$CSEC"

if ! vercel env ls production "${SCOPE_ARGS[@]}" 2>/dev/null | grep -q NEXT_PUBLIC_SITE_URL; then
  printf "%s" "https://${DOMAIN}" | vercel env add NEXT_PUBLIC_SITE_URL production "${SCOPE_ARGS[@]}" >/dev/null
  echo "  ✓ set NEXT_PUBLIC_SITE_URL=https://${DOMAIN} (production)"
fi

echo "Redeploying…"
vercel deploy --prod --yes "${SCOPE_ARGS[@]}"
echo
echo "Done. Open https://${DOMAIN}/dashboard/gsc-connect and click 'Connect with Google'."
