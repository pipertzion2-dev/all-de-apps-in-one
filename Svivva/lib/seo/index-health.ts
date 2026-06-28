/**
 * Index health engine.
 *
 * SEO indexing is slow — Google can take days to a week to crawl a new URL,
 * and large sites blow past the Indexing API daily quota. This module:
 *   1. Verifies each canonical URL is live + indexable (status 200, no noindex).
 *   2. Persists per-URL progress so a week-long crawl is tracked across runs.
 *   3. Rotates submission batches (least-recently-submitted first) so every URL
 *      eventually gets nudged instead of always re-submitting the first 200.
 *
 * Tables are created on demand (CREATE TABLE IF NOT EXISTS) so no migration is
 * required for deploys.
 */
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getCanonicalUrlsForIndexing } from "@/lib/seo/sitemap/registry";
import { getSiteUrl } from "@/lib/site-url";

export type UrlCheck = {
  url: string;
  httpStatus: number;
  reachable: boolean;
  indexable: boolean;
  noindex: boolean;
  notes: string;
};

export type IndexHealthReport = {
  site: string;
  checkedAt: string;
  total: number;
  sampled: number;
  reachable: number;
  indexable: number;
  blocked: number;
  /** 0–100 score over the sampled URLs. */
  score: number;
  /** Coverage = URLs ever submitted / total known URLs. */
  coverage: {
    totalUrls: number;
    submitted: number;
    confirmed: number;
    pct: number;
  };
  problems: UrlCheck[];
  staleUrls: number;
  summary: string;
};

let tablesReady = false;

