import { NextRequest, NextResponse } from "next/server";
import { canUseHybridizationEngine } from "@/lib/hybridization";
import { protectRequestSchema, runPoorManProtection } from "@/lib/poor-man-protection";

export const maxDuration = 120;

/**
 * Create a Poor Man Protection certificate:
 * dual-axis scientific hybridization + crypto coin metadata + cyber seal.
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await canUseHybridizationEngine(req))) {
      return NextResponse.json(
        { error: "Sign in or enter access code 333 to use Poor Man Protection." },
        { status: 401 },
      );
    }

    const body = await req.json();
    const parsed = protectRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid protection request.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await runPoorManProtection(parsed.data);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Protection failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
