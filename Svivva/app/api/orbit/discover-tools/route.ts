import { NextResponse, NextRequest } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { openai, DEFAULT_MODEL } from "@/lib/llm/openai";

export const maxDuration = 90;

// ── Helpers ───────────────────────────────────────────────────────────────────

const SKIP_PATHS = new Set([
  "/",
  "/home",
  "/index",
  "/about",
  "/contact",
  "/login",
  "/logout",
  "/register",
  "/signup",
  "/signin",
  "/privacy",
  "/terms",
  "/tos",
  "/blog",
  "/docs",
  "/documentation",
  "/help",
  "/faq",
  "/support",
  "/settings",
  "/profile",
  "/dashboard",
  "/account",
  "/404",
  "/500",
  "/sitemap",
  "/robots",
  "/pricing",
  "/plans",
  "/upgrade",
  "/changelog",
  "/tools",
  "/apps",
  "/features",
  "/categories",
  "/search",
]);

// Path PREFIXES that should be filtered (blog posts, comparison pages, etc.)
const SKIP_PREFIXES = [
  "/blog/",
  "/svivva-vs-",
  "/tools/best-",
  "/tools/build-",
  "/tools/cheapest-",
  "/tools/enforce-",
];

// Endings that confirm a slug is a real tool (used only for JS-bundle extraction)
const TOOL_ENDINGS = [
  // Security/scan
  "-checker",
  "-scanner",
  "-tester",
  "-inspector",
  "-detector",
  "-analyzer",
  "-validator",
  "-auditor",
  "-grader",
  "-monitor",
  "-profiler",
  // Data / encode / decode
  "-decoder",
  "-encoder",
  "-parser",
  "-formatter",
  "-converter",
  "-extractor",
  "-viewer",
  "-reader",
  "-diff",
  // Generate / build
  "-generator",
  "-builder",
  "-maker",
  "-creator",
  "-composer",
  "-planner",
  "-simulator",
  "-sandbox",
  "-studio",
  // Look up / find
  "-lookup",
  "-finder",
  "-tracker",
  "-searcher",
  "-mapper",
  "-explorer",
  // Compute / calculate
  "-calculator",
  "-estimator",
  "-predictor",
  "-ranker",
  "-optimizer",
  // Run / test
  "-runner",
  "-tester",
  "-debugger",
  "-linter",
  "-evaluator",
  // Misc tool words
  "-tool",
  "-toolkit",
  "-audit",
  "-test",
  "-check",
  "-scan",
  "-hub",
  "-labs",
  "-reporter",
  "-harvester",
  "-comparator",
  // Cybersecurity specific
  "-payload",
  "-fuzzer",
  "-sniffer",
  "-injector",
  "-cracker",
  "-bruteforcer",
  "-recon",
  "-enumarator",
];

function isToolSlug(s: string): boolean {
  if (!s.includes("-")) return false;
  if (s.length < 5 || s.length > 80) return false;
  if (/^\d/.test(s)) return false;
  // Must end with a known tool-type word (filters out aria-label, content-type, etc.)
  return TOOL_ENDINGS.some((e) => s.endsWith(e));
}

function isGenericPath(p: string): boolean {
  const clean = p.toLowerCase().split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
  if (SKIP_PATHS.has(clean)) return true;
  if (SKIP_PREFIXES.some((prefix) => clean.startsWith(prefix))) return true;
  // Filter comparison pages, lp pages, article-style slugs
  if (/\/svivva-vs-/.test(clean)) return true;
  if (/\/best-[a-z]/.test(clean)) return true;
  if (/\.(xml|txt|ico|png|jpg|jpeg|svg|css|js|json|webp|woff|woff2|mp4|pdf)$/i.test(clean))
    return true;
  if (/^\/\d+$/.test(clean)) return true;
  return false;
}

function pathToName(p: string): string {
  const segs = p.split("/").filter(Boolean);
  const last = segs[segs.length - 1] || p;
  return last
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function extractMetaContent(html: string, attr: string): string {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${attr}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const m =
    html.match(re) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']description["']/i);
  return m?.[1] || "";
}

function extractTitle(html: string): string {
  return html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() || "";
}

