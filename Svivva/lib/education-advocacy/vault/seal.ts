import { randomUUID } from "crypto";
import {
  PROOF_DOES_ESTABLISH,
  PROOF_DOES_NOT_ESTABLISH,
  proofReceiptStatement,
  ROLE_BOUNDARY,
} from "../disclaimers";
import type { LedgerAdapter } from "../adapters/interfaces";
import { hmacSha256Hex } from "./crypto";
import { buildManifestDigest, type EpvPackage } from "./epv";
import { ChainOfCustody } from "./custody";

export type EducationProofReceipt = {
  kind: "Education Proof Receipt";
  proofId: string;
  vaultId: string;
  version: number;
  createdTimestamp: string;
  cryptographicFingerprint: string;
  verificationMethod: string;
  ledgerNetwork?: string;
  ledgerTransactionRef?: string;
  verificationStatus: "internal" | "anchored" | "pending" | "unanchored";
  verificationToken: string;
  qrPayload: string;
  establishes: string[];
  doesNotEstablish: string[];
  statement: string;
  roleBoundary: string;
};

export type SealOptions = {
  passphraseSigningHint?: string;
  ledger?: LedgerAdapter;
  /** Opt-in only — never required to protect evidence. */
  anchorToLedger?: boolean;
  verifyUrlBase?: string;
};

export type SealResult = {
  package: EpvPackage;
  receipt: EducationProofReceipt;
  custodyEvents: ReturnType<ChainOfCustody["getHistory"]>;
};

/**
 * Seal a vault version:
 * 1. Canonicalize manifest
 * 2. Cryptographic digest
 * 3. Timestamp
 * 4. Unique proof ID
 * 5. Sign metadata where appropriate
 * 6. Tamper-evident audit log (custody)
 * 7. Optional digest-only ledger anchor
 */
export async function sealEpvPackage(
  pkg: EpvPackage,
  custody: ChainOfCustody,
  opts: SealOptions = {},
): Promise<SealResult> {
  if (pkg.status === "Sealed") {
    throw new Error("Already sealed — create a new version to revise.");
  }

  const fingerprint = buildManifestDigest(pkg);
  const proofId = `epr_${randomUUID().replace(/-/g, "").slice(0, 14)}`;
  const createdTimestamp = new Date().toISOString();
  const verificationToken = hmacSha256Hex(
    `${pkg.vaultId}:${proofId}`,
    `${fingerprint}:${createdTimestamp}`,
  ).slice(0, 32);

  custody.append({
    objectId: pkg.vaultId,
    actorType: "system",
    action: "sealed",
    contentHash: fingerprint,
    detail: `proofId=${proofId}`,
    signingKey: opts.passphraseSigningHint ? "present" : undefined,
  });

  let ledgerNetwork: string | undefined;
  let ledgerTransactionRef: string | undefined;
  let verificationStatus: EducationProofReceipt["verificationStatus"] = "internal";

  if (opts.anchorToLedger && opts.ledger) {
    const anchor = await opts.ledger.anchorProof({
      proofId,
      digestHex: fingerprint,
      createdAt: createdTimestamp,
      metadata: { vaultId: pkg.vaultId, version: String(pkg.version) },
    });
    ledgerNetwork = anchor.network;
    ledgerTransactionRef = anchor.transactionRef;
    verificationStatus =
      anchor.status === "confirmed"
        ? "anchored"
        : anchor.status === "pending"
          ? "pending"
          : "unanchored";
  }

  const verifyBase = opts.verifyUrlBase || "/education/verify";
  const qrPayload = `${verifyBase}?proof=${encodeURIComponent(proofId)}&fp=${encodeURIComponent(fingerprint.slice(0, 16))}`;

  const receipt: EducationProofReceipt = {
    kind: "Education Proof Receipt",
    proofId,
    vaultId: pkg.vaultId,
    version: pkg.version,
    createdTimestamp,
    cryptographicFingerprint: fingerprint,
    verificationMethod: opts.anchorToLedger
      ? "SHA-256 canonical manifest + optional ledger digest anchor"
      : "SHA-256 canonical manifest + internal tamper-evident audit log",
    ledgerNetwork,
    ledgerTransactionRef,
    verificationStatus,
    verificationToken,
    qrPayload,
    establishes: [...PROOF_DOES_ESTABLISH],
    doesNotEstablish: [...PROOF_DOES_NOT_ESTABLISH],
    statement: proofReceiptStatement(),
    roleBoundary: ROLE_BOUNDARY,
  };

  const sealed: EpvPackage = {
    ...pkg,
    status: "Sealed",
    updatedAt: createdTimestamp,
    manifest: {
      ...pkg.manifest,
      itemIds: pkg.evidence.map((e) => e.id),
      itemCount: pkg.evidence.length,
      canonicalDigest: fingerprint,
    },
    verification: {
      sealed: true,
      proofId,
      fingerprint,
      ledgerRef: ledgerTransactionRef,
    },
    signatures: [
      ...pkg.signatures,
      {
        role: "platform",
        alg: "HMAC-SHA256-trunc",
        value: verificationToken,
        at: createdTimestamp,
      },
    ],
    custody: custody.getHistory(pkg.vaultId),
    priorVersionDigests: pkg.manifest.canonicalDigest
      ? [...pkg.priorVersionDigests, pkg.manifest.canonicalDigest]
      : pkg.priorVersionDigests,
  };

  return { package: sealed, receipt, custodyEvents: custody.getHistory() };
}

/** Create a new draft version from a sealed package (never overwrite sealed history). */
export function createNewVersionFromSealed(sealed: EpvPackage): EpvPackage {
  if (sealed.status !== "Sealed" && sealed.status !== "Verified" && sealed.status !== "Shared") {
    throw new Error("createNewVersionFromSealed expects a sealed/verified/shared package");
  }
  const now = new Date().toISOString();
  return {
    ...sealed,
    version: sealed.version + 1,
    status: "Draft",
    createdAt: now,
    updatedAt: now,
    verification: { sealed: false },
    priorVersionDigests: sealed.manifest.canonicalDigest
      ? [...sealed.priorVersionDigests, sealed.manifest.canonicalDigest]
      : sealed.priorVersionDigests,
    signatures: [],
  };
}

export type VerifyReceiptInput = {
  receipt: EducationProofReceipt;
  package?: EpvPackage;
  expectedFingerprint?: string;
};

export type VerifyReceiptResult = {
  receiptExists: boolean;
  hashMatches: boolean | null;
  timestamp?: string;
  version?: number;
  ledgerAnchorStatus?: string;
  statusLabel: "Verified" | "Mismatch" | "Incomplete";
  notes: string[];
};

export function verifyProofReceipt(input: VerifyReceiptInput): VerifyReceiptResult {
  const { receipt, package: pkg, expectedFingerprint } = input;
  const notes: string[] = [
    "Verification checks integrity of a sealed digital version — not truth of allegations or legal conclusions.",
  ];
  const fp = expectedFingerprint || (pkg ? buildManifestDigest(pkg) : undefined);
  const hashMatches = fp != null ? fp === receipt.cryptographicFingerprint : null;
  const statusLabel =
    hashMatches === true ? "Verified" : hashMatches === false ? "Mismatch" : "Incomplete";
  if (pkg && pkg.verification.proofId && pkg.verification.proofId !== receipt.proofId) {
    notes.push("Proof ID on package does not match receipt.");
  }
  return {
    receiptExists: true,
    hashMatches,
    timestamp: receipt.createdTimestamp,
    version: receipt.version,
    ledgerAnchorStatus: receipt.verificationStatus,
    statusLabel,
    notes,
  };
}
