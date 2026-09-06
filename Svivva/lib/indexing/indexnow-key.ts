import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { desc, eq, isNotNull } from "drizzle-orm";
import { getSiteUrl } from "@/lib/site-url";

const KEY_FILE_RE = /^[0-9a-f]{32}$/i;

function normalizeKey(key: string | null | undefined): string | null {
  const trimmed = key?.trim().toLowerCase() ?? "";
  return KEY_FILE_RE.test(trimmed) ? trimmed : null;
}

/** Read a bundled `{key}.txt` from `public/` (deploy-time fallback when DB is empty). */
async function readPublicKeyFile(requested: string): Promise<string | null> {
  const key = normalizeKey(requested);
  if (!key) return null;
  try {
    const filePath = path.join(process.cwd(), "public", `${key}.txt`);
    const body = (await readFile(filePath, "utf8")).trim().toLowerCase();
    return body === key ? body : null;
  } catch {
    return null;
  }
}

/** First valid `{32hex}.txt` in `public/` when no DB/env key exists. */
async function discoverBundledIndexNowKey(): Promise<string | null> {
  try {
    const publicDir = path.join(process.cwd(), "public");
    const files = await readdir(publicDir);
    for (const file of files) {
      const match = file.match(/^([0-9a-f]{32})\.txt$/i);
      if (!match) continue;
      const key = match[1].toLowerCase();
      const body = (await readFile(path.join(publicDir, file), "utf8")).trim().toLowerCase();
      if (body === key) return key;
    }
  } catch {
    /* no public dir in some test environments */
  }
  return null;
}

/** Resolve a key by id: DB row → INDEXNOW_KEY env → bundled public file. */
export async function resolveIndexNowKey(requested?: string | null): Promise<string | null> {
  const normalized = normalizeKey(requested);
  if (normalized) {
    const [row] = await db
      .select({ indexnowKey: seedCredentials.indexnowKey })
      .from(seedCredentials)
      .where(eq(seedCredentials.indexnowKey, normalized))
      .limit(1);
    if (row?.indexnowKey) return row.indexnowKey.trim().toLowerCase();

    const envKey = normalizeKey(process.env.INDEXNOW_KEY);
    if (envKey === normalized) return envKey;

    return readPublicKeyFile(normalized);
  }

  return getActiveIndexNowKey();
}

/** Latest IndexNow key from env, DB, or bundled public file. */
export async function getActiveIndexNowKey(): Promise<string | null> {
  const envKey = normalizeKey(process.env.INDEXNOW_KEY);
  if (envKey) return envKey;

  const [row] = await db
    .select({ indexnowKey: seedCredentials.indexnowKey })
    .from(seedCredentials)
    .where(isNotNull(seedCredentials.indexnowKey))
    .orderBy(desc(seedCredentials.updatedAt))
    .limit(1);
  const dbKey = normalizeKey(row?.indexnowKey);
  if (dbKey) return dbKey;

  return discoverBundledIndexNowKey();
}

export type IndexNowKeyFileCheck = {
  ok: boolean;
  httpStatus: number;
  keyLocation: string;
  detail: string;
};

/** Verify the public `{key}.txt` file matches the stored key (IndexNow requirement). */
export async function verifyIndexNowKeyFile(key: string): Promise<IndexNowKeyFileCheck> {
  const normalized = normalizeKey(key);
  if (!normalized) {
    return {
      ok: false,
      httpStatus: 0,
      keyLocation: "",
      detail: "Invalid IndexNow key format.",
    };
  }

  const baseUrl = getSiteUrl().replace(/\/$/, "");
  const keyLocation = `${baseUrl}/${normalized}.txt`;
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
    const body = (await res.text()).trim().toLowerCase();
    if (body !== normalized) {
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
      detail: `Key file OK at /${normalized}.txt`,
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
