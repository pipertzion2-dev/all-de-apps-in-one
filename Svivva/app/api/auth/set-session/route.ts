import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessions, users } from "@/lib/schema";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "vivva_session";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "No token" }, { status: 400 });
    }

    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())));

    if (!session) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }

    const [user] = await db.select().from(users).where(eq(users.id, session.userId));
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const sessionUser = {
      id: user.id,
      email: user.email,
      firstName: user.name?.split(" ")[0] || null,
      lastName: user.name?.split(" ").slice(1).join(" ") || null,
      profileImageUrl: user.avatarUrl,
    };

    const expiresAt = session.expiresAt.getTime();

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify({ user: sessionUser, expiresAt }), {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("set-session error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
