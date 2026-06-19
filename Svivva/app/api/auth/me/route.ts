import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasAdminAccess } from "@/lib/auth/admin";

export async function GET() {
  const user = await getCurrentUser();
  const admin = await hasAdminAccess();
  if (!user && !admin) return NextResponse.json({ user: null, isAdmin: false });
  return NextResponse.json({
    user: user ? { id: user.id, email: user.email, firstName: user.firstName } : null,
    isAdmin: admin,
    ...(admin
      ? {
          vercelCommit: process.env.VERCEL_GIT_COMMIT_SHA || null,
          nextPublicSiteUrl: process.env.NEXT_PUBLIC_SITE_URL?.trim() || null,
        }
      : {}),
  });
}
