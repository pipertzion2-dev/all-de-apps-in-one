import OpenAI from "openai";
import {
  buildAiClient,
  getActiveAiProvider,
  getDefaultModelForProvider,
  getModelFallbackChain,
  isAnyAiProviderAvailable,
  probeAndCacheOllama,
  resetProviderCache,
} from "@/lib/llm/providers";

export {
  probeAndCacheOllama,
  isAnyAiProviderAvailable,
  getActiveAiProvider,
} from "@/lib/llm/providers";

let _client: OpenAI | null = null;
let _lastSig = "";
let _isOllama = false;
let _isGemini = false;
let _provider = getActiveAiProvider();

export function resetOpenAIClientCache() {
  _client = null;
  _lastSig = "";
  _isOllama = false;
  _isGemini = false;
  resetProviderCache();
  _provider = getActiveAiProvider();
}

function getClientSync(): OpenAI {
  const sig = `${process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? ""}\0${process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ?? ""}\0${process.env.OPENAI_API_KEY ?? ""}\0${process.env.GEMINI_API_KEY ?? ""}\0${process.env.OLLAMA_URL ?? ""}`;
  if (!_client || sig !== _lastSig) {
    const built = buildAiClient();
    _client = built.client;
    _isOllama = built.isOllama;
    _isGemini = built.isGemini;
    _provider = built.provider;
    _lastSig = sig;
  }
  return _client;
}

export function isUsingOllama(): boolean {
  getClientSync();
  return _isOllama;
}

export function isUsingGemini(): boolean {
  getClientSync();
  return _isGemini;
}

export function isUsingReplitAi(): boolean {
  getClientSync();
  return _provider === "replit";
}

export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    const client = getClientSync();
    const value = Reflect.get(client, prop, client);
    if (typeof value === "function") return value.bind(client);
    return value;
  },
});

export const DEFAULT_MODEL = "gpt-4o-mini";

export function getDefaultModel(): string {
  getClientSync();
  return getDefaultModelForProvider(_provider);
}

export function getPlayModelChain(): string[] {
  getClientSync();
  const chain = getModelFallbackChain(_provider);
  const primary = getDefaultModel();
  return [...new Set([primary, ...chain])];
}

export function isOrbitFreeAIConfigured(): boolean {
  return isAnyAiProviderAvailable();
}
