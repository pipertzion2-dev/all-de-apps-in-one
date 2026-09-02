import { NextResponse } from "next/server";
import { z } from "zod";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { ensureOrbitAiForRun } from "@/lib/orbit/ensure-orbit-ai";
import { getMarketingModel } from "@/lib/orbit/ai-client";
import { getOrbitAiProviderLabel } from "@/lib/llm/providers";

const bodySchema = z
  .object({
    testConnection: z.boolean().optional(),
  })
  .strict();

export const maxDuration = 60;

/** Wire a working Orbit AI provider (Gemini → OpenAI → EasyPeasy) before one-click runs. */
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

    const result = await ensureOrbitAiForRun({
      testConnection: parsed.data.testConnection ?? true,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          ...result,
          providerLabel: getOrbitAiProviderLabel(),
          marketingModel: getMarketingModel(),
        },
        { status: 429 },
      );
    }

    return NextResponse.json({
      ...result,
      providerLabel: getOrbitAiProviderLabel(),
      marketingModel: getMarketingModel(),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
