/**
 * Resolve Postgres connection string from common host env names.
 * On Vercel, a copied `.env.example` DATABASE_URL (127.0.0.1) must not
 * override a real POSTGRES_URL / Neon URL from Storage integrations.
 */

const LOCALHOST = /(?:^|[/@])127\.0\.0\.1(?=[:/]|$)|(?:^|[/@])localhost(?=[:/]|$)/i;

const CANDIDATE_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "NEON_DATABASE_URL",
] as const;

export function isLocalDatabaseUrl(url: string): boolean {
  return LOCALHOST.test(url.trim());
}

export function isVercelRuntime(): boolean {
  return !!(process.env.VERCEL || process.env.VERCEL_ENV);
}

function readCandidate(key: (typeof CANDIDATE_KEYS)[number]): string | undefined {
  const v = process.env[key]?.trim();
  return v || undefined;
}

/** Pick the best Postgres URL for this runtime. */
export function resolveDatabaseUrl(): string | undefined {
  const byKey = Object.fromEntries(CANDIDATE_KEYS.map((k) => [k, readCandidate(k)])) as Record<
    (typeof CANDIDATE_KEYS)[number],
    string | undefined
  >;

  if (isVercelRuntime()) {
    for (const key of CANDIDATE_KEYS) {
      const url = byKey[key];
      if (url && !isLocalDatabaseUrl(url)) return url;
    }
    return byKey.DATABASE_URL ?? byKey.POSTGRES_URL;
  }

  return (
    byKey.DATABASE_URL ??
    byKey.POSTGRES_URL ??
    byKey.POSTGRES_PRISMA_URL ??
    byKey.POSTGRES_URL_NON_POOLING ??
    byKey.NEON_DATABASE_URL
  );
}

/** Sync `process.env.DATABASE_URL` when a better candidate exists. */
export function ensureDatabaseUrl(): string | undefined {
  const resolved = resolveDatabaseUrl();
  if (!resolved) return undefined;

  const current = process.env.DATABASE_URL?.trim();
  const shouldReplace =
    !current ||
    (isVercelRuntime() && isLocalDatabaseUrl(current) && resolved !== current);

  if (shouldReplace) process.env.DATABASE_URL = resolved;
  return process.env.DATABASE_URL?.trim() || resolved;
}
