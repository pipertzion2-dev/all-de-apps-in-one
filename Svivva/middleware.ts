import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Route /{32-char-hex}.txt → /api/indexnow-key so IndexNow can verify key ownership
const INDEXNOW_KEY_PATTERN = /^\/[0-9a-f]{32}\.txt$/i;

export function middleware(request: NextRequest) {
  if (INDEXNOW_KEY_PATTERN.test(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/api/indexnow-key";
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
