import { NextResponse } from "next/server";
import { z } from "zod";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { loadEasyPeasyConfig } from "@/lib/easypeasy/config";
import { testEasyPeasyConnection } from "@/lib/easypeasy/client";
import { getEasyPeasyModelForTier, resolveEasyPeasyTierId } from "@/lib/easypeasy/tiers";

const bodySchema = z
  .object({
    apiKey: z.string().optional(),
    model: z.string().optional(),
    tier: z.enum(["standard", "balanced", "premium"]).optional(),
  })
  .strict();

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    if (!(await isOrbitAdminAllowed())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const json = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const saved = await loadEasyPeasyConfig();
    const apiKey = parsed.data.apiKey?.trim() || saved.apiKey;
    const tierId = parsed.data.tier ? resolveEasyPeasyTierId(parsed.data.tier) : saved.tierId;
    const model = parsed.data.model?.trim() || getEasyPeasyModelForTier(tierId) || saved.model;

    const result = await testEasyPeasyConnection({ apiKey, model });
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error, status: result.status ?? null },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      model: result.model,
      reply: result.reply,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
