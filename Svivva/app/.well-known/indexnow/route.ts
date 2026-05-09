import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db.execute(sql`SELECT indexnow_key FROM seed_credentials LIMIT 1`);
    const row = (rows as unknown as any[])[0];
    const key = row?.indexnow_key;
    if (!key) return new NextResponse("Not configured", { status: 404 });
    return new NextResponse(key, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse("Error", { status: 500 });
  }
}
