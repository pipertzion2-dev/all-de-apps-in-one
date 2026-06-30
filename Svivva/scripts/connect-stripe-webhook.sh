#!/usr/bin/env bash
# Wire Stripe webhook signing secret into Vercel production.
#
# Prereq:
#   1. https://dashboard.stripe.com/webhooks → Add endpoint
#   2. URL: https://svivva.com/api/stripe/webhook
#   3. Events: checkout.session.completed, customer.subscription.created,
#      customer.subscription.updated, customer.subscription.deleted
#   4. Copy Signing secret (whsec_…)
#
# Run: bash scripts/connect-stripe-webhook.sh whsec_…
set -euo pipefail
WHSEC="${1:-${STRIPE_WEBHOOK_SECRET:-}}"
if [[ -z "$WHSEC" ]]; then
  echo "usage: bash scripts/connect-stripe-webhook.sh whsec_…" >&2
  exit 1
fi
vercel env rm STRIPE_WEBHOOK_SECRET production -y >/dev/null 2>&1 || true
printf "%s" "$WHSEC" | vercel env add STRIPE_WEBHOOK_SECRET production >/dev/null
echo "✓ STRIPE_WEBHOOK_SECRET set (production)"
echo "Redeploying…"
vercel --prod --yes >/dev/null
echo "Done. Subscriptions will upgrade accounts after checkout."
