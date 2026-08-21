import { NextRequest } from "next/server";
import { z } from "zod";
import { badRequest, ok, serverError } from "@/lib/http-response";
import { ChainOfCustody } from "@/lib/education-advocacy/vault/custody";
import {
  addEvidenceItem,
  createEmptyEpv,
  type EpvPackage,
} from "@/lib/education-advocacy/vault/epv";
import { sealEpvPackage } from "@/lib/education-advocacy/vault/seal";
import { InternalAppendOnlyLedger } from "@/lib/education-advocacy/ledger/internal";
import { sha256Hex } from "@/lib/education-advocacy/vault/crypto";

const evidenceSchema = z.object({
  type: z.string().max(80),
  title: z.string().max(300),
  contentHash: z
    .string()
    .regex(/^[a-f0-9]{64}$/i)
    .optional(),
  plaintext: z.string().max(50_000).optional(),
  source: z.string().max(300).optional(),
  notes: z.string().max(1000).optional(),
});

const bodySchema = z.object({
  vaultId: z.string().max(80).optional(),
  timeline: z
    .array(z.object({ at: z.string(), summary: z.string().max(1000) }))
    .max(100)
    .optional(),
  advocacy: z
    .object({
      issue: z.string().max(2000).optional(),
      requestedResolution: z.string().max(2000).optional(),
    })
    .optional(),
  legalSources: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        citation: z.string(),
        url: z.string(),
      }),
    )
    .max(40)
    .optional(),
  evidence: z.array(evidenceSchema).max(40).optional().default([]),
  passphrase: z.string().min(8).max(200).optional(),
  anchorToLedger: z.boolean().optional().default(false),
});

/** In-memory seal for demo/API — production should persist via StorageProvider. */
export async function POST(req: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return badRequest("Invalid vault seal request");

    const custody = new ChainOfCustody();
    let pkg: EpvPackage = createEmptyEpv({
      vaultId: parsed.data.vaultId,
      timeline: parsed.data.timeline || [],
      advocacy: parsed.data.advocacy || {},
      legalSources: parsed.data.legalSources || [],
    });

    for (const item of parsed.data.evidence) {
      const contentHash = item.contentHash || sha256Hex(item.plaintext || item.title);
      pkg = addEvidenceItem(
        pkg,
        {
          type: item.type,
          title: item.title,
          contentHash,
          plaintext: item.plaintext,
          source: item.source,
          notes: item.notes,
        },
        custody,
        parsed.data.passphrase,
      );
    }

    const ledger = new InternalAppendOnlyLedger();
    const result = await sealEpvPackage(pkg, custody, {
      ledger,
      anchorToLedger: parsed.data.anchorToLedger,
      passphraseSigningHint: parsed.data.passphrase ? "present" : undefined,
      verifyUrlBase: "/education/verify",
    });

    // Never echo passphrase back
    return ok({
      package: {
        ...result.package,
        evidence: result.package.evidence.map((e) => ({
          ...e,
          // ciphertext may be returned to the owner; omit if no passphrase was used for storage demo
          encrypted: e.encrypted,
        })),
      },
      receipt: result.receipt,
    });
  } catch (err: unknown) {
    return serverError(err instanceof Error ? err.message : "Seal failed");
  }
}
