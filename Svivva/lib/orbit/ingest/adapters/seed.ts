import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { seeds, seedSessions, type SeedAppSpec } from "@/lib/schema";
import type { IngestSnapshot } from "../types";

export async function loadSeedForUser(seedId: string, userId: string) {
  const [row] = await db
    .select({ seed: seeds, session: seedSessions })
    .from(seeds)
    .innerJoin(seedSessions, eq(seeds.sessionId, seedSessions.id))
    .where(and(eq(seeds.id, seedId), eq(seedSessions.userId, userId)))
    .limit(1);
  return row;
}

export function buildSeedIngestSnapshot(
  seedId: string,
  appName: string,
  spec: SeedAppSpec,
  marketingContent?: { valueProposition?: string } | null,
): IngestSnapshot {
  const productRef = "product";
  const entities = [
    {
      ref: productRef,
      entityType: "product" as const,
      name: appName,
      externalId: seedId,
      description: spec.problemStatement,
      metadata: {
        targetUsers: spec.targetUsers,
        businessModel: spec.businessModel,
        valueProposition: marketingContent?.valueProposition,
      },
    },
    ...spec.features.map((feature, i) => ({
      ref: `feature:${i}`,
      entityType: "feature" as const,
      name: feature,
      metadata: { source: "seed_spec" },
    })),
    ...spec.apiEndpoints.map((endpoint, i) => ({
      ref: `api:${i}`,
      entityType: "api" as const,
      name: endpoint,
      metadata: { source: "seed_spec" },
    })),
  ];

  const links = [
    ...spec.features.map((_, i) => ({
      fromRef: productRef,
      toRef: `feature:${i}`,
      linkType: "has_feature" as const,
    })),
    ...spec.apiEndpoints.map((_, i) => ({
      fromRef: productRef,
      toRef: `api:${i}`,
      linkType: "related_to" as const,
    })),
  ];

  return {
    projectName: appName,
    description: spec.problemStatement,
    productType: "seed_app",
    summary: {
      seedId,
      featureCount: spec.features.length,
      apiEndpointCount: spec.apiEndpoints.length,
      userFlowCount: spec.userFlows.length,
      ingestedAt: new Date().toISOString(),
    },
    entities,
    links,
  };
}

export async function buildSeedIngestSnapshotForUser(
  seedId: string,
  userId: string,
): Promise<IngestSnapshot> {
  const row = await loadSeedForUser(seedId, userId);
  if (!row) throw new Error("Seed not found or access denied");
  const marketing = row.seed.marketingContent as { valueProposition?: string } | null;
  return buildSeedIngestSnapshot(seedId, row.seed.appName, row.seed.spec, marketing);
}
