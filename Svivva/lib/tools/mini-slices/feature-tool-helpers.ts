/** Pure helpers for indexable one-job feature mini-apps (no React). */

export function scoreOrbitIndexUrls(raw: string): {
  urls: string[];
  httpsOk: number;
  uniqueHosts: string[];
  tips: string[];
} {
  const urls = raw
    .split(/[\s,]+/)
    .map((u) => u.trim())
    .filter((u) => /^https?:\/\//i.test(u));
  const httpsOk = urls.filter((u) => u.toLowerCase().startsWith("https://")).length;
  const hosts = [
    ...new Set(
      urls.map((u) => {
        try {
          return new URL(u).hostname;
        } catch {
          return "";
        }
      }),
    ),
  ].filter(Boolean);
  const tips: string[] = [];
  if (urls.length === 0) tips.push("Paste at least one absolute http(s) URL.");
  if (urls.length > 0 && httpsOk < urls.length) tips.push("Prefer https:// for Search Console and IndexNow.");
  if (hosts.length > 1) tips.push("Keep one canonical host per IndexNow batch when possible.");
  if (urls.length > 0 && httpsOk === urls.length && hosts.length === 1) {
    tips.push("Ready for a small IndexNow / GSC batch — Orbit can automate the rest.");
  }
  return { urls, httpsOk, uniqueHosts: hosts, tips };
}

export function estimateBomLine(qty: number, unitCost: number): number {
  if (!Number.isFinite(qty) || !Number.isFinite(unitCost)) return 0;
  return Math.max(0, qty) * Math.max(0, unitCost);
}

export function sketchApiEndpoint(job: string): { method: string; path: string; note: string } {
  const text = job.trim().toLowerCase();
  let method = "POST";
  if (/\b(get|list|fetch|read|show)\b/.test(text)) method = "GET";
  if (/\b(update|patch|edit)\b/.test(text)) method = "PATCH";
  if (/\b(delete|remove)\b/.test(text)) method = "DELETE";
  const tokens = text
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !["the", "and", "for", "with", "from", "into"].includes(t))
    .slice(0, 4);
  const path = `/v1/${tokens.join("-") || "action"}`;
  return {
    method,
    path,
    note: "Sketch only — API Builder adds schema guards, deploy, and rollback.",
  };
}

export function scoreIdeaGap(args: {
  problemClarity: number;
  audienceSize: number;
  differentiation: number;
}): { total: number; label: string } {
  const clamp = (n: number) => Math.min(10, Math.max(0, Math.round(n)));
  const p = clamp(args.problemClarity);
  const a = clamp(args.audienceSize);
  const d = clamp(args.differentiation);
  const total = Math.round((p * 0.4 + a * 0.3 + d * 0.3) * 10) / 10;
  let label = "Needs sharpening";
  if (total >= 8) label = "Strong gap signal";
  else if (total >= 6) label = "Promising — validate next";
  else if (total >= 4) label = "Thin — tighten the wedge";
  return { total, label };
}

export function testLaunchHeadline(headline: string): {
  chars: number;
  words: number;
  tips: string[];
  score: number;
} {
  const trimmed = headline.trim();
  const chars = trimmed.length;
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const tips: string[] = [];
  let score = 70;
  if (chars < 20) {
    tips.push("Too short — add a concrete outcome.");
    score -= 20;
  } else if (chars > 70) {
    tips.push("Over ~70 characters can truncate in ads and SERPs.");
    score -= 15;
  } else {
    tips.push("Length looks landing-friendly.");
    score += 10;
  }
  if (!/[a-z]/i.test(trimmed)) {
    tips.push("Add readable words, not only symbols.");
    score -= 20;
  }
  if (/\b(free|fast|ship|build|launch|seo|api)\b/i.test(trimmed)) {
    tips.push("Benefit keyword present — good.");
    score += 5;
  }
  return { chars, words, tips, score: Math.max(0, Math.min(100, score)) };
}

