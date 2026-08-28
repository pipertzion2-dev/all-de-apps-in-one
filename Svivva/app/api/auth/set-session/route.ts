import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessions } from "@/lib/schema";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "vivva_session";

function sessionCookieOptions(maxAgeSec: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSec,
  };
}

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

    const maxAgeSec = Math.max(0, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000));
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions(maxAgeSec));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("set-session error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
