import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { desc, eq, isNotNull } from "drizzle-orm";
import { isLegacyBrandSlug, slugFromPublicUrl } from "@/lib/seo/legacy-paths";
import { getSiteUrl } from "@/lib/site-url";

/** IndexNow allows large batches; stay under 10k URLs and reasonable JSON size per request. */
const INDEXNOW_CHUNK_SIZE = 5000;

export type IndexNowSubmitResult = {
  ok: boolean;
  submittedCount: number;
  totalUrls: number;
  chunks: number;
  message: string;
  lastHttpStatus: number;
};

export type SubmitIndexNowOptions = {
  /** Use this key instead of loading the latest row from `seed_credentials`. */
  indexnowKey?: string | null;
  /** When false, callers update `last_indexnow_submit` themselves (e.g. per-user marketing row). */
  updateMatchingCredentialRows?: boolean;
};

/**
 * Submit URLs to IndexNow in chunks. `keyLocation` must be `https://host/{key}.txt` (see middleware).
 */
export async function submitIndexNowBatched(
  urls: string[],
  options?: SubmitIndexNowOptions,
): Promise<IndexNowSubmitResult> {
  const indexableUrls = urls.filter((url) => {
    const slug = slugFromPublicUrl(url);
    return !slug || !isLegacyBrandSlug(slug);
  });
  const totalUrls = indexableUrls.length;
  if (totalUrls === 0) {
    return {
      ok: true,
      submittedCount: 0,
      totalUrls: 0,
      chunks: 0,
      message: "No URLs to submit.",
      lastHttpStatus: 0,
    };
  }

  let key = options?.indexnowKey?.trim() || null;
  if (!key) {
    const [credRow] = await db
      .select({ indexnowKey: seedCredentials.indexnowKey })
      .from(seedCredentials)
      .where(isNotNull(seedCredentials.indexnowKey))
      .orderBy(desc(seedCredentials.updatedAt))
      .limit(1);
    key = credRow?.indexnowKey ?? null;
  }

  if (!key) {
    return {
      ok: false,
      submittedCount: 0,
      totalUrls,
      chunks: 0,
      message: "No IndexNow key — run IndexNow setup in Orbit (or Marketing) first.",
      lastHttpStatus: 0,
    };
  }

  const baseUrl = getSiteUrl().replace(/\/$/, "");
  const host = baseUrl.replace(/^https?:\/\//, "");
  const keyLocation = `${baseUrl}/${key}.txt`;

  let submittedCount = 0;
  let lastHttpStatus = 0;
  let allAccepted = true;
  const chunks = Math.ceil(indexableUrls.length / INDEXNOW_CHUNK_SIZE);

  for (let i = 0; i < indexableUrls.length; i += INDEXNOW_CHUNK_SIZE) {
    const chunk = indexableUrls.slice(i, i + INDEXNOW_CHUNK_SIZE);
    const body = JSON.stringify({ host, key, keyLocation, urlList: chunk });

    let status = 0;
    try {
      const res = await fetch("https://api.indexnow.org/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body,
        signal: AbortSignal.timeout(60_000),
      });
      status = res.status;
      lastHttpStatus = status;

      fetch("https://www.bing.com/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body,
        signal: AbortSignal.timeout(60_000),
      }).catch(() => {});
    } catch {
      lastHttpStatus = 0;
      allAccepted = false;
      continue;
    }

    if (status === 200 || status === 202) {
      submittedCount += chunk.length;
    } else {
      allAccepted = false;
    }
  }

  const shouldTouchDb = options?.updateMatchingCredentialRows !== false;
  const fullySubmitted = submittedCount === totalUrls;
  const substantiallySubmitted = totalUrls > 0 && submittedCount >= Math.ceil(totalUrls * 0.98);
  if (shouldTouchDb && (fullySubmitted || substantiallySubmitted)) {
    await db
      .update(seedCredentials)
      .set({ lastIndexnowSubmit: new Date(), updatedAt: new Date() })
      .where(eq(seedCredentials.indexnowKey, key));
  }

  const ok = fullySubmitted || substantiallySubmitted;
  const statusMsg =
    lastHttpStatus === 403
      ? `IndexNow key verification failed (403) — key must be reachable at ${keyLocation}`
      : lastHttpStatus === 422
        ? "IndexNow invalid URL format (422)"
        : lastHttpStatus === 400
          ? "IndexNow bad request (400)"
          : lastHttpStatus === 0
            ? "IndexNow: timeout or network error on at least one chunk"
            : !ok
              ? `IndexNow: only ${submittedCount}/${totalUrls} URLs accepted across ${chunks} chunk(s); last HTTP ${lastHttpStatus}`
              : "";

  return {
    ok,
    submittedCount,
    totalUrls,
    chunks,
    message: ok
      ? `✓ ${submittedCount} URLs submitted in ${chunks} IndexNow request(s) (Bing / partners)`
      : statusMsg || `IndexNow incomplete (${submittedCount}/${totalUrls})`,
    lastHttpStatus,
  };
}
