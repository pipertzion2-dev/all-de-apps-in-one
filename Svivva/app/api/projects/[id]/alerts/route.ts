import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { projectRepository } from "@/lib/repositories";
import { db } from "@/lib/db";
import { usageAlerts } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

const createAlertSchema = z.object({
  thresholdType: z.enum(["percent", "absolute"]).default("percent"),
  thresholdValue: z.number().min(1).max(100).default(80),
  emailEnabled: z.boolean().default(true),
  slackEnabled: z.boolean().default(false),
  slackWebhook: z.string().url().optional().nullable(),
});

const updateAlertSchema = z.object({
  alertId: z.string().min(1),
  thresholdValue: z.number().min(1).max(100).optional(),
  emailEnabled: z.boolean().optional(),
  slackEnabled: z.boolean().optional(),
  slackWebhook: z.string().url().optional().nullable(),
  isActive: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

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

    const alerts = await db
      .select()
      .from(usageAlerts)
      .where(eq(usageAlerts.projectId, id));

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
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
    const parsed = createAlertSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { thresholdType, thresholdValue, emailEnabled, slackEnabled, slackWebhook } = parsed.data;

    const [alert] = await db
      .insert(usageAlerts)
      .values({
        id: nanoid(),
        projectId: id,
        userId: user.id,
        thresholdType,
        thresholdValue,
        emailEnabled,
        slackEnabled,
        slackWebhook: slackWebhook || null,
      })
      .returning();

    return NextResponse.json(alert);
  } catch (error) {
    console.error("Error creating alert:", error);
    return NextResponse.json({ error: "Failed to create alert" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    const parsed = updateAlertSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { alertId, thresholdValue, emailEnabled, slackEnabled, slackWebhook, isActive } = parsed.data;

    const updateData: Record<string, unknown> = {};
    if (thresholdValue !== undefined) updateData.thresholdValue = thresholdValue;
    if (emailEnabled !== undefined) updateData.emailEnabled = emailEnabled;
    if (slackEnabled !== undefined) updateData.slackEnabled = slackEnabled;
    if (slackWebhook !== undefined) updateData.slackWebhook = slackWebhook;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [updated] = await db
      .update(usageAlerts)
      .set(updateData)
      .where(
        and(
          eq(usageAlerts.id, alertId),
          eq(usageAlerts.projectId, id)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating alert:", error);
    return NextResponse.json({ error: "Failed to update alert" }, { status: 500 });
  }
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

    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get("alertId");

    if (!alertId) {
      return NextResponse.json({ error: "Alert ID required" }, { status: 400 });
    }

    await db
      .delete(usageAlerts)
      .where(
        and(
          eq(usageAlerts.id, alertId),
          eq(usageAlerts.projectId, id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting alert:", error);
    return NextResponse.json({ error: "Failed to delete alert" }, { status: 500 });
  }
}
