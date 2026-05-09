/* eslint-disable no-console */
import { XMLParser } from "fast-xml-parser";
import * as cheerio from "cheerio";
import robotsParser from "robots-parser";

type IssuePriority = "high" | "medium" | "low";

type UrlAuditIssue = {
  code: string;
  message: string;
  priority: IssuePriority;
};

type UrlAuditResult = {
  url: string;
  status: number;
  canonical?: string;
  title?: string;
  description?: string;
  h1Count: number;
  issues: UrlAuditIssue[];
};

type SeoAuditReport = {
  baseUrl: string;
  scannedAt: string;
  sitemapUrl: string;
  robotsUrl: string;
  totals: {
    urlsInSitemap: number;
    crawled: number;
    byPriority: Record<IssuePriority, number>;
  };
  results: UrlAuditResult[];
};

const parser = new XMLParser({ ignoreAttributes: false });

function normalizeUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

async function fetchText(url: string): Promise<{ status: number; body: string }> {
  const response = await fetch(url, {
    headers: {
      "user-agent": "SvivvaSEOAudit/1.0 (+https://svivva.com)",
      accept: "text/html,application/xml,text/plain,*/*",
    },
  });
  return { status: response.status, body: await response.text() };
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

async function getSitemapUrls(sitemapUrl: string): Promise<string[]> {
  const { status, body } = await fetchText(sitemapUrl);
  if (status !== 200) throw new Error(`Sitemap fetch failed with status ${status}`);

  const xml = parser.parse(body);
  const urlNodes = toArray(xml?.urlset?.url);
  const urls = urlNodes.map((node: { loc?: string }) => node?.loc).filter(Boolean) as string[];
  return Array.from(new Set(urls));
}

async function getRobots(robotsUrl: string) {
  const { body } = await fetchText(robotsUrl);
  return robotsParser(robotsUrl, body);
}

function pushIssue(
  issues: UrlAuditIssue[],
  code: string,
  message: string,
  priority: IssuePriority,
) {
  issues.push({ code, message, priority });
}

function countByPriority(results: UrlAuditResult[]): Record<IssuePriority, number> {
  return results.reduce(
    (acc, row) => {
      row.issues.forEach((issue) => {
        acc[issue.priority] += 1;
      });
      return acc;
    },
    { high: 0, medium: 0, low: 0 },
  );
}

async function auditUrl(
  url: string,
  robots: ReturnType<typeof robotsParser>,
): Promise<UrlAuditResult> {
  const issues: UrlAuditIssue[] = [];
  const { status, body } = await fetchText(url);

  if (!robots.isAllowed(url, "*")) {
    pushIssue(
      issues,
      "BLOCKED_BY_ROBOTS",
      "URL is blocked by robots.txt but present in sitemap.",
      "high",
    );
  }

  if (status !== 200) {
    pushIssue(issues, "NON_200", `URL returned status ${status}.`, "high");
    return { url, status, h1Count: 0, issues };
  }

  const $ = cheerio.load(body);
  const title = $("head title").text().trim();
  const description = $('meta[name="description"]').attr("content")?.trim();
  const canonical = $('head link[rel="canonical"]').attr("href")?.trim();
  const h1Count = $("h1").length;

  if (!title) pushIssue(issues, "MISSING_TITLE", "Missing <title> in <head>.", "high");
  if (!description) pushIssue(issues, "MISSING_DESCRIPTION", "Missing meta description.", "medium");
  if (!canonical) {
    pushIssue(issues, "MISSING_CANONICAL", "Missing canonical link in <head>.", "high");
  } else {
    const canonicalIsAbsolute = /^https?:\/\//i.test(canonical);
    const canonicalFinal = canonicalIsAbsolute ? canonical : new URL(canonical, url).toString();
    if (normalizeUrl(canonicalFinal) !== normalizeUrl(url)) {
      pushIssue(
        issues,
        "CANONICAL_MISMATCH",
        `Canonical points to ${canonicalFinal}, expected ${url}.`,
        "high",
      );
    }
  }

  if (h1Count === 0) pushIssue(issues, "MISSING_H1", "No H1 found.", "high");
  if (h1Count > 1) pushIssue(issues, "MULTIPLE_H1", `Found ${h1Count} H1 tags.`, "medium");

  const wordCount = $("body").text().replace(/\s+/g, " ").trim().split(" ").filter(Boolean).length;
  if (wordCount < 120) {
    pushIssue(issues, "THIN_CONTENT_RISK", `Low content word count (${wordCount}).`, "low");
  }

  return { url, status, canonical, title, description, h1Count, issues };
}

async function main() {
  const baseArg = process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL || "https://svivva.com";
  const baseUrl = baseArg.replace(/\/+$/, "");
  const sitemapUrl = `${baseUrl}/sitemap.xml`;
  const robotsUrl = `${baseUrl}/robots.txt`;

  const sitemapUrls = await getSitemapUrls(sitemapUrl);
  const robots = await getRobots(robotsUrl);

  const results: UrlAuditResult[] = [];
  for (const url of sitemapUrls) {
    try {
      const row = await auditUrl(url, robots);
      results.push(row);
    } catch (error) {
      results.push({
        url,
        status: 0,
        h1Count: 0,
        issues: [
          {
            code: "CRAWL_ERROR",
            message: error instanceof Error ? error.message : "Unknown crawl error",
            priority: "high",
          },
        ],
      });
    }
  }

  const report: SeoAuditReport = {
    baseUrl,
    scannedAt: new Date().toISOString(),
    sitemapUrl,
    robotsUrl,
    totals: {
      urlsInSitemap: sitemapUrls.length,
      crawled: results.length,
      byPriority: countByPriority(results),
    },
    results,
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
