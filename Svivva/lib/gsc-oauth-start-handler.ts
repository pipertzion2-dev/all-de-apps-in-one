import { NextRequest, NextResponse } from "next/server";
import { gscOAuthConnectUrl } from "@/lib/gsc-oauth-connect-url";
import { oauthHtmlBridgeResponse } from "@/lib/oauth-html-bridge";

export { gscOAuthConnectUrl as gscOAuthConnectPath };

/** Legacy route handlers — forward to the /connect HTML page (never redirect straight to Google). */
export async function handleGscOAuthStart(req: NextRequest): Promise<NextResponse> {
  const returnTo = req.nextUrl.searchParams.get("return") || "/dashboard/gsc-connect";
  const email = req.nextUrl.searchParams.get("email");
  const dest = new URL(gscOAuthConnectUrl(returnTo, email ?? undefined), req.nextUrl.origin);
  return oauthHtmlBridgeResponse(dest.toString(), "Continue to Google Search Console");
}
