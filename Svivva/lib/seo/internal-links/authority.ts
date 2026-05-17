import type { SeoLandingPage } from "@/lib/schema";

export type AuthorityFactors = {
  searchIntent: number;
  conversionIntent: number;
  trafficPotential: number;
};

const CATEGORY_INTENT: Record<string, AuthorityFactors> = {
  "seo-landing": { searchIntent: 0.9, conversionIntent: 0.85, trafficPotential: 0.8 },
  "seed-marketing": { searchIntent: 0.75, conversionIntent: 0.9, trafficPotential: 0.85 },
  aeo: { searchIntent: 0.85, conversionIntent: 0.7, trafficPotential: 0.75 },
  "parasite-seo": { searchIntent: 0.6, conversionIntent: 0.5, trafficPotential: 0.55 },
  general: { searchIntent: 0.65, conversionIntent: 0.65, trafficPotential: 0.6 },
};

const HUB_SLUGS = new Set(["ai-tools-hub", "cyber-security-mini-apps", "seo-pack"]);

export function computeAuthorityScore(page: SeoLandingPage): number {
  const base = CATEGORY_INTENT[page.category] ?? CATEGORY_INTENT.general;
  let score = base.searchIntent * base.conversionIntent * base.trafficPotential;

  if (HUB_SLUGS.has(page.slug)) score = Math.max(score, 0.95);
  if ((page.relatedSlugs?.length ?? 0) >= 3) score += 0.05;
  if (page.toolUrl) score += 0.03;
  const wordEstimate = page.content.split(/\s+/).length;
  if (wordEstimate >= 400) score += 0.04;

  return Math.min(1, Math.round(score * 100) / 100);
}

export function pickHubForPage(page: SeoLandingPage): string {
  if (HUB_SLUGS.has(page.slug)) return "/";
  if (page.category === "seed-marketing") return "/ai-tools-hub";
  if (page.category === "parasite-seo") return "/seo-pack";
  return "/tools";
}

export function suggestRelatedSlugs(
  page: SeoLandingPage,
  candidates: Pick<SeoLandingPage, "slug" | "category" | "keyword">[],
  limit = 6,
): string[] {
  const sameCategory = candidates.filter(
    (c) => c.slug !== page.slug && c.category === page.category,
  );
  const cross = candidates.filter((c) => c.slug !== page.slug && c.category !== page.category);
  const scored = [...sameCategory, ...cross].slice(0, limit * 2);
  return scored.slice(0, limit).map((c) => c.slug);
}
