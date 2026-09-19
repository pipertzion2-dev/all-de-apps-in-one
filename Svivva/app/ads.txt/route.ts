/**
 * AdSense publisher verification file.
 * https://support.google.com/adsense/answer/7532444
 *
 * Set NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXX (or ADSENSE_PUB_ID=pub-XXXXXXXX).
 */
export const dynamic = "force-dynamic";

function publisherId(): string | null {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || "";
  if (client.startsWith("ca-pub-")) return client.slice(3); // pub-XXXX
  if (client.startsWith("pub-")) return client;
  const pub = process.env.ADSENSE_PUB_ID?.trim() || "";
  if (pub.startsWith("pub-")) return pub;
  if (pub.startsWith("ca-pub-")) return pub.slice(3);
  return null;
}

export async function GET() {
  const pub = publisherId();
  const lines = [
    "# ads.txt for zzaizzai.com — Google AdSense",
    "# https://support.google.com/adsense/answer/7532444",
  ];
  if (pub) {
    // DIRECT + Google's certified seller ID
    lines.push(`google.com, ${pub}, DIRECT, f08c47fec0942fa0`);
  } else {
    lines.push("# Set NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-… in Vercel, then redeploy.");
  }
  lines.push("");

  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
