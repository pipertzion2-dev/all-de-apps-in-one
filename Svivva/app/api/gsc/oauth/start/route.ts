import { NextRequest, NextResponse } from "next/server";
import { gscOAuthConnectPath } from "@/lib/gsc-oauth-start-handler";

export const dynamic = "force-dynamic";

/** @deprecated Use /dashboard/gsc-connect/oauth — iOS Safari treats `/start` as a download. */
export async function GET(req: NextRequest) {
  const returnTo = req.nextUrl.searchParams.get("return") || "/dashboard/gsc-connect";
  const email = req.nextUrl.searchParams.get("email");
  const dest = new URL(gscOAuthConnectPath(returnTo), req.nextUrl.origin);
  if (email) dest.searchParams.set("email", email);
  return NextResponse.redirect(dest);
}
