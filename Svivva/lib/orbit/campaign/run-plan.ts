import { getOrbitProjectById, getOrbitGraph } from "@/lib/orbit/ingest";
import { buildCampaignPlanFromGraph, countPlannedAssets, graphContextFromProject } from "./planner";
import { createOrbitCampaign } from "./campaign-repository";
import { normalizeApprovalPolicy } from "./approval-policy";
import type { PlanCampaignInput, CampaignPlan } from "./plan-types";
import type { OrbitCampaign } from "@/lib/orbit/schema";

export type PlanCampaignResult = {
  campaign: OrbitCampaign;
  plan: CampaignPlan;
  plannedAssetCount: number;
};

export async function planCampaignForProject(
  projectId: string,
  userId: string,
  input: PlanCampaignInput & {
    name?: string;
    description?: string;
    sourceChannel?: string;
    sourceRef?: string;
  } = {},
): Promise<PlanCampaignResult> {
  const project = await getOrbitProjectById(projectId, userId);
  if (!project) {
    throw new Error("Orbit project not found");
  }
  if (project.status !== "ready") {
    throw new Error(`Project is not ready for planning (status: ${project.status})`);
  }

  const graph = await getOrbitGraph(projectId);
  const ctx = graphContextFromProject(project, graph.entities);
  const plan = buildCampaignPlanFromGraph(ctx, input);

  const campaign = await createOrbitCampaign({
    orbitProjectId: projectId,
    userId,
    name: input.name || `${project.name} — Growth Plan`,
    description: input.description || project.description || undefined,
    mode: input.mode,
    objective: input.objective,
    sourceChannel: input.sourceChannel || project.sourceType,
    sourceRef: input.sourceRef || project.sourceRef || undefined,
    plan,
    approvalPolicy: input.approvalPolicy
      ? normalizeApprovalPolicy(input.approvalPolicy)
      : undefined,
  });

  return {
    campaign,
    plan,
    plannedAssetCount: countPlannedAssets(plan),
  };
}
