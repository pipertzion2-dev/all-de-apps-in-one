import OpenAI from "openai";
import { getGeminiApiKey, getOpenAIApiKey, getOpenAIBaseUrl, getOllamaUrl } from "@/lib/env";
import {
  getEasyPeasyModel,
  isEasyPeasyBaseUrl,
  isEasyPeasyConfiguredFromEnv,
} from "@/lib/easypeasy/config";

/** Paid OpenAI default for Orbit marketing — override with ORBIT_AI_MODEL in env. */
export const ORBIT_DEFAULT_OPENAI_MODEL = "gpt-5";

export type AiProvider = "gemini" | "openai" | "replit" | "ollama" | "none";

let cachedOllamaUrl: string | null | undefined;

export function resetProviderCache(): void {
  cachedOllamaUrl = undefined;
}

/** True on Vercel production/preview (zzaizzai.com, *.vercel.app). */
export function isOnVercelRuntime(): boolean {
  return !!(process.env.VERCEL || process.env.VERCEL_ENV);
}

export function isOnReplitRuntime(): boolean {
  return !!(
    process.env.REPL_ID ||
    process.env.REPLIT_DEPLOYMENT ||
    process.env.REPLIT_DEV_DOMAIN ||
    process.env.REPLIT_CLUSTER
  );
}

export function hasReplitAiIntegration(): boolean {
  return !!(
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY?.trim() &&
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL?.trim()
  );
}

export function getActiveAiProvider(): AiProvider {
  if (getGeminiApiKey()?.trim()) return "gemini";

  const openaiKey = getOpenAIApiKey()?.trim();
  const customBase = getOpenAIBaseUrl()?.trim();
  if (openaiKey && (customBase || openaiKey.startsWith("sk-"))) return "openai";
  if (openaiKey) return "openai";

  // Replit/Ollama are not used on Vercel — serverless has no localhost Ollama
  if (!isOnVercelRuntime()) {
    if (hasReplitAiIntegration()) return "replit";
    if (getOllamaUrl()?.trim() || cachedOllamaUrl) return "ollama";
  }

  return "none";
}

/**
 * Orbit marketing/admin AI — prefers paid OpenAI when a billing key is set.
 * Override with ORBIT_AI_PROVIDER=openai|gemini|ollama.
 */
export function getOrbitActiveAiProvider(): AiProvider {
  const forced = process.env.ORBIT_AI_PROVIDER?.trim().toLowerCase();
  const openaiKey = getOpenAIApiKey()?.trim();
  const geminiKey = getGeminiApiKey()?.trim();
  const customBase = getOpenAIBaseUrl()?.trim();

  if (forced === "openai" && openaiKey) return "openai";
  if (forced === "gemini" && geminiKey) return "gemini";
  if (forced === "ollama" && !isOnVercelRuntime()) {
    if (getOllamaUrl()?.trim() || cachedOllamaUrl) return "ollama";
  }

  // Default: paid OpenAI for Orbit when configured (sk- key or custom gateway base)
  if (openaiKey && (openaiKey.startsWith("sk-") || customBase)) return "openai";
  if (geminiKey) return "gemini";

  if (!isOnVercelRuntime()) {
    if (hasReplitAiIntegration()) return "replit";
    if (getOllamaUrl()?.trim() || cachedOllamaUrl) return "ollama";
  }

  if (openaiKey) return "openai";
  return "none";
}

export function isOrbitAiConfigured(): boolean {
  return getOrbitActiveAiProvider() !== "none";
}

function isEasyPeasyOpenAiRoute(): boolean {
  return isEasyPeasyConfiguredFromEnv();
}

export function getOrbitAiProviderLabel(provider: AiProvider = getOrbitActiveAiProvider()): string {
  switch (provider) {
    case "openai": {
      if (isEasyPeasyOpenAiRoute()) {
        return `EasyPeasy ${getEasyPeasyModel()}`;
      }
      const model = process.env.ORBIT_AI_MODEL?.trim() || ORBIT_DEFAULT_OPENAI_MODEL;
      return `OpenAI ${model}`;
    }
    case "gemini":
      return "Google Gemini";
    case "ollama":
      return "Ollama (local)";
    case "replit":
      return "Replit AI";
    default:
      return "none";
  }
}

export function isZeroConfigAiAvailable(): boolean {
  return getActiveAiProvider() !== "none" || cachedOllamaUrl != null;
}

export function isAnyAiProviderAvailable(): boolean {
  return isZeroConfigAiAvailable();
}

export function getRuntimeLabel(): string {
  if (isOnVercelRuntime()) return "vercel";
  if (isOnReplitRuntime()) return "replit";
  return "self-hosted";
}

export function getDefaultModelForProvider(provider: AiProvider = getActiveAiProvider()): string {
  switch (provider) {
    case "gemini":
      return "gemini-2.0-flash";
    case "replit":
    case "openai":
      return "gpt-4o-mini";
    case "ollama":
      return "llama3.2";
    default:
      return "gpt-4o-mini";
  }
}

/** Orbit marketing — stronger default for SEO copy, outreach, and launch packs. */
export function getOrbitDefaultModelForProvider(
  provider: AiProvider = getOrbitActiveAiProvider(),
): string {
  switch (provider) {
    case "gemini":
      return "gemini-2.0-flash";
    case "replit":
    case "openai":
      if (isEasyPeasyOpenAiRoute()) return getEasyPeasyModel();
      return ORBIT_DEFAULT_OPENAI_MODEL;
    case "ollama":
      return "llama3.2";
    default:
      return "gpt-4o-mini";
  }
}

