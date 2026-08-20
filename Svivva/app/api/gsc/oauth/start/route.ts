import { NextRequest } from "next/server";
import { gscOAuthConnectPath } from "@/lib/gsc-oauth-start-handler";
import { oauthHtmlBridgeResponse } from "@/lib/oauth-html-bridge";

export const dynamic = "force-dynamic";

/** @deprecated Use /dashboard/gsc-connect/oauth — iOS Safari treats `/start` as a download. */
export async function GET(req: NextRequest) {
  const returnTo = req.nextUrl.searchParams.get("return") || "/dashboard/gsc-connect";
  const email = req.nextUrl.searchParams.get("email");
  const dest = new URL(gscOAuthConnectPath(returnTo), req.nextUrl.origin);
  if (email) dest.searchParams.set("email", email);
  // HTML page (not 307) — iOS Safari downloads a file named "start" from this path.
  return oauthHtmlBridgeResponse(dest.toString(), "Continue to Google Search Console");
}
