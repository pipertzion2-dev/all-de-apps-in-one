#!/usr/bin/env bash
# One-command Google Search Console wiring.
#
# Prereq (the ONE human step — Google's security model, no API can skip it):
#   1. Go to https://console.cloud.google.com/apis/credentials
#   2. Create an OAuth client ID → type "Web application"
#   3. Authorized redirect URI:  https://svivva.com/api/gsc/oauth/callback
#   4. Copy the Client ID and Client Secret.
#   5. Also enable these APIs for the project:
#        - "Google Search Console API"  (Webmasters)
#        - "Web Search Indexing API"     (Indexing)
#
# Then run:
#   bash scripts/connect-google-gsc.sh <CLIENT_ID> <CLIENT_SECRET>
#
# This sets the two env vars in Vercel production and redeploys. After deploy,
# open https://svivva.com/dashboard/gsc-connect and click "Connect with Google".
set -euo pipefail

CID="${1:-${GOOGLE_GSC_CLIENT_ID:-}}"
CSEC="${2:-${GOOGLE_GSC_CLIENT_SECRET:-}}"

if [[ -z "$CID" || -z "$CSEC" ]]; then
  echo "usage: bash scripts/connect-google-gsc.sh <CLIENT_ID> <CLIENT_SECRET>" >&2
  exit 1
fi

set_var() {
  local name="$1" value="$2"
  vercel env rm "$name" production -y >/dev/null 2>&1 || true
  printf "%s" "$value" | vercel env add "$name" production >/dev/null
  echo "  ✓ set $name (production)"
}

echo "Wiring Google Search Console OAuth into Vercel production…"
set_var GOOGLE_GSC_CLIENT_ID "$CID"
set_var GOOGLE_GSC_CLIENT_SECRET "$CSEC"

echo "Redeploying…"
vercel --prod --yes >/dev/null
echo
echo "Done. Now open https://svivva.com/dashboard/gsc-connect and click 'Connect with Google'."
echo "After you authorize, indexing submits directly to Google automatically."