export function buildUtmUrl(args: {
  baseUrl: string;
  source: string;
  medium: string;
  campaign: string;
}): string | null {
  try {
    const u = new URL(args.baseUrl.trim());
    if (args.source.trim()) u.searchParams.set("utm_source", args.source.trim());
    if (args.medium.trim()) u.searchParams.set("utm_medium", args.medium.trim());
    if (args.campaign.trim()) u.searchParams.set("utm_campaign", args.campaign.trim());
    return u.toString();
  } catch {
    return null;
  }
}

export function extractKeywordScan(text: string, limit = 8): { word: string; count: number }[] {
  const stop = new Set([
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "from",
    "your",
    "have",
    "are",
    "was",
    "were",
    "you",
    "our",
    "not",
    "but",
    "can",
    "will",
    "just",
    "into",
    "about",
  ]);
  const counts = new Map<string, number>();
  for (const raw of text.toLowerCase().match(/[a-z][a-z0-9-]{2,}/g) ?? []) {
    if (stop.has(raw)) continue;
    counts.set(raw, (counts.get(raw) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
    .slice(0, limit);
}

export function pulseConversionRate(visits: number, conversions: number): number | null {
  if (!Number.isFinite(visits) || !Number.isFinite(conversions) || visits <= 0) return null;
  return Math.round((Math.max(0, conversions) / visits) * 10000) / 100;
}

export function sketchHypothesisPair(a: string, b: string): string {
  const left = a.trim() || "Component A";
  const right = b.trim() || "Component B";
  return `${left} × ${right} — Crest hypothesis: fuse interfaces, share power budget, ship one BOM line.`;
}

export const EDU_ADVOCACY_SITUATIONS: { id: string; label: string; nextStep: string; href: string }[] =
  [
    {
      id: "understand",
      label: "I need to understand my rights",
      nextStep: "Start with Student Rights & Law for jurisdiction-aware information (not legal advice).",
      href: "/dashboard/education-advocacy/rights",
    },
    {
      id: "document",
      label: "I need to document what happened",
      nextStep: "Open Protect My Education to build a guided case timeline.",
      href: "/dashboard/education-advocacy/protect",
    },
    {
      id: "evidence",
      label: "I need to seal evidence",
      nextStep: "Use the Education Proof Vault for chain-of-custody packages.",
      href: "/dashboard/education-advocacy/vault",
    },
    {
      id: "crisis",
      label: "I need help right now",
      nextStep: "Use I Need Help Now for verified crisis routing — call 988 if you are in immediate danger.",
      href: "/dashboard/education-advocacy/crisis",
    },
    {
      id: "human",
      label: "I need a human advocate",
      nextStep: "Open Human Assistance for counselor / legal-aid style referrals.",
      href: "/dashboard/education-advocacy/help",
    },
  ];

export const SECURITY_POSTURE_QUESTIONS: { id: string; label: string }[] = [
  { id: "https", label: "Site serves HTTPS everywhere" },
  { id: "headers", label: "Security headers (CSP / HSTS) are configured" },
  { id: "secrets", label: "No API keys or tokens in public repos" },
  { id: "deps", label: "Dependencies are scanned on a schedule" },
  { id: "backup", label: "Incident / restore plan exists" },
];

export function scoreSecurityPosture(answers: Record<string, boolean>): {
  yes: number;
  total: number;
  percent: number;
  label: string;
} {
  const total = SECURITY_POSTURE_QUESTIONS.length;
  const yes = SECURITY_POSTURE_QUESTIONS.filter((q) => answers[q.id]).length;
  const percent = Math.round((yes / total) * 100);
  let label = "High risk — start with free cyber mini-apps";
  if (percent >= 80) label = "Solid baseline — deepen with Clutety / Security";
  else if (percent >= 40) label = "Partial coverage — close the gaps next";
  return { yes, total, percent, label };
}

export const PROJECT_EVAL_ITEMS: { id: string; label: string }[] = [
  { id: "version", label: "Prompt has a named version" },
  { id: "eval", label: "At least one eval case exists" },
  { id: "schema", label: "Output schema is defined" },
  { id: "rollback", label: "Previous version can be restored" },
  { id: "owner", label: "Owner is assigned for regressions" },
];
