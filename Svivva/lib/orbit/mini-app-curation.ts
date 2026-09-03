/**
 * Curated mini-app / tool surface for Orbit — traffic funnels to ZZAI + Clutety
 * without shipping full product replacements on free tiers.
 */

import { FEATURE_MINI_APPS } from "@/lib/tools/feature-mini-app-data";
import {
  getHubFeaturePagesForHub,
  HUB_FEATURE_PATHS,
  HUB_FEATURE_PAGES,
} from "@/lib/tools/catalogs/hub-feature-pages";
import { getSiteUrl } from "../site-url";

function siteBase(): string {
  return getSiteUrl().replace(/\/$/, "");
}

export type CuratedNativeTool = {
  path: string;
  name: string;
  description: string;
  hub: "ai-tools-hub" | "cyber-security-mini-apps" | "seo-pack";
};

/** Verified working utilities on zzaizzai.com (lead magnets → platform signup). */
export const NATIVE_SVIVVA_TOOLS: CuratedNativeTool[] = [
  {
    path: "/tools/prompt-forge",
    name: "Prompt Forge",
    description: "Draft API prompts and schemas — upgrade on ZZAI for deployment and guardrails.",
    hub: "ai-tools-hub",
  },
  {
    path: "/tools/json-schema-validator",
    name: "JSON Schema Validator",
    description: "Validate JSON against a schema before you ship an endpoint on ZZAI.",
    hub: "ai-tools-hub",
  },
  {
    path: "/tools/ai-api-cost-calculator",
    name: "AI API Cost Calculator",
    description: "Estimate token spend — ZZAI helps cap and monitor production API costs.",
    hub: "ai-tools-hub",
  },
  ...FEATURE_MINI_APPS.map((app) => ({
    path: app.path,
    name: app.name,
    description: app.description,
    hub: app.hub,
  })),
];

export function nativeToolSitemapPaths(): string[] {
  return NATIVE_SVIVVA_TOOLS.map((t) => t.path);
}

/** Hub + native /tools/* + per-feature keyword pages — prioritize for IndexNow / Google. */
export function getMiniAppPathsForIndexing(): string[] {
  return [
    "/tools",
    ...ORBIT_HUB_SLUGS.map((hub) => `/${hub}`),
    ...nativeToolSitemapPaths(),
    ...HUB_FEATURE_PATHS,
  ];
}

export function getMiniAppUrlsForIndexing(origin?: string): string[] {
  const base = (origin || siteBase()).replace(/\/$/, "");
  return getMiniAppPathsForIndexing().map((path) => `${base}${path}`);
}

