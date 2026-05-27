/**
 * Clutety Feed Shield matcher (synced with Svivva lib/clutety/feed-shield-engine.ts)
 * @typedef {{ id: string, displayName: string, aliases: string[], blockAllMentions: boolean }} BlockedPerson
 * @typedef {{ enabled: boolean, platforms: Record<string, boolean>, categories: Record<string, boolean>, keywords: string[], blockedPeople: BlockedPerson[], scanChannelNames: boolean, analyzeTranscripts: boolean }} FeedShieldRules
 */

const CATEGORY_PHRASES = {
  violence: ["murder", "killed", "shooting", "stabbing", "gore", "graphic violence", "war crime", "massacre"],
  adult: ["onlyfans", "nsfw", "explicit", "porn", "xxx", "nude leak"],
  gambling: ["sportsbook", "bet now", "casino", "crypto pump", "100x", "get rich quick"],
  politics: ["breaking: trump", "breaking: biden", "culture war", "owned the libs", "election fraud", "woke mob"],
  scams: ["giveaway scam", "send bitcoin", "verify your wallet", "free iphone click"],
  sensational: ["you won't believe", "gone wrong", "shocking truth", "what happened next"],
  celebrity_gossip: ["breakup", "cheating", "feud", "drama", "exposed", "leaked texts", "plastic surgery"],
  tragedy: ["dead at", "dies at", "found dead", "fatal crash", "shooting victim", "obituary"],
};

function normalizeText(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s@#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textContainsPhrase(haystack, phrase) {
  const p = normalizeText(phrase);
  if (!p || p.length < 2) return false;
  const h = ` ${normalizeText(haystack)} `;
  if (p.includes(" ")) return h.includes(` ${p} `);
  const re = new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  return re.test(normalizeText(haystack));
}

function matchPerson(person, corpus) {
  const terms = [person.displayName, ...(person.aliases || [])].filter(Boolean);
  for (const term of terms) {
    if (textContainsPhrase(corpus, term)) {
      return { type: "person", label: person.displayName, snippet: term };
    }
  }
  return null;
}

/**
 * @param {{ platform: string, title?: string, description?: string, transcript?: string, channel?: string, tags?: string[] }} item
 * @param {FeedShieldRules} rules
 */
function analyzeFeedItem(item, rules) {
  if (!rules?.enabled) return { action: "allow", reasons: ["disabled"], matches: [] };
  if (!rules.platforms?.[item.platform]) return { action: "allow", reasons: ["platform off"], matches: [] };

  const parts = [];
  if (item.title) parts.push(item.title);
  if (item.description) parts.push(item.description);
  if (rules.analyzeTranscripts && item.transcript) parts.push(item.transcript);
  if (rules.scanChannelNames && item.channel) parts.push(item.channel);
  if (item.tags?.length) parts.push(item.tags.join(" "));

  const corpus = parts.join("\n");
  if (!corpus.trim()) return { action: "allow", reasons: [], matches: [] };

  const matches = [];
  const reasons = [];

  for (const person of rules.blockedPeople || []) {
    if (!person.blockAllMentions) continue;
    const m = matchPerson(person, corpus);
    if (m) {
      matches.push(m);
      reasons.push(`Blocked person: ${person.displayName}`);
    }
  }

  for (const kw of rules.keywords || []) {
    if (textContainsPhrase(corpus, kw)) {
      matches.push({ type: "keyword", label: kw });
      reasons.push(`Keyword: ${kw}`);
    }
  }

  for (const [catId, enabled] of Object.entries(rules.categories || {})) {
    if (!enabled) continue;
    const phrases = CATEGORY_PHRASES[catId];
    if (!phrases) continue;
    for (const phrase of phrases) {
      if (textContainsPhrase(corpus, phrase)) {
        matches.push({ type: "category", label: catId });
        reasons.push(`Category: ${catId}`);
        break;
      }
    }
  }

  return {
    action: matches.length ? "block" : "allow",
    reasons,
    matches,
  };
}

globalThis.ClutetyMatcher = { analyzeFeedItem, textContainsPhrase };
