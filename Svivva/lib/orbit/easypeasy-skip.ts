import { getPlatformRuntimeSecretsRow, patchPlatformRuntimeSecrets } from "@/lib/platform-runtime-secrets";
import { isEasyPeasyWordLimitError } from "@/lib/orbit/orbit-error-messages";

export const EASYPEASY_SKIP_REASON_WORD_LIMIT = "word_limit";

/** True when EasyPeasy should not be probed (quota hit or env override). */
export async function isEasyPeasySkippedForOrbit(): Promise<boolean> {
  if (process.env.ORBIT_FORCE_EASYPEASY === "1") return false;
  if (process.env.ORBIT_SKIP_EASYPEASY === "1") return true;
  try {
    const row = await getPlatformRuntimeSecretsRow();
    return row?.easypeasySkipReason === EASYPEASY_SKIP_REASON_WORD_LIMIT;
  } catch {
    return false;
  }
}

/** Remember EasyPeasy word-limit failures so future runs skip the broken gateway. */
export async function markEasyPeasyWordLimitSkip(error?: string): Promise<void> {
  if (error && !isEasyPeasyWordLimitError(error)) return;
  try {
    await patchPlatformRuntimeSecrets({ easypeasySkipReason: EASYPEASY_SKIP_REASON_WORD_LIMIT });
  } catch (e) {
    console.warn("[orbit] could not persist EasyPeasy skip:", e);
  }
}

export function formatTemplateModeNotice(wasEasyPeasyOnly: boolean): string | undefined {
  if (!wasEasyPeasyOnly) return undefined;
  return "Using built-in templates — no quota limits. For AI-generated copy, add a free Gemini key in Settings or use Cursor Cloud Agent ingest.";
}
