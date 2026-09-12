import { isEasyPeasyWordLimitError } from "@/lib/orbit/orbit-error-messages";
import { describeOrbitAiAlternatives } from "@/lib/orbit/orbit-ai-alternatives";

export type HardwareAiErrorHint = {
  title: string;
  detail: string;
  actions: { label: string; href: string }[];
};

/** Short banner when heuristic fallback succeeded — not an error. */
export function hardwareAiFallbackNotice(context: "sketch" | "suppliers" | "deposit"): string {
  if (context === "sketch") {
    return "Starter brief loaded from your notes. Add a free Gemini key below for full sketch vision.";
  }
  if (context === "deposit") {
    return "Starter analysis loaded from your image fingerprint. Add a free Gemini key for full vision read.";
  }
  return "Starter supplier list loaded. Add a free Gemini key below for AI-tailored manufacturer matches.";
}

/** Turn raw AI failures into actionable Hardware Builder copy. */
export function formatHardwareAiError(raw: string): HardwareAiErrorHint {
  if (isEasyPeasyWordLimitError(raw)) {
    return {
      title: "AI word limit reached",
      detail: `EasyPeasy quota is used up. ${describeOrbitAiAlternatives(["easypeasy"])} A starter pack is shown below so you can keep building.`,
      actions: [
        { label: "Add Gemini (free)", href: "/dashboard/settings/runtime-keys" },
        { label: "OpenAI direct", href: "https://platform.openai.com/api-keys" },
      ],
    };
  }

  if (
    raw.toLowerCase().includes("401") ||
    raw.toLowerCase().includes("403") ||
    raw.toLowerCase().includes("invalid api key")
  ) {
    return {
      title: "AI API key rejected",
      detail: `${raw} Check Platform Secrets or add Google Gemini (free tier).`,
      actions: [{ label: "Platform Secrets", href: "/dashboard/settings/runtime-keys" }],
    };
  }

  if (raw.toLowerCase().includes("not configured") || raw.toLowerCase().includes("no ai")) {
    return {
      title: "No AI provider configured",
      detail:
        "Add GEMINI_API_KEY (free) or OPENAI_API_KEY in Platform Secrets, or use the written brief path without sketch analysis.",
      actions: [{ label: "Platform Secrets", href: "/dashboard/settings/runtime-keys" }],
    };
  }

  return {
    title: "AI request failed",
    detail: raw,
    actions: [{ label: "Platform Secrets", href: "/dashboard/settings/runtime-keys" }],
  };
}
