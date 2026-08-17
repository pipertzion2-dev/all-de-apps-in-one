import { NextRequest } from "next/server";
import { z } from "zod";
import { canUseHybridizationEngine, runHybridization } from "@/lib/hybridization";
import {
  assertBlendable,
  buildFeatureLabFallback,
  defaultTargetApplication,
  mergeLineage,
  nextHybridOrder,
  resolveParent,
  type HybridParentRef,
} from "@/lib/hybridization/feature-lab";
import type { HybridizationMode } from "@/lib/hybridization/types";
import { badRequest, ok, serverError, unauthorized } from "@/lib/http-response";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const parentSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("feature"),
    id: z.string().min(1),
  }),
  z.object({
    kind: z.literal("hybrid"),
    id: z.string().min(1),
    label: z.string().min(1).max(200),
    description: z.string().max(2000).optional().default(""),
    order: z.union([z.literal(1), z.literal(2)]),
    lineage: z.array(z.string()).min(1).max(24),
    components: z.array(z.string()).max(20).optional(),
  }),
]);

const bodySchema = z.object({
  parentA: parentSchema,
  parentB: parentSchema,
  hybridizationMode: z
    .enum(["complementary", "antagonistic", "emergent", "biomimetic"])
    .optional()
    .default("emergent"),
  targetApplication: z.string().max(500).optional(),
});

function toRef(raw: z.infer<typeof parentSchema>): HybridParentRef {
  if (raw.kind === "feature") {
    return {
      kind: "feature",
      id: raw.id,
      label: raw.id,
      description: "",
      order: 0,
      lineage: [raw.id],
    };
  }
  return {
    kind: "hybrid",
    id: raw.id,
    label: raw.label,
    description: raw.description || "",
    order: raw.order,
    lineage: raw.lineage,
    components: raw.components,
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!(await canUseHybridizationEngine(request))) {
      return unauthorized("Sign in to blend channels in the Hybrid² lab.");
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return badRequest("Pick two parents (channels or listed blends).");
    }

    const rawA = toRef(parsed.data.parentA);
    const rawB = toRef(parsed.data.parentB);
    assertBlendable(rawA, rawB);

    const resolvedA = resolveParent(rawA);
    const resolvedB = resolveParent(rawB);
    const order = nextHybridOrder(resolvedA.ref.order, resolvedB.ref.order);
    const lineage = mergeLineage(resolvedA.ref.lineage, resolvedB.ref.lineage);
    const mode = parsed.data.hybridizationMode as HybridizationMode;
    const targetApplication =
      parsed.data.targetApplication?.trim() ||
      defaultTargetApplication(order, resolvedA.ref.label, resolvedB.ref.label);

    let usedEngine = true;
    let result;
    try {
      result = await runHybridization({
        schematicA: resolvedA.schematic,
        schematicB: resolvedB.schematic,
        hybridizationMode: mode,
        targetApplication,
        scientificDepth: order === 2 ? "research" : "prototype",
        surface: "hybrid-lab",
      });
      if (!result.hybrids.length) {
        throw new Error("Engine returned no hybrids");
      }
    } catch {
      usedEngine = false;
      result = buildFeatureLabFallback({
        schematicA: resolvedA.schematic,
        schematicB: resolvedB.schematic,
        order,
        mode,
        targetApplication,
        lineage,
      });
    }

    return ok({
      order,
      lineage,
      usedEngine,
      parentA: resolvedA.ref,
      parentB: resolvedB.ref,
      targetApplication,
      result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Hybrid blend failed";
    if (/pick two|unknown channel|different/i.test(message)) {
      return badRequest(message);
    }
    return serverError(message);
  }
}
