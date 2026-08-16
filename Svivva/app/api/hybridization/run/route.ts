import { NextRequest, NextResponse } from "next/server";
import {
  adaptSourcesToSchematics,
  canUseHybridizationEngine,
  hybridizationRequestSchema,
  runHybridization,
} from "@/lib/hybridization";
import { z } from "zod";

const sourcesSchema = z.object({
  sources: z
    .array(
      z.object({
        name: z.string().min(1),
        type: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .min(2)
    .max(6),
  hybridizationMode: z
    .enum(["complementary", "antagonistic", "emergent", "biomimetic"])
    .optional()
    .default("emergent"),
  targetApplication: z.string().min(1).max(500),
  scientificDepth: z.enum(["prototype", "research", "production"]).optional().default("research"),
  surface: z
    .enum(["hardware", "digital", "hypothesis", "idea-engine", "api-builder", "research"])
    .optional()
    .default("research"),
});

/**
 * Shared hybridization endpoint for Idea Engine, Hypothesis, API Builder, etc.
 * Accepts either full schematics or free-form source pairs.
 */
export async function POST(req: NextRequest) {
  try {
    if (!(await canUseHybridizationEngine(req))) {
      return NextResponse.json(
        { error: "Sign in or enter access code 333 to use the Hybridization Engine." },
        { status: 401 },
      );
    }

    const body = await req.json();

    if (body.sources && Array.isArray(body.sources)) {
      const parsed = sourcesSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid sources input.", details: parsed.error.flatten() },
          { status: 400 },
        );
      }
      const adapted = adaptSourcesToSchematics(parsed.data.sources);
      if (!adapted) {
        return NextResponse.json({ error: "Need at least two sources." }, { status: 400 });
      }
      const result = await runHybridization({
        ...adapted,
        hybridizationMode: parsed.data.hybridizationMode,
        targetApplication: parsed.data.targetApplication,
        scientificDepth: parsed.data.scientificDepth,
        surface: parsed.data.surface,
      });
      return NextResponse.json(result);
    }

    const parsed = hybridizationRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const result = await runHybridization(parsed.data);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Hybridization failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
