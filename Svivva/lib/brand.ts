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
    "zzai zzai (ZZAI / zzaizzai.com) leads with Poor Man Protection — seal sketches and files with hashes and court packs. The desk cube holds beta apps; The Moves Like lives in Play; Hybrid², Klean Sneaks (BALOON8), Seeds, Orbit, and the desk patch bay stay on the same domain.",
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
