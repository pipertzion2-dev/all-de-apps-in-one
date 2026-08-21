import type { SharedContextSnapshot } from "../buses/schemas";
import type { AdvocacyChannelId, ChannelWeights, RoutingReason } from "../types";
import { ADVOCACY_CHANNELS, computeModulePriority } from "../types";
import { CHANNEL_CAPABILITIES, clampWeight, mergeWeights, normalizeWeights } from "../channels";
import { getPreset, type ConsolePresetId } from "../presets";
import { RISK_CLASSIFICATION_NOTICE } from "../disclaimers";

export type OrchestrationInput = {
  userText?: string;
  context?: SharedContextSnapshot;
  presetId?: ConsolePresetId;
  /** Manual fader overrides (editable presets). */
  weightOverrides?: Partial<ChannelWeights>;
  /** Independently mute/unmute channels. */
  enabledChannels?: Partial<Record<AdvocacyChannelId, boolean>>;
};

export type ModuleSignal = {
  channel: AdvocacyChannelId;
  priority: number;
  confidence: number;
  reasons: string[];
};

export type OrchestrationResult = {
  weights: ChannelWeights;
  enabled: Record<AdvocacyChannelId, boolean>;
  reasons: RoutingReason[];
  moduleSignals: ModuleSignal[];
  safetyOverride: boolean;
  notice: string;
  synthesisHints: string[];
};

function baseFromPreset(presetId?: ConsolePresetId): ChannelWeights {
  if (presetId) {
    const p = getPreset(presetId);
    if (p) return { ...p.weights };
  }
  return normalizeWeights({
    education: 70,
    career_pathways: 40,
    opportunity_resources: 40,
    ai_guide: 60,
    advocacy: 30,
    student_rights_law: 20,
    story_timeline: 20,
    human_assistance: 20,
    evidence_vault: 10,
    cybersecurity: 15,
    verification_ledger: 5,
    crisis_safety: 0,
  });
}

function detectSignals(text: string, context?: SharedContextSnapshot): RoutingReason[] {
  const reasons: RoutingReason[] = [];
  const lower = (text || "").toLowerCase();

  const bump = (channel: AdvocacyChannelId, reason: string, weightDelta: number) => {
    reasons.push({ channel, reason, weightDelta });
  };

  if (/force|forcing|leave school|withdraw|involuntary|kick(ed)? out|expuls/.test(lower)) {
    bump(
      "student_rights_law",
      "User described a possible involuntary school exit or rights issue.",
      40,
    );
    bump("advocacy", "Advocacy increased for education-rights framing.", 35);
    bump("evidence_vault", "Evidence capture may help preserve a contemporaneous record.", 25);
    bump(
      "human_assistance",
      "Human Assistance increased because entitlement certainty is limited.",
      20,
    );
  }
  if (/transfer|district|enroll|credits?|attendance|graduation|diploma|ged|iep|504/.test(lower)) {
    bump("education", "Educational planning keywords detected.", 25);
    bump("story_timeline", "Timeline may clarify sequence of school events.", 15);
  }
  if (/scholarship|college|career|job|internship/.test(lower)) {
    bump("career_pathways", "Career / college pathway intent detected.", 30);
    bump("opportunity_resources", "Opportunity search may be relevant.", 25);
  }
  if (
    /unsafe|hurt myself|suicid|kill myself|abuse|neglect|weapon|emergency|in danger|homeless|no place to stay/.test(
      lower,
    )
  ) {
    bump(
      "crisis_safety",
      "Potential safety-sensitive language — Safety channel may override ordinary mix.",
      80,
    );
    bump("human_assistance", "Human Assistance increased for qualified resource routing.", 50);
  }
  if (/document|screenshot|email|letter|proof|evidence|seal|vault/.test(lower)) {
    bump("evidence_vault", "User indicated documentation / evidence intent.", 30);
    bump("cybersecurity", "Cybersecurity channel raised for protected storage.", 20);
    bump("verification_ledger", "Optional integrity anchoring may be useful after seal.", 15);
  }
  if (/lawyer|legal aid|attorney|rights|law/.test(lower)) {
    bump("student_rights_law", "User asked about law / rights information.", 35);
    bump("human_assistance", "Route toward qualified human legal resources when uncertain.", 25);
  }
  if (/advocate|counselor|social worker|trusted adult/.test(lower)) {
    bump("human_assistance", "User asked for human help pathways.", 40);
  }

  if (
    context?.safety?.needsImmediateHelp ||
    context?.safety?.routingCategory === "immediate_physical_danger"
  ) {
    bump("crisis_safety", "Safety bus indicates immediate help may be needed.", 100);
    bump("human_assistance", "Safety bus raised Human Assistance.", 100);
  }

  return reasons;
}

