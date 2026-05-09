import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, users, usageLogs } from "@/lib/schema";
import { sql } from "drizzle-orm";

export const revalidate = 300;

export async function GET() {
  try {
    const [projectCount] = await db.select({ count: sql<number>`count(*)::int` }).from(projects);

    const [userCount] = await db.select({ count: sql<number>`count(*)::int` }).from(users);

    const [apiCallCount] = await db.select({ count: sql<number>`count(*)::int` }).from(usageLogs);

    return NextResponse.json({
      projects: projectCount.count ?? 0,
      developers: userCount.count ?? 0,
      apiCalls: apiCallCount.count ?? 0,
    });
  } catch (error) {
    console.error("Public stats error:", error);
    return NextResponse.json({ projects: 0, developers: 0, apiCalls: 0 });
  }
}
