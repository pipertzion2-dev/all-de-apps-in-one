/**
 * Curated mini-app / tool surface for Orbit — traffic funnels to Svivva + Clutety
 * without shipping full product replacements on free tiers.
 */

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

/** Verified working utilities on svivva.com (lead magnets → platform signup). */
export const NATIVE_SVIVVA_TOOLS: CuratedNativeTool[] = [
  {
    path: "/tools/prompt-forge",
    name: "Prompt Forge",
    description: "Draft API prompts and schemas — upgrade on Svivva for deployment and guardrails.",
    hub: "ai-tools-hub",
  },
  {
    path: "/tools/json-schema-validator",
    name: "JSON Schema Validator",
    description: "Validate JSON against a schema before you ship an endpoint on Svivva.",
    hub: "ai-tools-hub",
  },
  {
    path: "/tools/ai-api-cost-calculator",
    name: "AI API Cost Calculator",
    description: "Estimate token spend — Svivva helps cap and monitor production API costs.",
    hub: "ai-tools-hub",
  },
];

export const ORBIT_HUB_SLUGS = [
  "ai-tools-hub",
  "cyber-security-mini-apps",
  "seo-pack",
] as const;

export type HubSlug = (typeof ORBIT_HUB_SLUGS)[number];

const CLUTETY_LANDING = "/cyber-security-mini-apps";

/** Tool names/URLs that imply a full product — skip for SEO import. */
const BLOCKED_NAME_RE =
  /\b(full\s*stack|production\s*deploy|enterprise\s*suite|unlimited\s*api|replace\s*lovable|white\s*label)\b/i;

/** Prefer lightweight scanners/calculators for top-of-funnel. */
const PREFERRED_NAME_RE =
  /\b(checker|scanner|validator|calculator|generator|analyzer|inspector|encoder|decoder|password|hash|audit|grader|tool)\b/i;

export type DiscoverableTool = {
  name: string;
  url: string;
  description?: string;
};

export function nativeToolsAsDiscoverable(): DiscoverableTool[] {
  return NATIVE_SVIVVA_TOOLS.map((t) => ({
    name: t.name,
    url: `${siteBase()}${t.path}`,
    description: t.description,
  }));
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

    const onSvivva = url.includes("svivva.com");
    const isNative = NATIVE_SVIVVA_TOOLS.some((n) => url.includes(n.path));
    if (!onSvivva && !PREFERRED_NAME_RE.test(tool.name)) continue;

    if (!byUrl.has(url)) byUrl.set(url, tool);
  }

  const list = Array.from(byUrl.values());
  list.sort((a, b) => {
    const aNative = a.url.includes("svivva.com/tools/");
    const bNative = b.url.includes("svivva.com/tools/");
    if (aNative !== bNative) return aNative ? -1 : 1;
    const aPref = PREFERRED_NAME_RE.test(a.name) ? 1 : 0;
    const bPref = PREFERRED_NAME_RE.test(b.name) ? 1 : 0;
    return bPref - aPref;
  });

  return list.slice(0, 48);
}

export function buildHubPageHtml(hub: HubSlug): string {
  const hubTools = NATIVE_SVIVVA_TOOLS.filter((t) => t.hub === hub || hub === "ai-tools-hub");
  const toolList = hubTools
    .map(
      (t) =>
        `<li><a href="${siteBase()}${t.path}"><strong>${t.name}</strong></a> — ${t.description}</li>`,
    )
    .join("");

  const titles: Record<HubSlug, { h1: string; lead: string }> = {
    "ai-tools-hub": {
      h1: "Svivva AI Tools Hub",
      lead: "Free utilities that solve one job well — then funnel to Svivva for schema validation, deployment, and rollback.",
    },
    "cyber-security-mini-apps": {
      h1: "Cyber Security Mini Apps (Clutety)",
      lead: "Security scanners and hardening utilities. Full parental controls and device protection ship with Clutety on iOS — explore Svivva for AI backends.",
    },
    "seo-pack": {
      h1: "Svivva SEO Pack",
      lead: "Lightweight SEO helpers. Scale programmatic pages and indexing with Orbit on Svivva.",
    },
  };

  const { h1, lead } = titles[hub];

  return `<h1>${h1}</h1>
<p>${lead}</p>
<h2>Featured free tools</h2>
<ul>${toolList}</ul>
<p><a href="${siteBase()}">Build on Svivva →</a> · <a href="${siteBase()}/tools">All tools →</a> · <a href="${CLUTETY_LANDING}">Security mini apps →</a></p>
<p><a href="${siteBase()}/orbit">Orbit growth autopilot →</a></p>`;
}
