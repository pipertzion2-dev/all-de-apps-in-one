import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { ensureDatabaseUrl } from "@/lib/resolve-database-url";

ensureDatabaseUrl();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);
