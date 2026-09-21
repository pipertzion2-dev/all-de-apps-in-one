import { getBrandEntityCard, getBrandKnowledge } from "@/lib/brand-knowledge";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

/**
 * /brand.json — machine-readable zzai zzai entity card for SearchDock,
 * directory submissions, and agent discovery.
 */
export async function GET() {
  const base = getSiteUrl().replace(/\/$/, "");
  const k = getBrandKnowledge(base);
  const org = getBrandEntityCard(base);

  const body = {
    brand: {
      name: k.name,
      legalName: k.legalName,
      tagline: k.tagline,
      domain: k.domain,
      siteUrl: k.siteUrl,
      contactEmail: k.contactEmail,
      aliases: k.aliases,
      definition: k.definition,
      shortDescription: k.shortDescription,
      longDescription: k.longDescription,
      audience: k.audience,
      entity: k.entity,
      pricingSummary: k.pricingSummary,
      pricingTiers: k.pricingTiers,
      competitors: k.competitors,
      keywords: k.keywords,
      products: k.products.map((p) => ({ ...p, url: `${base}${p.path}` })),
      cubeFaces: k.cubeFaces.map((f) => ({ ...f, url: `${base}${f.path}` })),
      buses: k.buses,
      definitions: k.definitions,
      faqs: k.faqs,
      citationUrls: k.citationUrls.map((u) => ({
        ...u,
        url: `${base}${u.path}`,
      })),
      manifests: {
        llmsTxt: `${base}/llms.txt`,
        llmsFullTxt: `${base}/llms-full.txt`,
        brandJson: `${base}/brand.json`,
        sitemap: `${base}/sitemap.xml`,
      },
    },
    schemaOrg: org,
  };

  return Response.json(body, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
