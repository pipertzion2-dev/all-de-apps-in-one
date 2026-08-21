import { NextRequest } from "next/server";
import { badRequest, forbidden, ok, serverError } from "@/lib/http-response";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { completeManualGscOAuth } from "@/lib/gsc-oauth-manual";

export const dynamic = "force-dynamic";

/**
 * Alternate connect — exchange a pasted Google callback URL (or code+state)
 * using the PKCE verifier stored in the database (no cookie required).
 */
export async function POST(req: NextRequest) {
  if (!(await isOrbitAdminAllowed(req))) return forbidden();

  try {
    const body = (await req.json()) as {
      callbackUrl?: string;
      code?: string;
      state?: string;
    };

    if (!body.callbackUrl?.trim() && !(body.code?.trim() && body.state?.trim())) {
      return badRequest("Provide callbackUrl, or both code and state");
    }

    const result = await completeManualGscOAuth({
      callbackUrl: body.callbackUrl,
      code: body.code,
      state: body.state,
    });

    return ok(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Manual complete failed";
    if (
      /expired|required|Could not read|refresh token|Revoke/i.test(message) ||
      message.includes("Authorization code")
    ) {
      return badRequest(message);
    }
    return serverError(message);
  }
}
