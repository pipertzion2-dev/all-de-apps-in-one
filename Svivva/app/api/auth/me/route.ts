import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasAdminAccess } from "@/lib/auth/admin";
import { hasMembershipAccess } from "@/lib/auth/membership-access";

export async function GET() {
  const user = await getCurrentUser();
  const admin = await hasAdminAccess();
  const membership = await hasMembershipAccess();
  if (!user && !admin && !membership) {
    return NextResponse.json({ user: null, isAdmin: false, isMembershipAccess: false });
  }
  return NextResponse.json({
    user: user ? { id: user.id, email: user.email, firstName: user.firstName } : null,
    isAdmin: admin,
    isMembershipAccess: membership,
    ...(admin
      ? {
          vercelCommit: process.env.VERCEL_GIT_COMMIT_SHA || null,
          nextPublicSiteUrl: process.env.NEXT_PUBLIC_SITE_URL?.trim() || null,
        }
      : {}),
  });
}
