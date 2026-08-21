import { getGeminiApiKey, getOllamaUrl, getOpenAIApiKey } from "@/lib/env";
import { getDefaultModel, openai } from "@/lib/llm/openai";
import { PLATFORM_FEATURES, getFeature, type PlatformFeature } from "@/lib/platform/feature-graph";

export type FeatureSuggestion = {
  featureId: string;
  title: string;
  href: string;
  reason: string;
  score: number;
};

export type FeatureSuggestionResult = {
  goal: string;
  suggestions: FeatureSuggestion[];
  workflow: string[];
  aiUsed: boolean;
  summary: string;
};

function canUseAi(): boolean {
  return !!(getGeminiApiKey()?.trim() || getOllamaUrl()?.trim() || getOpenAIApiKey()?.trim());
}

function terms(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
}

function scoreFeature(feature: PlatformFeature, goalTerms: string[], fromId?: string): number {
  let score = 0;
  const blob = [feature.title, feature.description, ...feature.tags].join(" ").toLowerCase();
  for (const term of goalTerms) {
    if (blob.includes(term)) score += 6;
    if (feature.tags.some((t) => t.includes(term) || term.includes(t))) score += 4;
  }
  if (fromId && getFeature(fromId)?.connectsTo.includes(feature.id)) score += 12;
  if (
    feature.id === "seeds" &&
    goalTerms.some((t) =>
      ["app", "apps", "suite", "pdf", "seed", "youtube", "transcript"].includes(t),
    )
  ) {
    score += 10;
  }
  if (feature.id === "orchestration") score += 4;
  if (
    feature.id === "hybridization" &&
    goalTerms.some((t) =>
      [
        "hybrid",
        "hybridize",
        "blend",
        "fuse",
        "marketplace",
        "laboratory",
        "hybridization",
      ].includes(t),
    )
  ) {
    score += 14;
  }
  if (
    feature.id === "orchestration" &&
    goalTerms.some((t) =>
      ["orchestr", "workflow", "route", "connect", "console", "platform"].includes(t),
    )
  ) {
    score += 8;
  }
  if (
    (feature.bus === "advocate" ||
      feature.id.startsWith("edu-") ||
      feature.id === "education-advocacy") &&
    goalTerms.some((t) =>
      [
        "education",
        "school",
        "student",
        "rights",
        "advocacy",
        "ferpa",
        "iep",
        "crisis",
        "evidence",
        "vault",
        "legal",
        "counselor",
        "graduation",
        "transfer",
        "scholarship",
      ].includes(t),
    )
  ) {
    score += 16;
  }
  return score;
}

function fallbackReason(feature: PlatformFeature, goal: string): string {
  if (feature.id === "orchestration") {
    return "Patch bay — OaaS assigns channel order and bus sends across the full desk.";
  }
  if (feature.id === "hybridization") {
    return `${feature.channelLabel}: Hybrid² lab — blend any two channels, list the product, then hybridize those blends.`;
  }
  if (feature.id === "seeds") {
    return `${feature.channelLabel}: unmute Seeds first — multi-app generation, then send to Grow and Master.`;
  }
  if (feature.layer === "hybrid") {
    return `FX insert on ${feature.channelLabel} — route “${goal.slice(0, 48)}…” through the hybrid bus.`;
  }
  if (feature.layer === "grow") {
    return `${feature.channelLabel} on the Grow bus — send traffic and launch signal toward Master.`;
  }
  if (feature.layer === "protect") {
    return `${feature.channelLabel} on the Protect bus — limiter chain before Master out.`;
  }
  if (feature.layer === "advocate") {
    return `${feature.channelLabel} on the Advocate bus — education rights, evidence, and human help routing.`;
  }
  return `${feature.channelLabel}: ${feature.description}`;
}

function buildWorkflow(suggestions: FeatureSuggestion[]): string[] {
  return suggestions.slice(0, 5).map((s) => s.title);
}

