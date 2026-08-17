/**
 * 2026 hybrid GTM playbooks for ZZAI + Orbit — PLG entry, sales-assisted expansion,
 * answer-shaped SEO, and channel-intel loops.
 */
import { ADMIN_DEFAULT_YOUTUBE_HANDLE } from "@/lib/marketing/youtube-defaults";

export type HybridGtmMotion = "plg" | "pls" | "clg" | "aeo" | "funnel";

export type HybridGtmStrategy = {
  id: string;
  title: string;
  motion: HybridGtmMotion;
  summary: string;
  whyItWorks: string;
  zzaiActions: string[];
  orbitTaskIds?: string[];
  metrics: string[];
};

export const HYBRID_GTM_STRATEGIES: HybridGtmStrategy[] = [
  {
    id: "hybrid-pls",
    title: "Hybrid PLG + Product-Led Sales",
    motion: "pls",
    summary:
      "Let founders self-serve Seeds, free mini-apps, and Security tools — then nudge high-intent users when they hit usage thresholds.",
    whyItWorks:
      "2026 benchmarks show sales-assisted product-qualified leads convert at 25–35% vs cold outbound; hybrid motions dominate $5K–$50K ACV SaaS.",
    zzaiActions: [
      "Free /tools and /cyber-security-mini-apps with signup CTA after value",
      "Track seed builds, security scans, and channel-intel queries as PQL signals",
      "Offer Stripe checkout when users deploy 2+ seeds or run 5+ security scans",
    ],
    orbitTaskIds: ["content-seo-pages", "content-comparisons", "content-usecases"],
    metrics: ["PQL count", "trial→paid %", "CAC payback < 15 mo"],
  },
  {
    id: "answer-shaped-aeo",
    title: "Answer-shaped content (AEO + SEO)",
    motion: "aeo",
    summary:
      "Publish direct, citable answers — not keyword fluff — so Google and AI overviews quote ZZAI for builder and security queries.",
    whyItWorks:
      "Buyers research on Google, ChatGPT, and Perplexity; structured Q&A pages win citations and compress consideration cycles.",
    zzaiActions: [
      "Orbit AEO + PAA pages with step lists and schema.org FAQ",
      "Lead with outcomes: “Build an AI API in 10 minutes” not feature dumps",
      "Cross-link /ai-tools-hub tools to /dashboard/security and /seeds",
    ],
    orbitTaskIds: ["content-aeo", "content-paa", "tech-schema-jsonld"],
    metrics: ["AI overview citations", "non-brand organic clicks", "tool→signup rate"],
  },
  {
    id: "free-tools-funnel",
    title: "Free tools → Security Center → paid",
    motion: "funnel",
    summary:
      "Cyber mini-apps and YouTube caption preview drive organic traffic; Security Center and Seeds convert visitors into builders.",
    whyItWorks:
      "Utility SEO compounds — each indexed tool is a landing page with built-in product demo.",
    zzaiActions: [
      "Index 40+ security mini-apps + AI Tools Hub variants via Orbit",
      "CTA from free tools to /dashboard/security and /seeds",
      "Embed ZZAI Security suite (formerly Pyracrypt) in logged-in center",
    ],
    orbitTaskIds: ["content-seo-pages", "content-integrations", "tech-indexnow-submitted"],
    metrics: ["Indexed tool pages", "hub→signup %", "Security Center activations"],
  },
  {
    id: "channel-intel-loop",
    title: `YouTube intel loop (${ADMIN_DEFAULT_YOUTUBE_HANDLE})`,
    motion: "clg",
    summary:
      "Auto-transcribe Starter Story (and peers), extract growth tactics, and feed Orbit content + product suggestions weekly.",
    whyItWorks:
      "Founder marketing channels publish repeatable playbooks; mining captions beats guessing positioning.",
    zzaiActions: [
      `Admin auto-watch ${ADMIN_DEFAULT_YOUTUBE_HANDLE} — daily ingest + briefing`,
      "Turn intel answers into blog posts, comparisons, and seed ideas",
      "One-click Seeds from any transcribed video or channel",
    ],
    orbitTaskIds: ["content-channel-intel", "content-blog", "content-social-pack"],
    metrics: ["Intel briefings / week", "content from intel", "seed sessions from YouTube"],
  },
  {
    id: "community-parasite",
    title: "Community + parasite distribution",
    motion: "clg",
    summary:
      "Ship Dev.to, Hashnode, Reddit, and Product Hunt assets from Orbit — meet builders where they already hang out.",
    whyItWorks:
      "Community-led growth cuts CAC ~34% for tools with clear indie-founder fit; parasite SEO on high-DA platforms accelerates discovery.",
    zzaiActions: [
      "Orbit social launch pack + directory submissions",
      "Show HN / Indie Hackers posts tied to a concrete free tool",
      "Referral widget on Seeds and Security pages",
    ],
    orbitTaskIds: ["content-parasite", "content-community", "manual-reddit-sideproject"],
    metrics: ["Referral signups", "directory listings live", "community CTR"],
  },
  {
    id: "plg-activation",
    title: "PLG activation in first session",
    motion: "plg",
    summary:
      "Time-to-value under 30 minutes: paste YouTube URL → seeds → deploy, or paste URL → Security scan — no setup wall.",
    whyItWorks:
      "PLG breaks when onboarding is slow; ZZAI’s transcript + seed pipeline is the aha moment.",
    zzaiActions: [
      "YouTube transcribe chips for @StarterStory on /seeds and admin intel",
      "Security Feed Shield: paste URL → auto-fetch captions",
      "Remove dead-end legacy Pyracrypt hosts — everything on zzaizzai.com",
    ],
    metrics: ["First-session seed count", "YouTube→seed conversion", "D1 retention"],
  },
];

export function getHybridStrategy(id: string): HybridGtmStrategy | undefined {
  return HYBRID_GTM_STRATEGIES.find((s) => s.id === id);
}

export function orbitTasksForHybridPlaybook(): string[] {
  const ids = new Set<string>();
  for (const strategy of HYBRID_GTM_STRATEGIES) {
    for (const taskId of strategy.orbitTaskIds ?? []) ids.add(taskId);
  }
  return [...ids];
}

export function formatHybridPlaybookMarkdown(): string {
  return HYBRID_GTM_STRATEGIES.map(
    (s) =>
      `## ${s.title}\n${s.summary}\n\n**ZZAI actions:**\n${s.zzaiActions.map((a) => `- ${a}`).join("\n")}\n`,
  ).join("\n");
}
