import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function canonicalSiteUrl(): URL | null {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://svivva.com";
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

// Route /{32-char-hex}.txt → /api/indexnow-key?key=... so IndexNow can verify the requested key

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase();
  const canonical = canonicalSiteUrl();
  if (host && canonical) {
    const apex = canonical.hostname.toLowerCase();
    if (host === `www.${apex}`) {
      const dest = new URL(
        request.nextUrl.pathname + request.nextUrl.search,
        `${canonical.protocol}//${apex}`,
      );
      return NextResponse.redirect(dest, 308);
    }
  }

  const keyMatch = request.nextUrl.pathname.match(/^\/([0-9a-f]{32})\.txt$/i);
  if (keyMatch) {
    const url = request.nextUrl.clone();
    url.pathname = "/api/indexnow-key";
    url.searchParams.set("key", keyMatch[1].toLowerCase());
    return NextResponse.rewrite(url);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|sitemap/|pyracrypt-sitemap.xml|security-sitemap.xml).*)",
  ],
};
