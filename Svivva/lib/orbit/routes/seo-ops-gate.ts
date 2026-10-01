import { getSiteUrl } from "@/lib/site-url";
import { runSiteAudit } from "@/lib/seo/audit/run-audit";
import { runIndexHealth } from "@/lib/seo/index-health";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { orbitProjects } from "@/lib/orbit/schema";
import { getOrbitProjectById } from "../ingest";

export type SeoOpsGateConfig = {
  strict?: boolean;
  maxCanonicalConflicts?: number;
  maxRobotsConflicts?: number;
  maxMissingCanonical?: number;
  maxDuplicateTitles?: number;
  maxThinPages?: number;
  minIndexHealthScore?: number;
  indexHealthSample?: number;
  requireRobotsSitemap?: boolean;
};

export type SeoOpsGateResult = {
  ok: boolean;
  issues: string[];
  checks: {
    canonicalConflicts: number;
    robotsConflicts: number;
    missingCanonical: number;
    duplicateTitles: number;
    thinPages: number;
    robotsStatus: number;
    sitemapStatus: number;
    indexHealthScore?: number;
    indexableSample?: number;
  };
};

export type SeoOpsProjectSnapshot = SeoOpsGateResult & {
  checkedAt: string;
};

async function probePath(pathname: string): Promise<number> {
  try {
    const base = getSiteUrl().replace(/\/$/, "");
    const res = await fetch(`${base}${pathname}`, {
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    return res.status;
  } catch {
    return 0;
  }
}

export function evaluateSeoOpsGate(
  checks: SeoOpsGateResult["checks"],
  config: SeoOpsGateConfig = {},
): SeoOpsGateResult {
  const issues: string[] = [];
  const maxCanonicalConflicts = config.maxCanonicalConflicts ?? 0;
  const maxRobotsConflicts = config.maxRobotsConflicts ?? 0;
  const maxMissingCanonical = config.maxMissingCanonical ?? 0;
  const maxDuplicateTitles = config.maxDuplicateTitles ?? 0;
  const maxThinPages = config.maxThinPages ?? 5;
  const minIndexHealthScore = config.minIndexHealthScore ?? 70;

  if (checks.canonicalConflicts > maxCanonicalConflicts) {
    issues.push(
      `${checks.canonicalConflicts} canonical/noindex sitemap conflict(s) (max ${maxCanonicalConflicts})`,
    );
  }
  if (checks.robotsConflicts > maxRobotsConflicts) {
    issues.push(`${checks.robotsConflicts} robots/sitemap conflict(s) (max ${maxRobotsConflicts})`);
  }
  if (checks.missingCanonical > maxMissingCanonical) {
    issues.push(`${checks.missingCanonical} page(s) missing canonical (max ${maxMissingCanonical})`);
  }
  if (checks.duplicateTitles > maxDuplicateTitles) {
    issues.push(`${checks.duplicateTitles} duplicate title group(s) (max ${maxDuplicateTitles})`);
  }
  if (checks.thinPages > maxThinPages) {
    issues.push(`${checks.thinPages} thin content page(s) exceed threshold (max ${maxThinPages})`);
  }
  if (config.requireRobotsSitemap !== false) {
    if (checks.robotsStatus !== 200) {
      issues.push(`robots.txt returned HTTP ${checks.robotsStatus || "error"}`);
    }
    if (checks.sitemapStatus !== 200) {
      issues.push(`sitemap.xml returned HTTP ${checks.sitemapStatus || "error"}`);
    }
  }
  if (
    checks.indexHealthScore != null &&
    checks.indexHealthScore < minIndexHealthScore
  ) {
    issues.push(
      `Index health score ${checks.indexHealthScore} below minimum ${minIndexHealthScore}`,
    );
  }

  return { ok: issues.length === 0, issues, checks };
}

export async function runSeoOpsGate(config: SeoOpsGateConfig = {}): Promise<SeoOpsGateResult> {
  const audit = await runSiteAudit();
  const [robotsStatus, sitemapStatus] = await Promise.all([
    probePath("/robots.txt"),
    probePath("/sitemap.xml"),
  ]);

  let indexHealthScore: number | undefined;
  let indexableSample: number | undefined;
  if (config.minIndexHealthScore != null || config.indexHealthSample) {
    try {
      const health = await runIndexHealth({
        sampleLimit: config.indexHealthSample ?? 30,
      });
      indexHealthScore = health.score;
      indexableSample = health.indexable;
    } catch {
      /* best-effort */
    }
  }

  const checks: SeoOpsGateResult["checks"] = {
    canonicalConflicts: audit.canonical.noindexConflicts.length,
    robotsConflicts: audit.canonical.robotsConflicts.length,
    missingCanonical: audit.canonical.missingCanonical.length,
    duplicateTitles: audit.duplicate_content.duplicateTitles.length,
    thinPages: audit.thin_content.belowThreshold.length,
    robotsStatus,
    sitemapStatus,
    indexHealthScore,
    indexableSample,
  };

  return evaluateSeoOpsGate(checks, config);
}

export function parseSeoOpsSnapshot(
  metadata: Record<string, unknown> | null | undefined,
): SeoOpsProjectSnapshot | null {
  const raw = metadata?.seoOps;
  if (!raw || typeof raw !== "object") return null;
  return raw as SeoOpsProjectSnapshot;
}

export async function saveSeoOpsSnapshot(
  projectId: string,
  userId: string,
  snapshot: SeoOpsGateResult,
): Promise<SeoOpsProjectSnapshot> {
  const project = await getOrbitProjectById(projectId, userId);
  if (!project) throw new Error("Orbit project not found");

  const meta = (project.metadata || {}) as Record<string, unknown>;
  const next: SeoOpsProjectSnapshot = {
    ...snapshot,
    checkedAt: new Date().toISOString(),
  };

  await db
    .update(orbitProjects)
    .set({
      metadata: { ...meta, seoOps: next },
      updatedAt: new Date(),
    })
    .where(and(eq(orbitProjects.id, projectId), eq(orbitProjects.userId, userId)));

  return next;
}
