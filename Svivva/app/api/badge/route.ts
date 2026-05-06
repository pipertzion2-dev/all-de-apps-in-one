import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const label = req.nextUrl.searchParams.get("label") || "built with";
  const message = req.nextUrl.searchParams.get("message") || "Svivva";
  const color = req.nextUrl.searchParams.get("color") || "5BA8A0";

  // Classic shields.io style badge SVG
  const labelWidth = Math.max(label.length * 6.5 + 16, 60);
  const messageWidth = Math.max(message.length * 7 + 16, 70);
  const totalWidth = labelWidth + messageWidth;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${message}">
  <title>${label}: ${message}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${messageWidth}" height="20" fill="#${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="110">
    <text x="${(labelWidth / 2 + 1) * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(labelWidth - 12) * 10}" lengthAdjust="spacing">${label}</text>
    <text x="${(labelWidth / 2) * 10}" y="140" transform="scale(.1)" textLength="${(labelWidth - 12) * 10}" lengthAdjust="spacing">${label}</text>
    <text x="${(labelWidth + messageWidth / 2 + 1) * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(messageWidth - 12) * 10}" lengthAdjust="spacing">${message}</text>
    <text x="${(labelWidth + messageWidth / 2) * 10}" y="140" transform="scale(.1)" textLength="${(messageWidth - 12) * 10}" lengthAdjust="spacing">${message}</text>
  </g>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-cache, max-age=0",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
