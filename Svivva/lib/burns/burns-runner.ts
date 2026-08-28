/**
 * Burns System runner — executes the graph against the live site.
 *
 * Executors are dynamically imported so a node's dependencies only load when
 * that node actually runs; the daily cron would otherwise pull in every heavy
 * SEO and AI module on every invocation.
 */
import { BURNS_NODES, burnsExecutionOrder, type BurnsNode } from "@/lib/burns/burns-graph";

export type BurnsNodeStatus = "ok" | "skipped" | "failed" | "blocked" | "pending";

export type BurnsNodeResult = {
  id: string;
  status: BurnsNodeStatus;
  /** One line an admin can read without opening the payload. */
  message: string;
  durationMs: number;
  /** Small, JSON-safe detail for the UI. Never the full report. */
  detail?: Record<string, unknown>;
};

export type BurnsRunResult = {
  startedAt: string;
  finishedAt: string;
  trigger: "cron" | "manual";
  ok: boolean;
  /** True when the time budget stopped the run before every node was attempted. */
  truncated: boolean;
  counts: { ok: number; skipped: number; failed: number; blocked: number };
  nodes: BurnsNodeResult[];
  summary: string;
};

type Executor = () => Promise<{ message: string; detail?: Record<string, unknown> }>;

function short(value: unknown, max = 160): string {
  const s = typeof value === "string" ? value : String(value);
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

/**
 * Each node's real work. Keys must cover every node in BURNS_NODES — a test
 * enforces that, so adding a graph node without an executor fails CI rather
 * than silently skipping at 6am.
 */
export function burnsExecutors(): Record<string, Executor> {
  // Resolved by the owner node and reused by everything that writes content.
  let ownerId: string | null = null;

  return {
    owner: async () => {
      const { resolveOrbitInternalUserId } = await import("@/lib/orbit/internal-user");
      ownerId = await resolveOrbitInternalUserId();
      if (!ownerId) {
        throw new Error("No Orbit owner — set ADMIN_USER_ID or save Orbit credentials once");
      }
      return { message: "Orbit owner resolved", detail: { ownerId } };
    },

    "hub-pages": async () => {
      const { ensureOrbitHubPages } = await import("@/lib/orbit/ensure-hub-pages");
      const slugs = await ensureOrbitHubPages();
      return {
        message: slugs.length ? `Ensured ${slugs.length} hub pages` : "Hub pages already present",
        detail: { slugs: slugs.slice(0, 10) },
      };
    },

    "content-gaps": async () => {
      if (!ownerId) throw new Error("Owner not resolved");
      const { fillMarketingGaps } = await import("@/lib/orbit/fill-marketing-gaps");
      const result = await fillMarketingGaps(ownerId);
      // MarketingCounts mixes numeric tallies with boolean flags, so only sum
      // the numbers and keep the flags out of the item total.
      const counts: Record<string, number> = {};
      for (const [k, v] of Object.entries(result.counts ?? {})) {
        if (typeof v === "number") counts[k] = v;
      }
      const created = Object.values(counts).reduce((a, b) => a + b, 0);
      return { message: `Content gaps filled (${created} items)`, detail: { counts } };
    },

    "index-phases": async () => {
      const { runSeoIndexStep } = await import("@/lib/orbit/seo-index-actions");
      const result = await runSeoIndexStep("seo-index-all");
      const r = result as { ok?: boolean; summary?: string };
      return {
        message: r.summary ? short(r.summary) : "Index 22 phases complete",
        detail: { ok: r.ok !== false },
      };
    },

    "legacy-cleanup": async () => {
      const { unpublishLegacySeoSlugs } = await import("@/lib/seo/unpublish-legacy-slugs");
      const removed = await unpublishLegacySeoSlugs();
      return {
        message: removed.length
          ? `Unpublished ${removed.length} legacy slugs`
          : "No legacy slugs to unpublish",
        detail: { count: removed.length },
      };
    },

    "quality-repair": async () => {
      const { runTrafficQualityRepair } = await import("@/lib/orbit/traffic-quality-repair");
      const result = (await runTrafficQualityRepair()) as Record<string, unknown>;
      return { message: "Traffic quality repaired", detail: pickNumbers(result) };
    },

    "internal-links": async () => {
      const { healOrphanInternalLinks } = await import("@/lib/seo/internal-links/graph");
      const { updated } = await healOrphanInternalLinks();
      return {
        message: updated ? `Linked ${updated} orphan pages` : "No orphan pages found",
        detail: { updated },
      };
    },

    "index-submit": async () => {
      const { runAutomatableManualActions } = await import("@/lib/orbit/automate-manual-actions");
      const result = (await runAutomatableManualActions()) as {
        indexNow?: { ok?: boolean; submitted?: number };
        googleSitemap?: { ok?: boolean };
        googleIndexing?: { submitted?: number };
        bingPing?: { ok?: boolean };
      };
      const submitted = result.indexNow?.submitted ?? 0;
      return {
        message: `IndexNow ${submitted} URLs, Google sitemap ${result.googleSitemap?.ok ? "ok" : "skipped"}`,
        detail: {
          indexNowSubmitted: submitted,
          googleSitemapOk: !!result.googleSitemap?.ok,
          googleIndexingSubmitted: result.googleIndexing?.submitted ?? 0,
          bingPingOk: !!result.bingPing?.ok,
        },
      };
    },

    "launch-pack": async () => {
      const { runMarketingAutopilot } = await import("@/lib/orbit/marketing-autopilot");
      // On-site content is already handled by content-gaps in this graph.
      const result = await runMarketingAutopilot({ skipOnSite: true });
      return {
        message: result.copyOnlyMode
          ? `Launch copy prepared (copy-only, ${result.stats.prepared} items)`
          : `Launch pack run: ${result.stats.posted} posted, ${result.stats.prepared} prepared`,
        detail: { ...result.stats, copyOnly: !!result.copyOnlyMode },
      };
    },

    "channel-intel": async () => {
      const { runDueChannelIntelWatches } = await import("@/lib/marketing/channel-intel-watch");
      const result = (await runDueChannelIntelWatches()) as {
        ran?: number;
        due?: number;
        results?: unknown[];
      };
      const ran = result.ran ?? result.results?.length ?? 0;
      return { message: ran ? `Ran ${ran} channel watches` : "No watches due", detail: { ran } };
    },

    "growth-intel": async () => {
      const { buildGrowthIntelligenceReport } = await import("@/lib/orbit/growth-intelligence");
      const report = buildGrowthIntelligenceReport() as {
        opportunities?: unknown[];
      };
      const count = report.opportunities?.length ?? 0;
      return { message: `${count} growth opportunities ranked`, detail: { opportunities: count } };
    },

    "index-health": async () => {
      const { runIndexHealth } = await import("@/lib/seo/index-health");
      const report = await runIndexHealth({ persist: true });
      const r = report as { score?: number; sampled?: number; indexable?: number };
      return {
        message: `Index health ${r.score ?? "?"} (${r.indexable ?? 0}/${r.sampled ?? 0} indexable)`,
        detail: { score: r.score, sampled: r.sampled, indexable: r.indexable },
      };
    },

    "seo-monitor": async () => {
      const { runSeoMonitor } = await import("@/lib/seo/monitoring/detector");
      const report = (await runSeoMonitor()) as { alerts?: unknown[]; issues?: unknown[] };
      const alerts = report.alerts?.length ?? report.issues?.length ?? 0;
      return {
        message: alerts ? `${alerts} SEO alerts raised` : "No SEO regressions detected",
        detail: { alerts },
      };
    },
  };
}

/** Keep only shallow numeric fields so persisted detail stays small. */
function pickNumbers(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "number" || typeof v === "boolean") out[k] = v;
  }
  return out;
}

