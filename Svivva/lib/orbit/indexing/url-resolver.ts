import { getSiteUrl } from "@/lib/site-url";
import type { ResolveUrlsInput } from "./index-types";

const INDEXABLE_ENTITY_TYPES = new Set([
  "page",
  "release",
  "article",
  "product",
  "seed_app",
  "api",
  "tool",
]);

function normalizeUrl(raw: string, baseUrl: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return new URL(trimmed).href.replace(/\/$/, "") || trimmed;
    }
    const base = baseUrl.replace(/\/$/, "");
    const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return new URL(path, `${base}/`).href.replace(/\/$/, "") || null;
  } catch {
    return null;
  }
}

/** Resolve indexable URLs from graph entities, targets, and content assets. */
export function resolveIndexUrls(input: ResolveUrlsInput, baseUrl?: string): string[] {
  const base = (baseUrl || getSiteUrl()).replace(/\/$/, "");
  const urls = new Set<string>();

  for (const url of input.explicitUrls || []) {
    const normalized = normalizeUrl(url, base);
    if (normalized) urls.add(normalized);
  }

  for (const url of input.contentAssetUrls || []) {
    const normalized = normalizeUrl(url, base);
    if (normalized) urls.add(normalized);
  }

  const targetIds = new Set(input.targetEntityIds || []);
  for (const entity of input.entities) {
    if (!entity.url) continue;
    if (targetIds.size > 0 && !targetIds.has(entity.id)) continue;
    if (targetIds.size === 0 && !INDEXABLE_ENTITY_TYPES.has(entity.entityType)) continue;
    const normalized = normalizeUrl(entity.url, base);
    if (normalized) urls.add(normalized);
  }

  return [...urls].sort();
}
