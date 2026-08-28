import { NextRequest, NextResponse } from "next/server";
import {
  adaptLegacySystems,
  canUseHybridizationEngine,
  hybridizationRequestSchema,
  runHybridization,
} from "@/lib/hybridization";
import { z } from "zod";

const legacySchema = z.object({
  systemA: z.object({
    name: z.string().min(1),
    description: z.string().optional().default(""),
    components: z.array(z.string()).optional(),
    properties: z.array(z.string()).optional(),
  }),
  systemB: z.object({
    name: z.string().min(1),
    description: z.string().optional().default(""),
    components: z.array(z.string()).optional(),
    properties: z.array(z.string()).optional(),
  }),
  hybridizationMode: z
    .enum(["complementary", "antagonistic", "emergent", "biomimetic"])
    .optional()
    .default("emergent"),
  targetApplication: z.string().optional(),
  scientificDepth: z.enum(["prototype", "research", "production"]).optional().default("research"),
});

export async function POST(req: NextRequest) {
  try {
    if (!(await canUseHybridizationEngine(req))) {
      return NextResponse.json(
        { error: "Sign in or enter your Pro access code to use the Hybridization Engine." },
        { status: 401 },
      );
    }

    const body = await req.json();

    // Legacy Cross-Domain Hybridizer payload → scientific schematics
    if (body.systemA && body.systemB && !body.schematicA) {
      const legacy = legacySchema.safeParse(body);
      if (!legacy.success) {
        return NextResponse.json(
          { error: "Invalid legacy input.", details: legacy.error.flatten() },
          { status: 400 },
        );
      }
      const adapted = adaptLegacySystems(legacy.data);
      const result = await runHybridization({
        ...adapted,
        hybridizationMode: legacy.data.hybridizationMode,
        targetApplication:
          legacy.data.targetApplication ||
          `${legacy.data.systemA.name} × ${legacy.data.systemB.name}`,
        scientificDepth: legacy.data.scientificDepth,
        surface: "hardware",
      });
      return NextResponse.json(result);
    }

    const parsed = hybridizationRequestSchema.safeParse({
      ...body,
      surface: body.surface || "hardware",
    });
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
