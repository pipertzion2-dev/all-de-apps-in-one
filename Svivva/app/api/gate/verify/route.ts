import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const sitePassword = process.env.SITE_PASSWORD?.trim();

    // Gate is optional — when unset, do not surface a 500 "error sign" to visitors.
    if (!sitePassword) {
      return NextResponse.json(
        { error: "Site passcode is not enabled. Continue from the homepage." },
        { status: 403 },
      );
    }

    if (password === sitePassword) {
      const response = NextResponse.json({ success: true });
      response.cookies.set("site_auth", "authorized", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
      return response;
    }

    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
