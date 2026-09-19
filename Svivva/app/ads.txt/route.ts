/**
 * AdSense publisher verification file.
 * https://support.google.com/adsense/answer/7532444
 *
 * Set via Orbit admin → AdSense, or NEXT_PUBLIC_ADSENSE_CLIENT / ADSENSE_PUB_ID.
 */
import { hydratePlatformSecrets } from "@/lib/platform-runtime-secrets";

export const dynamic = "force-dynamic";

function publisherId(): string | null {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || "";
  if (client.startsWith("ca-pub-")) return client.slice(3);
  if (client.startsWith("pub-")) return client;
  const pub = process.env.ADSENSE_PUB_ID?.trim() || "";
  if (pub.startsWith("pub-")) return pub;
  if (pub.startsWith("ca-pub-")) return pub.slice(3);
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
