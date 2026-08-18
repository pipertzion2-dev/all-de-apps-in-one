import type { IngestSnapshot } from "../types";
import { crawlAuthorizedUrl } from "../url-crawler";

export async function buildUrlIngestSnapshot(url: string): Promise<IngestSnapshot> {
  const crawl = await crawlAuthorizedUrl(url);

  const entities = [
    {
      ref: "product",
      entityType: "product" as const,
      name: crawl.title,
      url: crawl.canonicalUrl || crawl.url,
      description: crawl.description,
      metadata: {
        headings: crawl.headings,
        audienceSignals: crawl.audienceSignals,
        keywords: crawl.keywords,
        structuredDataCount: crawl.structuredData.length,
      },
    },
    ...crawl.pages.map((page, i) => ({
      ref: `page:${i}`,
      entityType: "page" as const,
      name: page.title,
      url: page.url,
      slug: (() => {
        try {
          return new URL(page.url).pathname;
        } catch {
          return undefined;
        }
      })(),
    })),
    ...crawl.keywords.map((kw, i) => ({
      ref: `keyword:${i}`,
      entityType: "keyword" as const,
      name: kw,
      metadata: { inferred: true },
    })),
  ];

  const links = [
    ...crawl.pages.map((_, i) => ({
      fromRef: "product",
      toRef: `page:${i}`,
      linkType: "has_page" as const,
    })),
    ...crawl.keywords.map((_, i) => ({
      fromRef: "product",
      toRef: `keyword:${i}`,
      linkType: "targets" as const,
    })),
  ];

  return {
    projectName: crawl.title,
    description: crawl.description,
    productType: "website",
    summary: {
      url: crawl.url,
      canonicalUrl: crawl.canonicalUrl,
      pageCount: crawl.pages.length,
      keywordCount: crawl.keywords.length,
      hasStructuredData: crawl.structuredData.length > 0,
      crawledAt: new Date().toISOString(),
    },
    entities,
    links,
  };
}
