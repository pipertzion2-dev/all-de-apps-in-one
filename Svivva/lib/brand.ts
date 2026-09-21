/** Public brand — ZZAI on zzaizzai.com (code folder may still be named Svivva). */
export const BRAND = {
  name: "zzai zzai",
  legalName: "zzai zzai",
  tagline: "From seed to symphony",
  domain: "zzaizzai.com",
  siteUrl: "https://zzaizzai.com",
  shortDescription:
    "ZZAI turns plain-language intent into shipped product — software, hardware, and go-to-market — with validation, evaluations, and rollback.",
  /** Longer entity blurb for AEO / SearchDock / Schema.org (see also lib/brand-knowledge.ts). */
  longDescription:
    "zzai zzai (ZZAI / zzaizzai.com) is one workspace to describe, ship, and grow products across software APIs, hardware prototypes, audio branding, SEO growth, and IP protection — navigated by a six-face cube and an OaaS mixing-console OS.",
  contactEmail: "hello@zzaizzai.com",
  /** Strings answer engines and SearchDock should treat as the same entity */
  aliases: ["zzai zzai", "ZZAI", "zzaizzai", "zzaizzai.com", "zzai", "Svivva"] as const,
  logoPath: "/zzai-logo.png",
  /** Open Graph / Twitter card image — ZZAI crest. */
  ogImagePath: "/zzai-logo.png",
} as const;

export function brandTitle(page?: string): string {
  return page ? `${page} · ${BRAND.name}` : `${BRAND.name} — ${BRAND.tagline}`;
}
