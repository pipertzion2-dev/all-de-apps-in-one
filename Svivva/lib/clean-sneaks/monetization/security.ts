/**
 * Lightweight server-side claim attestation.
 * Uses HMAC when KLEAN_MONETIZATION_HMAC_SECRET is set; otherwise deterministic hash.
 */

import { createHmac, createHash, timingSafeEqual } from "crypto";

export function signClaimPayload(payload: string): string {
  const secret = process.env.KLEAN_MONETIZATION_HMAC_SECRET?.trim();
  if (secret) {
    return createHmac("sha256", secret).update(payload).digest("hex");
  }
  return createHash("sha256").update(`klean-dev:${payload}`).digest("hex");
}

export function verifyClaimSignature(payload: string, signature: string): boolean {
  const expected = signClaimPayload(payload);
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(String(signature || ""));
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** In-memory claimed set for serverless warm instances (pair with DB in production). */
type ClaimBag = { claims: Map<string, number> };

function bag(): ClaimBag {
  const g = globalThis as typeof globalThis & { __kleanClaims?: ClaimBag };
  if (!g.__kleanClaims) g.__kleanClaims = { claims: new Map() };
  return g.__kleanClaims;
}

export function serverHasClaimed(claimId: string): boolean {
  return bag().claims.has(claimId);
}

export function serverMarkClaimed(claimId: string, at = Date.now()) {
  bag().claims.set(claimId, at);
  // Cap map size
  if (bag().claims.size > 5000) {
    const entries = [...bag().claims.entries()].sort((a, b) => a[1] - b[1]);
    for (const [k] of entries.slice(0, 1000)) bag().claims.delete(k);
  }
}
