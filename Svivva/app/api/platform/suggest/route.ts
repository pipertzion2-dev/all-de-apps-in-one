import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { suggestFeatures } from "@/lib/platform/feature-suggestions";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const bodySchema = z.object({
  goal: z.string().min(3).max(2000),
  fromFeatureId: z.string().max(64).optional(),
  includeAdmin: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const result = await suggestFeatures({
      goal: parsed.data.goal,
      fromFeatureId: parsed.data.fromFeatureId,
      includeAdmin: parsed.data.includeAdmin ?? false,
    });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Suggestion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
