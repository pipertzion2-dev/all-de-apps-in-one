import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { upsertInventionBundleForUser } from "@/lib/poor-man-protection/invention-studio/server-sync";
import type { InventionBundle } from "@/lib/poor-man-protection/invention-studio/types";

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error || !user) {
    return NextResponse.json(
      { error: "Sign in to sync inventions to your private server vault." },
      { status: 401 },
    );
  }

  try {
    const body = (await req.json()) as { bundle?: InventionBundle };
    if (!body.bundle?.invention?.id) {
      return NextResponse.json({ error: "Missing bundle" }, { status: 400 });
    }
    if (body.bundle.invention.privacy !== "private") {
      return NextResponse.json({ error: "Inventions must remain private" }, { status: 400 });
    }

    await upsertInventionBundleForUser(user.id, body.bundle);
    return NextResponse.json({
      ok: true,
      serverTimestamp: new Date().toISOString(),
      inventionId: body.bundle.invention.id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
