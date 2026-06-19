import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { hasAdminAccess } from "@/lib/auth/admin";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await hasAdminAccess()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const username = process.env.REPL_OWNER || null;
    if (!username) {
      return NextResponse.json(
        { error: "REPL_OWNER not available in this environment" },
        { status: 400 },
      );
    }

    const [existing] = await db
      .select({ id: seedCredentials.id })
      .from(seedCredentials)
      .where(eq(seedCredentials.userId, user.id))
      .limit(1);

    if (existing) {
      await db
        .update(seedCredentials)
        .set({ replitUsername: username, updatedAt: new Date() })
        .where(eq(seedCredentials.userId, user.id));
    } else {
      await db.insert(seedCredentials).values({ userId: user.id, replitUsername: username });
    }

    return NextResponse.json({ success: true, username });
  } catch (e) {
    console.error("replit-autoconnect error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