/**
 * Scientific / modular hybridization engine for advocacy channels.
 * Safety-critical modules may override ordinary weighting.
 */
export function orchestrateAdvocacyMix(input: OrchestrationInput): OrchestrationResult {
  let weights = baseFromPreset(input.presetId);
  const reasons = detectSignals(input.userText || "", input.context);

  for (const r of reasons) {
    weights[r.channel] = clampWeight(weights[r.channel] + r.weightDelta);
  }

  if (input.weightOverrides) {
    weights = mergeWeights(weights, input.weightOverrides);
  }

  const safetyOverride = reasons.some((r) => r.channel === "crisis_safety" && r.weightDelta >= 80);
  if (safetyOverride) {
    weights.crisis_safety = 100;
    weights.human_assistance = Math.max(weights.human_assistance, 100);
    weights.ai_guide = Math.min(weights.ai_guide, 40);
  }

  const enabled = Object.fromEntries(
    ADVOCACY_CHANNELS.map((id) => {
      const capability = CHANNEL_CAPABILITIES.find((c) => c.id === id);
      const defaultOn = capability?.defaultEnabled ?? true;
      const override = input.enabledChannels?.[id];
      return [id, override == null ? defaultOn : override];
    }),
  ) as Record<AdvocacyChannelId, boolean>;

  // Muted channels keep weight for explainability but are marked disabled.
  for (const id of ADVOCACY_CHANNELS) {
    if (!enabled[id] && !CHANNEL_CAPABILITIES.find((c) => c.id === id)?.safetyCritical) {
      // keep weight but callers should skip muted non-safety channels
    }
  }

  if (safetyOverride) {
    enabled.crisis_safety = true;
    enabled.human_assistance = true;
  }

  const moduleSignals: ModuleSignal[] = ADVOCACY_CHANNELS.map((channel) => {
    const relevance = (weights[channel] || 0) / 100;
    const priority = computeModulePriority({
      contextRelevance: Math.max(0.05, relevance),
      userIntentWeight: input.presetId ? 1.1 : 1,
      riskWeight: channel === "crisis_safety" && safetyOverride ? 1.5 : 1,
      evidenceConfidence: (input.context?.evidence?.length || 0) > 0 ? 1.1 : 0.9,
      jurisdictionConfidence:
        input.context?.legal?.country || input.context?.identity?.jurisdiction?.country
          ? 1.1
          : 0.85,
      resourceAvailability: 1,
    });
    return {
      channel,
      priority: Number(priority.toFixed(4)),
      confidence: Number(Math.min(1, relevance + 0.15).toFixed(3)),
      reasons: reasons.filter((r) => r.channel === channel).map((r) => r.reason),
    };
  }).sort((a, b) => b.priority - a.priority);

  const synthesisHints = moduleSignals
    .filter((s) => s.reasons.length > 0)
    .slice(0, 6)
    .map((s) => s.reasons[0]);

  return {
    weights,
    enabled,
    reasons,
    moduleSignals,
    safetyOverride,
    notice: RISK_CLASSIFICATION_NOTICE,
    synthesisHints,
  };
}
