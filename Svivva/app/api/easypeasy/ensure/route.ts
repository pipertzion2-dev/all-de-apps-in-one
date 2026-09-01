import { NextResponse } from "next/server";
import { z } from "zod";
import { canRunUrrthang } from "@/lib/orbit/urrthang-access";
import { ensureEasyPeasyForOrbit } from "@/lib/easypeasy/ensure";
import { getOrbitAiProviderLabel } from "@/lib/llm/providers";
import { getMarketingModel } from "@/lib/orbit/ai-client";

const bodySchema = z
  .object({
    tier: z.enum(["standard", "balanced", "premium"]).optional(),
    forceTier: z.boolean().optional(),
    testConnection: z.boolean().optional(),
  })
  .strict();

export const maxDuration = 60;

/** Wire EasyPeasy (key, base URL, tier) before Orbit one-click runs. */
export async function POST(request: Request) {
  try {
    if (!(await canRunUrrthang())) {
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

    const result = await ensureEasyPeasyForOrbit({
      tierId: parsed.data.tier,
      forceTier: parsed.data.forceTier,
      testConnection: parsed.data.testConnection ?? true,
    });

    return NextResponse.json({
      ...result,
      providerLabel: getOrbitAiProviderLabel(),
      marketingModel: getMarketingModel(),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
