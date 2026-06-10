import { cookies, headers } from "next/headers";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, users } from "@/lib/schema";
import { randomBytes } from "crypto";

export interface SessionUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

const SESSION_COOKIE_NAME = "vivva_session";

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (sessionCookie?.value) {
    try {
      const session = JSON.parse(sessionCookie.value);
      if (session.expiresAt && Date.now() < session.expiresAt) {
        return session.user;
      }
    } catch {
      // invalid cookie
    }
  }

  const headerStore = await headers();
  const authHeader = headerStore.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const user = await getUserFromToken(token);
    if (user) return user;
  }

  return null;
}

export async function getUserFromToken(token: string): Promise<SessionUser | null> {
  try {
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())));

    if (!session) return null;

    const [user] = await db.select().from(users).where(eq(users.id, session.userId));

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      firstName: user.name?.split(" ")[0] || null,
      lastName: user.name?.split(" ").slice(1).join(" ") || null,
      profileImageUrl: user.avatarUrl,
    };
  } catch (e) {
    console.error("Error getting user from token:", e);
    return null;
  }
}

function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export async function setSession(user: SessionUser, expiresAt: number): Promise<string> {
  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify({ user, expiresAt }), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
  } catch {
    console.log("Could not set session cookie");
  }

  const token = generateSessionToken();
  const sessionId = randomBytes(16).toString("hex");

  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    token,
    expiresAt: new Date(expiresAt),
  });

  return token;
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  return getSession();
}

export async function getLogoutUrl(hostname: string): Promise<string> {
  return `https://${hostname}`;
}
