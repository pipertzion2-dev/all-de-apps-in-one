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
  <main style="text-align:center;padding:1.5rem;max-width:24rem">
    <p style="margin:0 0 1rem">Opening Google sign-in…</p>
    <p style="margin:0"><a href="${safeUrl}" style="display:inline-block;padding:0.75rem 1.25rem;border-radius:0.5rem;background:#5B8DA8;color:#fff;text-decoration:none;font-weight:600">${label}</a></p>
  </main>
  <script>window.location.replace(${JSON.stringify(targetUrl)});</script>
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
