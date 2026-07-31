/** Public brand — ZZAI on zzaizzai.com (code folder may still be named Svivva). */
export const BRAND = {
  name: "zzai zzai",
  legalName: "zzai zzai",
  tagline: "From seed to symphony",
  domain: "zzaizzai.com",
  siteUrl: "https://zzaizzai.com",
  shortDescription:
    "ZZAI turns plain-language intent into shipped product — software, hardware, and go-to-market — with validation, evaluations, and rollback.",
  logoPath: "/zzai-logo.png",
  /** Open Graph / Twitter card image — ZZAI crest. */
  ogImagePath: "/zzai-logo.png",
} as const;

export function brandTitle(page?: string): string {
  return page ? `${page} · ${BRAND.name}` : `${BRAND.name} — ${BRAND.tagline}`;
}
