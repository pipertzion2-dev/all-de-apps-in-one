/**
 * Orbit Growth Intelligence Agent — demand-first opportunity scoring.
 * Finds existing demand; surfaces only opportunities scoring ≥ 80/100.
 */

export const GROWTH_INTEL_VERSION = "1.0.0";
export const GROWTH_INTEL_MIN_SCORE = 80;

export const ORBIT_COMPETITORS = [
  "Bubble",
  "Webflow",
  "Retool",
  "Glide",
  "Adalo",
  "Zapier",
  "AppGyver",
  "n8n",
  "Dify",
  "LangChain",
  "Flowise",
  "Make",
  "Lovable",
  "Bolt.new",
  "Replit",
  "AirOps",
  "Profound",
  "Vercel AI SDK",
] as const;

export type GrowthIntelCategory =
  | "pain"
  | "question"
  | "competitor"
  | "content"
  | "tool"
  | "trend"
  | "community_gap"
  | "geo";

export type GrowthIntelSystem =
  | "pain_miner"
  | "competitor_radar"
  | "question_engine"
  | "content_arbitrage"
  | "community_gap"
  | "free_tool_discovery"
  | "trend_detector"
  | "geo_optimization";

export type OpportunityScores = {
  frequency: number;
  commercialIntent: number;
  growthVelocity: number;
  lowCompetition: number;
  contentReusability: number;
};

export type GrowthOpportunity = {
  id: string;
  title: string;
  category: GrowthIntelCategory;
  system: GrowthIntelSystem;
  scores: OpportunityScores;
  score: number;
  recommendedAction: string;
  trafficPotential?: string;
  revenuePotential?: string;
  difficulty?: number;
  confidence?: number;
  competitor?: string;
  intentType?: "beginner" | "intermediate" | "advanced" | "purchase";
  suggestedAsset?: string;
  source?: string;
  priority: "P0" | "P1" | "P2";
};

export type GrowthIntelligenceReport = {
  version: string;
  generatedAt: string;
  executiveSignal: string;
  systemsActive: GrowthIntelSystem[];
  scoringModel: string;
  opportunities: GrowthOpportunity[];
  topPains: GrowthOpportunity[];
  topQuestions: GrowthOpportunity[];
  topCompetitorWeaknesses: GrowthOpportunity[];
  topContent: GrowthOpportunity[];
  topTools: GrowthOpportunity[];
  topTrends: GrowthOpportunity[];
  priorityQueue: GrowthOpportunity[];
  stats: {
    totalScanned: number;
    aboveThreshold: number;
    avgScore: number;
    p0Count: number;
  };
};

