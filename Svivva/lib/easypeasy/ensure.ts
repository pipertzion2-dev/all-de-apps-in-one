import {
  hydratePlatformSecrets,
  patchPlatformRuntimeSecrets,
  getPlatformRuntimeSecretsRow,
} from "@/lib/platform-runtime-secrets";
import {
  EASYPEASY_BASE_URL,
  isEasyPeasyActive,
  loadEasyPeasyConfig,
  mergeEasyPeasyConfig,
} from "@/lib/easypeasy/config";
import { testEasyPeasyConnection } from "@/lib/easypeasy/client";
import {
  EASYPEASY_DEFAULT_TIER_ID,
  getEasyPeasyModelForTier,
  resolveEasyPeasyTierId,
  type EasyPeasyTierId,
} from "@/lib/easypeasy/tiers";
import { isEasyPeasyWordLimitError } from "@/lib/orbit/orbit-error-messages";

export type EnsureEasyPeasyResult = {
  ok: boolean;
  active: boolean;
  tierId: EasyPeasyTierId;
  model: string;
  tested: boolean;
  testReply?: string;
  error?: string;
  /** True when this call wrote key/base/tier to platform secrets */
  configuredNow: boolean;
};

export type EnsureEasyPeasyOptions = {
  /** Tier to apply when missing or when forceTier is true */
  tierId?: EasyPeasyTierId;
  /** Always patch tier even if one is already stored */
  forceTier?: boolean;
  /** Ping chat completions before returning */
  testConnection?: boolean;
};

/** Orbit defaults to Standard — Premium burns paid word quota and is never auto-selected. */
export async function migrateStoredPremiumTierIfNeeded(): Promise<{
  migrated: boolean;
  tierId: EasyPeasyTierId;
}> {
  await hydratePlatformSecrets();
  const row = await getPlatformRuntimeSecretsRow();
  const stored = row?.easypeasyTier?.trim().toLowerCase();
  if (stored === "premium") {
    await patchPlatformRuntimeSecrets({ easypeasyTier: EASYPEASY_DEFAULT_TIER_ID });
    await hydratePlatformSecrets();
    return { migrated: true, tierId: EASYPEASY_DEFAULT_TIER_ID };
  }
  return { migrated: false, tierId: resolveEasyPeasyTierId(row?.easypeasyTier) };
}

function resolveOrbitEasyPeasyTier(
  opts: EnsureEasyPeasyOptions,
  storedTier: string | null | undefined,
): EasyPeasyTierId {
  if (opts.tierId && opts.forceTier) {
    return resolveEasyPeasyTierId(opts.tierId);
  }
  if (storedTier?.trim().toLowerCase() === "premium") {
    return EASYPEASY_DEFAULT_TIER_ID;
  }
  return resolveEasyPeasyTierId(opts.tierId ?? storedTier ?? process.env.EASYPEASY_TIER);
}

/**
 * Idempotent: hydrates secrets, ensures EasyPeasy base URL + tier, optionally tests API.
 * Used by Orbit one-click admin before marketing autopilot runs.
 */
export async function ensureEasyPeasyForOrbit(
  opts: EnsureEasyPeasyOptions = {},
): Promise<EnsureEasyPeasyResult> {
  await hydratePlatformSecrets();

  let configuredNow = false;
  const row = await getPlatformRuntimeSecretsRow();
  const storedTier = row?.easypeasyTier?.trim();
  const tierId = resolveOrbitEasyPeasyTier(opts, storedTier);

  const envKey = process.env.EASYPEASY_API_KEY?.trim();
  let config = await loadEasyPeasyConfig();

  const patch: Parameters<typeof patchPlatformRuntimeSecrets>[0] = {};

  if (envKey && !config.apiKey) {
    patch.openaiApiKey = envKey;
    patch.openaiBaseUrl = EASYPEASY_BASE_URL;
    configuredNow = true;
  }

  const storedNormalized = storedTier?.toLowerCase();
  const shouldMigratePremium =
    storedNormalized === "premium" && !(opts.tierId === "premium" && opts.forceTier);
  const shouldApplyTier =
    shouldMigratePremium ||
    (opts.tierId && (opts.forceTier || !storedTier || storedTier !== tierId)) ||
    !storedTier;

  if (shouldApplyTier) {
    const targetTier = shouldMigratePremium ? EASYPEASY_DEFAULT_TIER_ID : tierId;
    if (shouldMigratePremium || opts.forceTier || !storedTier || storedTier !== targetTier) {
      patch.easypeasyTier = targetTier;
      configuredNow = true;
    }
  }

  if (Object.keys(patch).length > 0) {
    await patchPlatformRuntimeSecrets(patch);
    await hydratePlatformSecrets();
    config = await loadEasyPeasyConfig();
  }

  if (!isEasyPeasyActive(config)) {
    const merged = mergeEasyPeasyConfig(
      config.apiKey
        ? { apiKey: config.apiKey, baseUrl: config.baseUrl, tierId: config.tierId }
        : null,
    );
    if (!isEasyPeasyActive(merged)) {
      return {
        ok: false,
        active: false,
        tierId: EASYPEASY_DEFAULT_TIER_ID,
        model: merged.model,
        tested: false,
        configuredNow,
        error:
          "EasyPeasy is not configured — paste your API key in Launchpad or set EASYPEASY_API_KEY in Vercel.",
      };
    }
    config = merged;
  }

  const resolvedTier = resolveEasyPeasyTierId(
    patch.easypeasyTier ?? config.tierId ?? EASYPEASY_DEFAULT_TIER_ID,
  );
  let tested = false;
  let testReply: string | undefined;
  let error: string | undefined;

  if (opts.testConnection !== false) {
    const test = await testEasyPeasyConnection({
      apiKey: config.apiKey!,
      model: config.model,
    });
    tested = true;
    if (test.ok) {
      testReply = test.reply;
    } else {
      error = test.error;
      if (isEasyPeasyWordLimitError(test.error) && resolvedTier !== "standard") {
        await patchPlatformRuntimeSecrets({ easypeasyTier: "standard" });
        await hydratePlatformSecrets();
        config = await loadEasyPeasyConfig();
        const standardModel = getEasyPeasyModelForTier("standard");
        const retry = await testEasyPeasyConnection({
          apiKey: config.apiKey!,
          model: standardModel,
        });
        if (retry.ok) {
          return {
            ok: true,
            active: true,
            tierId: "standard",
            model: standardModel,
            tested: true,
            testReply: retry.reply,
            configuredNow: true,
          };
        }
        error = retry.error ?? test.error;
      }
      return {
        ok: false,
        active: true,
        tierId: resolvedTier,
        model: config.model,
        tested,
        testReply,
        configuredNow,
        error,
      };
    }
  }

  return {
    ok: true,
    active: true,
    tierId: resolvedTier,
    model: config.model,
    tested,
    testReply,
    configuredNow,
    error,
  };
}
