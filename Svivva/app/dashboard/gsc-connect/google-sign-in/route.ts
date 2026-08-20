import { NextRequest } from "next/server";
import { handleGscOAuthStart } from "@/lib/gsc-oauth-start-handler";

export const dynamic = "force-dynamic";

/** Google OAuth entry — HTML bridge page (never a raw redirect; safe on iOS Safari). */
export async function GET(req: NextRequest) {
  return handleGscOAuthStart(req);
}
