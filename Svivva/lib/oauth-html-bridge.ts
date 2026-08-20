import { NextResponse } from "next/server";

/** iOS Safari treats API paths ending in `/start` (and some 307 chains) as file downloads. */
export function isIosBrowser(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return /iPhone|iPad|iPod/i.test(userAgent);
}

export function oauthHtmlBridgeResponse(
  targetUrl: string,
  label = "Continue to Google sign-in",
): NextResponse {
  const safeUrl = targetUrl.replace(/"/g, "&quot;");
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Connecting Google Search Console</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; min-height: 100vh; align-items: center; justify-content: center; margin: 0; background: #0b1220; color: #e5e7eb; }
    a { color: #fff; font-weight: 600; text-decoration: none; display: inline-block; padding: 0.75rem 1.25rem; border-radius: 0.5rem; background: linear-gradient(135deg,#5B8DA8,#6B2C4E); }
    p { text-align: center; max-width: 20rem; padding: 0 1rem; }
  </style>
</head>
<body>
  <main>
    <p style="margin-bottom:1rem">Tap below to continue (do not use Download).</p>
    <p><a href="${safeUrl}">${label}</a></p>
  </main>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": "inline",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
