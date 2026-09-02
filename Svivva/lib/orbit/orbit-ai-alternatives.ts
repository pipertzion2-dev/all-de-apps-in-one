import type { AiProvider } from "@/lib/llm/providers";
import { ORBIT_AGENT_PROVIDER_LABEL } from "@/lib/orbit/orbit-agent-mode";

/** One AI option Orbit can suggest when the active provider fails. */
export type OrbitAiAlternative = {
  id: AiProvider | "easypeasy" | "cursor-agent";
  name: string;
  why: string;
  priceLabel: string;
  setupHref: string;
  payUrl?: string;
  envKey: string;
  /** Lower = shown first */
  priority: number;
};

/** Ordered alternatives — Cloud Agent and templates need no keys; API keys optional. */
export const ORBIT_AI_ALTERNATIVES: OrbitAiAlternative[] = [
  {
    id: "cursor-agent",
    name: "Cursor Cloud Agent",
    why: "Uses the AI model in this agent session — agent writes content and runs orbit.mjs ingest. No API key.",
    priceLabel: "Included with Cursor",
    setupHref: "/dashboard/launchpad#orbit-agent-mode",
    envKey: "CURSOR_AGENT",
    priority: -1,
  },
  {
    id: "gemini",
    name: "Google Gemini",
    why: "Free tier — reliable daily Orbit runs with no word-quota surprises.",
    priceLabel: "Free",
    setupHref: "/dashboard/settings/runtime-keys",
    payUrl: "https://aistudio.google.com/apikey",
    envKey: "GEMINI_API_KEY",
    priority: 0,
  },
  {
    id: "openai",
    name: "OpenAI (direct)",
    why: "Best marketing copy quality — gpt-5 with gpt-4o fallback.",
    priceLabel: "~$10–30 prepaid credits",
    setupHref: "/dashboard/settings/runtime-keys",
    payUrl: "https://platform.openai.com/api-keys",
    envKey: "OPENAI_API_KEY",
    priority: 1,
  },
  {
    id: "easypeasy",
    name: "EasyPeasy.AI",
    why: "OpenAI-compatible gateway — only if you already have credits there.",
    priceLabel: "Credits · easy-peasy.ai",
    setupHref: "/dashboard/launchpad#orbit-easypeasy-setup",
    payUrl: "https://easy-peasy.ai/pricing",
    envKey: "EASYPEASY_API_KEY",
    priority: 10,
  },
];

export function getOrbitAiAlternatives(exclude?: (AiProvider | "easypeasy")[]): OrbitAiAlternative[] {
  const skip = new Set(exclude ?? []);
  return ORBIT_AI_ALTERNATIVES.filter((a) => !skip.has(a.id)).sort(
    (a, b) => a.priority - b.priority,
  );
}

export function orbitAiAlternativeActions(
  exclude?: (AiProvider | "easypeasy")[],
): { label: string; href: string }[] {
  return getOrbitAiAlternatives(exclude).slice(0, 3).map((a) => ({
    label: a.name,
    href: a.setupHref,
  }));
}

export function describeOrbitAiAlternatives(exclude?: (AiProvider | "easypeasy")[]): string {
  const alts = getOrbitAiAlternatives(exclude);
  if (alts.length === 0) return "";
  const names = alts.slice(0, 2).map((a) => a.name);
  const tail = alts.length > 2 ? ` or ${alts[2].name}` : "";
  return `Try ${names.join(" or ")}${tail} instead.`;
}
