import { defaultFeedShieldRules } from "@/lib/clutety/feed-shield-engine";
import {
  FEED_SHIELD_STORAGE_KEY,
  FEED_SHIELD_STORAGE_KEY_LEGACY,
  type FeedShieldRules,
  type PlatformId,
} from "@/lib/clutety/feed-shield-types";

function migrateLegacy(raw: Record<string, unknown>): FeedShieldRules {
  const base = defaultFeedShieldRules();
  const platforms = { ...base.platforms, ...(raw.platforms as Record<PlatformId, boolean>) };
  return {
    ...base,
    enabled: raw.enabled !== false,
    platforms,
    categories: { ...base.categories, ...(raw.categories as Record<string, boolean>) },
    keywords: Array.isArray(raw.keywords) ? (raw.keywords as string[]) : [],
    blockedPeople: [],
  };
}

export function loadFeedShieldRules(): FeedShieldRules {
  if (typeof window === "undefined") return defaultFeedShieldRules();
  try {
    const v2 = localStorage.getItem(FEED_SHIELD_STORAGE_KEY);
    if (v2) {
      const parsed = JSON.parse(v2) as FeedShieldRules;
      return { ...defaultFeedShieldRules(), ...parsed, version: 2 };
    }
    const legacy = localStorage.getItem(FEED_SHIELD_STORAGE_KEY_LEGACY);
    if (legacy) {
      const migrated = migrateLegacy(JSON.parse(legacy) as Record<string, unknown>);
      saveFeedShieldRules(migrated);
      return migrated;
    }
  } catch {
    /* ignore */
  }
  return defaultFeedShieldRules();
}

export function saveFeedShieldRules(rules: FeedShieldRules): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FEED_SHIELD_STORAGE_KEY, JSON.stringify({ ...rules, version: 2 as const }));
}

export function exportFeedShieldRulesJson(rules: FeedShieldRules): string {
  return JSON.stringify(rules, null, 2);
}
