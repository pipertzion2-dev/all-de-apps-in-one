import { PRODUCT_ONE_LINER, PRODUCT_TAGLINE } from "@/lib/product-positioning";

/** Public brand — ZZAI on zzaizzai.com (code folder may still be named Svivva). */
export const BRAND = {
  name: "zzai zzai",
  legalName: "zzai zzai",
  tagline: PRODUCT_TAGLINE,
  domain: "zzaizzai.com",
  siteUrl: "https://zzaizzai.com",
  shortDescription: PRODUCT_ONE_LINER,
  /** Longer entity blurb for AEO / SearchDock / Schema.org (see also lib/brand-knowledge.ts). */
  longDescription:
    "zzai zzai (ZZAI / zzaizzai.com) is production guardrails for AI APIs — preview deploy hazards, enforce JSON schema on every response, and roll back in one click. Klean Sneaks on ZZAI Play demonstrates the same “keep it Klean” loop; additional workspace modules ship in beta.",
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
