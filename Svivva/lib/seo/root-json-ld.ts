import { BRAND, getBrandSameAs } from "@/lib/brand";
import { MEDIA } from "@/lib/media-assets";
import { getSiteUrl } from "@/lib/site-url";
import { softwareApplicationSchema, websiteSchema } from "@/lib/seo/schema/builders";

/** Sitewide JSON-LD — Organization, WebSite, and product app. No FAQ/HowTo (page-scoped only). */
export function rootJsonLdSchemas(): object[] {
  const siteUrl = getSiteUrl();

  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: BRAND.name,
      url: siteUrl,
      logo: new URL(MEDIA.logo, siteUrl).toString(),
      description: `${BRAND.tagline} — ${BRAND.shortDescription}`,
      sameAs: getBrandSameAs(),
    },
    websiteSchema(),
    softwareApplicationSchema({
      name: BRAND.name,
      description: `${BRAND.tagline} — ship with schema validation, automated checks, versioning, and rollback from one workspace.`,
      path: "/",
      category: "DeveloperApplication",
    }),
  ];
}
