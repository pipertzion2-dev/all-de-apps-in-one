import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.redirect(new URL("/clutety-shell/index.html", "https://svivva.com"));
}
