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
  const safeUrl = targetUrl.replace(/\\/g, "\\\\").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  const safeLabel = label.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Connect Google Search Console</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; min-height: 100vh; align-items: center; justify-content: center; margin: 0; background: #0b1220; color: #e5e7eb; }
    main { text-align: center; max-width: 22rem; padding: 0 1.25rem; }
    h1 { font-size: 1.125rem; margin: 0 0 0.5rem; }
    p { font-size: 0.875rem; color: #94a3b8; margin: 0 0 1.5rem; line-height: 1.45; }
    button { color: #fff; font-weight: 700; font-size: 1rem; border: 0; cursor: pointer; display: inline-block; padding: 0.85rem 1.35rem; border-radius: 0.5rem; background: linear-gradient(135deg,#5B8DA8,#6B2C4E); width: 100%; max-width: 18rem; }
    .hint { font-size: 0.75rem; color: #64748b; margin-top: 1rem; }
  </style>
</head>
<body>
  <main>
    <h1>Connect Google Search Console</h1>
    <p>Tap the button to open Google sign-in in your browser.</p>
    <button type="button" id="gsc-oauth-go">${safeLabel}</button>
    <p class="hint">If nothing happens, long-press and choose Open in Safari.</p>
  </main>
  <script>
    (function () {
      var url = "${safeUrl}";
      var btn = document.getElementById("gsc-oauth-go");
      function go() { window.location.assign(url); }
      btn.addEventListener("click", go);
      btn.addEventListener("touchend", function (e) { e.preventDefault(); go(); }, { passive: false });
    })();
  </script>
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