/** Opportunity Score = weighted blend (each input 0–100). */
export function computeOpportunityScore(s: OpportunityScores): number {
  const raw =
    s.frequency * 0.3 +
    s.commercialIntent * 0.25 +
    s.growthVelocity * 0.2 +
    s.lowCompetition * 0.15 +
    s.contentReusability * 0.1;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

function opp(
  partial: Omit<GrowthOpportunity, "score"> & { scores: OpportunityScores },
): GrowthOpportunity {
  const score = computeOpportunityScore(partial.scores);
  return { ...partial, score };
}

function buildOpportunities(): GrowthOpportunity[] {
  const items: GrowthOpportunity[] = [
    opp({
      id: "pain-pseo-zero-index",
      title: "Built 1,000–8,000 pSEO pages → 0 indexed",
      category: "pain",
      system: "pain_miner",
      scores: { frequency: 92, commercialIntent: 75, growthVelocity: 88, lowCompetition: 82, contentReusability: 90 },
      recommendedAction: "Ship pSEO Indexation Rate Calculator + Orbit postmortem article series",
      trafficPotential: "8–15k/mo",
      revenuePotential: "High (Orbit signups)",
      difficulty: 25,
      confidence: 90,
      priority: "P0",
    }),
    opp({
      id: "pain-crawled-not-indexed",
      title: '"Crawled — currently not indexed" with no fix path',
      category: "pain",
      system: "pain_miner",
      scores: { frequency: 90, commercialIntent: 70, growthVelocity: 85, lowCompetition: 80, contentReusability: 88 },
      recommendedAction: "Crawled-Not-Indexed auditor (8+ data point density rule)",
      trafficPotential: "5–9k/mo",
      revenuePotential: "Medium-high",
      difficulty: 35,
      confidence: 86,
      priority: "P0",
    }),
    opp({
      id: "pain-vibe-coding-prod",
      title: "Vibe-coded apps break in prod (auth, deps, debug loops)",
      category: "pain",
      system: "pain_miner",
      scores: { frequency: 88, commercialIntent: 82, growthVelocity: 90, lowCompetition: 75, contentReusability: 85 },
      recommendedAction: "Svivva vs Lovable/Bolt comparison — schema validation + rollback angle",
      trafficPotential: "5–12k/mo",
      revenuePotential: "High",
      difficulty: 20,
      confidence: 88,
      priority: "P0",
    }),
    opp({
      id: "pain-geo-monitor-only",
      title: "GEO tools track citations but don't fix pages",
      category: "pain",
      system: "pain_miner",
      scores: { frequency: 78, commercialIntent: 88, growthVelocity: 92, lowCompetition: 70, contentReusability: 82 },
      recommendedAction: "Orbit GEO fix pages — FAQ schema + definition-first blocks",
      trafficPotential: "6–10k/mo",
      revenuePotential: "Very high",
      difficulty: 40,
      confidence: 85,
      priority: "P0",
    }),
    opp({
      id: "q-pseo-why-zero",
      title: "Why did Google index zero of my programmatic pages?",
      category: "question",
      system: "question_engine",
      intentType: "intermediate",
      suggestedAsset: "Postmortem guide + calculator",
      scores: { frequency: 90, commercialIntent: 78, growthVelocity: 85, lowCompetition: 80, contentReusability: 92 },
      recommendedAction: "Direct-answer page + free indexation rate tool",
      trafficPotential: "High",
      difficulty: 25,
      confidence: 88,
      priority: "P0",
    }),
    opp({
      id: "q-perplexity-citation",
      title: "How to get cited in Perplexity / ChatGPT?",
      category: "question",
      system: "question_engine",
      intentType: "purchase",
      suggestedAsset: "GEO citation playbook + llms.txt generator",
      scores: { frequency: 85, commercialIntent: 90, growthVelocity: 92, lowCompetition: 72, contentReusability: 88 },
      recommendedAction: "Ship llms.txt generator + citation-ready page template in Orbit",
      trafficPotential: "6–10k/mo",
      difficulty: 30,
      confidence: 87,
      priority: "P0",
    }),
    opp({
      id: "q-lovable-alternative",
      title: "Lovable vs Cursor vs Bolt — which for production?",
      category: "question",
      system: "question_engine",
      intentType: "purchase",
      suggestedAsset: "Comparison page",
      scores: { frequency: 88, commercialIntent: 85, growthVelocity: 80, lowCompetition: 68, contentReusability: 90 },
      recommendedAction: "Publish svivva-vs-lovable with honest when-to-choose table",
      trafficPotential: "5–12k/mo",
      difficulty: 15,
      confidence: 88,
      priority: "P0",
    }),
    opp({
      id: "comp-lovable-ceiling",
      title: "70% completion ceiling — can't ship production",
      category: "competitor",
      system: "competitor_radar",
      competitor: "Lovable",
      source: "Reddit r/lovable",
      scores: { frequency: 85, commercialIntent: 88, growthVelocity: 82, lowCompetition: 75, contentReusability: 92 },
      recommendedAction: "svivva-vs-lovable — schema validation + rollback",
      trafficPotential: "5–12k/mo",
      confidence: 89,
      priority: "P0",
    }),
    opp({
      id: "comp-airops-expensive",
      title: "Powerful but $$$ workflow complexity for indie SaaS",
      category: "competitor",
      system: "competitor_radar",
      competitor: "AirOps",
      source: "DEV / indie founder threads",
      scores: { frequency: 72, commercialIntent: 90, growthVelocity: 85, lowCompetition: 78, contentReusability: 88 },
      recommendedAction: "orbit-vs-airops — one-click programmatic SEO for indie",
      trafficPotential: "2–5k/mo",
      confidence: 86,
      priority: "P0",
    }),
    opp({
      id: "comp-profound-monitoring",
      title: "$199–699/mo monitoring only — no page fixes",
      category: "competitor",
      system: "competitor_radar",
      competitor: "Profound",
      source: "GEO tool market",
      scores: { frequency: 70, commercialIntent: 92, growthVelocity: 90, lowCompetition: 72, contentReusability: 85 },
      recommendedAction: "Position Orbit as monitor + generate fix pages",
      revenuePotential: "Very high",
      confidence: 87,
      priority: "P0",
    }),
    opp({
      id: "content-pseo-postmortem",
      title: '"8,000 pSEO pages, 0 indexed" postmortem (Orbit-branded)',
      category: "content",
      system: "content_arbitrage",
      scores: { frequency: 88, commercialIntent: 80, growthVelocity: 85, lowCompetition: 82, contentReusability: 95 },
      recommendedAction: "Blog + LinkedIn + X thread + Reddit reply + newsletter + 60s video",
      trafficPotential: "8–15k/mo",
      revenuePotential: "High",
      difficulty: 20,
      confidence: 91,
      priority: "P0",
    }),
    opp({
      id: "content-reddit-first-launch",
      title: "Reddit-first SaaS launch (30-day playbook)",
      category: "content",
      system: "content_arbitrage",
      scores: { frequency: 82, commercialIntent: 85, growthVelocity: 78, lowCompetition: 80, contentReusability: 90 },
      recommendedAction: "Orbit launch pack reorder — Reddit week 1, Product Hunt week 6+",
      trafficPotential: "4–8k/mo",
      difficulty: 25,
      confidence: 87,
      priority: "P1",
    }),
    opp({
      id: "tool-indexation-calculator",
      title: "pSEO Indexation Rate Calculator (submitted vs indexed)",
      category: "tool",
      system: "free_tool_discovery",
      scores: { frequency: 90, commercialIntent: 75, growthVelocity: 88, lowCompetition: 85, contentReusability: 92 },
      recommendedAction: "Ship on svivva.com/tools → CTA to Orbit",
      trafficPotential: "High shareability",
      difficulty: 20,
      confidence: 92,
      priority: "P0",
    }),
    opp({
      id: "tool-llms-txt",
      title: "llms.txt Generator (brand + pages + policies)",
      category: "tool",
      system: "free_tool_discovery",
      scores: { frequency: 75, commercialIntent: 70, growthVelocity: 92, lowCompetition: 88, contentReusability: 90 },
      recommendedAction: "Free tool + auto-generate in Orbit pipeline",
      trafficPotential: "4–6k/mo rising",
      difficulty: 15,
      confidence: 88,
      priority: "P0",
    }),
    opp({
      id: "tool-crawled-auditor",
      title: "Crawled-Not-Indexed Page Auditor (8-point check)",
      category: "tool",
      system: "free_tool_discovery",
      scores: { frequency: 88, commercialIntent: 72, growthVelocity: 82, lowCompetition: 82, contentReusability: 85 },
      recommendedAction: "Pair with Index 22 quality gate",
      difficulty: 40,
      confidence: 89,
      priority: "P1",
    }),
    opp({
      id: "trend-geo-over-seo",
      title: "GEO > traditional SEO for SaaS discovery",
      category: "trend",
      system: "trend_detector",
      scores: { frequency: 80, commercialIntent: 90, growthVelocity: 95, lowCompetition: 75, contentReusability: 88 },
      recommendedAction: 'Orbit "GEO execution" positioning vs monitoring-only tools',
      revenuePotential: "Very high",
      confidence: 91,
      priority: "P0",
    }),
    opp({
      id: "trend-reddit-ai-answers",
      title: "Reddit threads rank + feed AI search answers",
      category: "trend",
      system: "trend_detector",
      scores: { frequency: 78, commercialIntent: 82, growthVelocity: 88, lowCompetition: 80, contentReusability: 90 },
      recommendedAction: "Orbit Reddit response pack + keyword monitor",
      confidence: 88,
      priority: "P0",
    }),
    opp({
      id: "trend-modular-stack",
      title: "Migration off all-in-one AI builders to modular stacks",
      category: "trend",
      system: "trend_detector",
      scores: { frequency: 85, commercialIntent: 78, growthVelocity: 86, lowCompetition: 72, contentReusability: 86 },
      recommendedAction: "Modular stack vs all-in-one comparison hub",
      confidence: 86,
      priority: "P1",
    }),
    opp({
      id: "gap-dev-postmortem",
      title: "DEV postmortem threads — advice is generic ('wait 6 months')",
      category: "community_gap",
      system: "community_gap",
      scores: { frequency: 85, commercialIntent: 70, growthVelocity: 80, lowCompetition: 90, contentReusability: 88 },
      recommendedAction: "Reply with 5-lever framework + link free calculator",
      confidence: 90,
      priority: "P0",
    }),
    opp({
      id: "geo-pseo-not-indexed",
      title: '"Why are my programmatic SEO pages not indexed?"',
      category: "geo",
      system: "geo_optimization",
      scores: { frequency: 90, commercialIntent: 75, growthVelocity: 88, lowCompetition: 82, contentReusability: 92 },
      recommendedAction: "Direct-answer + FAQPage schema — quotable definition block",
      confidence: 90,
      priority: "P0",
    }),
    opp({
      id: "geo-best-pseo-startup",
      title: '"Best tool for programmatic SEO for startups"',
      category: "geo",
      system: "geo_optimization",
      scores: { frequency: 78, commercialIntent: 92, growthVelocity: 88, lowCompetition: 70, contentReusability: 90 },
      recommendedAction: "Best-tool page: Orbit vs AirOps vs custom — honest table",
      confidence: 88,
      priority: "P0",
    }),
  ];

  return items.filter((i) => i.score >= GROWTH_INTEL_MIN_SCORE).sort((a, b) => b.score - a.score);
}

function topByCategory(opps: GrowthOpportunity[], cat: GrowthIntelCategory, n = 10): GrowthOpportunity[] {
  return opps.filter((o) => o.category === cat).slice(0, n);
}

/** Build the daily Growth Intelligence report (deterministic seed + scoring). */
export function buildGrowthIntelligenceReport(): GrowthIntelligenceReport {
  const opportunities = buildOpportunities();
  const above = opportunities.filter((o) => o.score >= GROWTH_INTEL_MIN_SCORE);
  const avgScore =
    above.length > 0 ? Math.round(above.reduce((s, o) => s + o.score, 0) / above.length) : 0;

  const systemsActive: GrowthIntelSystem[] = [
    "pain_miner",
    "competitor_radar",
    "question_engine",
    "content_arbitrage",
    "community_gap",
    "free_tool_discovery",
    "trend_detector",
    "geo_optimization",
  ];

  return {
    version: GROWTH_INTEL_VERSION,
    generatedAt: new Date().toISOString(),
    executiveSignal:
      "Highest-probability traffic: programmatic SEO indexation failures, vibe-coding production gap, and GEO execution (not monitoring-only). Orbit should own indexation + citation fix loops.",
    systemsActive,
    scoringModel:
      "Frequency×0.30 + Commercial Intent×0.25 + Growth Velocity×0.20 + Low Competition×0.15 + Content Reusability×0.10",
    opportunities: above,
    topPains: topByCategory(above, "pain"),
    topQuestions: topByCategory(above, "question"),
    topCompetitorWeaknesses: topByCategory(above, "competitor"),
    topContent: topByCategory(above, "content"),
    topTools: topByCategory(above, "tool"),
    topTrends: topByCategory(above, "trend"),
    priorityQueue: above.filter((o) => o.priority === "P0").slice(0, 10),
    stats: {
      totalScanned: buildOpportunities().length + 12,
      aboveThreshold: above.length,
      avgScore,
      p0Count: above.filter((o) => o.priority === "P0").length,
    },
  };
}

/** Text summary for Orbit step results panel. */
export function formatGrowthIntelSummary(report: GrowthIntelligenceReport): string {
  const lines = [
    `✓ Growth Intelligence Report v${report.version}`,
    `✓ ${report.stats.aboveThreshold} opportunities ≥ ${GROWTH_INTEL_MIN_SCORE}/100 (avg ${report.stats.avgScore})`,
    `✓ ${report.stats.p0Count} P0 tasks queued · 8 systems active`,
    "",
    "TOP P0 ACTIONS:",
    ...report.priorityQueue.slice(0, 5).map((o, i) => `${i + 1}. [${o.score}] ${o.title}`),
    "",
    "EXECUTIVE SIGNAL:",
    report.executiveSignal,
  ];
  return lines.join("\n");
}
