/** Feed Shield — cross-platform feed filtering (metadata + transcripts). */

export type PlatformId =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "x"
  | "reddit"
  | "facebook"
  | "linkedin"
  | "threads"
  | "snapchat"
  | "pinterest"
  | "bluesky";

export type BlockedPerson = {
  id: string;
  displayName: string;
  /** Alternate spellings, handles, last names — matched in title, description, transcript, tags. */
  aliases: string[];
  blockAllMentions: boolean;
  addedAt: number;
};

export type FeedShieldRules = {
  version: 2;
  enabled: boolean;
  platforms: Record<PlatformId, boolean>;
  categories: Record<string, boolean>;
  keywords: string[];
  blockedPeople: BlockedPerson[];
  /** When true, also match mentions in channel/creator names. */
  scanChannelNames: boolean;
  /** When true, run transcript text through the same rules. */
  analyzeTranscripts: boolean;
};

export type FeedItemInput = {
  platform: PlatformId;
  title?: string;
  description?: string;
  transcript?: string;
  channel?: string;
  tags?: string[];
  url?: string;
};

export type FeedAnalysisMatch = {
  type: "person" | "keyword" | "category";
  label: string;
  snippet?: string;
};

export type FeedAnalysisResult = {
  action: "block" | "allow";
  confidence: number;
  reasons: string[];
  matches: FeedAnalysisMatch[];
  scannedFields: string[];
  platform: PlatformId;
};

export const FEED_SHIELD_STORAGE_KEY = "clutety-feed-shield-v2";
export const FEED_SHIELD_STORAGE_KEY_LEGACY = "clutety-feed-shield-v1";

export const PLATFORM_LABELS: Record<PlatformId, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  x: "X (Twitter)",
  reddit: "Reddit",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  threads: "Threads",
  snapchat: "Snapchat",
  pinterest: "Pinterest",
  bluesky: "Bluesky",
};

export const CATEGORY_DEFS = [
  { id: "violence", label: "Violence & gore" },
  { id: "adult", label: "Adult content" },
  { id: "gambling", label: "Gambling & betting" },
  { id: "politics", label: "Political rage-bait" },
  { id: "scams", label: "Scams & crypto pumps" },
  { id: "sensational", label: "Sensational / clickbait" },
  { id: "celebrity_gossip", label: "Celebrity gossip & drama" },
  { id: "tragedy", label: "Tragedy & breaking bad news" },
] as const;
