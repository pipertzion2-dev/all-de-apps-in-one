import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { projectRepository } from "@/lib/repositories";
import { db } from "@/lib/db";
import { costPolicies, usageLogs } from "@/lib/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

const costPolicySchema = z.object({
  budgetLimit: z.number().min(0).max(1000000).optional(),
  budgetAlertThreshold: z.number().min(1).max(100).default(80),
  modelPreference: z.enum(["quality", "balanced", "economy"]).default("balanced"),
  autoSwitch: z.boolean().default(false),
  fallbackModel: z.enum(["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"]).default("gpt-4o-mini"),
  complexityThreshold: z.number().min(0).max(100).default(50),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

const MODEL_COSTS = {
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4-turbo": { input: 10, output: 30 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
} as const;

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const project = await projectRepository.findById(id);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [policy] = await db
      .select()
      .from(costPolicies)
      .where(eq(costPolicies.projectId, id));

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthlyUsage] = await db
      .select({
        totalCost: sql<number>`coalesce(sum(${usageLogs.tokensUsed}), 0)::int`,
        totalCalls: sql<number>`count(*)::int`,
        totalTokens: sql<number>`coalesce(sum(${usageLogs.tokensUsed}), 0)::int`,
      })
      .from(usageLogs)
      .where(
        and(
          eq(usageLogs.projectId, id),
          gte(usageLogs.createdAt, monthStart)
        )
      );

    const budgetLimit = policy?.budgetLimit || 10000;
    const budgetUsedPercent = budgetLimit > 0 
      ? Math.round((monthlyUsage?.totalCost || 0) / budgetLimit * 100)
      : 0;

    const recommendation = getCostRecommendation(
      monthlyUsage?.totalCost || 0,
      monthlyUsage?.totalCalls || 0,
      policy?.modelPreference || "balanced"
    );

    return NextResponse.json({
      policy: policy || {
        budgetLimit: 10000,
        budgetAlertThreshold: 80,
        modelPreference: "balanced",
        autoSwitch: false,
        fallbackModel: "gpt-4o-mini",
        complexityThreshold: 50,
      },
      monthlyUsage: {
        totalCost: monthlyUsage?.totalCost || 0,
        totalCalls: monthlyUsage?.totalCalls || 0,
        totalTokens: monthlyUsage?.totalTokens || 0,
        budgetUsedPercent,
      },
      modelCosts: MODEL_COSTS,
      recommendation,
    });
  } catch (error) {
    console.error("Error fetching cost policy:", error);
    return NextResponse.json({ error: "Failed to fetch cost policy" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const project = await projectRepository.findById(id);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = costPolicySchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { budgetLimit, budgetAlertThreshold, modelPreference, autoSwitch, fallbackModel, complexityThreshold } = parsed.data;

    const [existing] = await db
      .select()
      .from(costPolicies)
      .where(eq(costPolicies.projectId, id));

    if (existing) {
      const [updated] = await db
        .update(costPolicies)
        .set({
          budgetLimit,
          budgetAlertThreshold,
          modelPreference,
          autoSwitch,
          fallbackModel,
          complexityThreshold,
          updatedAt: new Date(),
        })
        .where(eq(costPolicies.projectId, id))
        .returning();

      return NextResponse.json(updated);
    }

    const [policy] = await db
      .insert(costPolicies)
      .values({
        id: nanoid(),
        projectId: id,
        budgetLimit,
        budgetAlertThreshold,
        modelPreference,
        autoSwitch,
        fallbackModel,
        complexityThreshold,
      })
      .returning();

    return NextResponse.json(policy);
  } catch (error) {
    console.error("Error saving cost policy:", error);
    return NextResponse.json({ error: "Failed to save cost policy" }, { status: 500 });
  }
}

function getCostRecommendation(
  totalCost: number,
  totalCalls: number,
  currentPreference: string
): { model: string; reason: string; potentialSavings: number } | null {
  if (totalCalls < 100) {
    return null;
  }

  const avgCostPerCall = totalCost / totalCalls;

  if (avgCostPerCall > 50 && currentPreference !== "economy") {
    return {
      model: "gpt-4o-mini",
      reason: "Your average cost per call is high. Switching to gpt-4o-mini could reduce costs significantly.",
      potentialSavings: Math.round(totalCost * 0.6),
    };
  }

  if (avgCostPerCall < 5 && currentPreference !== "quality") {
    return {
      model: "gpt-4o",
      reason: "Your usage is low-cost. Consider upgrading to gpt-4o for better quality without major cost impact.",
      potentialSavings: 0,
    };
  }

  return null;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const project = await projectRepository.findById(id);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(costPolicies).where(eq(costPolicies.projectId, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cost policy:", error);
    return NextResponse.json({ error: "Failed to delete cost policy" }, { status: 500 });
  }
}