function extractBundleUrl(html: string, baseUrl: string): string | null {
  const m = html.match(/src="(\/assets\/[^"]+\.js)"/);
  return m ? `${baseUrl}${m[1]}` : null;
}

function isViteSpa(html: string): boolean {
  return /src="\/assets\/[^"]+\.js"/.test(html) && /<div id="root">/.test(html);
}

function extractSlugsFromBundle(bundle: string): string[] {
  const slugSet = new Set<string>();
  const strRe = /"([a-z][a-z0-9-]{4,68})"/g;
  let m: RegExpExecArray | null;
  while ((m = strRe.exec(bundle)) !== null) {
    if (isToolSlug(m[1])) slugSet.add(m[1]);
  }
  return [...slugSet];
}

function detectRoutePrefix(bundle: string): string {
  for (const pattern of [
    /path:["'](\/tools?)\/:/,
    /path:["'](\/apps?)\/:/,
    /to:["'](\/tools?)\/[a-z]/,
    /"(\/tools?)\/[a-z][a-z-]+"/,
  ]) {
    const m = bundle.match(pattern);
    if (m) return m[1];
  }
  return "/tool";
}

// Slug-aware deduplication: prefer cross-domain (e.g. svivva.com) URLs over Repl URLs for the same slug
function dedupeTools(
  tools: { name: string; url: string; description: string }[],
  replHost: string,
): { name: string; url: string; description: string }[] {
  // Build a map from slug → best tool entry (prefer non-Repl domain)
  const bySlug = new Map<string, { name: string; url: string; description: string }>();
  const byUrl = new Map<string, { name: string; url: string; description: string }>();

  for (const t of tools) {
    // Exact URL dedupe
    if (byUrl.has(t.url)) continue;
    byUrl.set(t.url, t);

    // Slug dedupe: extract last meaningful path segment
    try {
      const slug = new URL(t.url).pathname.split("/").filter(Boolean).pop() || "";
      if (!slug) continue;
      const existing = bySlug.get(slug);
      if (!existing) {
        bySlug.set(slug, t);
      } else {
        // Prefer the entry whose URL is NOT on the Repl domain
        const existingHost = new URL(existing.url).hostname;
        const currentHost = new URL(t.url).hostname;
        if (existingHost === replHost && currentHost !== replHost) {
          bySlug.set(slug, t); // replace Repl URL with better URL
        }
      }
    } catch {
      /* skip */
    }
  }

  return [...bySlug.values()];
}

// ── Sitemap helpers ────────────────────────────────────────────────────────────

async function fetchSitemapXml(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": "Svivva-Orbit/1.0" },
      signal: AbortSignal.timeout(22000),
    });
    if (!r.ok) return null;
    const text = await r.text();
    const trimmed = text.trimStart();
    if (
      trimmed.startsWith("<?xml") ||
      trimmed.startsWith("<urlset") ||
      trimmed.startsWith("<sitemapindex")
    )
      return text;
    return null;
  } catch {
    return null;
  }
}

