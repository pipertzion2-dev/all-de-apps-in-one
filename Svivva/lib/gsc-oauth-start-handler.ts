import { NextRequest, NextResponse } from "next/server";
import { gscOAuthConnectUrl } from "@/lib/gsc-oauth-connect-url";

export { gscOAuthConnectUrl as gscOAuthConnectPath };

/** Legacy route handlers — redirect to canonical /connect (no double tap bridge). */
export async function handleGscOAuthStart(req: NextRequest): Promise<NextResponse> {
  const returnTo = req.nextUrl.searchParams.get("return") || "/dashboard/gsc-connect";
  const email = req.nextUrl.searchParams.get("email");
  const dest = new URL(gscOAuthConnectUrl(returnTo, email ?? undefined), req.nextUrl.origin);
  return NextResponse.redirect(dest);
}
