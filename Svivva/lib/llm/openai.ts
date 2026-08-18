import OpenAI from "openai";
import {
  buildAiClient,
  buildOrbitAiClient,
  getActiveAiProvider,
  getDefaultModelForProvider,
  getModelFallbackChain,
  getOrbitActiveAiProvider,
  getOrbitDefaultModelForProvider,
  getOrbitModelFallbackChain,
  getOrbitAiProviderLabel,
  isAnyAiProviderAvailable,
  isOrbitAiConfigured,
  probeAndCacheOllama,
  resetProviderCache,
} from "@/lib/llm/providers";

export {
  probeAndCacheOllama,
  isAnyAiProviderAvailable,
  getActiveAiProvider,
  getOrbitActiveAiProvider,
  getOrbitAiProviderLabel,
  isOrbitAiConfigured,
  getRuntimeLabel,
  isOnVercelRuntime,
} from "@/lib/llm/providers";

let _client: OpenAI | null = null;
let _lastSig = "";
let _isOllama = false;
let _isGemini = false;
let _provider = getActiveAiProvider();

let _orbitClient: OpenAI | null = null;
let _orbitLastSig = "";
let _orbitProvider = getOrbitActiveAiProvider();
let _orbitIsGemini = false;
let _orbitIsOllama = false;

function getOrbitClientSync(): OpenAI {
  const sig = `${process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? ""}\0${process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ?? ""}\0${process.env.OPENAI_API_KEY ?? ""}\0${process.env.GEMINI_API_KEY ?? ""}\0${process.env.OLLAMA_URL ?? ""}\0${process.env.ORBIT_AI_PROVIDER ?? ""}`;
  if (!_orbitClient || sig !== _orbitLastSig) {
    const built = buildOrbitAiClient();
    _orbitClient = built.client;
    _orbitIsGemini = built.isGemini;
    _orbitIsOllama = built.isOllama;
    _orbitProvider = built.provider;
    _orbitLastSig = sig;
  }
  return _orbitClient;
}

export const orbitOpenai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    const client = getOrbitClientSync();
    const value = Reflect.get(client, prop, client);
    if (typeof value === "function") return value.bind(client);
    return value;
  },
});

export function getOrbitDefaultModel(): string {
  getOrbitClientSync();
  return getOrbitDefaultModelForProvider(_orbitProvider);
}

export function getOrbitModelChain(): string[] {
  getOrbitClientSync();
  return getOrbitModelFallbackChain(_orbitProvider);
}

export function isOrbitUsingGemini(): boolean {
  getOrbitClientSync();
  return _orbitIsGemini;
}

export function isOrbitUsingOllama(): boolean {
  getOrbitClientSync();
  return _orbitIsOllama;
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

export function resetOpenAIClientCache() {
  _client = null;
  _lastSig = "";
  _isOllama = false;
  _isGemini = false;
  _orbitClient = null;
  _orbitLastSig = "";
  _orbitIsGemini = false;
  _orbitIsOllama = false;
  resetProviderCache();
  _provider = getActiveAiProvider();
  _orbitProvider = getOrbitActiveAiProvider();
}

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
  return isOrbitAiConfigured();
}
