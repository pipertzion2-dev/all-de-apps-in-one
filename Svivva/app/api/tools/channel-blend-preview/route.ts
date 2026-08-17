import { NextRequest } from "next/server";
import { z } from "zod";
import { getFeature } from "@/lib/platform/feature-graph";
import {
  assertBlendable,
  buildFeatureLabFallback,
  defaultTargetApplication,
  featureToSchematic,
  mergeLineage,
  nextHybridOrder,
  resolveParent,
} from "@/lib/hybridization/feature-lab";
import { badRequest, ok } from "@/lib/http-response";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  aId: z.string().min(1),
  bId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return badRequest("Pick two ZZAI channels.");

  const a = getFeature(parsed.data.aId);
  const b = getFeature(parsed.data.bId);
  if (!a || !b) return badRequest("Unknown channel.");

  const parentA = {
    kind: "feature" as const,
    id: a.id,
    label: a.shortTitle,
    description: a.description,
    order: 0 as const,
    lineage: [a.id],
  };
  const parentB = {
    kind: "feature" as const,
    id: b.id,
    label: b.shortTitle,
    description: b.description,
    order: 0 as const,
    lineage: [b.id],
  };

  try {
    assertBlendable(parentA, parentB);
  } catch (err: unknown) {
    return badRequest(err instanceof Error ? err.message : "Pick two different channels.");
  }

  const resolvedA = resolveParent(parentA);
  const resolvedB = resolveParent(parentB);
  const order = nextHybridOrder(0, 0);
  const lineage = mergeLineage(resolvedA.ref.lineage, resolvedB.ref.lineage);
  const result = buildFeatureLabFallback({
    schematicA: featureToSchematic(a),
    schematicB: featureToSchematic(b),
    order,
    mode: "emergent",
    targetApplication: defaultTargetApplication(order, a.shortTitle, b.shortTitle),
    lineage,
  });
  const hybrid = result.hybrids[0];

  return ok({
    order,
    lineage,
    name: hybrid?.name,
    sketch: hybrid?.emergentBehavior || hybrid?.scientificBasis,
    properties: hybrid?.emergentProperties?.slice(0, 3) ?? [],
    nextHref: "/dashboard/hybrid-lab",
    slice: "First-order sketch only. Hybrid² Lab lists blends and hybridizes those blends.",
  });
}
