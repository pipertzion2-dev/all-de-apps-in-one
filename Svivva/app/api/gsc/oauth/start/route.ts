import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { oauthStates } from "@/lib/schema";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { resolveOrbitInternalUserId } from "@/lib/orbit/internal-user";
import {
  buildGoogleOAuthUrl,
  generatePkce,
  getGscOAuthRedirectUri,
  getGoogleGscOAuthConfig,
  isGoogleGscOAuthConfigured,
} from "@/lib/google-gsc-oauth";
import { getRequestOrigin } from "@/lib/site-url";

export const dynamic = "force-dynamic";

/** Start Google OAuth for Search Console — admin only */
export async function GET(req: NextRequest) {
  if (!(await isOrbitAdminAllowed(req))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isGoogleGscOAuthConfigured()) {
    return NextResponse.json(
      {
        error:
          "Google OAuth not configured. Set GOOGLE_GSC_CLIENT_ID and GOOGLE_GSC_CLIENT_SECRET in Vercel env.",
      },
      { status: 503 },
    );
  }

  const cfg = getGoogleGscOAuthConfig()!;
  const userId = (await resolveOrbitInternalUserId()) || "orbit-admin";
  const { codeVerifier, codeChallenge } = generatePkce();
  const state = crypto.randomBytes(24).toString("hex");
  const origin = getRequestOrigin(req);
  const redirectUri = getGscOAuthRedirectUri(origin);
  const returnTo = req.nextUrl.searchParams.get("return") || "/dashboard/gsc-connect";

  await db.insert(oauthStates).values({
    state,
    codeVerifier,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    redirectAfter: JSON.stringify({ path: returnTo, userId }),
    callbackBase: origin,
  });

  const url = buildGoogleOAuthUrl({
    clientId: cfg.clientId,
    redirectUri,
    state,
    codeChallenge,
  });

  return NextResponse.redirect(url);
}
