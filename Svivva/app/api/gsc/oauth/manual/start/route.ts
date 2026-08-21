import { NextRequest } from "next/server";
import { badRequest, forbidden, ok, serverError } from "@/lib/http-response";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { prepareGscOAuthStart } from "@/lib/gsc-oauth-prepare";
import { GSC_OAUTH_LOGIN_HINT } from "@/lib/gsc-oauth-connect-url";

export const dynamic = "force-dynamic";

/**
 * Alternate connect — returns a Google sign-in URL as JSON (no browser redirect).
 * PKCE state is stored in the DB for up to 1 hour so cookies are optional.
 */
export async function POST(req: NextRequest) {
  if (!(await isOrbitAdminAllowed(req))) return forbidden();

  try {
    const body = (await req.json().catch(() => ({}))) as {
      returnTo?: string;
      email?: string;
    };
    const result = await prepareGscOAuthStart({
      returnTo: body.returnTo || "/dashboard/gsc-connect",
      email: body.email || GSC_OAUTH_LOGIN_HINT,
      ttlMs: 60 * 60 * 1000,
    });

    if (!result.ok) {
      const err = new URL(result.redirectPath, "https://example.invalid").searchParams.get(
        "gsc_error",
      );
      return badRequest(err || "Could not start Google connect");
    }

    return ok({
      googleUrl: result.googleUrl,
      state: result.state,
      redirectUri: result.redirectUri,
      expiresAt: result.expiresAt,
      loginHint: body.email || GSC_OAUTH_LOGIN_HINT,
      instructions: [
        "Open the Google URL in a new tab (desktop browser works best).",
        "Sign in and approve Search Console access.",
        "If you land back on ZZAI automatically, you are done.",
        "If not, copy the full redirect URL from the address bar and paste it into Finish connect.",
      ],
    });
  } catch (e: unknown) {
    return serverError(e instanceof Error ? e.message : "Manual start failed");
  }
}