async function ensureTables(): Promise<void> {
  if (tablesReady) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS index_url_status (
      url TEXT PRIMARY KEY,
      first_submitted_at TIMESTAMPTZ,
      last_submitted_at TIMESTAMPTZ,
      last_checked_at TIMESTAMPTZ,
      http_status INTEGER,
      indexable BOOLEAN,
      confirmed BOOLEAN DEFAULT FALSE,
      submit_count INTEGER DEFAULT 0,
      notes TEXT
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS index_health_runs (
      id TEXT PRIMARY KEY,
      run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      total INTEGER,
      sampled INTEGER,
      reachable INTEGER,
      indexable INTEGER,
      score INTEGER,
      summary JSONB
    )
  `);
  tablesReady = true;
}

/** Key paths that must always be checked fully (homepage, hubs, mini-app bridges). */
const KEY_PATHS = [
  "",
  "/blog",
  "/tools",
  "/ai-tools-hub",
  "/cyber-security-mini-apps",
  "/seo-pack",
  "/orbit",
  "/seeds",
];

async function checkUrl(url: string, timeoutMs = 9000): Promise<UrlCheck> {
  try {
    const r = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "User-Agent": "Svivva-IndexHealth/1.0 (+https://svivva.com)" },
      cache: "no-store",
    });
    const xRobots = (r.headers.get("x-robots-tag") || "").toLowerCase();
    let noindex = xRobots.includes("noindex");
    let notes = "";

    if (r.ok && !noindex) {
      // Only parse body for HTML responses to detect <meta robots noindex>.
      const ct = (r.headers.get("content-type") || "").toLowerCase();
      if (ct.includes("text/html")) {
        const body = await r.text();
        const metaRobots =
          body.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i)?.[1] || "";
        if (/noindex/i.test(metaRobots)) {
          noindex = true;
          notes = "meta robots noindex";
        }
      }
    } else if (noindex) {
      notes = "x-robots-tag noindex";
    } else {
      notes = `HTTP ${r.status}`;
    }

    const reachable = r.ok;
    return {
      url,
      httpStatus: r.status,
      reachable,
      indexable: reachable && !noindex,
      noindex,
      notes: notes || "ok",
    };
  } catch (e) {
    return {
      url,
      httpStatus: 0,
      reachable: false,
      indexable: false,
      noindex: false,
      notes: e instanceof Error ? e.message : "fetch failed",
    };
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

async function persistChecks(checks: UrlCheck[]): Promise<void> {
  for (const c of checks) {
    await db.execute(sql`
      INSERT INTO index_url_status (url, last_checked_at, http_status, indexable, confirmed, notes)
      VALUES (${c.url}, NOW(), ${c.httpStatus}, ${c.indexable}, ${c.indexable}, ${c.notes})
      ON CONFLICT (url) DO UPDATE SET
        last_checked_at = NOW(),
        http_status = ${c.httpStatus},
        indexable = ${c.indexable},
        confirmed = CASE WHEN ${c.indexable} THEN TRUE ELSE index_url_status.confirmed END,
        notes = ${c.notes}
    `);
  }
}

/**
 * Run a thorough index-health check.
 * Key URLs are always checked; the rest are sampled to bound runtime.
 */
export async function runIndexHealth(
  opts: { sampleLimit?: number; concurrency?: number; persist?: boolean } = {},
): Promise<IndexHealthReport> {
  const { sampleLimit = 60, concurrency = 8, persist = true } = opts;
  await ensureTables();

  const site = getSiteUrl().replace(/\/$/, "");
  const allUrls = await getCanonicalUrlsForIndexing();
  // Always verify the homepage + key hubs (they may differ from sitemap casing).
  const keyUrls = [...new Set(KEY_PATHS.map((p) => `${site}${p}`))];

  // Always check key URLs; sample the remainder up to sampleLimit.
  const rest = allUrls.filter((u) => !keyUrls.includes(u));
  const shuffled = [...rest].sort(() => Math.random() - 0.5);
  const sample = shuffled.slice(0, Math.max(0, sampleLimit - keyUrls.length));
  const toCheck = [...new Set([...keyUrls, ...sample])];

  const checks = await mapWithConcurrency(toCheck, concurrency, (u) => checkUrl(u));
  if (persist) await persistChecks(checks);

  const reachable = checks.filter((c) => c.reachable).length;
  const indexable = checks.filter((c) => c.indexable).length;
  const blocked = checks.filter((c) => c.reachable && c.noindex).length;
  const problems = checks.filter((c) => !c.indexable);
  const score = checks.length ? Math.round((indexable / checks.length) * 100) : 0;

  // Coverage from the persisted tracking table.
  let submitted = 0;
  let confirmed = 0;
  let staleUrls = 0;
  try {
    const cov = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE last_submitted_at IS NOT NULL) AS submitted,
        COUNT(*) FILTER (WHERE confirmed = TRUE) AS confirmed
      FROM index_url_status
    `);
    const covRow = cov.rows?.[0] as { submitted?: string; confirmed?: string } | undefined;
    submitted = Number(covRow?.submitted ?? 0);
    confirmed = Number(covRow?.confirmed ?? 0);
    const stale = await db.execute(sql`
      SELECT COUNT(*) AS n FROM index_url_status
      WHERE confirmed = FALSE
        AND (last_submitted_at IS NULL OR last_submitted_at < NOW() - INTERVAL '3 days')
    `);
    staleUrls = Number((stale.rows?.[0] as { n?: string } | undefined)?.n ?? 0);
  } catch {
    /* tracking table empty */
  }

  const coveragePct = allUrls.length ? Math.round((submitted / allUrls.length) * 100) : 0;

  const report: IndexHealthReport = {
    site,
    checkedAt: new Date().toISOString(),
    total: allUrls.length,
    sampled: checks.length,
    reachable,
    indexable,
    blocked,
    score,
    coverage: { totalUrls: allUrls.length, submitted, confirmed, pct: coveragePct },
    problems,
    staleUrls,
    summary:
      `${indexable}/${checks.length} sampled URLs are live & indexable (score ${score}). ` +
      `${submitted}/${allUrls.length} known URLs have been submitted (${coveragePct}% coverage). ` +
      (staleUrls > 0
        ? `${staleUrls} URL(s) need a fresh submission.`
        : `All submitted URLs are fresh.`),
  };

  try {
    await db.execute(sql`
      INSERT INTO index_health_runs (id, total, sampled, reachable, indexable, score, summary)
      VALUES (${crypto.randomUUID()}, ${report.total}, ${report.sampled}, ${report.reachable},
              ${report.indexable}, ${report.score}, ${JSON.stringify({ problems: problems.slice(0, 25), coverage: report.coverage })})
    `);
  } catch {
    /* non-fatal */
  }

  return report;
}

