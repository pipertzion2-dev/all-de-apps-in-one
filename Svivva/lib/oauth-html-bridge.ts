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
  <meta http-equiv="refresh" content="0;url=${safeUrl}" />
  <title>Connecting Google Search Console</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; min-height: 100vh; align-items: center; justify-content: center; margin: 0; background: #0b1220; color: #e5e7eb; }
    a { color: #5B8DA8; font-weight: 600; }
  </style>
</head>
<body>
  <p>Opening Google sign-in… <a href="${safeUrl}">${label}</a></p>
  <script>window.location.replace(${JSON.stringify(targetUrl)});</script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
