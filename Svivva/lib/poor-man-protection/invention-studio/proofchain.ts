import { sha256Text } from "./hashing";
import type {
  EvidenceRecord,
  InventionBundle,
  ProofChainRecord,
  PublicProofCertificate,
} from "./types";
import { INVENTION_STUDIO_PROTOCOL } from "./types";

export const PROOFCHAIN_DISCLAIMER =
  "A cryptographic hash verifies file integrity for the stored bytes — it does not prove authorship, inventorship, or ownership. Trusted timestamps and blockchain anchors are shown only when a real external response or transaction exists.";

export async function buildEvidenceManifest(
  evidence: EvidenceRecord,
  inventionId: string,
  extras?: Record<string, unknown>,
): Promise<{ manifest: Record<string, unknown>; manifestHash: string }> {
  const manifest = {
    protocol: INVENTION_STUDIO_PROTOCOL,
    kind: "proofchain_evidence_manifest",
    evidenceId: evidence.id,
    inventionId,
    originalFilename: evidence.originalFilename,
    fileType: evidence.fileType,
    byteLength: evidence.byteLength,
    sha256: evidence.sha256,
    version: evidence.version,
    uploadDate: evidence.uploadDate,
    serverTimestamp: evidence.serverTimestamp || null,
    extras: extras || {},
  };
  const manifestHash = await sha256Text(JSON.stringify(manifest));
  return { manifest, manifestHash };
}

export async function buildProofChainRecord(
  evidence: EvidenceRecord,
  inventionId: string,
  opts?: {
    serverTimestamp?: string;
    trustedTimestampToken?: string;
    blockchainTxId?: string;
    publicCertId?: string;
  },
): Promise<ProofChainRecord> {
  const { manifestHash } = await buildEvidenceManifest(evidence, inventionId, {
    serverTimestamp: opts?.serverTimestamp,
  });

  const trustedConfigured = Boolean(process.env.TSA_ENDPOINT?.trim());
  const chainConfigured = Boolean(process.env.PROOFCHAIN_ANCHOR_URL?.trim());

  return {
    id: `pc_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`,
    evidenceId: evidence.id,
    inventionId,
    version: evidence.version,
    sha256: evidence.sha256,
    localTimestamp: evidence.uploadDate,
    serverTimestamp: opts?.serverTimestamp,
    verificationMethod: opts?.serverTimestamp ? "server_timestamp" : "sha256",
    integrityStatus: evidence.verificationStatus === "failed" ? "failed" : "hashed",
    trustedTimestampStatus: opts?.trustedTimestampToken
      ? "anchored"
      : trustedConfigured
        ? "requested"
        : "not_configured",
    trustedTimestampToken: opts?.trustedTimestampToken,
    blockchainStatus: opts?.blockchainTxId
      ? "anchored"
      : chainConfigured
        ? "requested"
        : "not_configured",
    blockchainTxId: opts?.blockchainTxId,
    publicCertId: opts?.publicCertId,
    manifestHash,
  };
}

export function buildPublicProofCertificate(
  evidence: EvidenceRecord,
  inventionId: string,
  opts: {
    authorizeTitle: boolean;
    title?: string;
    serverTimestamp?: string;
    origin?: string;
  },
): PublicProofCertificate {
  const publicCertId = `pub_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const issuedAt = new Date().toISOString();
  const origin = opts.origin || "https://zzaizzai.com";
  const verificationPath = `${origin}/protect/proofchain/${publicCertId}`;
  const methodsClaimed = ["sha256", "manifest", "server_timestamp"].filter(Boolean);
  const qrPayload = JSON.stringify({
    protocol: INVENTION_STUDIO_PROTOCOL,
    publicCertId,
    evidenceId: evidence.id,
    sha256: evidence.sha256,
    version: evidence.version,
  });

  return {
    protocol: INVENTION_STUDIO_PROTOCOL,
    publicCertId,
    evidenceId: evidence.id,
    inventionId,
    inventionTitleAuthorized: opts.authorizeTitle,
    inventionTitle: opts.authorizeTitle ? opts.title : undefined,
    originalFilename: evidence.originalFilename,
    sha256: evidence.sha256,
    version: evidence.version,
    issuedAt,
    serverTimestamp: opts.serverTimestamp,
    verificationPath,
    qrPayload,
    disclaimer: PROOFCHAIN_DISCLAIMER,
    methodsClaimed,
  };
}

/** Optional RFC3161-style hook — only returns a token if TSA responds successfully. */
export async function requestTrustedTimestamp(
  contentHash: string,
): Promise<{ ok: boolean; token?: string; detail: string }> {
  const endpoint = process.env.TSA_ENDPOINT?.trim();
  if (!endpoint) {
    return {
      ok: false,
      detail: "TSA_ENDPOINT not configured — trusted timestamp not claimed.",
    };
  }
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hash: contentHash, algo: "sha256" }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      return { ok: false, detail: `TSA responded HTTP ${res.status}` };
    }
    const data = (await res.json()) as { token?: string };
    if (!data.token) {
      return { ok: false, detail: "TSA response missing token" };
    }
    return { ok: true, token: data.token, detail: "Trusted timestamp anchored" };
  } catch (err) {
    return {
      ok: false,
      detail: err instanceof Error ? err.message : "TSA request failed",
    };
  }
}

/** Optional blockchain anchor — only returns tx id if service returns one. */
export async function requestBlockchainAnchor(
  contentHash: string,
): Promise<{ ok: boolean; txId?: string; detail: string }> {
  const url = process.env.PROOFCHAIN_ANCHOR_URL?.trim();
  if (!url) {
    return {
      ok: false,
      detail: "PROOFCHAIN_ANCHOR_URL not configured — blockchain not claimed.",
    };
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.PROOFCHAIN_ANCHOR_KEY
          ? { Authorization: `Bearer ${process.env.PROOFCHAIN_ANCHOR_KEY}` }
          : {}),
      },
      body: JSON.stringify({ hash: contentHash }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return { ok: false, detail: `Anchor HTTP ${res.status}` };
    const data = (await res.json()) as { txId?: string; transactionHash?: string };
    const txId = data.txId || data.transactionHash;
    if (!txId) return { ok: false, detail: "Anchor response missing tx id" };
    return { ok: true, txId, detail: "Anchored" };
  } catch (err) {
    return {
      ok: false,
      detail: err instanceof Error ? err.message : "Anchor failed",
    };
  }
}

export async function compareEvidenceHashes(
  a: EvidenceRecord,
  b: EvidenceRecord,
): Promise<{ sameFile: boolean; note: string }> {
  const sameFile = a.sha256 === b.sha256;
  return {
    sameFile,
    note: sameFile
      ? "SHA-256 digests match — byte-identical content."
      : "SHA-256 digests differ — files are not byte-identical.",
  };
}

export function findPublicCert(
  bundle: InventionBundle,
  publicCertId: string,
): PublicProofCertificate | null {
  return bundle.publicCerts?.find((c) => c.publicCertId === publicCertId) || null;
}

export async function hashManifestClient(obj: unknown): Promise<string> {
  return sha256Text(JSON.stringify(obj));
}
