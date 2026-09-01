import { NextRequest } from "next/server";
import { gscOAuthConnectUrl } from "@/lib/gsc-oauth-connect-url";
import { oauthHtmlBridgeResponse } from "@/lib/oauth-html-bridge";

export const dynamic = "force-dynamic";

/** @deprecated Legacy path — iOS Safari may download a file named "oauth". */
export async function GET(req: NextRequest) {
  const returnTo = req.nextUrl.searchParams.get("return") || "/dashboard/gsc-connect";
  const email = req.nextUrl.searchParams.get("email");
  const dest = new URL(gscOAuthConnectUrl(returnTo, email ?? undefined), req.nextUrl.origin);
  return oauthHtmlBridgeResponse(dest.toString(), "Continue to Google Search Console");
}
