import { ROLE_BOUNDARY } from "../disclaimers";
import type { CrisisResourceProvider, ResourceRecord } from "../adapters/interfaces";
import { InMemoryResourceRegistry } from "../resources/registry";
import type { SafetyBus } from "../buses/schemas";

export const CRISIS_CATEGORIES = [
  "immediate_physical_danger",
  "emotional_psychological_crisis",
  "abuse_neglect",
  "housing_instability",
  "education_exclusion",
  "potential_rights_issue",
  "urgent_legal_assistance",
  "school_conflict",
  "non_emergency_advocacy",
] as const;

export type CrisisCategory = (typeof CRISIS_CATEGORIES)[number];

export type CrisisRouteResult = {
  category: CrisisCategory;
  safety: SafetyBus;
  resources: ResourceRecord[];
  orientation: string[];
  disclaimers: string[];
  /** AI stays supportive but does not invent services. */
  usedVerifiedDirectoryOnly: true;
};

export function classifyCrisisCategory(text: string): CrisisCategory {
  const lower = text.toLowerCase();
  if (/911|in danger|being hurt|weapon|attack|emergency right now/.test(lower)) {
    return "immediate_physical_danger";
  }
  if (/suicid|kill myself|want to die|self.?harm|panic|can't go on/.test(lower)) {
    return "emotional_psychological_crisis";
  }
  if (/abuse|neglect|hit me|molest|assault/.test(lower)) {
    return "abuse_neglect";
  }
  if (/homeless|evict|no place to stay|couch.?surf|housing/.test(lower)) {
    return "housing_instability";
  }
  if (/expuls|suspended|not allowed (at|in) school|locked out|exclusion/.test(lower)) {
    return "education_exclusion";
  }
  if (/lawyer|legal aid|court|rights violated/.test(lower)) {
    return "urgent_legal_assistance";
  }
  if (/rights|illegal|against the law|ferpa|iep/.test(lower)) {
    return "potential_rights_issue";
  }
  if (/teacher|principal|school|counselor|grade dispute/.test(lower)) {
    return "school_conflict";
  }
  return "non_emergency_advocacy";
}

export async function routeCrisisHelp(input: {
  text: string;
  jurisdiction?: string;
  category?: CrisisCategory;
  provider?: CrisisResourceProvider;
}): Promise<CrisisRouteResult> {
  const category = input.category || classifyCrisisCategory(input.text);
  const provider = input.provider || new InMemoryResourceRegistry();
  const resources = await provider.routeByCategory(category, input.jurisdiction);

  const orientation: string[] = [
    "You reached I Need Help Now. This guide orients you toward verified resources — it is not emergency dispatch.",
  ];
  if (category === "immediate_physical_danger") {
    orientation.push(
      "If you are in immediate physical danger, contact local emergency services right away using verified channels for your location.",
    );
  }
  orientation.push(
    "Resources below come only from the maintained directory. If a listing is missing, we will not invent a phone number.",
  );

  return {
    category,
    safety: {
      schemaVersion: "ZZAI-EduAdvocate/1.0",
      needsImmediateHelp:
        category === "immediate_physical_danger" ||
        category === "emotional_psychological_crisis" ||
        category === "abuse_neglect",
      routingCategory: category,
      jurisdictionHint: input.jurisdiction,
    },
    resources,
    orientation,
    disclaimers: [ROLE_BOUNDARY],
    usedVerifiedDirectoryOnly: true,
  };
}
