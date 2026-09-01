import { getOpenAIApiKey, getOpenAIBaseUrl } from "@/lib/env";
import {
  getEasyPeasyFallbacksForTier,
  getEasyPeasyModelForTier,
  resolveEasyPeasyTierId,
  type EasyPeasyTierId,
} from "@/lib/easypeasy/tiers";
import { EASYPEASY_BASE_URL } from "@/lib/easypeasy/constants";

/** Env/runtime helpers safe to import from shared modules (no DB). */

export function isEasyPeasyBaseUrl(url: string | null | undefined): boolean {
  const t = url?.trim().toLowerCase();
  if (!t) return false;
  return t.includes("easy-peasy.ai");
}

export function getEasyPeasyTierId(): EasyPeasyTierId {
  return resolveEasyPeasyTierId(process.env.EASYPEASY_TIER);
}

export function getEasyPeasyModel(): string {
  if (process.env.EASYPEASY_MODEL?.trim()) return process.env.EASYPEASY_MODEL.trim();
  if (process.env.ORBIT_AI_MODEL?.trim()) return process.env.ORBIT_AI_MODEL.trim();
  return getEasyPeasyModelForTier(getEasyPeasyTierId());
}

export function getEasyPeasyModelFallbackChain(): string[] {
  return getEasyPeasyFallbacksForTier(getEasyPeasyTierId());
}

export function isEasyPeasyConfiguredFromEnv(): boolean {
  if (process.env.EASYPEASY_API_KEY?.trim()) return true;
  const key = getOpenAIApiKey()?.trim();
  const base = getOpenAIBaseUrl()?.trim();
  return !!(key && base && isEasyPeasyBaseUrl(base));
}

export function isEasyPeasyActiveNow(): boolean {
  return isEasyPeasyConfiguredFromEnv();
}

export { EASYPEASY_BASE_URL };
