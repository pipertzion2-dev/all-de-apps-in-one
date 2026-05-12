import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/admin";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null, isAdmin: false });
  const admin = isAdmin(user);
  return NextResponse.json({
    user: { id: user.id, email: user.email, firstName: user.firstName },
    isAdmin: admin,
    ...(admin
      ? {
          /** Set automatically on Vercel — use to confirm GitHub changes reached production. */
          vercelCommit: process.env.VERCEL_GIT_COMMIT_SHA || null,
          nextPublicSiteUrl: process.env.NEXT_PUBLIC_SITE_URL?.trim() || null,
        }
      : {}),
  });
}
