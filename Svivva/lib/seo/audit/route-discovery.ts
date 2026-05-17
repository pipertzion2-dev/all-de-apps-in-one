import { readdir, stat } from "node:fs/promises";
import path from "node:path";

export type RouteKind = "static" | "dynamic" | "api" | "layout" | "group";

export type DiscoveredRoute = {
  path: string;
  file: string;
  kind: RouteKind;
  segment: string;
};

const APP_ROOT = path.join(process.cwd(), "app");

const SKIP_SEGMENTS = new Set(["api", "favicon.ico"]);

const NOINDEX_PREFIXES = [
  "/dashboard",
  "/api",
  "/gate",
  "/play",
  "/playground",
  "/test",
  "/badge",
  "/api-card",
];

const DISALLOWED_IN_ROBOTS = ["/dashboard", "/api", "/_next", "/gate", "/play"];

function segmentToPath(parts: string[]): string {
  const filtered = parts.filter((p) => !p.startsWith("(") && !p.startsWith("@"));
  if (filtered.length === 0) return "/";
  return `/${filtered.join("/")}`;
}

function classifySegment(seg: string): RouteKind {
  if (seg.startsWith("[") && seg.endsWith("]")) return "dynamic";
  return "static";
}

async function walkAppDir(
  dir: string,
  segments: string[],
  routes: DiscoveredRoute[],
): Promise<void> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return;
  }

  for (const name of entries) {
    const full = path.join(dir, name);
    const st = await stat(full);
    if (st.isDirectory()) {
      if (SKIP_SEGMENTS.has(name)) {
        if (name === "api") {
          routes.push({
            path: segmentToPath([...segments, "api", "*"]),
            file: full,
            kind: "api",
            segment: "api",
          });
        }
        continue;
      }
      await walkAppDir(full, [...segments, name], routes);
      continue;
    }

    if (name === "page.tsx" || name === "page.ts") {
      const routePath = segmentToPath(segments);
      const lastSeg = segments[segments.length - 1] ?? "";
      routes.push({
        path: routePath,
        file: full,
        kind: classifySegment(lastSeg),
        segment: lastSeg,
      });
    } else if (name === "route.ts" || name === "route.tsx") {
      const apiPath = `/api${segmentToPath(segments.slice(1))}`;
      routes.push({
        path: apiPath,
        file: full,
        kind: "api",
        segment: segments[segments.length - 1] ?? "api",
      });
    }
  }
}

export async function discoverAppRoutes(): Promise<DiscoveredRoute[]> {
  const routes: DiscoveredRoute[] = [];
  await walkAppDir(APP_ROOT, [], routes);
  return routes.sort((a, b) => a.path.localeCompare(b.path));
}

export function isNoindexPath(routePath: string): boolean {
  return NOINDEX_PREFIXES.some((p) => routePath === p || routePath.startsWith(`${p}/`));
}

export function isRobotsDisallowed(routePath: string): boolean {
  return DISALLOWED_IN_ROBOTS.some((p) => routePath === p || routePath.startsWith(`${p}/`));
}

export function isCrawlablePublicPath(routePath: string): boolean {
  if (isNoindexPath(routePath)) return false;
  if (routePath.includes("[") || routePath.includes("*")) return false;
  return true;
}
