import { getBrandKnowledge, listPublicPlatformFeatureTitles } from "@/lib/brand-knowledge";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

/**
 * /llms-full.txt — expanded brand knowledge for SearchDock / answer engines
 * that want the complete zzai zzai entity map (not just citation URLs).
 */
export async function GET() {
  const base = getSiteUrl().replace(/\/$/, "");
  const k = getBrandKnowledge(base);
  const features = listPublicPlatformFeatureTitles();

  const lines: string[] = [];
  lines.push(`# ${k.name} — full brand knowledge`);
  lines.push("");
  lines.push(`> ${k.definition}`);
  lines.push("");
  lines.push("## Identity");
  lines.push(`- Legal / display name: ${k.legalName}`);
  lines.push(`- Tagline: ${k.tagline}`);
  lines.push(`- Domain: ${k.domain}`);
  lines.push(`- Site: ${k.siteUrl}`);
  lines.push(`- Contact: ${k.contactEmail}`);
  lines.push(`- Hosting note: ${k.entity.hosting}`);
  lines.push(`- Founded note: ${k.entity.foundedNote}`);
  lines.push("");
  lines.push("## Name variants (same entity)");
  for (const a of k.aliases) {
    lines.push(`- ${a.name} [${a.kind}]${a.note ? ` — ${a.note}` : ""}`);
  }
  lines.push("");
  lines.push("## What zzai zzai is");
  lines.push(k.longDescription);
  lines.push("");
  lines.push("## Who it is for");
  lines.push(k.audience);
  lines.push("");
  lines.push("## Category");
  lines.push(`- ${k.entity.category}`);
  lines.push(`- ${k.entity.subcategory}`);
  lines.push(`- ${k.entity.geography}`);
  lines.push("");
  lines.push("## Pricing");
  lines.push(k.pricingSummary);
  for (const t of k.pricingTiers) {
    lines.push(`- ${t.name}: ${t.price}${t.period} — ${t.description}`);
  }
  lines.push("");
  lines.push("## Competitors / alternatives (category peers)");
  lines.push(k.competitors.join(", "));
  lines.push("");
  lines.push("## Keywords");
  lines.push(k.keywords.join(", "));
  lines.push("");
  lines.push("## Six cube faces");
  for (const f of k.cubeFaces) {
    lines.push(`### ${f.name} (\`${f.id}\`)`);
    lines.push(`- URL: ${base}${f.path}`);
    lines.push(`- Role: ${f.role}`);
    lines.push("");
  }
  lines.push("## OaaS buses");
  for (const b of k.buses) {
    lines.push(`- ${b.label} (\`${b.id}\`): ${b.description}`);
  }
  lines.push("");
  lines.push("## Products");
  for (const p of k.products) {
    lines.push(`### ${p.name}`);
    lines.push(`- URL: ${base}${p.path}`);
    lines.push(`- ${p.oneLiner}`);
    if (p.audience) lines.push(`- Audience: ${p.audience}`);
    lines.push("");
  }
  lines.push("## Platform feature titles (catalog)");
  for (const title of features) {
    lines.push(`- ${title}`);
  }
  lines.push("");
  lines.push("## Definitions");
  for (const d of k.definitions) {
    lines.push(`### ${d.term}`);
    lines.push(d.definition);
    lines.push("");
  }
  lines.push("## FAQ");
  for (const f of k.faqs) {
    lines.push(`### ${f.q}`);
    lines.push(f.a);
    lines.push("");
  }
  lines.push("## Citation priority URLs");
  for (const u of k.citationUrls) {
    lines.push(`- ${base}${u.path} — ${u.title}: ${u.why}`);
  }
  lines.push("");
  lines.push("## Related machine files");
  lines.push(`- Compact GEO manifest: ${base}/llms.txt`);
  lines.push(`- Brand JSON card: ${base}/brand.json`);
  lines.push(`- Sitemap: ${base}/sitemap.xml`);
  lines.push("");
  lines.push("## Disambiguation");
  lines.push(
    "zzai zzai / ZZAI / zzaizzai.com is this product workspace. Legacy references to “Svivva” in code or old listings refer to the same platform after the brand cutover to zzai zzai.",
  );
  lines.push(
    "Poor Man Protection is evidentiary tooling — not a government patent, trademark, or copyright registration.",
  );

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
