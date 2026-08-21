/** Fixed product disclaimers — never omit from AI or legal surfaces. */

export const ROLE_BOUNDARY =
  "This system provides educational guidance, legal information, advocacy assistance, and resource navigation. It is not a lawyer, emergency professional, government agency, counselor, or law-enforcement officer.";

export const LEGAL_INFO_NOT_ADVICE =
  "Legal information is not legal advice. When uncertainty exists, seek qualified human assistance.";

export const RISK_CLASSIFICATION_NOTICE =
  "Channel weighting and risk routing are context signals for the mixing console — not medical, legal, or criminal determinations.";

export const PROOF_DOES_NOT_ESTABLISH = [
  "that every statement in the document is true",
  "who committed an alleged act",
  "that a law was violated",
  "legal ownership",
  "legal admissibility",
  "identity unless identity was separately verified",
] as const;

export const PROOF_DOES_ESTABLISH = [
  "Integrity: Has this file changed?",
  "Existence: Can we demonstrate that this version existed by a particular time?",
  "Versioning: Which version is being examined?",
  "Provenance: What recorded sequence produced this package?",
  "Selective disclosure: What information did the user authorize another person to see?",
] as const;

export const RECORDING_LAW_WARNING =
  "Recording laws differ by jurisdiction. Do not secretly record people. Only capture audio where lawful and explicitly permitted.";

export const EVIDENCE_STATUS_LABELS = [
  "Draft",
  "Protected",
  "Sealed",
  "Verified",
  "Shared",
  "Superseded",
] as const;

export type EvidenceStatus = (typeof EVIDENCE_STATUS_LABELS)[number];

/** Banned misleading status terms unless an authority actually supplied them. */
export const BANNED_STATUS_TERMS = [
  "legally proven",
  "court certified",
  "government verified",
] as const;

export function proofReceiptStatement(): string {
  return [
    "This Education Proof Receipt establishes integrity and existence of a particular digital version.",
    `It does NOT automatically prove: ${PROOF_DOES_NOT_ESTABLISH.join("; ")}.`,
    ROLE_BOUNDARY,
  ].join(" ");
}
