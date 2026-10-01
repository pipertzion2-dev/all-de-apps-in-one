import { NATIVE_SVIVVA_TOOLS, type CuratedNativeTool, type HubSlug } from "../mini-app-curation";
import { getSiteUrl } from "@/lib/site-url";
import type { GenerateIfmPairingsInput, IfmFaqItem, IfmPairing, IfmToolRef } from "./ifm-types";

const BRIDGE_PRINCIPLES = [
  "Adjacent intents share users but differ in keyword clusters — fuse utilities into one bridge surface.",
  "Cross-hub pairings compound SEO: security scanners × AI validators capture builder + compliance queries.",
  "Bi-directional CTAs route traffic between free tools and platform signup without gating the micro-utility.",
];

function siteBase(): string {
  return getSiteUrl().replace(/\/$/, "");
}

function toToolRef(tool: CuratedNativeTool): IfmToolRef {
  return {
    name: tool.name,
    path: tool.path,
    url: `${siteBase()}${tool.path}`,
    hub: tool.hub,
    description: tool.description,
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function distinctiveToken(name: string): string {
  const stop = new Set(["tool", "tools", "mini", "app", "apps", "free", "online", "checker"]);
  const parts = name
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((p) => p.length > 2 && !stop.has(p.toLowerCase()));
  return parts[0] || name.split(/\s+/)[0] || "fusion";
}

export function deriveFusionTitle(toolA: IfmToolRef, toolB: IfmToolRef): string {
  const a = distinctiveToken(toolA.name);
  const b = distinctiveToken(toolB.name);
  return `${a} × ${b} Bridge`;
}

function buildFaq(pair: { fusionTitle: string; toolA: IfmToolRef; toolB: IfmToolRef }): IfmFaqItem[] {
  return [
    {
      question: `What is ${pair.fusionTitle}?`,
      answer: `A fused utility surface combining ${pair.toolA.name} and ${pair.toolB.name} for users searching across both intent clusters.`,
    },
    {
      question: "Is this a free tool?",
      answer: "Yes — the micro-utility block is free. Upgrade paths lead to ZZAI for deployment, guardrails, and Orbit automation.",
    },
    {
      question: "How does Intent Fusion help SEO?",
      answer:
        "Bridge pages target long-tail queries that span two tool families, with FAQ schema and cross-links to both source utilities.",
    },
  ];
}

export function buildIfmPairing(toolA: CuratedNativeTool, toolB: CuratedNativeTool): IfmPairing {
  const a = toToolRef(toolA);
  const b = toToolRef(toolB);
  const fusionTitle = deriveFusionTitle(a, b);
  const slug = slugify(`ifm-${a.path}-${b.path}`);

  return {
    id: crypto.randomUUID(),
    toolA: a,
    toolB: b,
    fusionTitle,
    slug,
    bridgePrinciple: BRIDGE_PRINCIPLES[Math.abs(slug.length) % BRIDGE_PRINCIPLES.length],
    microToolIdea: `Interactive block chaining ${a.name} output into ${b.name} workflow with one-click copy/export.`,
    ctaPrimary: { label: "Build on ZZAI", href: `${siteBase()}/dashboard` },
    ctaSecondary: { label: `Open ${a.name}`, href: a.url },
    faq: buildFaq({ fusionTitle, toolA: a, toolB: b }),
    status: "planned",
    createdAt: new Date().toISOString(),
  };
}

export function pairKey(toolA: CuratedNativeTool, toolB: CuratedNativeTool): string {
  const paths = [toolA.path, toolB.path].sort();
  return `${paths[0]}|${paths[1]}`;
}

function groupToolsByHub(): Map<HubSlug, CuratedNativeTool[]> {
  const map = new Map<HubSlug, CuratedNativeTool[]>();
  for (const tool of NATIVE_SVIVVA_TOOLS) {
    const list = map.get(tool.hub) || [];
    list.push(tool);
    map.set(tool.hub, list);
  }
  return map;
}

/** Generate cross-hub tool pairings for the Intent Fusion Matrix. */
export function generateIfmPairings(input: GenerateIfmPairingsInput = {}): IfmPairing[] {
  const count = Math.min(Math.max(input.count ?? 10, 1), 20);
  const byHub = groupToolsByHub();
  const hubs = [...byHub.keys()].filter((h) => (byHub.get(h)?.length ?? 0) > 0);
  if (hubs.length < 2) return [];

  const exclude = new Set(input.excludePairKeys ?? []);
  const seed = input.weekSeed ?? new Date().toISOString().slice(0, 10);
  const seedOffset = seed.split("").reduce((n, c) => n + c.charCodeAt(0), 0);

  const pairings: IfmPairing[] = [];
  let hubIdx = seedOffset % hubs.length;
  let attempts = 0;

  while (pairings.length < count && attempts < count * 20) {
    attempts += 1;
    const hubA = hubs[hubIdx % hubs.length];
    const hubB = hubs[(hubIdx + 1) % hubs.length];
    if (hubA === hubB) {
      hubIdx += 1;
      continue;
    }

    const listA = byHub.get(hubA)!;
    const listB = byHub.get(hubB)!;
    const toolA = listA[(attempts + seedOffset) % listA.length];
    const toolB = listB[(attempts + seedOffset * 2) % listB.length];
    const key = pairKey(toolA, toolB);

    hubIdx += 1;
    if (exclude.has(key)) continue;

    pairings.push(buildIfmPairing(toolA, toolB));
    exclude.add(key);
  }

  return pairings;
}

export function listIfmToolFamilies(): Array<{ hub: HubSlug; count: number }> {
  const byHub = groupToolsByHub();
  return [...byHub.entries()].map(([hub, tools]) => ({ hub, count: tools.length }));
}
