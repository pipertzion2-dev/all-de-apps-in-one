/** Map Postgres / pg pool errors to operator-friendly copy. */
export function isDatabaseConnectionError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  const cause = error instanceof Error && error.cause instanceof Error ? error.cause.message : "";
  const combined = `${msg} ${cause}`.toLowerCase();
  return (
    combined.includes("econnrefused") ||
    combined.includes("enotfound") ||
    combined.includes("etimedout") ||
    combined.includes("connect refused") ||
    combined.includes("connection terminated") ||
    combined.includes("getaddrinfo")
  );
}

export function isMissingSeedCredentialsTableError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    /relation .*seed_credentials.* does not exist/i.test(msg) ||
    /relation .*platform_runtime_secrets.* does not exist/i.test(msg)
  );
}

export function isSchemaSetupError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    isMissingSeedCredentialsTableError(error) ||
    /DATABASE_URL_UNPOOLED/i.test(msg) ||
    /direct Postgres URL/i.test(msg) ||
    /Schema setup requires/i.test(msg)
  );
}

export function missingSeedCredentialsTableMessage(): string {
  return schemaSetupErrorMessage();
}

export function schemaSetupErrorMessage(): string {
  return "Database tables are not set up yet. In Vercel, connect Neon (prefix DATABASE) so both DATABASE_URL and DATABASE_URL_UNPOOLED are set, then redeploy. Tables are created on the direct (unpooled) connection.";
}

export function databaseConnectionErrorMessage(): string {
  return "Database connection failed (connect ECONNREFUSED). The server cannot reach Postgres — set DATABASE_URL in Vercel to your hosted database (Neon, Vercel Postgres, Supabase, etc.) and redeploy.";
}

export function formatDatabaseConnectionError(error: unknown): string | null {
  return isDatabaseConnectionError(error) ? databaseConnectionErrorMessage() : null;
}
