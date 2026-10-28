export type DisclosureRiskHit = {
  phrase: string;
  severity: "high" | "medium";
  guidance: string;
};

const PATTERNS: Array<{ re: RegExp; phrase: string; severity: "high" | "medium" }> = [
  { re: /\b(post(ing)?|posted)\b.*\b(online|instagram|tiktok|youtube|twitter|x\.com|linkedin)\b/i, phrase: "public posting", severity: "high" },
  { re: /\b(publish|published|publishing)\b/i, phrase: "publishing", severity: "high" },
  { re: /\b(demo(nstrate|nstration|ing)?|show(n|ing)?\s+at\s+(a\s+)?(trade|fair|conference))\b/i, phrase: "public demonstration", severity: "high" },
  { re: /\b(sell(ing)?|sold|offer(ing)?\s+for\s+sale|crowdfund)\b/i, phrase: "sale / offer for sale", severity: "high" },
  { re: /\b(disclose|disclosed|disclosure|publicly\s+share)\b/i, phrase: "public disclosure", severity: "high" },
  { re: /\b(kickstarter|indiegogo|product\s+hunt)\b/i, phrase: "crowdfunding / launch platforms", severity: "medium" },
  { re: /\b(open[- ]source|github\s+public)\b/i, phrase: "open-source release", severity: "medium" },
];

export function scanDisclosureRisk(text: string): DisclosureRiskHit[] {
  if (!text.trim()) return [];
  const hits: DisclosureRiskHit[] = [];
  for (const p of PATTERNS) {
    if (p.re.test(text)) {
      hits.push({
        phrase: p.phrase,
        severity: p.severity,
        guidance:
          p.severity === "high"
            ? "Public disclosure, sale, or demonstration can limit patent rights in many jurisdictions (including grace-period nuances in the U.S.). Record dates carefully and consult qualified IP counsel before further disclosure."
            : "This activity may count as a public disclosure depending on jurisdiction. Prefer private documentation first; ask counsel before launching publicly.",
      });
    }
  }
  // de-dupe by phrase
  const seen = new Set<string>();
  return hits.filter((h) => {
    if (seen.has(h.phrase)) return false;
    seen.add(h.phrase);
    return true;
  });
}

export const DISCLOSURE_RISK_BANNER =
  "Cube Protect does not publish or share your invention. Disclosure risk alerts are informational — not legal advice. Patent rights differ by jurisdiction; consult a licensed attorney.";
