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

export function databaseConnectionErrorMessage(): string {
  return "Database connection failed (connect ECONNREFUSED). The server cannot reach Postgres — set DATABASE_URL in Vercel to your hosted database (Neon, Vercel Postgres, Supabase, etc.) and redeploy.";
}

export function formatDatabaseConnectionError(error: unknown): string | null {
  return isDatabaseConnectionError(error) ? databaseConnectionErrorMessage() : null;
}