export function nativeToolsAsIndexCards() {
  const natives = NATIVE_SVIVVA_TOOLS.map((t) => {
    const slug = t.path.replace(/^\/tools\//, "");
    return {
      id: `native-${slug}`,
      slug,
      keyword: t.name,
      title: t.name,
      headline: t.name,
      subheadline: t.description,
      content: t.description,
      benefits: [] as string[],
      category:
        t.hub === "cyber-security-mini-apps"
          ? "Security"
          : t.hub === "seo-pack"
            ? "SEO"
            : "AI tools",
      toolUrl: t.path,
      metaTitle: t.name,
      metaDescription: t.description,
      published: true,
    };
  });

  const features = HUB_FEATURE_PAGES.map((p) => ({
    id: `feature-${p.hub}-${p.slug}`,
    slug: p.slug,
    keyword: p.keyword,
    title: p.title,
    headline: p.h1 || p.title,
    subheadline: p.metaDescription,
    content: p.description,
    benefits: [] as string[],
    category: p.hub === "cyber-security-mini-apps" ? "Security" : p.category || "AI tools",
    toolUrl: p.path,
    metaTitle: p.title,
    metaDescription: p.metaDescription,
    published: true,
  }));

  return [...natives, ...features];
}

export const ORBIT_HUB_SLUGS = ["ai-tools-hub", "cyber-security-mini-apps", "seo-pack"] as const;

export type HubSlug = (typeof ORBIT_HUB_SLUGS)[number];

const CLUTETY_LANDING = "/cyber-security-mini-apps";

/** Tool names/URLs that imply a full product — skip for SEO import. */
const BLOCKED_NAME_RE =
  /\b(full\s*stack|production\s*deploy|enterprise\s*suite|unlimited\s*api|replace\s*lovable|white\s*label)\b/i;

/** Prefer lightweight scanners/calculators for top-of-funnel. */
const PREFERRED_NAME_RE =
  /\b(checker|scanner|validator|calculator|generator|analyzer|inspector|encoder|decoder|password|hash|audit|grader|tool|preview|chooser|stamp|caption|blend|patch)\b/i;

export type DiscoverableTool = {
  name: string;
  url: string;
  description?: string;
};

export function nativeToolsAsDiscoverable(): DiscoverableTool[] {
  const natives = NATIVE_SVIVVA_TOOLS.map((t) => ({
    name: t.name,
    url: `${siteBase()}${t.path}`,
    description: t.description,
  }));
  const features = HUB_FEATURE_PAGES.map((p) => ({
    name: p.h1 || p.title,
    url: `${siteBase()}${p.path}`,
    description: p.description,
  }));
  return [...natives, ...features];
}

/** Keep discovery/import focused on traffic-safe, working funnel tools. */
export function filterToolsForTrafficDiscovery(tools: DiscoverableTool[]): DiscoverableTool[] {
  const byUrl = new Map<string, DiscoverableTool>();

  for (const native of nativeToolsAsDiscoverable()) {
    byUrl.set(native.url, native);
  }

  for (const tool of tools) {
    const url = tool.url?.trim();
    if (!url) continue;
    if (BLOCKED_NAME_RE.test(`${tool.name} ${tool.description ?? ""}`)) continue;

    const onSvivva = url.includes("zzaizzai.com");
    if (!onSvivva && !PREFERRED_NAME_RE.test(tool.name)) continue;

    if (!byUrl.has(url)) byUrl.set(url, tool);
  }

  const list = Array.from(byUrl.values());
  list.sort((a, b) => {
    const aFeature = HUB_FEATURE_PATHS.some((p) => a.url.includes(p));
    const bFeature = HUB_FEATURE_PATHS.some((p) => b.url.includes(p));
    if (aFeature !== bFeature) return aFeature ? -1 : 1;
    const aNative = a.url.includes("zzaizzai.com/tools/");
    const bNative = b.url.includes("zzaizzai.com/tools/");
    if (aNative !== bNative) return aNative ? -1 : 1;
    const aPref = PREFERRED_NAME_RE.test(a.name) ? 1 : 0;
    const bPref = PREFERRED_NAME_RE.test(b.name) ? 1 : 0;
    return bPref - aPref;
  });

  return list.slice(0, Math.max(200, NATIVE_SVIVVA_TOOLS.length + HUB_FEATURE_PATHS.length));
}

export function buildHubPageHtml(hub: HubSlug): string {
  const nativeHubTools = NATIVE_SVIVVA_TOOLS.filter((t) => t.hub === hub || hub === "ai-tools-hub");
  const featurePages =
    hub === "seo-pack"
      ? []
      : getHubFeaturePagesForHub(hub as "ai-tools-hub" | "cyber-security-mini-apps");

  const nativeList = nativeHubTools
    .map(
      (t) =>
        `<li><a href="${siteBase()}${t.path}"><strong>${t.name}</strong></a> — ${t.description}</li>`,
    )
    .join("");

  const featureList = featurePages
    .map(
      (p) =>
        `<li><a href="${siteBase()}${p.path}"><strong>${p.h1 || p.title}</strong></a> — ${p.keyword}</li>`,
    )
    .join("");

  const titles: Record<HubSlug, { h1: string; lead: string }> = {
    "ai-tools-hub": {
      h1: "ZZAI AI Tools Hub",
      lead: "Free utilities that solve one job well — each tool has its own indexed keyword page, then funnel to ZZAI for schema validation, deployment, and rollback.",
    },
    "cyber-security-mini-apps": {
      h1: "Cyber Security Mini Apps (Clutety)",
      lead: "Security scanners and hardening utilities — each checker is a crawlable feature URL with its own search keywords. Full parental controls ship with Clutety on iOS.",
    },
    "seo-pack": {
      h1: "ZZAI SEO Pack",
      lead: "Lightweight SEO helpers. Scale programmatic pages and indexing with Orbit on ZZAI.",
    },
  };

  const { h1, lead } = titles[hub];

  return `<h1>${h1}</h1>
<p>${lead}</p>
<h2>Featured free tools</h2>
<ul>${nativeList}</ul>
${
  featureList
    ? `<h2>Indexed feature pages (keyword targets)</h2>
<ul>${featureList}</ul>`
    : ""
}
<p><a href="${siteBase()}">Build on ZZAI →</a> · <a href="${siteBase()}/tools">All tools →</a> · <a href="${CLUTETY_LANDING}">Security mini apps →</a></p>
<p><a href="${siteBase()}/orbit">Orbit growth autopilot →</a></p>`;
}