export function suggestFeaturesByKeywords(options: {
  goal: string;
  fromFeatureId?: string;
  limit?: number;
  includeAdmin?: boolean;
}): FeatureSuggestionResult {
  const goal = options.goal.trim();
  const goalTerms = terms(goal);
  const limit = options.limit ?? 6;
  const includeAdmin = options.includeAdmin ?? false;

  const ranked = PLATFORM_FEATURES.filter((f) => includeAdmin || !f.adminOnly)
    .map((feature) => ({
      feature,
      score: scoreFeature(feature, goalTerms, options.fromFeatureId),
    }))
    .sort((a, b) => b.score - a.score);

  const top = ranked.filter((r) => r.score > 0).slice(0, limit);
  const picks = top.length >= 2 ? top : ranked.slice(0, Math.min(limit, ranked.length));

  const suggestions: FeatureSuggestion[] = picks.map(({ feature, score }) => ({
    featureId: feature.id,
    title: feature.title,
    href: feature.href,
    reason: fallbackReason(feature, goal),
    score,
  }));

  return {
    goal,
    suggestions,
    workflow: buildWorkflow(suggestions),
    aiUsed: false,
    summary:
      suggestions[0]?.featureId === "orchestration" || suggestions[0]?.featureId === "seeds"
        ? "Patch route: unmute channels in order, send through subgroup buses, print to Master."
        : "OaaS patch bay (add AI keys for richer channel routing).",
  };
}

export async function suggestFeatures(options: {
  goal: string;
  fromFeatureId?: string;
  limit?: number;
  includeAdmin?: boolean;
}): Promise<FeatureSuggestionResult> {
  const keywordResult = suggestFeaturesByKeywords(options);
  if (!canUseAi() || options.goal.trim().length < 8) {
    return keywordResult;
  }

  const catalog = PLATFORM_FEATURES.filter((f) => options.includeAdmin || !f.adminOnly)
    .map((f) => `- ${f.id}: ${f.title} — ${f.description} (connects: ${f.connectsTo.join(", ")})`)
    .join("\n");

  const prompt = `You route users on the ZZAI mixing-console OS via OaaS (Orchestration as a Service).

Desk layout:
- Each feature is a CHANNEL STRIP (CH 01 Seeds, CH 02 API Builder, etc.)
- Subgroup BUSES: Seed, Build, FX/Hybrid, Grow, Protect, Aux, Advocate
- Main buses: Signal (digital/API) and Crest (hardware)
- MASTER BUS: deploy, launch, live endpoints, court packs, education proof receipts
- PATCH BAY (orchestration): AI assigns channel order and bus sends

User goal: ${options.goal.trim()}
${options.fromFeatureId ? `Currently on channel: ${options.fromFeatureId}` : ""}

Channels:
${catalog}

Return ONLY JSON:
{
  "summary": "2 sentences using mixing-board language (channels, buses, master)",
  "workflow": ["feature id", "..."],
  "picks": [{"featureId":"...","reason":"one sentence why — mention channel or bus"}]
}

Rules:
- Prefer orchestration when they need a full patch route across channels
- Prefer seeds (CH 01) when they want many apps from a PDF or YouTube transcript
- Route Grow bus channels (launch, marketing, channel-intel, orbit) for traffic/SEO
- Prefer hybridization (CH 06 Hybrid² Lab) when they want to blend channels or fuse two products
- Route Protect bus + hybridization FX for IP/patent/sketches
- End workflows at Master (launch/deploy) when possible
- Max 5 picks in patch order`;

  try {
    const completion = await openai.chat.completions.create({
      model: getDefaultModel(),
      messages: [{ role: "user", content: prompt }],
      temperature: 0.25,
    });
    const raw = completion.choices[0]?.message?.content?.trim() || "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return keywordResult;
    const parsed = JSON.parse(match[0]) as {
      summary?: string;
      workflow?: string[];
      picks?: { featureId?: string; reason?: string }[];
    };
    const suggestions: FeatureSuggestion[] = [];
    for (const pick of parsed.picks ?? []) {
      const feature = pick.featureId ? getFeature(pick.featureId) : undefined;
      if (!feature) continue;
      if (!options.includeAdmin && feature.adminOnly) continue;
      suggestions.push({
        featureId: feature.id,
        title: feature.title,
        href: feature.href,
        reason: pick.reason?.trim() || fallbackReason(feature, options.goal),
        score: 100 - suggestions.length,
      });
    }
    if (suggestions.length < 2) return keywordResult;
    return {
      goal: options.goal.trim(),
      suggestions: suggestions.slice(0, options.limit ?? 6),
      workflow: (parsed.workflow ?? suggestions.map((s) => s.featureId)).map((id) => {
        const f = getFeature(id);
        return f?.title ?? id;
      }),
      aiUsed: true,
      summary: parsed.summary?.trim() || keywordResult.summary,
    };
  } catch {
    return keywordResult;
  }
}
