import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { setSession } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = randomBytes(16).toString("hex");

    await db.insert(users).values({
      id: userId,
      email: normalizedEmail,
      name: name?.trim() || null,
      passwordHash,
    });

    const sessionUser: SessionUser = {
      id: userId,
      email: normalizedEmail,
      firstName: name?.split(" ")[0] || null,
      lastName: name?.split(" ").slice(1).join(" ") || null,
      profileImageUrl: null,
    };

    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    const token = await setSession(sessionUser, expiresAt);

    return NextResponse.json({ ok: true, token });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Account creation failed. Please try again." },
      { status: 500 },
    );
  }
}
