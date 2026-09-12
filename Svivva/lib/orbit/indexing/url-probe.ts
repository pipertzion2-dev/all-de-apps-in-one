import type { UrlProbeResult } from "./index-types";

/** Lightweight URL probe for Orbit index state machine (mirrors lib/seo/index-health). */
export async function probeIndexUrl(url: string, timeoutMs = 9000): Promise<UrlProbeResult> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "User-Agent": "Orbit-IndexProbe/1.0 (+https://zzaizzai.com)" },
      cache: "no-store",
    });

    const xRobots = (res.headers.get("x-robots-tag") || "").toLowerCase();
    let noindex = xRobots.includes("noindex");
    let notes = "";

    if (res.ok && !noindex) {
      const ct = (res.headers.get("content-type") || "").toLowerCase();
      if (ct.includes("text/html")) {
        const body = await res.text();
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
      notes = `HTTP ${res.status}`;
    }

    const reachable = res.ok;
    return {
      url,
      httpStatus: res.status,
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
