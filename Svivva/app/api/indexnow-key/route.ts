import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { eq, isNotNull, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const requested = req.nextUrl.searchParams.get("key")?.trim().toLowerCase() ?? "";

    if (requested && /^[0-9a-f]{32}$/.test(requested)) {
      const [row] = await db
        .select({ indexnowKey: seedCredentials.indexnowKey })
        .from(seedCredentials)
        .where(eq(seedCredentials.indexnowKey, requested))
        .limit(1);
      const key = row?.indexnowKey;
      if (!key) {
        return new NextResponse("key not found", { status: 404 });
      }
      return new NextResponse(key, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const [row] = await db
      .select({ indexnowKey: seedCredentials.indexnowKey })
      .from(seedCredentials)
      .where(isNotNull(seedCredentials.indexnowKey))
      .orderBy(desc(seedCredentials.updatedAt))
      .limit(1);

    const key = row?.indexnowKey;
    if (!key) {
      return new NextResponse("no key configured", { status: 404 });
    }
    return new NextResponse(key, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (e) {
    console.error("indexnow-key error:", e);
    return new NextResponse("error", { status: 500 });
  }
}
