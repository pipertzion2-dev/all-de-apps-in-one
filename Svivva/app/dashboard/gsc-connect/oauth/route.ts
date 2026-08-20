import { NextRequest } from "next/server";
import { handleGscOAuthStart } from "@/lib/gsc-oauth-start-handler";

export const dynamic = "force-dynamic";

/** Google OAuth entry — page route avoids iOS Safari downloading a file named "start". */
export async function GET(req: NextRequest) {
  return handleGscOAuthStart(req);
}