/**
 * Pick the batch of URLs that most need (re)submission: never-submitted first,
 * then least-recently submitted. This rotates through a large site over days so
 * a slow crawl still reaches every page despite per-day quotas.
 */
export async function getIndexingBatch(batchSize = 200): Promise<string[]> {
  await ensureTables();
  const allUrls = await getCanonicalUrlsForIndexing();
  if (allUrls.length === 0) return [];

  // Seed any unknown URLs into the tracker so they are considered.
  for (const url of allUrls) {
    await db.execute(sql`
      INSERT INTO index_url_status (url) VALUES (${url})
      ON CONFLICT (url) DO NOTHING
    `);
  }

  const known = new Set(allUrls);
  const res = await db.execute(sql`
    SELECT url FROM index_url_status
    WHERE confirmed = FALSE OR last_submitted_at IS NULL
       OR last_submitted_at < NOW() - INTERVAL '3 days'
    ORDER BY last_submitted_at ASC NULLS FIRST, submit_count ASC
    LIMIT ${batchSize}
  `);
  const picked = ((res.rows || []) as Array<{ url: string }>)
    .map((r) => r.url)
    .filter((u) => known.has(u));
  // Fall back to the canonical list if the tracker has nothing pending.
  return picked.length > 0 ? picked : allUrls.slice(0, batchSize);
}

/** Record that a set of URLs was just submitted to a search engine. */
export async function recordSubmission(urls: string[]): Promise<void> {
  if (urls.length === 0) return;
  await ensureTables();
  for (const url of urls) {
    await db.execute(sql`
      INSERT INTO index_url_status (url, first_submitted_at, last_submitted_at, submit_count)
      VALUES (${url}, NOW(), NOW(), 1)
      ON CONFLICT (url) DO UPDATE SET
        first_submitted_at = COALESCE(index_url_status.first_submitted_at, NOW()),
        last_submitted_at = NOW(),
        submit_count = index_url_status.submit_count + 1
    `);
  }
}

/** Compact coverage snapshot for dashboards without re-crawling. */
export async function getCoverageSnapshot(): Promise<{
  totalUrls: number;
  submitted: number;
  confirmed: number;
  stale: number;
  lastRunAt: string | null;
  lastScore: number | null;
}> {
  await ensureTables();
  const allUrls = await getCanonicalUrlsForIndexing();
  let submitted = 0;
  let confirmed = 0;
  let stale = 0;
  let lastRunAt: string | null = null;
  let lastScore: number | null = null;
  try {
    const cov = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE last_submitted_at IS NOT NULL) AS submitted,
        COUNT(*) FILTER (WHERE confirmed = TRUE) AS confirmed,
        COUNT(*) FILTER (WHERE confirmed = FALSE AND (last_submitted_at IS NULL OR last_submitted_at < NOW() - INTERVAL '3 days')) AS stale
      FROM index_url_status
    `);
    const covRow = cov.rows?.[0] as
      | { submitted?: string; confirmed?: string; stale?: string }
      | undefined;
    submitted = Number(covRow?.submitted ?? 0);
    confirmed = Number(covRow?.confirmed ?? 0);
    stale = Number(covRow?.stale ?? 0);
    const run = await db.execute(sql`
      SELECT run_at, score FROM index_health_runs ORDER BY run_at DESC LIMIT 1
    `);
    const runRow = run.rows?.[0] as { run_at?: string | Date; score?: number } | undefined;
    lastRunAt = runRow?.run_at ? new Date(runRow.run_at).toISOString() : null;
    lastScore = runRow?.score ?? null;
  } catch {
    /* tracker not yet created */
  }
  return { totalUrls: allUrls.length, submitted, confirmed, stale, lastRunAt, lastScore };
}
