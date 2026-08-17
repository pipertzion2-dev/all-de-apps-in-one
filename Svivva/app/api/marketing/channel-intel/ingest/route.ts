import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { hasAdminAccess } from "@/lib/auth/admin";
import {
  ingestChannelIntel,
  MAX_CHANNEL_INTEL_VIDEOS,
} from "@/lib/marketing/channel-intel";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const bodySchema = z.object({
  channelUrl: z.string().min(3).max(500),
  maxVideos: z.number().int().min(1).max(MAX_CHANNEL_INTEL_VIDEOS).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const corpus = await ingestChannelIntel({
      channelUrl: parsed.data.channelUrl,
      maxVideos: parsed.data.maxVideos,
    });
    return NextResponse.json({ corpus });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Channel ingest failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