export type RunBurnsOptions = {
  trigger?: "cron" | "manual";
  /**
   * Wall-clock budget. Vercel caps the cron route at 300s, so the default
   * leaves headroom to persist the result and return a response.
   */
  budgetMs?: number;
  /** Run only these node ids (plus nothing else) — used by the manual UI. */
  only?: string[];
  /** Injected in tests. */
  executors?: Record<string, Executor>;
  now?: () => number;
};

export async function runBurnsSystem(options: RunBurnsOptions = {}): Promise<BurnsRunResult> {
  const {
    trigger = "manual",
    budgetMs = 240_000,
    only,
    executors = burnsExecutors(),
    now = () => Date.now(),
  } = options;

  const startedAtMs = now();
  const startedAt = new Date(startedAtMs).toISOString();
  const order = burnsExecutionOrder().filter((n) => !only || only.includes(n.id));

  const results = new Map<string, BurnsNodeResult>();
  let truncated = false;

  for (const node of order) {
    const blockedBy = node.dependsOn.filter((dep) => {
      const r = results.get(dep);
      // A dependency outside the selected subset is treated as satisfied.
      if (!r) return only ? false : true;
      return r.status === "failed" || r.status === "blocked";
    });

    if (blockedBy.length) {
      results.set(node.id, {
        id: node.id,
        status: "blocked",
        message: `Blocked by ${blockedBy.join(", ")}`,
        durationMs: 0,
      });
      continue;
    }

    const elapsed = now() - startedAtMs;
    if (elapsed + node.estimatedSeconds * 1000 > budgetMs) {
      truncated = true;
      results.set(node.id, {
        id: node.id,
        status: "skipped",
        message: "Skipped — outside this run's time budget",
        durationMs: 0,
      });
      continue;
    }

    const exec = executors[node.id];
    if (!exec) {
      results.set(node.id, {
        id: node.id,
        status: "skipped",
        message: "No executor registered",
        durationMs: 0,
      });
      continue;
    }

    const t0 = now();
    try {
      const { message, detail } = await exec();
      results.set(node.id, {
        id: node.id,
        status: "ok",
        message: short(message),
        durationMs: now() - t0,
        detail,
      });
    } catch (e) {
      results.set(node.id, {
        id: node.id,
        status: "failed",
        message: short(e instanceof Error ? e.message : String(e)),
        durationMs: now() - t0,
      });
    }
  }

  const nodes = order.map(
    (n) =>
      results.get(n.id) ?? {
        id: n.id,
        status: "pending" as BurnsNodeStatus,
        message: "Not attempted",
        durationMs: 0,
      },
  );

  const counts = {
    ok: nodes.filter((n) => n.status === "ok").length,
    skipped: nodes.filter((n) => n.status === "skipped").length,
    failed: nodes.filter((n) => n.status === "failed").length,
    blocked: nodes.filter((n) => n.status === "blocked").length,
  };

  const finishedAtMs = now();
  const seconds = Math.round((finishedAtMs - startedAtMs) / 1000);
  const summary =
    `${counts.ok}/${nodes.length} nodes ok in ${seconds}s` +
    (counts.failed ? `, ${counts.failed} failed` : "") +
    (counts.blocked ? `, ${counts.blocked} blocked` : "") +
    (truncated ? ", stopped on time budget" : "");

  return {
    startedAt,
    finishedAt: new Date(finishedAtMs).toISOString(),
    trigger,
    ok: counts.failed === 0,
    truncated,
    counts,
    nodes,
    summary,
  };
}

/** Node ids that have no executor — surfaced by tests, not at runtime. */
export function burnsNodesMissingExecutors(): string[] {
  const executors = burnsExecutors();
  return BURNS_NODES.filter((n) => !executors[n.id]).map((n) => n.id);
}
