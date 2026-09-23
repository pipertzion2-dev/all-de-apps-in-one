import { NextRequest, NextResponse } from "next/server";
import {
  serverHasClaimed,
  serverMarkClaimed,
  signClaimPayload,
  verifyClaimSignature,
} from "@/lib/clean-sneaks/monetization/security";

export const dynamic = "force-dynamic";

/**
 * Attest a claim id so the same purchase/ad callback cannot be replayed across devices
 * sharing a signed receipt. Client still applies rewards locally; this is the anti-dupe ledger.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const claimId = String(body.claimId || "").slice(0, 180);
    const source = String(body.source || "").slice(0, 64);
    const providerRef = String(body.providerRef || "").slice(0, 256);
    const signature = String(body.signature || "");
    if (!claimId || !source) {
      return NextResponse.json({ error: "claimId and source required" }, { status: 400 });
    }

    const payload = `${claimId}|${source}|${providerRef}`;
    // If client supplies a signature, verify. Otherwise issue one for trusted server grants.
    if (signature) {
      if (!verifyClaimSignature(payload, signature)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    if (serverHasClaimed(claimId)) {
      return NextResponse.json({ ok: true, duplicate: true, claimId });
    }

    serverMarkClaimed(claimId);
    const issued = signClaimPayload(payload);
    return NextResponse.json({
      ok: true,
      duplicate: false,
      claimId,
      signature: issued,
    });
  } catch (err) {
    console.error("monetization claim:", err);
    return NextResponse.json({ error: "Claim failed" }, { status: 500 });
  }
}
