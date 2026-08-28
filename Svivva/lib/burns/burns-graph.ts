/**
 * Burns System — the app pointed at itself.
 *
 * Every node is one of ZZAI's own features run against zzaizzai.com, wired into
 * a dependency graph so the daily job executes them in a sensible order
 * (foundation before content, content before indexing, indexing before
 * measurement) instead of firing everything at once.
 *
 * Admin-only. See lib/burns/burns-runner.ts for the executors.
 */
import { FEATURE_BY_ID } from "@/lib/platform/feature-graph";

/** Columns in the graph UI, left to right. */
export const BURNS_STAGES = [
  "foundation",
  "content",
  "quality",
  "index",
  "distribution",
  "intel",
  "measure",
] as const;

export type BurnsStageId = (typeof BURNS_STAGES)[number];

export const BURNS_STAGE_LABELS: Record<BurnsStageId, string> = {
  foundation: "Foundation",
  content: "Content",
  quality: "Quality",
  index: "Indexing",
  distribution: "Distribution",
  intel: "Intelligence",
  measure: "Measurement",
};

/** What a node needs before it can do anything useful. */
export type BurnsRequirement = "db" | "ai" | "gsc" | "outbound";

export type BurnsNode = {
  id: string;
  label: string;
  stage: BurnsStageId;
  /** Which ZZAI feature this exercises — id from lib/platform/feature-graph. */
  featureId?: string;
  /** What running this actually does to the live site. */
  description: string;
  /** Node ids that must finish first. */
  dependsOn: string[];
  /**
   * Rough seconds this usually takes. The runner uses it to decide whether the
   * next node still fits inside the cron's execution budget.
   */
  estimatedSeconds: number;
  requires: BurnsRequirement[];
  /** Where an admin goes to inspect the result by hand. */
  href?: string;
};

export const BURNS_NODES: BurnsNode[] = [
  {
    id: "owner",
    label: "Resolve Orbit owner",
    stage: "foundation",
    featureId: "orbit",
    description:
      "Finds the admin user id the rest of the run writes content and credentials against.",
    dependsOn: [],
    estimatedSeconds: 2,
    requires: ["db"],
    href: "/dashboard/orbit",
  },
  {
    id: "hub-pages",
    label: "Ensure hub pages",
    stage: "foundation",
    featureId: "marketing",
    description: "Publishes the Orbit hub SEO pages if any are missing, so internal links resolve.",
    dependsOn: ["owner"],
    estimatedSeconds: 15,
    requires: ["db"],
    href: "/dashboard/seo-health",
  },
  {
    id: "content-gaps",
    label: "Fill content gaps",
    stage: "content",
    featureId: "marketing",
    description:
      "Runs the marketing gap filler: creates and publishes missing SEO pages, blog posts, comparisons and tool pages, and mints the IndexNow key.",
    dependsOn: ["hub-pages"],
    estimatedSeconds: 90,
    requires: ["db", "ai"],
    href: "/dashboard/content",
  },
  {
    id: "index-phases",
    label: "Index 22 phases",
    stage: "content",
    featureId: "orbit",
    description:
      "Executes the nine Index 22 SEO infrastructure phases — audit, sitemap probes, ISR checks, internal links, quality gate, performance and conversion.",
    dependsOn: ["content-gaps"],
    estimatedSeconds: 120,
    requires: ["db"],
    href: "/dashboard/seo-health",
  },
  {
    id: "legacy-cleanup",
    label: "Unpublish legacy slugs",
    stage: "quality",
    featureId: "marketing",
    description: "Removes deprecated pyracrypt/clutety slugs that must not stay indexed.",
    dependsOn: ["hub-pages"],
    estimatedSeconds: 10,
    requires: ["db"],
  },
  {
    id: "quality-repair",
    label: "Traffic quality repair",
    stage: "quality",
    featureId: "marketing",
    description:
      "Unpublishes doorway pages, expands thin content and de-duplicates meta titles so the indexed set stays high quality.",
    dependsOn: ["content-gaps"],
    estimatedSeconds: 60,
    requires: ["db"],
  },
  {
    id: "internal-links",
    label: "Heal internal links",
    stage: "quality",
    featureId: "marketing",
    description: "Fills related-slug links on orphaned SEO pages so nothing is unreachable.",
    dependsOn: ["content-gaps"],
    estimatedSeconds: 20,
    requires: ["db"],
  },
  {
    id: "index-submit",
    label: "Submit to search engines",
    stage: "index",
    featureId: "orbit",
    description:
      "IndexNow batch to Bing/Yandex, Bing sitemap ping, Google Search Console sitemap PUT and Google Indexing API batches.",
    dependsOn: ["quality-repair", "internal-links", "legacy-cleanup"],
    estimatedSeconds: 90,
    requires: ["db", "gsc"],
    href: "/dashboard/gsc-connect",
  },
  {
    id: "launch-pack",
    label: "Marketing launch pack",
    stage: "distribution",
    featureId: "launch-studio",
    description:
      "Generates the AI launch copy and publishes it wherever outbound credentials exist. Stays copy-only when none are configured, so it never spams.",
    dependsOn: ["content-gaps"],
    estimatedSeconds: 150,
    requires: ["db", "ai", "outbound"],
    href: "/dashboard/launch-studio",
  },
  {
    id: "channel-intel",
    label: "Channel intel watches",
    stage: "intel",
    featureId: "channel-intel",
    description: "Runs any due YouTube channel watches and refreshes their feature suggestions.",
    dependsOn: ["owner"],
    estimatedSeconds: 60,
    requires: ["db", "ai"],
    href: "/dashboard/marketing/channel-intel",
  },
  {
    id: "growth-intel",
    label: "Growth intelligence",
    stage: "intel",
    featureId: "idea-engine",
    description: "Rebuilds the opportunity report that ranks what to work on next.",
    dependsOn: [],
    estimatedSeconds: 3,
    requires: [],
    href: "/dashboard/growth",
  },
  {
    id: "index-health",
    label: "Index health",
    stage: "measure",
    featureId: "pulse",
    description:
      "Samples live URLs to confirm they are reachable and indexable, and records coverage.",
    dependsOn: ["index-submit"],
    estimatedSeconds: 90,
    requires: ["db"],
    href: "/dashboard/seo-health",
  },
  {
    id: "seo-monitor",
    label: "SEO monitor",
    stage: "measure",
    featureId: "pulse",
    description:
      "Audits the site for orphans, thin pages and duplicate titles, and raises alerts for anything that regressed.",
    dependsOn: ["index-submit"],
    estimatedSeconds: 60,
    requires: ["db"],
    href: "/dashboard/seo-health",
  },
];

