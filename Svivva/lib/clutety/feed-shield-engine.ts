import type {
  BlockedPerson,
  FeedAnalysisMatch,
  FeedAnalysisResult,
  FeedItemInput,
  FeedShieldRules,
  PlatformId,
} from "@/lib/clutety/feed-shield-types";

const CATEGORY_PHRASES: Record<string, string[]> = {
  violence: [
    "murder",
    "killed",
    "shooting",
    "stabbing",
    "gore",
    "graphic violence",
    "war crime",
    "massacre",
  ],
  adult: ["onlyfans", "nsfw", "explicit", "porn", "xxx", "nude leak"],
  gambling: ["sportsbook", "bet now", "casino", "crypto pump", "100x", "get rich quick"],
  politics: [
    "breaking: trump",
    "breaking: biden",
    "culture war",
    "owned the libs",
    "election fraud",
    "woke mob",
  ],
  scams: ["giveaway scam", "send bitcoin", "verify your wallet", "free iphone click"],
  sensational: ["you won't believe", "gone wrong", "shocking truth", "what happened next"],
  celebrity_gossip: [
    "breakup",
    "cheating",
    "feud",
    "drama",
    "exposed",
    "leaked texts",
    "plastic surgery",
  ],
  tragedy: ["dead at", "dies at", "found dead", "fatal crash", "shooting victim", "obituary"],
};

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s@#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Word-boundary match for names/phrases (handles multi-word aliases). */
function textContainsPhrase(haystack: string, phrase: string): boolean {
  const p = normalizeText(phrase);
  if (!p || p.length < 2) return false;
  const h = ` ${normalizeText(haystack)} `;
  if (p.includes(" ")) {
    return h.includes(` ${p} `);
  }
  const re = new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  return re.test(normalizeText(haystack));
}

function collectCorpus(
  item: FeedItemInput,
  rules: FeedShieldRules,
): { text: string; fields: string[] } {
  const parts: { key: string; value: string }[] = [];
  if (item.title) parts.push({ key: "title", value: item.title });
  if (item.description) parts.push({ key: "description", value: item.description });
  if (rules.analyzeTranscripts && item.transcript) {
    parts.push({ key: "transcript", value: item.transcript });
  }
  if (rules.scanChannelNames && item.channel) {
    parts.push({ key: "channel", value: item.channel });
  }
  if (item.tags?.length) parts.push({ key: "tags", value: item.tags.join(" ") });
  return {
    text: parts.map((p) => p.value).join("\n"),
    fields: parts.map((p) => p.key),
  };
}

function matchPerson(person: BlockedPerson, corpus: string): FeedAnalysisMatch | null {
  const terms = [person.displayName, ...person.aliases].filter(Boolean);
  for (const term of terms) {
    if (textContainsPhrase(corpus, term)) {
      return {
        type: "person",
        label: person.displayName,
        snippet: term,
      };
    }
  }
  return null;
}

export function analyzeFeedItem(item: FeedItemInput, rules: FeedShieldRules): FeedAnalysisResult {
  const reasons: string[] = [];
  const matches: FeedAnalysisMatch[] = [];

  if (!rules.enabled) {
    return {
      action: "allow",
      confidence: 1,
      reasons: ["Feed Shield is turned off"],
      matches: [],
      scannedFields: [],
      platform: item.platform,
    };
  }

  if (!rules.platforms[item.platform]) {
    return {
      action: "allow",
      confidence: 1,
      reasons: [`${item.platform} is not in your protected platform list`],
      matches: [],
      scannedFields: [],
      platform: item.platform,
    };
  }

  const { text: corpus, fields } = collectCorpus(item, rules);

  if (!corpus.trim()) {
    return {
      action: "allow",
      confidence: 0.5,
      reasons: ["No title, description, or transcript to analyze"],
      matches: [],
      scannedFields: fields,
      platform: item.platform,
    };
  }

  for (const person of rules.blockedPeople) {
    if (!person.blockAllMentions) continue;
    const m = matchPerson(person, corpus);
    if (m) {
      matches.push(m);
      reasons.push(`Blocked person: ${person.displayName}`);
    }
  }

  for (const kw of rules.keywords) {
    if (textContainsPhrase(corpus, kw)) {
      matches.push({ type: "keyword", label: kw, snippet: kw });
      reasons.push(`Blocked keyword: "${kw}"`);
    }
  }

  for (const [catId, enabled] of Object.entries(rules.categories)) {
    if (!enabled) continue;
    const phrases = CATEGORY_PHRASES[catId];
    if (!phrases) continue;
    for (const phrase of phrases) {
      if (textContainsPhrase(corpus, phrase)) {
        matches.push({ type: "category", label: catId, snippet: phrase });
        reasons.push(`Blocked category: ${catId.replace(/_/g, " ")}`);
        break;
      }
    }
  }

  const uniqueReasons = [...new Set(reasons)];
  const blocked = matches.length > 0;
  const confidence = blocked ? Math.min(0.98, 0.55 + matches.length * 0.12) : 0.85;

  return {
    action: blocked ? "block" : "allow",
    confidence,
    reasons: blocked ? uniqueReasons : ["No blocked people, keywords, or categories matched"],
    matches,
    scannedFields: fields,
    platform: item.platform,
  };
}

export function defaultFeedShieldRules(): FeedShieldRules {
  const platforms = Object.keys({
    youtube: true,
    tiktok: true,
    instagram: true,
    x: true,
    reddit: true,
    facebook: true,
    linkedin: true,
    threads: true,
    snapchat: true,
    pinterest: true,
    bluesky: true,
  }) as PlatformId[];

  return {
    version: 2,
    enabled: true,
    platforms: Object.fromEntries(platforms.map((p) => [p, true])) as Record<PlatformId, boolean>,
    categories: Object.fromEntries(
      Object.keys(CATEGORY_PHRASES).map((id) => [id, ["violence", "adult", "scams"].includes(id)]),
    ),
    keywords: [],
    blockedPeople: [],
    scanChannelNames: true,
    analyzeTranscripts: true,
  };
}
