import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { desc, isNotNull } from "drizzle-orm";
import { getSiteUrl } from "@/lib/site-url";

/** Latest IndexNow key from any `seed_credentials` row (canonical for submissions). */
export async function getActiveIndexNowKey(): Promise<string | null> {
  const [row] = await db
    .select({ indexnowKey: seedCredentials.indexnowKey })
    .from(seedCredentials)
    .where(isNotNull(seedCredentials.indexnowKey))
    .orderBy(desc(seedCredentials.updatedAt))
    .limit(1);
  return row?.indexnowKey?.trim() || null;
}

export type IndexNowKeyFileCheck = {
  ok: boolean;
  httpStatus: number;
  keyLocation: string;
  detail: string;
};

/** Verify the public `{key}.txt` file matches the stored key (IndexNow requirement). */
export async function verifyIndexNowKeyFile(key: string): Promise<IndexNowKeyFileCheck> {
  const baseUrl = getSiteUrl().replace(/\/$/, "");
  const keyLocation = `${baseUrl}/${key}.txt`;
  try {
    const res = await fetch(keyLocation, {
      method: "GET",
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });
    if (!res.ok) {
      return {
        ok: false,
        httpStatus: res.status,
        keyLocation,
        detail: `Key file returned HTTP ${res.status} — deploy must serve /{key}.txt before IndexNow accepts URLs.`,
      };
    }
    const body = (await res.text()).trim();
    if (body !== key) {
      return {
        ok: false,
        httpStatus: res.status,
        keyLocation,
        detail: "Key file body does not match stored key — re-run IndexNow setup in Orbit.",
      };
    }
    return {
      ok: true,
      httpStatus: res.status,
      keyLocation,
      detail: `Key file OK at /${key}.txt`,
    };
  } catch {
    return {
      ok: false,
      httpStatus: 0,
      keyLocation,
      detail: "Could not reach IndexNow key file — check NEXT_PUBLIC_SITE_URL and deployment.",
    };
  }
}
