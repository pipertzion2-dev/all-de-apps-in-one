import { isEasyPeasyWordLimitError } from "@/lib/orbit/orbit-error-messages";
import { describeOrbitAiAlternatives } from "@/lib/orbit/orbit-ai-alternatives";

export type HardwareAiErrorHint = {
  title: string;
  detail: string;
  actions: { label: string; href: string }[];
};

/** Turn raw AI failures into actionable Hardware Builder copy. */
export function formatHardwareAiError(raw: string): HardwareAiErrorHint {
  if (isEasyPeasyWordLimitError(raw)) {
    return {
      title: "AI word limit reached",
      detail: `EasyPeasy quota is used up. ${describeOrbitAiAlternatives(["easypeasy"])} We can still pre-fill your brief from your notes — try again or switch to a written brief.`,
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
