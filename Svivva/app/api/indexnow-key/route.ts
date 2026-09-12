import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resolveIndexNowKey } from "@/lib/indexing/indexnow-key";

export async function GET(req: NextRequest) {
  try {
    const requested = req.nextUrl.searchParams.get("key");
    const key = await resolveIndexNowKey(requested);
    if (!key) {
      return new NextResponse(requested ? "key not found" : "no key configured", {
        status: 404,
      });
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
