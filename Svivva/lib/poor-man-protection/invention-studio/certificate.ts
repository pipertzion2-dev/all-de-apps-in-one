import type { EvidenceCertificate, EvidenceRecord, InventionBundle } from "./types";
import { INVENTION_STUDIO_PROTOCOL } from "./types";

const DISCLAIMER =
  "SHA-256 integrity certificate for evidence stored in ZZAI Invention Protection Studio (Poor Man Protection). This is not a government registration, blockchain anchor, or digital signature unless those methods are separately implemented and shown as available.";

/** Only methods that are actually implemented in this studio. */
export const IMPLEMENTED_VERIFICATION_METHODS = [
  {
    id: "sha256",
    label: "SHA-256 file hashing",
    implemented: true as const,
    description:
      "Browser-side digest stored with each evidence record; re-check compares live blob.",
  },
  {
    id: "version_history",
    label: "Append-only version history",
    implemented: true as const,
    description: "Invention versions are never overwritten; each seal creates a new snapshot.",
  },
  {
    id: "server_timestamp",
    label: "Server timestamps (when signed in)",
    implemented: true as const,
    description: "Optional API stamp on export/verify requests; local ISO times always recorded.",
  },
  {
    id: "audit_chain",
    label: "Tamper-evident audit chain",
    implemented: true as const,
    description: "Each audit event hashes the previous event hash + payload.",
  },
  {
    id: "qr_certificate",
    label: "Downloadable evidence certificate + QR payload",
    implemented: true as const,
    description: "JSON/PDF certificate embeds a verification payload string.",
  },
  {
    id: "proofchain_manifest",
    label: "ProofChain evidence manifest",
    implemented: true as const,
    description:
      "Signed manifest hash over evidence metadata + SHA-256; public certs omit private descriptions.",
  },
] as const;

/** Explicitly not claimed unless env-configured and a real response is received. */
export const NOT_IMPLEMENTED_VERIFICATION_METHODS = [
  "Digital signature integrations",
  "Trusted timestamp authority (RFC 3161) — requires TSA_ENDPOINT and a successful TSA response",
  "Blockchain anchoring — requires PROOFCHAIN_ANCHOR_URL and a real transaction id",
] as const;

export function buildEvidenceCertificate(
  bundle: InventionBundle,
  evidence: EvidenceRecord,
  origin = "https://zzaizzai.com",
): EvidenceCertificate {
  const issuedAt = new Date().toISOString();
  const verificationPath = `${origin}/protect/verify`;
  const qrPayload = JSON.stringify({
    protocol: INVENTION_STUDIO_PROTOCOL,
    evidenceId: evidence.id,
    inventionId: bundle.invention.id,
    sha256: evidence.sha256,
    issuedAt,
  });
  return {
    protocol: INVENTION_STUDIO_PROTOCOL,
    evidenceId: evidence.id,
    inventionId: bundle.invention.id,
    inventionTitle: bundle.invention.fields.title,
    originalFilename: evidence.originalFilename,
    sha256: evidence.sha256,
    issuedAt,
    verificationPath,
    disclaimer: DISCLAIMER,
    qrPayload,
  };
}
