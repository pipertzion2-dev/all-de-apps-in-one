import { NextRequest } from "next/server";
import { handleGscOAuthStart } from "@/lib/gsc-oauth-start-handler";

export const dynamic = "force-dynamic";

/** @deprecated Use /dashboard/gsc-connect/connect */
export async function GET(req: NextRequest) {
  return handleGscOAuthStart(req);
}
