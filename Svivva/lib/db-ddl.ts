import pg from "pg";
import { getDatabaseMigrationUrl, isPooledDatabaseUrl } from "@/lib/db-migration-url";

/** Run DDL on a direct (non-pooler) connection — required for Neon CREATE TABLE. */
export async function executeDatabaseDdl(query: string): Promise<void> {
  const url = getDatabaseMigrationUrl();
  if (!url) {
    throw new Error("DATABASE_URL is not configured");
  }
  if (isPooledDatabaseUrl(url)) {
    throw new Error(
      "Schema setup requires a direct Postgres URL (DATABASE_URL_UNPOOLED). Neon pooler cannot create tables.",
    );
  }

  const client = new pg.Client({ connectionString: url });
  try {
    await client.connect();
    await client.query(query);
  } finally {
    await client.end();
  }
}