async function collectLocsFromSitemap(
  smUrl: string,
): Promise<{ locs: string[]; crossDomains: Set<string>; smHost: string }> {
  const smHost = (() => {
    try {
      return new URL(smUrl).hostname;
    } catch {
      return "";
    }
  })();
  const locs: string[] = [];
  const crossDomains = new Set<string>();

  const smText = await fetchSitemapXml(smUrl);
  if (!smText) return { locs, crossDomains, smHost };

  const allLocs = [...smText.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((m) => m[1].trim());

  // Sub-sitemap index: fetch child sitemaps
  const subUrls = [...smText.matchAll(/<sitemap>[\s\S]*?<loc>([^<]+)<\/loc>/gi)].map((m) =>
    m[1].trim(),
  );
  const subTexts = await Promise.all(subUrls.slice(0, 5).map((u) => fetchSitemapXml(u)));
  for (const subText of subTexts) {
    if (subText)
      allLocs.push(...[...subText.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((m) => m[1].trim()));
  }

  for (const loc of allLocs) {
    locs.push(loc);
    try {
      const h = new URL(loc).hostname;
      if (h && h !== smHost) crossDomains.add(h);
    } catch {
      /* skip */
    }
  }

  return { locs, crossDomains, smHost };
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    if (!(await isOrbitAdminAllowed(req)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const replUrl: string = (body.replUrl || "").trim().replace(/\/$/, "");
    if (!replUrl) return NextResponse.json({ error: "replUrl is required" }, { status: 400 });

    const replHost = (() => {
      try {
        return new URL(replUrl).hostname;
      } catch {
        return "";
      }
    })();
    const rawToolMap = new Map<string, { name: string; url: string; description: string }>();
    let source = "none";
    let homeHtml = "";
    let metaDescription = "";
    let pageTitle = "";

    function addTool(name: string, url: string, description = "") {
      if (!rawToolMap.has(url)) rawToolMap.set(url, { name, url, description });
    }

    // ── Step 1: Fetch homepage ────────────────────────────────────────────────
    try {
      const res = await fetch(replUrl, {
        headers: { "User-Agent": "Svivva-Orbit/1.0" },
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        homeHtml = await res.text();
        metaDescription = extractMetaContent(homeHtml, "description");
        pageTitle = extractTitle(homeHtml);
      }
    } catch {
      /* continue */
    }

    // ── Step 2: Sitemap ───────────────────────────────────────────────────────
    const { locs, crossDomains } = await collectLocsFromSitemap(`${replUrl}/sitemap.xml`);

    // Also pull in cross-domain sitemaps (e.g. when hub Repl points to svivva.com)
    const crossLocs: string[] = [];
    for (const crossHost of crossDomains) {
      const { locs: cLocs } = await collectLocsFromSitemap(`https://${crossHost}/sitemap.xml`);
      crossLocs.push(...cLocs);
    }

    const allSitemapLocs = [...locs, ...crossLocs];
    console.log(
      `[discover-tools] sitemap locs: ${locs.length}, cross-domain locs: ${crossLocs.length}`,
    );

    for (const loc of allSitemapLocs) {
      try {
        const parsed = new URL(loc);
        const path = parsed.pathname;
        if (!isGenericPath(path)) addTool(pathToName(path), loc);
      } catch {
        /* skip */
      }
    }
    if (rawToolMap.size > 0) source = "sitemap";

    // ── Step 3: JS bundle — ALWAYS run for Vite SPAs, merge with sitemap ─────
    if (homeHtml && isViteSpa(homeHtml)) {
      const bundleUrl = extractBundleUrl(homeHtml, replUrl);
      if (bundleUrl) {
        try {
          const res = await fetch(bundleUrl, {
            headers: { "User-Agent": "Svivva-Orbit/1.0" },
            signal: AbortSignal.timeout(20000),
          });
          if (res.ok) {
            const bundle = await res.text();
            const slugs = extractSlugsFromBundle(bundle);
            console.log(`[discover-tools] JS bundle slugs: ${slugs.length}`);
            if (slugs.length > 0) {
              const routePrefix = detectRoutePrefix(bundle);
              // For each slug: if we already have a cross-domain URL for it (e.g. svivva.com/slug),
              // prefer that — only add the Repl URL if no better URL exists yet
              for (const slug of slugs) {
                const replicUrl = `${replUrl}${routePrefix}/${slug}`;
                // Check if a cross-domain entry with this slug already exists
                const crossDomainMatch = [...rawToolMap.values()].find((t) => {
                  try {
                    return new URL(t.url).hostname !== replHost && t.url.endsWith(`/${slug}`);
                  } catch {
                    return false;
                  }
                });
                if (!crossDomainMatch) addTool(pathToName(`/${slug}`), replicUrl);
              }
              if (source === "none") source = "js-bundle";
              else source = "sitemap+bundle";
            }
          }
        } catch {
          /* continue */
        }
      }
    }

    // ── Step 4: HTML link extraction — always run to catch anything sitemap/bundle missed ──
    if (homeHtml) {
      const hrefRe = /href=["']([^"'#?]+)["']/gi;
      let m: RegExpExecArray | null;
      while ((m = hrefRe.exec(homeHtml)) !== null) {
        const raw = m[1].trim();
        if (!raw || raw.startsWith("javascript:") || raw.startsWith("mailto:")) continue;
        let full: string;
        if (raw.startsWith("http://") || raw.startsWith("https://")) {
          full = raw;
        } else if (raw.startsWith("/")) {
          try {
            full = new URL(raw, replUrl).href;
          } catch {
            continue;
          }
        } else continue;
        try {
          const parsed = new URL(full);
          if (parsed.hostname !== replHost) continue;
          if (!isGenericPath(parsed.pathname)) addTool(pathToName(parsed.pathname), full);
        } catch {
          /* skip */
        }
      }
      if (rawToolMap.size > 0 && source === "none") source = "html-links";
    }

    // ── Step 5: Dedupe by slug ────────────────────────────────────────────────
    const rawTools = [...rawToolMap.values()];
    const deduped = dedupeTools(rawTools, replHost).slice(0, 200);
    console.log(`[discover-tools] rawTools: ${rawTools.length}, deduped: ${deduped.length}`);

    // ── Step 6: AI enrichment ─────────────────────────────────────────────────
    if (deduped.length > 0) {
      const toEnrich = deduped.slice(0, 100);
      console.log(`[discover-tools] sending ${toEnrich.length} to AI`);
      try {
        const res = await openai.chat.completions.create({
          model: DEFAULT_MODEL,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `Enrich tool metadata. Return EXACTLY ${toEnrich.length} items — never fewer, never more.
Rules:
- Keep the original URL exactly as given — do NOT change or normalise it.
- Give each tool a human-readable name (2-5 words, title case).
- Write a 1-sentence description (max 12 words) of what the tool does.
- Do NOT merge, reorder, or skip any tool.
Return JSON: { "tools": [{ "name": string, "url": string, "description": string }] }`,
            },
            {
              role: "user",
              content: `${toEnrich.length} tools from ${replUrl}:\n${toEnrich
                .map((t, i) => `${i + 1}. ${t.name} | ${t.url}`)
                .join("\n")}`,
            },
          ],
        });
        const parsed = JSON.parse(res.choices[0].message.content || "{}");
        console.log(`[discover-tools] AI returned: ${parsed.tools?.length ?? 0}`);
        if (Array.isArray(parsed.tools) && parsed.tools.length > 0) {
          const enriched = parsed.tools
            .slice(0, toEnrich.length)
            .map((t: Record<string, string>, i: number) => ({
              name: t.name || toEnrich[i]?.name || "Tool",
              url: toEnrich[i]?.url || t.url, // always keep original URL
              description: t.description || "",
            }));
          const finalTools = [...enriched, ...deduped.slice(toEnrich.length)];
          return NextResponse.json({ tools: finalTools, source, count: finalTools.length });
        }
      } catch (e) {
        console.log(`[discover-tools] AI error: ${e}`);
      }

      return NextResponse.json({ tools: deduped, source, count: deduped.length });
    }

    // ── Step 7: AI fallback from meta description ─────────────────────────────
    if (metaDescription || pageTitle) {
      try {
        const res = await openai.chat.completions.create({
          model: DEFAULT_MODEL,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You are reading metadata from a mini-apps website. Generate a list of every tool the site offers.
Base each tool on what is actually mentioned. Never invent tools not implied by the description.
Return JSON: { "tools": [{ "name": string, "url": string, "description": string }] }`,
            },
            {
              role: "user",
              content: `Website: ${replUrl}\nTitle: ${pageTitle}\nMeta description: ${metaDescription}\n\nGenerate one entry per tool. URL pattern: ${replUrl}/tool/SLUG (kebab-case slug).`,
            },
          ],
        });
        const parsed = JSON.parse(res.choices[0].message.content || "{}");
        if (Array.isArray(parsed.tools) && parsed.tools.length > 0) {
          return NextResponse.json({
            tools: parsed.tools,
            source: "ai-meta",
            count: parsed.tools.length,
          });
        }
      } catch {
        /* fall through */
      }
    }

    // Extract a clean app name from the page title (strip taglines after " - ", " | ", " — ")
    const cleanAppName = pageTitle
      ? pageTitle
          .split(/\s[-|—]\s/)[0]
          .trim()
          .slice(0, 60)
      : "";

    return NextResponse.json({
      tools: [],
      source: "none",
      appName: cleanAppName,
      error:
        "No tools found. Make sure the URL is your live deployed Replit app and it's publicly accessible.",
    });
  } catch (e) {
    console.error("[discover-tools] fatal:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
