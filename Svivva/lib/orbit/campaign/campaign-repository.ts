import { db } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { orbitCampaigns, type OrbitCampaign } from "@/lib/orbit/schema";
import type { CampaignPlan } from "./plan-types";
import type {
  OrbitApprovalPolicy,
  OrbitCampaignMode,
  OrbitCampaignObjective,
} from "../graph-constants";

export type CreateCampaignInput = {
  orbitProjectId: string;
  userId: string;
  name: string;
  description?: string;
  phase?: string;
  mode?: OrbitCampaignMode;
  objective?: OrbitCampaignObjective;
  sourceChannel?: string;
  sourceRef?: string;
  plan: CampaignPlan;
  approvalPolicy?: OrbitApprovalPolicy;
  startsAt?: Date;
  endsAt?: Date;
};

export async function createOrbitCampaign(input: CreateCampaignInput): Promise<OrbitCampaign> {
  const [row] = await db
    .insert(orbitCampaigns)
    .values({
      orbitProjectId: input.orbitProjectId,
      userId: input.userId,
      name: input.name,
      description: input.description,
      phase: input.phase || input.plan.phases[0]?.phase || "discovery",
      mode: input.mode || "manual",
      status: "planning",
      objective: input.objective || input.plan.objective,
      sourceChannel: input.sourceChannel,
      sourceRef: input.sourceRef,
      planSnapshot: input.plan,
      approvalPolicy: input.approvalPolicy || { requireApprovalForPublish: true },
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      metadata: {
        plannedAssetCount: input.plan.phases.reduce((n, p) => n + p.assets.length, 0),
        planVersion: input.plan.version,
      },
    })
    .returning();
  return row;
}

export async function listOrbitCampaignsForProject(
  orbitProjectId: string,
  userId: string,
  limit = 20,
): Promise<OrbitCampaign[]> {
  return db
    .select()
    .from(orbitCampaigns)
    .where(
      and(eq(orbitCampaigns.orbitProjectId, orbitProjectId), eq(orbitCampaigns.userId, userId)),
    )
    .orderBy(desc(orbitCampaigns.createdAt))
    .limit(limit);
}

export async function listOrbitCampaignsForUser(
  userId: string,
  limit = 50,
): Promise<OrbitCampaign[]> {
  return db
    .select()
    .from(orbitCampaigns)
    .where(eq(orbitCampaigns.userId, userId))
    .orderBy(desc(orbitCampaigns.updatedAt))
    .limit(limit);
}

export async function getOrbitCampaignById(
  campaignId: string,
  userId: string,
): Promise<OrbitCampaign | undefined> {
  const [row] = await db
    .select()
    .from(orbitCampaigns)
    .where(and(eq(orbitCampaigns.id, campaignId), eq(orbitCampaigns.userId, userId)))
    .limit(1);
  return row;
}

export async function updateCampaignStatus(
  campaignId: string,
  userId: string,
  status: string,
): Promise<OrbitCampaign | undefined> {
  const [row] = await db
    .update(orbitCampaigns)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(orbitCampaigns.id, campaignId), eq(orbitCampaigns.userId, userId)))
    .returning();
  return row;
}

export async function updateCampaignApprovalPolicy(
  campaignId: string,
  userId: string,
  approvalPolicy: OrbitApprovalPolicy,
): Promise<OrbitCampaign | undefined> {
  const [row] = await db
    .update(orbitCampaigns)
    .set({ approvalPolicy, updatedAt: new Date() })
    .where(and(eq(orbitCampaigns.id, campaignId), eq(orbitCampaigns.userId, userId)))
    .returning();
  return row;
}

export async function updateCampaignMode(
  campaignId: string,
  userId: string,
  mode: OrbitCampaignMode,
): Promise<OrbitCampaign | undefined> {
  const [row] = await db
    .update(orbitCampaigns)
    .set({ mode, updatedAt: new Date() })
    .where(and(eq(orbitCampaigns.id, campaignId), eq(orbitCampaigns.userId, userId)))
    .returning();
  return row;
}

export async function updateCampaignSchedule(
  campaignId: string,
  userId: string,
  schedule: { startsAt?: Date | null; endsAt?: Date | null },
): Promise<OrbitCampaign | undefined> {
  const [row] = await db
    .update(orbitCampaigns)
    .set({
      startsAt: schedule.startsAt ?? undefined,
      endsAt: schedule.endsAt ?? undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(orbitCampaigns.id, campaignId), eq(orbitCampaigns.userId, userId)))
    .returning();
  return row;
}