export const BURNS_NODE_BY_ID: Map<string, BurnsNode> = new Map(BURNS_NODES.map((n) => [n.id, n]));

export function getBurnsNode(id: string): BurnsNode | undefined {
  return BURNS_NODE_BY_ID.get(id);
}

/** Directed edges, one per dependency, for drawing the graph. */
export function burnsEdges(): { from: string; to: string }[] {
  return BURNS_NODES.flatMap((n) => n.dependsOn.map((from) => ({ from, to: n.id })));
}

/**
 * Execution order. Kahn's algorithm, tie-broken by stage then declaration order
 * so the sequence is deterministic across runs.
 *
 * Throws on an unknown dependency or a cycle — both are authoring mistakes that
 * would otherwise strand nodes silently at runtime.
 */
export function burnsExecutionOrder(): BurnsNode[] {
  const indegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();

  for (const node of BURNS_NODES) {
    indegree.set(node.id, node.dependsOn.length);
    for (const dep of node.dependsOn) {
      if (!BURNS_NODE_BY_ID.has(dep)) {
        throw new Error(`Burns node "${node.id}" depends on unknown node "${dep}"`);
      }
      const list = dependents.get(dep) ?? [];
      list.push(node.id);
      dependents.set(dep, list);
    }
  }

  const stageRank = new Map<BurnsStageId, number>(BURNS_STAGES.map((s, i) => [s, i]));
  const declarationRank = new Map(BURNS_NODES.map((n, i) => [n.id, i]));
  const rank = (id: string) => {
    const node = BURNS_NODE_BY_ID.get(id)!;
    return (stageRank.get(node.stage) ?? 0) * 1000 + (declarationRank.get(id) ?? 0);
  };

  const ready = BURNS_NODES.filter((n) => n.dependsOn.length === 0).map((n) => n.id);
  const out: BurnsNode[] = [];

  while (ready.length) {
    ready.sort((a, b) => rank(a) - rank(b));
    const id = ready.shift()!;
    out.push(BURNS_NODE_BY_ID.get(id)!);
    for (const next of dependents.get(id) ?? []) {
      const remaining = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, remaining);
      if (remaining === 0) ready.push(next);
    }
  }

  if (out.length !== BURNS_NODES.length) {
    const stuck = BURNS_NODES.filter((n) => !out.includes(n)).map((n) => n.id);
    throw new Error(`Burns graph has a dependency cycle involving: ${stuck.join(", ")}`);
  }
  return out;
}

/** Total estimated runtime, used to warn when the graph outgrows the cron budget. */
export function burnsEstimatedSeconds(): number {
  return BURNS_NODES.reduce((sum, n) => sum + n.estimatedSeconds, 0);
}

/** Nodes grouped by stage, for the graph UI's columns. */
export function burnsNodesByStage(): { stage: BurnsStageId; label: string; nodes: BurnsNode[] }[] {
  return BURNS_STAGES.map((stage) => ({
    stage,
    label: BURNS_STAGE_LABELS[stage],
    nodes: BURNS_NODES.filter((n) => n.stage === stage),
  })).filter((col) => col.nodes.length > 0);
}

/** The ZZAI feature a node exercises, when it maps to one. */
export function burnsFeatureTitle(node: BurnsNode): string | undefined {
  if (!node.featureId) return undefined;
  return FEATURE_BY_ID.get(node.featureId)?.shortTitle;
}
