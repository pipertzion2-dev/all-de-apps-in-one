import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Route /{32-char-hex}.txt → /api/indexnow-key?key=... so IndexNow can verify the requested key

export function middleware(request: NextRequest) {
  const keyMatch = request.nextUrl.pathname.match(/^\/([0-9a-f]{32})\.txt$/i);
  if (keyMatch) {
    const url = request.nextUrl.clone();
    url.pathname = "/api/indexnow-key";
    url.searchParams.set("key", keyMatch[1].toLowerCase());
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
