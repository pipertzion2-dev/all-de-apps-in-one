#!/usr/bin/env tsx
/**
 * Generates SEO audit JSON reports under seo-reports/
 * Run: npm run seo:audit
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runSiteAudit } from "../lib/seo/audit/run-audit";
import { checkSeoDeployGates } from "../lib/seo/audit/deploy-gates";
import { buildInternalLinkMap } from "../lib/seo/internal-links/graph";
import { buildAnalyticsMap } from "../lib/seo/analytics-events";
import { buildPerformanceReport } from "../lib/seo/performance/budget";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "seo-reports");

async function main() {
  const audit = await runSiteAudit();
  const linkMap = await buildInternalLinkMap();

  await mkdir(outDir, { recursive: true });

  const files: [string, unknown][] = [
    ["site_map.json", audit.site_map],
    ["crawl_graph.json", audit.crawl_graph],
    ["orphan_pages.json", audit.orphan_pages],
    ["duplicate_content_report.json", audit.duplicate_content],
    ["thin_content_report.json", audit.thin_content],
    ["canonical_report.json", audit.canonical],
    ["internal_link_map.json", linkMap],
    ["analytics_map.json", buildAnalyticsMap()],
    [
      "performance_report.json",
      buildPerformanceReport({ hasImageConfig: true, hasCacheHeaders: true }),
    ],
  ];

  for (const [name, data] of files) {
    const dest = path.join(outDir, name);
    await writeFile(dest, JSON.stringify(data, null, 2));
    console.log(`Wrote ${dest}`);
  }

  const gates = await checkSeoDeployGates();
  await writeFile(
    path.join(outDir, "deploy_gates.json"),
    JSON.stringify(gates, null, 2),
  );
  console.log(`Wrote ${path.join(outDir, "deploy_gates.json")}`);

  console.log("\nAudit complete at", audit.generatedAt);
  console.log(
    `Orphans: ${audit.orphan_pages.orphans.length}, thin: ${audit.thin_content.belowThreshold.length}, dup titles: ${audit.duplicate_content.duplicateTitles.length}`,
  );

  if (!gates.pass) {
    console.error("\n❌ Deploy gates FAILED:");
    for (const issue of gates.issues.filter((i) => i.severity === "critical")) {
      console.error(`  · [${issue.gate}] ${issue.message} (${issue.count ?? "?"})`);
    }
    process.exit(1);
  }
  console.log("\n✓ Deploy gates passed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
