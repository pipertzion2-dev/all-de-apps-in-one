/**
 * AdSense publisher verification file.
 * https://support.google.com/adsense/answer/7532444
 *
 * Set via Orbit admin → AdSense, or NEXT_PUBLIC_ADSENSE_CLIENT / ADSENSE_PUB_ID.
 * Falls back to SITE_ADSENSE_CLIENT so verification works out of the box.
 */
import { hydratePlatformSecrets } from "@/lib/platform-runtime-secrets";
import { resolveSiteAdsenseClient } from "@/lib/adsense-credentials";

export const dynamic = "force-dynamic";

function publisherId(): string | null {
  const client = resolveSiteAdsenseClient();
  if (client.startsWith("ca-pub-")) return client.slice(3);
  return null;
}

export async function GET() {
  try {
    await hydratePlatformSecrets();
  } catch {
    /* ignore */
  }
  const pub = publisherId();
  const lines = [
    "# ads.txt for zzaizzai.com — Google AdSense",
    "# https://support.google.com/adsense/answer/7532444",
  ];
  if (pub) {
    lines.push(`google.com, ${pub}, DIRECT, f08c47fec0942fa0`);
  } else {
    lines.push(
      "# Set AdSense in Orbit admin (/dashboard/orbit?tab=adsense) or NEXT_PUBLIC_ADSENSE_CLIENT.",
    );
  }
  lines.push("");

  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
}
