import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, projects, usageLogs, seoLandingPages } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/admin";
import { count } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const [[{ totalUsers }], [{ totalProjects }], [{ totalApiCalls }], [{ totalSeoPages }]] =
      await Promise.all([
        db.select({ totalUsers: count() }).from(users),
        db.select({ totalProjects: count() }).from(projects),
        db.select({ totalApiCalls: count() }).from(usageLogs),
        db.select({ totalSeoPages: count() }).from(seoLandingPages),
      ]);

    return NextResponse.json({
      totalUsers: Number(totalUsers ?? 0),
      totalProjects: Number(totalProjects ?? 0),
      totalApiCalls: Number(totalApiCalls ?? 0),
      totalSeoPages: Number(totalSeoPages ?? 0),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
