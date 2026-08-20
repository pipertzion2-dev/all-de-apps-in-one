import { NextRequest, NextResponse } from "next/server";
import { prepareGscOAuthStart } from "@/lib/gsc-oauth-prepare";
import { oauthHtmlBridgeResponse } from "@/lib/oauth-html-bridge";

export const dynamic = "force-dynamic";

/**
 * Route handler (not page.tsx) — cookies().set() only works here, not in Server Components.
 * iOS Safari needs inline HTML with a tap-to-continue link, not a 307 to Google.
 */
export async function GET(req: NextRequest) {
  const returnTo = req.nextUrl.searchParams.get("return") || "/dashboard/gsc-connect";
  const email = req.nextUrl.searchParams.get("email") ?? undefined;

  const result = await prepareGscOAuthStart({ returnTo, email });

  if (!result.ok) {
    return NextResponse.redirect(new URL(result.redirectPath, req.nextUrl.origin));
  }

  const res = oauthHtmlBridgeResponse(result.googleUrl, "Continue to Google sign-in");
  res.cookies.set(result.oauthCookie.name, result.oauthCookie.value, result.oauthCookie.options);
  return res;
}
