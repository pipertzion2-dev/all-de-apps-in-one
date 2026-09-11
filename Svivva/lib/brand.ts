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

/** Social/profile URLs for Organization sameAs — comma-separated in NEXT_PUBLIC_BRAND_SOCIAL_URLS. */
export function getBrandSameAs(): string[] {
  const raw = process.env.NEXT_PUBLIC_BRAND_SOCIAL_URLS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
}

export function brandTitle(page?: string): string {
  return page ? `${page} · ${BRAND.name}` : `${BRAND.name} — ${BRAND.tagline}`;
}
