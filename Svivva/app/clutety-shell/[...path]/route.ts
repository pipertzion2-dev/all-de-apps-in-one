import { NextResponse } from "next/server";

/** Legacy embed assets — redirect to Security Center. */
export function GET() {
  return NextResponse.redirect(new URL("/dashboard/security", "https://svivva.com"));
}
