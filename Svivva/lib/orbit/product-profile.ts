import { getBrandProfileSummary } from "@/lib/brand-knowledge";
import { getSiteUrl } from "@/lib/site-url";

export type ProductProfile = {
  name: string;
  /** All known names for entity matching (SearchDock / directories / AEO) */
  aliases: string[];
  tagline: string;
  url: string;
  toolsHubUrl: string;
  description: string;
  shortDescription: string;
  /** Quotable one-paragraph definition */
  definition: string;
  audience: string;
  competitors: string[];
  keywords: string[];
  pricing: string;
  category: string;
  /** Cube faces + major products for site-structure mapping */
  products: string[];
  cubeFaces: string[];
};

/** Canonical product profile for Orbit, directory submissions, and SearchDock context. */
export function getSvivvaProductProfile(): ProductProfile {
  const s = getBrandProfileSummary(getSiteUrl());
  return {
    name: s.name,
    aliases: s.aliases,
    tagline: s.tagline,
    url: s.url,
    toolsHubUrl: s.toolsHubUrl,
    description: s.description,
    shortDescription: s.shortDescription,
    definition: s.definition,
    audience: s.audience,
    competitors: s.competitors,
    keywords: s.keywords,
    pricing: s.pricing,
    category: s.category,
    products: s.products,
    cubeFaces: s.cubeFaces,
  };
}

/** @deprecated Prefer getSvivvaProductProfile — alias kept for clarity in SearchDock docs. */
export const getZzaiProductProfile = getSvivvaProductProfile;