export function getOrbitModelFallbackChain(
  provider: AiProvider = getOrbitActiveAiProvider(),
): string[] {
  switch (provider) {
    case "gemini":
      return ["gemini-2.0-flash", "gemini-1.5-flash"];
    case "replit":
    case "openai":
      if (isEasyPeasyOpenAiRoute()) {
        const primary = getEasyPeasyModel();
        return [primary, "gemini-3-flash", "gpt-4o-mini"];
      }
      return [ORBIT_DEFAULT_OPENAI_MODEL, "gpt-4o", "gpt-4o-mini"];
    case "ollama":
      return ["llama3.2", "llama3.1", "mistral"];
    default:
      return [];
  }
}

export function getModelFallbackChain(provider: AiProvider = getActiveAiProvider()): string[] {
  switch (provider) {
    case "gemini":
      return ["gemini-2.0-flash", "gemini-1.5-flash"];
    case "replit":
    case "openai":
      return ["gpt-4o-mini", "gpt-4o"];
    case "ollama":
      return ["llama3.2", "llama3.1", "mistral", "phi3"];
    default:
      return [];
  }
}

async function probeOllamaEndpoint(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/tags`, {
      signal: AbortSignal.timeout(1200),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Local dev only — skipped on Vercel. */
export async function probeAndCacheOllama(): Promise<string | null> {
  if (isOnVercelRuntime()) {
    cachedOllamaUrl = null;
    return null;
  }

  if (cachedOllamaUrl !== undefined) return cachedOllamaUrl;

  const explicit = getOllamaUrl()?.trim();
  if (explicit) {
    cachedOllamaUrl = explicit.replace(/\/$/, "");
    return cachedOllamaUrl;
  }

  if (process.env.NODE_ENV !== "development") {
    cachedOllamaUrl = null;
    return null;
  }

  const candidates = ["http://127.0.0.1:11434", "http://localhost:11434"];
  for (const url of candidates) {
    if (await probeOllamaEndpoint(url)) {
      cachedOllamaUrl = url;
      process.env.OLLAMA_URL = url;
      return url;
    }
  }

  cachedOllamaUrl = null;
  return null;
}

export function buildAiClient(provider: AiProvider = getActiveAiProvider()): {
  client: OpenAI;
  provider: AiProvider;
  isGemini: boolean;
  isOllama: boolean;
} {
  const geminiKey = getGeminiApiKey() ?? "";
  const ollamaUrl = getOllamaUrl() ?? cachedOllamaUrl ?? "";
  const openaiKey = getOpenAIApiKey() ?? "";
  const customBase = getOpenAIBaseUrl() ?? "";
  const onVercel = isOnVercelRuntime();

  if (provider === "gemini" && geminiKey.length > 10) {
    const client = new OpenAI({
      apiKey: geminiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });
    return { client, provider: "gemini", isGemini: true, isOllama: false };
  }

  if (provider === "openai") {
    if (customBase && openaiKey) {
      const client = new OpenAI({ apiKey: openaiKey, baseURL: customBase });
      return { client, provider: "openai", isGemini: false, isOllama: false };
    }
    if (openaiKey) {
      const client = new OpenAI({ apiKey: openaiKey });
      return { client, provider: "openai", isGemini: false, isOllama: false };
    }
  }

  if (provider === "replit" && !onVercel && hasReplitAiIntegration()) {
    const client = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY!,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL!,
    });
    return { client, provider: "replit", isGemini: false, isOllama: false };
  }

  if (provider === "ollama" && !onVercel && ollamaUrl) {
    const client = new OpenAI({
      apiKey: "ollama",
      baseURL: `${ollamaUrl.replace(/\/$/, "")}/v1`,
    });
    return { client, provider: "ollama", isGemini: false, isOllama: true };
  }

  // Fallback chain when requested provider is unavailable
  if (geminiKey.length > 10) {
    const client = new OpenAI({
      apiKey: geminiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });
    return { client, provider: "gemini", isGemini: true, isOllama: false };
  }

  if (customBase && openaiKey) {
    const client = new OpenAI({ apiKey: openaiKey, baseURL: customBase });
    return { client, provider: "openai", isGemini: false, isOllama: false };
  }

  if (openaiKey) {
    const client = new OpenAI({ apiKey: openaiKey });
    return { client, provider: "openai", isGemini: false, isOllama: false };
  }

  if (!onVercel && hasReplitAiIntegration()) {
    const client = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY!,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL!,
    });
    return { client, provider: "replit", isGemini: false, isOllama: false };
  }

  if (!onVercel && ollamaUrl) {
    const client = new OpenAI({
      apiKey: "ollama",
      baseURL: `${ollamaUrl.replace(/\/$/, "")}/v1`,
    });
    return { client, provider: "ollama", isGemini: false, isOllama: true };
  }

  const client = new OpenAI({ apiKey: "unconfigured", baseURL: "http://127.0.0.1:1/v1" });
  return { client, provider: "none", isGemini: false, isOllama: false };
}

/** Orbit marketing routes — paid OpenAI first when configured. */
export function buildOrbitAiClient(): {
  client: OpenAI;
  provider: AiProvider;
  isGemini: boolean;
  isOllama: boolean;
} {
  return buildAiClient(getOrbitActiveAiProvider());
}
