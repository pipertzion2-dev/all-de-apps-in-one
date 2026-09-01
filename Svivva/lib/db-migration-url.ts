/** Direct Postgres URL for DDL (Neon pooler cannot run CREATE TABLE reliably). */
export function getDatabaseMigrationUrl(): string | null {
  const unpooled =
    process.env.DATABASE_URL_UNPOOLED?.trim() ||
    process.env.POSTGRES_URL_NON_POOLING?.trim() ||
    process.env.POSTGRES_URL?.trim();
  if (unpooled) return unpooled;

  const pooled = process.env.DATABASE_URL?.trim();
  if (!pooled) return null;

  // Neon pooled hostnames include `-pooler`; derive direct URL when unpooled env is missing.
  if (pooled.includes("-pooler.")) {
    return pooled.replace("-pooler.", ".");
  }
  return pooled;
}

export function isPooledDatabaseUrl(url: string): boolean {
  return url.includes("-pooler.");
}
