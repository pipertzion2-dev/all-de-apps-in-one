import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { setSession } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const redirect = request.nextUrl.searchParams.get("redirect");
  const loginUrl = new URL("/login", request.url);
  if (redirect?.startsWith("/")) {
    loginUrl.searchParams.set("redirect", redirect);
  }
  return NextResponse.redirect(loginUrl);
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      firstName: user.name?.split(" ")[0] || null,
      lastName: user.name?.split(" ").slice(1).join(" ") || null,
      profileImageUrl: user.avatarUrl,
    };

    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    const token = await setSession(sessionUser, expiresAt);

    return NextResponse.json({ ok: true, token });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Sign-in failed. Please try again." }, { status: 500 });
  }
}
