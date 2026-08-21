import { NextRequest } from "next/server";
import { z } from "zod";
import { badRequest, ok, serverError } from "@/lib/http-response";
import {
  verifyProofReceipt,
  type EducationProofReceipt,
} from "@/lib/education-advocacy/vault/seal";
import { buildManifestDigest, type EpvPackage } from "@/lib/education-advocacy/vault/epv";
import { InternalAppendOnlyLedger } from "@/lib/education-advocacy/ledger/internal";

const bodySchema = z.object({
  receipt: z.record(z.unknown()),
  package: z.record(z.unknown()).optional(),
  expectedFingerprint: z
    .string()
    .regex(/^[a-f0-9]{64}$/i)
    .optional(),
});

/**
 * Verification does not reveal other vault contents — only integrity of the supplied package/receipt.
 */
export async function POST(req: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return badRequest("Invalid verify payload");

    const receipt = parsed.data.receipt as unknown as EducationProofReceipt;
    if (!receipt?.proofId || !receipt?.cryptographicFingerprint) {
      return badRequest("Not an Education Proof Receipt");
    }

    const pkg = parsed.data.package as unknown as EpvPackage | undefined;
    const result = verifyProofReceipt({
      receipt,
      package: pkg,
      expectedFingerprint: parsed.data.expectedFingerprint,
    });

    // Optional ledger check when package was anchored to the default internal adapter in-process
    // (stateless API cannot see prior anchors across requests — report receipt ledger fields only).
    let ledger: { status: string; note: string } | undefined;
    if (receipt.ledgerTransactionRef) {
      ledger = {
        status: receipt.verificationStatus,
        note: "Ledger reference present on receipt. Cross-node verification requires the configured LedgerAdapter.",
      };
    } else {
      const probe = new InternalAppendOnlyLedger();
      void probe;
      ledger = {
        status: "unanchored_or_internal",
        note: "No public ledger transaction on receipt.",
      };
    }

    return ok({
      ...result,
      proofId: receipt.proofId,
      vaultId: receipt.vaultId,
      fingerprint: receipt.cryptographicFingerprint,
      packageDigest: pkg ? buildManifestDigest(pkg) : undefined,
      ledger,
      revealsOtherVaultContents: false,
    });
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Verify failed");
  }
}
