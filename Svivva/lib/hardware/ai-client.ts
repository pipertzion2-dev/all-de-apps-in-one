import OpenAI from "openai";
import { getGeminiApiKey, getOpenAIApiKey, getOpenAIBaseUrl } from "@/lib/env";
import {
  getEasyPeasyModel,
  getEasyPeasyModelFallbackChain,
  isEasyPeasyConfiguredFromEnv,
} from "@/lib/easypeasy/runtime";
import {
  buildAiClient,
  getDefaultModelForProvider,
  getModelFallbackChain,
  isDirectOpenAiConfigured,
  type AiProvider,
} from "@/lib/llm/providers";
import { resetOpenAIClientCache } from "@/lib/llm/openai";
import { isEasyPeasyWordLimitError } from "@/lib/orbit/orbit-error-messages";
import { hydratePlatformSecrets } from "@/lib/platform-runtime-secrets";

export type VisionUserContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string; detail?: "low" | "high" | "auto" } }
    >;

type ProviderAttempt = {
  id: AiProvider | "easypeasy";
  label: string;
  client: OpenAI;
  models: string[];
};

export type HardwareChatResult = {
  text: string;
  provider: string;
  model: string;
  usedFallback: boolean;
};

function buildGeminiClient(): OpenAI | null {
  const key = getGeminiApiKey()?.trim();
  if (!key || key.length < 10) return null;
  return new OpenAI({
    apiKey: key,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  });
}

function buildDirectOpenAiClient(): OpenAI | null {
  const key =
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.ORBIT_OPENAI_API_KEY?.trim() ||
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY?.trim();
  if (!key?.startsWith("sk-")) return null;
  const base = getOpenAIBaseUrl()?.trim();
  if (base && base.includes("easy-peasy.ai")) return null;
  if (base) return new OpenAI({ apiKey: key, baseURL: base });
  return new OpenAI({ apiKey: key });
}

function buildEasyPeasyClient(): OpenAI | null {
  if (!isEasyPeasyConfiguredFromEnv()) return null;
  const key = getOpenAIApiKey()?.trim();
  const base = getOpenAIBaseUrl()?.trim();
  if (!key || !base) return null;
  return new OpenAI({ apiKey: key, baseURL: base });
}

function uniqueModels(...lists: string[][]): string[] {
  return [...new Set(lists.flat().filter(Boolean))];
}

/** Ordered providers for Hardware Builder — Gemini and direct OpenAI before EasyPeasy. */
export function getHardwareProviderAttempts(): ProviderAttempt[] {
  const attempts: ProviderAttempt[] = [];

  const gemini = buildGeminiClient();
  if (gemini) {
    attempts.push({
      id: "gemini",
      label: "Google Gemini",
      client: gemini,
      models: uniqueModels(
        [getDefaultModelForProvider("gemini")],
        getModelFallbackChain("gemini"),
      ),
    });
  }

  const direct = buildDirectOpenAiClient();
  if (direct) {
    attempts.push({
      id: "openai",
      label: "OpenAI",
      client: direct,
      models: uniqueModels(
        [getDefaultModelForProvider("openai")],
        getModelFallbackChain("openai"),
        ["gpt-4o", "gpt-4o-mini"],
      ),
    });
  }

  const easyPeasy = buildEasyPeasyClient();
  if (easyPeasy && !isDirectOpenAiConfigured()) {
    attempts.push({
      id: "easypeasy",
      label: "EasyPeasy.AI",
      client: easyPeasy,
      models: uniqueModels([getEasyPeasyModel()], getEasyPeasyModelFallbackChain()),
    });
  }

  if (attempts.length === 0) {
    const built = buildAiClient();
    if (built.provider !== "none") {
      attempts.push({
        id: built.provider,
        label: built.provider === "gemini" ? "Google Gemini" : "OpenAI",
        client: built.client,
        models: uniqueModels(
          [getDefaultModelForProvider(built.provider)],
          getModelFallbackChain(built.provider),
        ),
      });
    }
  }

  return attempts;
}

function isRetryableModelError(e: unknown): boolean {
  const msg = String(e instanceof Error ? e.message : e);
  if (isEasyPeasyWordLimitError(msg)) return false;
  const lower = msg.toLowerCase();
  if (lower.includes("rate limit")) return true;
  if (lower.includes("401") || lower.includes("403") || lower.includes("invalid api key"))
    return false;
  return (
    lower.includes("model") &&
    (lower.includes("not found") ||
      lower.includes("does not exist") ||
      lower.includes("invalid") ||
      lower.includes("unsupported"))
  );
}

function isProviderLevelFailure(e: unknown): boolean {
  const msg = String(e instanceof Error ? e.message : e);
  return (
    isEasyPeasyWordLimitError(msg) ||
    msg.toLowerCase().includes("401") ||
    msg.toLowerCase().includes("403") ||
    msg.toLowerCase().includes("invalid api key") ||
    msg.toLowerCase().includes("not configured")
  );
}

export async function hardwareChatCompletion(opts: {
  system: string;
  userContent: VisionUserContent;
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
}): Promise<HardwareChatResult> {
  await hydratePlatformSecrets();
  resetOpenAIClientCache();

  const attempts = getHardwareProviderAttempts();
  if (attempts.length === 0) {
    throw new Error("No AI provider configured for Hardware Builder.");
  }

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: opts.system },
    { role: "user", content: opts.userContent as OpenAI.Chat.ChatCompletionContentPart[] },
  ];

  let lastError: unknown;

  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i]!;
    for (const model of attempt.models) {
      try {
        const res = await attempt.client.chat.completions.create({
          model,
          messages,
          max_tokens: opts.maxTokens ?? 2000,
          temperature: opts.temperature ?? 0.5,
          ...(opts.jsonMode ? { response_format: { type: "json_object" as const } } : {}),
        });
        const text = res.choices[0]?.message?.content?.trim() ?? "";
        if (!text) {
          lastError = new Error("Empty response from AI provider");
          continue;
        }
        return {
          text,
          provider: attempt.label,
          model,
          usedFallback: i > 0,
        };
      } catch (e) {
        lastError = e;
        if (isProviderLevelFailure(e)) break;
        if (!isRetryableModelError(e)) break;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError ?? "AI request failed"));
}
