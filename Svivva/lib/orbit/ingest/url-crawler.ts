/** Lightweight HTML + sitemap extraction for Orbit URL ingest (authorized URLs only). */

const FETCH_HEADERS = { "User-Agent": "ZZAI-Orbit-Ingest/1.0" };
const PAGE_LIMIT = 80;

function extractMetaContent(html: string, attr: string): string {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${attr}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const m =
    html.match(re) ||
    html.match(
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${attr}["']`, "i"),
    );
  return m?.[1]?.trim() || "";
}

function extractCanonical(html: string, baseUrl: string): string | undefined {
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  if (!m?.[1]) return undefined;
  try {
    return new URL(m[1], baseUrl).href;
  } catch {
    return undefined;
  }
}

function extractJsonLd(html: string): unknown[] {
  const blocks: unknown[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      blocks.push(JSON.parse(m[1]));
    } catch {
      /* skip malformed */
    }
  }
  return blocks;
}

function extractHeadings(html: string): string[] {
  const headings: string[] = [];
  const re = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const text = m[1]
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (text.length >= 3 && text.length <= 200) headings.push(text);
  }
  return headings.slice(0, 24);
}

function extractInternalLinks(html: string, baseUrl: string, host: string): string[] {
  const urls = new Set<string>();
  const re = /href=["']([^"'#?]+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1].trim();
    if (!raw || raw.startsWith("javascript:") || raw.startsWith("mailto:")) continue;
    try {
      const full = new URL(raw, baseUrl);
      if (full.hostname !== host) continue;
      if (/\.(xml|txt|ico|png|jpg|jpeg|svg|css|js|json|webp|woff|pdf)$/i.test(full.pathname))
        continue;
      urls.add(full.href.replace(/\/$/, "") || full.href);
    } catch {
      /* skip */
    }
  }
  return [...urls];
}

async function fetchText(url: string, timeoutMs = 18000): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function collectSitemapUrls(siteUrl: string): Promise<string[]> {
  const origin = siteUrl.replace(/\/$/, "");
  const smText = await fetchText(`${origin}/sitemap.xml`, 22000);
  if (!smText) return [];

  const locs = [...smText.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((m) => m[1].trim());
  const subUrls = [...smText.matchAll(/<sitemap>[\s\S]*?<loc>([^<]+)<\/loc>/gi)].map((m) =>
    m[1].trim(),
  );
  for (const sub of subUrls.slice(0, 4)) {
    const subText = await fetchText(sub, 22000);
    if (subText) {
      locs.push(...[...subText.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((m) => m[1].trim()));
    }
  }

  const host = new URL(origin).hostname;
  return [
    ...new Set(
      locs.filter((loc) => {
        try {
          return new URL(loc).hostname === host;
        } catch {
          return false;
        }
      }),
    ),
  ].slice(0, PAGE_LIMIT);
}

export type UrlCrawlResult = {
  url: string;
  title: string;
  description: string;
  canonicalUrl?: string;
  headings: string[];
  structuredData: unknown[];
  pages: Array<{ url: string; title: string }>;
  audienceSignals: string[];
  keywords: string[];
};

export async function crawlAuthorizedUrl(rawUrl: string): Promise<UrlCrawlResult> {
  const normalized = rawUrl.trim().replace(/\/$/, "");
  const parsed = new URL(normalized);
  const host = parsed.hostname;

  const homeHtml = (await fetchText(normalized)) || "";
  const title =
    extractMetaContent(homeHtml, "og:title") ||
    homeHtml.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() ||
    host;
  const description =
    extractMetaContent(homeHtml, "og:description") ||
    extractMetaContent(homeHtml, "description") ||
    "";
  const canonicalUrl = extractCanonical(homeHtml, normalized);
  const headings = extractHeadings(homeHtml);
  const structuredData = extractJsonLd(homeHtml);
  const internalFromHome = extractInternalLinks(homeHtml, normalized, host);
  const sitemapUrls = await collectSitemapUrls(normalized);

  const pageUrlSet = new Set<string>([normalized, ...sitemapUrls, ...internalFromHome]);
  const pages: Array<{ url: string; title: string }> = [];

  for (const pageUrl of [...pageUrlSet].slice(0, PAGE_LIMIT)) {
    let pageTitle = pageUrl;
    if (pageUrl === normalized) {
      pageTitle = title;
    } else {
      const html = await fetchText(pageUrl, 12000);
      if (html) {
        pageTitle =
          extractMetaContent(html, "og:title") ||
          html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() ||
          new URL(pageUrl).pathname.split("/").filter(Boolean).pop() ||
          pageUrl;
      }
    }
    pages.push({ url: pageUrl, title: String(pageTitle).slice(0, 200) });
  }

  const keywords = [
    ...new Set(
      [...description.split(/\W+/), ...title.split(/\W+/)]
        .map((w) => w.toLowerCase())
        .filter((w) => w.length >= 4 && w.length <= 32),
    ),
  ].slice(0, 20);

  const audienceSignals = headings.slice(0, 8);

  return {
    url: normalized,
    title,
    description,
    canonicalUrl,
    headings,
    structuredData,
    pages,
    audienceSignals,
    keywords,
  };
}
