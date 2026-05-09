#!/usr/bin/env node
/**
 * Prints random secret values to paste into Vercel (or .env.production).
 * Run from repo root: node Svivva/scripts/gen-deploy-secrets.mjs
 */
import crypto from "crypto";

const hex = (bytes = 24) => crypto.randomBytes(bytes).toString("hex");

console.log(`
=== Paste into Vercel → Project → Settings → Environment Variables (Production) ===

NEXTAUTH_SECRET=${hex()}
CRON_SECRET=${hex()}
ORBIT_INTERNAL_SECRET=${hex()}

(Also set DATABASE_URL, NEXT_PUBLIC_SITE_URL, auth keys, Stripe, etc. from .env.example)

================================================================================
`);
