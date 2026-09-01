import { getPlatformRuntimeSecretsRow } from "@/lib/platform-runtime-secrets";
import {
  EASYPEASY_DEFAULT_TIER_ID,
  getEasyPeasyModelForTier,
  resolveEasyPeasyTierId,
  type EasyPeasyTierId,
} from "@/lib/easypeasy/tiers";
export { EASYPEASY_BASE_URL, EASYPEASY_DEFAULT_MODEL } from "@/lib/easypeasy/constants";
import { EASYPEASY_BASE_URL } from "@/lib/easypeasy/constants";
import {
  getEasyPeasyModel,
  getEasyPeasyTierId,
  isEasyPeasyBaseUrl,
  isEasyPeasyConfiguredFromEnv,
} from "@/lib/easypeasy/runtime";

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

export { isEasyPeasyConfiguredFromEnv, isEasyPeasyBaseUrl };
