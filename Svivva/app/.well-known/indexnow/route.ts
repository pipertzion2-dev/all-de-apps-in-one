import { NextResponse } from "next/server";
import { getActiveIndexNowKey } from "@/lib/indexing/indexnow-key";

/**
 * IndexNow discovery endpoint — some engines probe `/.well-known/indexnow`.
 * Must return the same active key as `/{key}.txt` (env or seed_credentials).
 */
export async function GET() {
  try {
    const key = await getActiveIndexNowKey();
    if (!key) return new NextResponse("Not configured", { status: 404 });
    return new NextResponse(key, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Error", { status: 500 });
  }
}
