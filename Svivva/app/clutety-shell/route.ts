import { NextResponse } from "next/server";

/** Legacy embed shell — security features are native in Svivva. */
export function GET() {
  return NextResponse.redirect(new URL("/dashboard/security", "https://svivva.com"));
}
