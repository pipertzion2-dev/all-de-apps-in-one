import { randomUUID } from "crypto";
import { SCHEMA_VERSION } from "../types";
import type { EvidenceStatus } from "../disclaimers";
import { RECORDING_LAW_WARNING } from "../disclaimers";
import { digestCanonical, encryptUtf8, type EncryptedBlob } from "./crypto";
import { ChainOfCustody, type CustodyEvent } from "./custody";

export type EpvEvidenceItem = {
  id: string;
  type: string;
  title: string;
  /** Content hash of plaintext before encryption — never put raw PII on a public ledger. */
  contentHash: string;
  encrypted?: EncryptedBlob;
  source?: string;
  createdAt: string;
  notes?: string;
};

export type EpvPackage = {
  protocol: "ZZAI-EPV/1.0";
  schemaVersion: string;
  vaultId: string;
  version: number;
  status: EvidenceStatus;
  createdAt: string;
  updatedAt: string;
  recordingLawWarning: string;
  manifest: {
    itemIds: string[];
    itemCount: number;
    canonicalDigest?: string;
  };
  timeline: Array<{ at: string; summary: string; refs?: string[] }>;
  evidence: EpvEvidenceItem[];
  legalSources: Array<{ id: string; citation: string; url: string; title: string }>;
  advocacy: {
    issue?: string;
    requestedResolution?: string;
    communications?: Array<{ at: string; summary: string }>;
  };
  verification: {
    sealed: boolean;
    proofId?: string;
    fingerprint?: string;
    ledgerRef?: string;
  };
  custody: CustodyEvent[];
  signatures: Array<{ role: string; alg: string; value: string; at: string }>;
  metadata: Record<string, string>;
  /** Prior sealed versions — history is never silently overwritten. */
  priorVersionDigests: string[];
};

export function createEmptyEpv(partial?: Partial<EpvPackage>): EpvPackage {
  const now = new Date().toISOString();
  return {
    protocol: "ZZAI-EPV/1.0",
    schemaVersion: SCHEMA_VERSION,
    vaultId: partial?.vaultId || `epv_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
    version: partial?.version || 1,
    status: partial?.status || "Draft",
    createdAt: partial?.createdAt || now,
    updatedAt: now,
    recordingLawWarning: RECORDING_LAW_WARNING,
    manifest: { itemIds: [], itemCount: 0 },
    timeline: [],
    evidence: [],
    legalSources: [],
    advocacy: {},
    verification: { sealed: false },
    custody: [],
    signatures: [],
    metadata: {},
    priorVersionDigests: [],
    ...partial,
  };
}

export function addEvidenceItem(
  pkg: EpvPackage,
  item: Omit<EpvEvidenceItem, "id" | "createdAt"> & {
    id?: string;
    createdAt?: string;
    plaintext?: string;
  },
  custody: ChainOfCustody,
  passphrase?: string,
): EpvPackage {
  if (pkg.status === "Sealed" || pkg.status === "Verified") {
    throw new Error("Sealed packages are immutable — create a new version instead.");
  }
  const id = item.id || `ev_${randomUUID().replace(/-/g, "").slice(0, 10)}`;
  const createdAt = item.createdAt || new Date().toISOString();
  let encrypted = item.encrypted;
  if (passphrase && !encrypted && item.plaintext) {
    encrypted = encryptUtf8(item.plaintext, passphrase);
  }
  const nextItem: EpvEvidenceItem = {
    id,
    type: item.type,
    title: item.title,
    contentHash: item.contentHash,
    encrypted,
    source: item.source,
    createdAt,
    notes: item.notes,
  };
  const evidence = [...pkg.evidence, nextItem];
  const event = custody.append({
    objectId: id,
    actorType: "user",
    action: "created",
    contentHash: item.contentHash,
    detail: item.title,
  });
  custody.append({
    objectId: id,
    actorType: "system",
    action: "hashed",
    contentHash: item.contentHash,
  });
  return {
    ...pkg,
    updatedAt: new Date().toISOString(),
    evidence,
    manifest: {
      itemIds: evidence.map((e) => e.id),
      itemCount: evidence.length,
    },
    custody: [...pkg.custody, event],
    status: pkg.status === "Draft" ? "Protected" : pkg.status,
  };
}

export function buildManifestDigest(pkg: EpvPackage): string {
  const manifestBody = {
    vaultId: pkg.vaultId,
    version: pkg.version,
    itemIds: pkg.evidence.map((e) => e.id).sort(),
    hashes: pkg.evidence
      .map((e) => ({ id: e.id, hash: e.contentHash }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    timeline: pkg.timeline,
    legalSources: pkg.legalSources,
    advocacy: pkg.advocacy,
  };
  return digestCanonical(manifestBody);
}

export type SelectiveShareProfile = "counselor" | "legal_advocate" | "scholarship" | "custom";

export type SelectiveShareRequest = {
  profile: SelectiveShareProfile;
  includeTimeline?: boolean;
  includeEvidenceIds?: string[];
  includeLegalSources?: boolean;
  includeAdvocacy?: boolean;
  includeAchievementsNote?: string;
};

/**
 * Limited disclosure package — each export gets its own manifest + hash.
 * Does not force sharing the entire vault.
 */
export function createSelectiveSharePackage(
  pkg: EpvPackage,
  req: SelectiveShareRequest,
): { exportId: string; manifestDigest: string; package: Partial<EpvPackage> } {
  const includeTimeline = req.includeTimeline ?? req.profile !== "scholarship";
  const includeLegal = req.includeLegalSources ?? req.profile === "legal_advocate";
  const includeAdvocacy = req.includeAdvocacy ?? true;
  const evidenceIds =
    req.includeEvidenceIds ||
    (req.profile === "counselor"
      ? []
      : req.profile === "scholarship"
        ? []
        : pkg.evidence.map((e) => e.id));

  const evidence = pkg.evidence.filter((e) => evidenceIds.includes(e.id));
  const shared: Partial<EpvPackage> = {
    protocol: pkg.protocol,
    schemaVersion: pkg.schemaVersion,
    vaultId: pkg.vaultId,
    version: pkg.version,
    status: "Shared",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    recordingLawWarning: pkg.recordingLawWarning,
    timeline: includeTimeline ? pkg.timeline : [],
    evidence,
    legalSources: includeLegal ? pkg.legalSources : [],
    advocacy: includeAdvocacy
      ? {
          issue: pkg.advocacy.issue,
          requestedResolution: pkg.advocacy.requestedResolution,
          communications:
            req.profile === "legal_advocate" ? pkg.advocacy.communications : undefined,
        }
      : {},
    metadata: {
      shareProfile: req.profile,
      ...(req.includeAchievementsNote ? { achievementsNote: req.includeAchievementsNote } : {}),
    },
    manifest: {
      itemIds: evidence.map((e) => e.id),
      itemCount: evidence.length,
    },
    verification: { sealed: false },
    custody: [],
    signatures: [],
    priorVersionDigests: [],
  };
  const digest = digestCanonical(shared);
  shared.manifest = { ...shared.manifest!, canonicalDigest: digest };
  return {
    exportId: `share_${randomUUID().replace(/-/g, "").slice(0, 10)}`,
    manifestDigest: digest,
    package: shared,
  };
}
