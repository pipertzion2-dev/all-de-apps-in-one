import { NextResponse } from "next/server";
import { pickLanIPv4 } from "@/lib/dev-lan-url";

/**
 * Dev-only: suggests http://<LAN-IP>:<PORT> so phones on the same Wi‑Fi can reach `next dev`
 * (127.0.0.1 on the phone is the phone itself, not your computer).
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  const port = (process.env.PORT || "5000").trim();
  const ip = pickLanIPv4();
  if (!ip) return NextResponse.json({ lanUrl: null });
  return NextResponse.json({ lanUrl: `http://${ip}:${port}` });
}
