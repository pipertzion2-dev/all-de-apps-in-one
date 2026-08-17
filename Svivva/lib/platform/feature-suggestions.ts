import { getGeminiApiKey, getOllamaUrl, getOpenAIApiKey } from "@/lib/env";
import { getDefaultModel, openai } from "@/lib/llm/openai";
import {
  PLATFORM_FEATURES,
  getFeature,
  type PlatformFeature,
} from "@/lib/platform/feature-graph";

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
  if (feature.id === "seeds" && goalTerms.some((t) => ["app", "apps", "suite", "pdf", "seed"].includes(t))) {
    score += 10;
  }
  if (feature.id === "haas") score += 4;
  return score;
}

function fallbackReason(feature: PlatformFeature, goal: string): string {
  if (feature.id === "haas") {
    return "HaaS hybridizes your goal across the full ZZAI stack — start here for AI-routed workflows.";
  }
  if (feature.id === "seeds") {
    return "ZZAI Seeds: multi-app generation from one document, then hybridize into launch and growth.";
  }
  if (feature.layer === "hybrid") {
    return `HaaS hybridizes your goal (“${goal.slice(0, 60)}…”) across ZZAI features.`;
  }
  if (feature.layer === "grow") {
    return "Ship traffic and launch workflows after you have something to promote.";
  }
  return feature.description;
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
  const picks =
    top.length >= 2
      ? top
      : ranked.slice(0, Math.min(limit, ranked.length));

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
      suggestions[0]?.featureId === "haas" || suggestions[0]?.featureId === "seeds"
        ? "HaaS routes hybrid workflows — fuse generation, launch, intel, and protection in order."
        : "HaaS keyword routing (add AI keys for richer hybrid paths).",
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
    .map(
      (f) =>
        `- ${f.id}: ${f.title} — ${f.description} (connects: ${f.connectsTo.join(", ")})`,
    )
    .join("\n");

  const prompt = `You route users inside ZZAI via HaaS (Hybridization as a Service) — a technical hybrid environment where APIs, ZZAI Seeds, launch, IP, and YouTube intel fuse.

User goal: ${options.goal.trim()}
${options.fromFeatureId ? `Currently on: ${options.fromFeatureId}` : ""}

Features:
${catalog}

Return ONLY JSON:
{
  "summary": "2 sentences",
  "workflow": ["feature id", "..."],
  "picks": [{"featureId":"...","reason":"one sentence why"}]
}

Rules:
- Prefer haas when they want connected workflows or hybridization across tools
- Prefer seeds when they want many apps from PDF upload
- Include grow features (launch-studio, marketing, channel-intel, orbit) for traffic/SEO
- Include poor-man-protection + hybridization for IP/patent/sketches
- Max 5 picks in workflow order`;

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
