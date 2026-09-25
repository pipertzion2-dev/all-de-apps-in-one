import { db } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { orbitRecommendations, type OrbitRecommendation } from "@/lib/orbit/schema";
import type { OrbitRecommendationStatus } from "../graph-constants";
import type { RecommendationDraft } from "./event-types";

export async function createRecommendation(
  projectId: string,
  draft: RecommendationDraft,
): Promise<OrbitRecommendation> {
  const [row] = await db
    .insert(orbitRecommendations)
    .values({
      orbitProjectId: projectId,
      orbitCampaignId: draft.orbitCampaignId,
      triggerEventId: draft.triggerEventId,
      kind: draft.kind,
      priority: draft.priority,
      status: "open",
      title: draft.title,
      rationale: draft.rationale,
      actionPayload: draft.actionPayload ?? {},
    })
    .returning();
  return row;
}

export async function listOpenRecommendations(
  projectId: string,
  campaignId?: string,
): Promise<OrbitRecommendation[]> {
  const conditions = [
    eq(orbitRecommendations.orbitProjectId, projectId),
    eq(orbitRecommendations.status, "open"),
  ];
  if (campaignId) {
    conditions.push(eq(orbitRecommendations.orbitCampaignId, campaignId));
  }
  return db
    .select()
    .from(orbitRecommendations)
    .where(and(...conditions))
    .orderBy(desc(orbitRecommendations.createdAt));
}

export async function getRecommendationById(
  id: string,
): Promise<OrbitRecommendation | undefined> {
  const [row] = await db
    .select()
    .from(orbitRecommendations)
    .where(eq(orbitRecommendations.id, id))
    .limit(1);
  return row;
}

export async function updateRecommendationStatus(
  id: string,
  status: OrbitRecommendationStatus,
): Promise<OrbitRecommendation | undefined> {
  const [row] = await db
    .update(orbitRecommendations)
    .set({
      status,
      appliedAt: status === "applied" ? new Date() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(orbitRecommendations.id, id))
    .returning();
  return row;
}

export async function countOpenRecommendations(projectId: string): Promise<number> {
  const rows = await listOpenRecommendations(projectId);
  return rows.length;
}

export async function findOpenRecommendationByKind(
  projectId: string,
  kind: string,
  campaignId?: string,
): Promise<OrbitRecommendation | undefined> {
  const open = await listOpenRecommendations(projectId, campaignId);
  return open.find((r) => r.kind === kind);
}
