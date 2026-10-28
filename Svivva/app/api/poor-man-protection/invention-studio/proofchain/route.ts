import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import {
  buildProofChainRecord,
  buildPublicProofCertificate,
  requestBlockchainAnchor,
  requestTrustedTimestamp,
  PROOFCHAIN_DISCLAIMER,
} from "@/lib/poor-man-protection/invention-studio/proofchain";
import type { EvidenceRecord } from "@/lib/poor-man-protection/invention-studio/types";

const bodySchema = z.object({
  inventionId: z.string(),
  inventionTitle: z.string().optional(),
  evidence: z.custom<EvidenceRecord>(),
  authorizePublicTitle: z.boolean().optional(),
  attemptTrustedTimestamp: z.boolean().optional(),
  attemptBlockchain: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error || !user) {
    return NextResponse.json({ error: "Sign in required for ProofChain server stamp" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success || !parsed.data.evidence?.id || !parsed.data.evidence?.sha256) {
    return NextResponse.json({ error: "Invalid proofchain request" }, { status: 400 });
  }

  const serverTimestamp = new Date().toISOString();
  let trustedToken: string | undefined;
  let blockchainTxId: string | undefined;
  const integrationNotes: string[] = [];

  if (parsed.data.attemptTrustedTimestamp) {
    const tsa = await requestTrustedTimestamp(parsed.data.evidence.sha256);
    integrationNotes.push(tsa.detail);
    if (tsa.ok) trustedToken = tsa.token;
  } else {
    integrationNotes.push("Trusted timestamp not requested this run.");
  }

  if (parsed.data.attemptBlockchain) {
    const chain = await requestBlockchainAnchor(parsed.data.evidence.sha256);
    integrationNotes.push(chain.detail);
    if (chain.ok) blockchainTxId = chain.txId;
  } else {
    integrationNotes.push("Blockchain anchor not requested this run.");
  }

  const publicCert = buildPublicProofCertificate(parsed.data.evidence, parsed.data.inventionId, {
    authorizeTitle: Boolean(parsed.data.authorizePublicTitle),
    title: parsed.data.inventionTitle,
    serverTimestamp,
  });

  const record = await buildProofChainRecord(parsed.data.evidence, parsed.data.inventionId, {
    serverTimestamp,
    trustedTimestampToken: trustedToken,
    blockchainTxId,
    publicCertId: publicCert.publicCertId,
  });

  return NextResponse.json({
    record,
    publicCert,
    disclaimer: PROOFCHAIN_DISCLAIMER,
    integrationNotes,
    notice:
      "Hash integrity ≠ authorship. Blockchain/TSA statuses reflect real responses only — never simulated success.",
  });
}
