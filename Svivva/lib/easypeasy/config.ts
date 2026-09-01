import { getOpenAIApiKey, getOpenAIBaseUrl } from "@/lib/env";
import { getPlatformRuntimeSecretsRow } from "@/lib/platform-runtime-secrets";
import {
  EASYPEASY_DEFAULT_TIER_ID,
  getEasyPeasyFallbacksForTier,
  getEasyPeasyModelForTier,
  resolveEasyPeasyTierId,
  type EasyPeasyTierId,
} from "@/lib/easypeasy/tiers";

/** OpenAI-compatible chat completions base URL. */
export const EASYPEASY_BASE_URL = "https://easy-peasy.ai/api";

/** Default model on EasyPeasy — override with EASYPEASY_MODEL or ORBIT_AI_MODEL. */
export const EASYPEASY_DEFAULT_MODEL = "gemini-3-flash";

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

export type EasyPeasyConfig = {
  apiKey: string | null;
  baseUrl: string;
  model: string;
  tierId: EasyPeasyTierId;
};

function trimKey(v: string | null | undefined): string | null {
  const t = v?.trim();
  return t || null;
}

function fromEnv(): EasyPeasyConfig {
  const envKey = trimKey(process.env.EASYPEASY_API_KEY);
  const openaiKey = trimKey(process.env.ORBIT_OPENAI_API_KEY || process.env.OPENAI_API_KEY);
  const base =
    trimKey(process.env.ORBIT_OPENAI_BASE_URL || process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) ||
    EASYPEASY_BASE_URL;

  if (envKey) {
    return {
      apiKey: envKey,
      baseUrl: EASYPEASY_BASE_URL,
      model: getEasyPeasyModel(),
      tierId: getEasyPeasyTierId(),
    };
  }

  if (openaiKey && isEasyPeasyBaseUrl(base)) {
    return {
      apiKey: openaiKey,
      baseUrl: EASYPEASY_BASE_URL,
      model: getEasyPeasyModel(),
      tierId: getEasyPeasyTierId(),
    };
  }

  return {
    apiKey: null,
    baseUrl: EASYPEASY_BASE_URL,
    model: getEasyPeasyModel(),
    tierId: EASYPEASY_DEFAULT_TIER_ID,
  };
}

export function mergeEasyPeasyConfig(
  db:
    | Partial<{ apiKey: string | null; baseUrl: string | null; tierId: string | null }>
    | null
    | undefined,
): EasyPeasyConfig {
  const env = fromEnv();
  const dbKey = trimKey(db?.apiKey);
  const dbBase = trimKey(db?.baseUrl);
  const dbTier = resolveEasyPeasyTierId(db?.tierId ?? undefined);

  if (env.apiKey) return env;

  if (dbKey && isEasyPeasyBaseUrl(dbBase)) {
    const tierId = dbTier;
    return {
      apiKey: dbKey,
      baseUrl: EASYPEASY_BASE_URL,
      model: getEasyPeasyModelForTier(tierId),
      tierId,
    };
  }

  return env;
}

export async function loadEasyPeasyConfig(): Promise<EasyPeasyConfig> {
  const row = await getPlatformRuntimeSecretsRow();
  return mergeEasyPeasyConfig(
    row
      ? {
          apiKey: row.openaiApiKey,
          baseUrl: row.openaiBaseUrl,
          tierId: row.easypeasyTier,
        }
      : null,
  );
}

export function isEasyPeasyActive(config: EasyPeasyConfig): boolean {
  return !!config.apiKey?.trim();
}

export function isEasyPeasyActiveNow(): boolean {
  return isEasyPeasyConfiguredFromEnv();
}
