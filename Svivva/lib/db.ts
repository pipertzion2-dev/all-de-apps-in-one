import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

function buildPoolConfig(): pg.PoolConfig {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    return { connectionString: undefined };
  }

  const isProd = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
  const needsSsl =
    isProd ||
    connectionString.includes("sslmode=require") ||
    connectionString.includes("neon.tech") ||
    connectionString.includes("supabase.co");

  return {
    connectionString,
    // Serverless-friendly: one connection per lambda instance.
    max: isProd ? 1 : undefined,
    idleTimeoutMillis: isProd ? 10_000 : undefined,
    connectionTimeoutMillis: 10_000,
    ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  };
}

const pool = new pg.Pool(buildPoolConfig());

export const db = drizzle(pool);

export function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL?.trim();
}
