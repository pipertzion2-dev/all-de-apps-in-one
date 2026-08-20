import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db";
import { ensureCoreTables } from "@/lib/db/ensure-core-tables";

const DB_MISSING =
  "DATABASE_URL is not configured in Vercel. Add Postgres in Settings → Environment Variables, then redeploy.";

/** Returns a 503 response when the database is unavailable; otherwise ensures core tables. */
export async function bootstrapConnectionDb(): Promise<NextResponse | null> {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: DB_MISSING }, { status: 503 });
  }
  await ensureCoreTables();
  return null;
}

export { DB_MISSING };
