/**
 * Privacy by design helpers for minors / family disputes / crisis / education records.
 */

export const PRIVACY_PRINCIPLES = [
  "privacy_by_design",
  "data_minimization",
  "least_privilege",
  "purpose_limitation",
  "encryption",
  "selective_disclosure",
  "explicit_authorization",
  "auditability",
  "safe_defaults",
] as const;

export type PrivacyPrinciple = (typeof PRIVACY_PRINCIPLES)[number];

/** Fields that must never appear on public ledgers, analytics, ads, URLs, or lock-screen notifications. */
export const SENSITIVE_FIELD_DENYLIST = [
  "studentName",
  "fullName",
  "address",
  "schoolName",
  "medical",
  "familyAllegation",
  "crisisConversation",
  "documentContents",
  "photograph",
  "rawEvidence",
  "recoverySecret",
  "privateKey",
  "passphrase",
] as const;

export function scrubForPublicSurface(payload: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    const key = k.toLowerCase();
    if (SENSITIVE_FIELD_DENYLIST.some((d) => key.includes(d.toLowerCase()))) continue;
    if (key.includes("secret") || key.includes("password") || key.includes("private")) continue;
    if (typeof v === "string" && v.length > 200) {
      out[k] = `${v.slice(0, 24)}…`;
      continue;
    }
    out[k] = v;
  }
  return out;
}

export function assertNoSensitiveInUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return !SENSITIVE_FIELD_DENYLIST.some((d) => lower.includes(d.toLowerCase()));
}
