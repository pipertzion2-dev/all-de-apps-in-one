import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { projectRepository } from "@/lib/repositories";
import { db } from "@/lib/db";
import { webhooks } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { randomBytes } from "crypto";
import { z } from "zod";

const validEvents = ["api.call", "api.error", "api.threshold", "eval.completed", "version.created", "version.rollback"] as const;

const createWebhookSchema = z.object({
  url: z.string().url("Invalid URL format"),
  events: z.array(z.enum(validEvents)).default(["api.error", "api.threshold"]),
});

const updateWebhookSchema = z.object({
  webhookId: z.string().min(1),
  url: z.string().url("Invalid URL format").optional(),
  events: z.array(z.enum(validEvents)).optional(),
  isActive: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString("base64url")}`;
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

    const projectWebhooks = await db
      .select({
        id: webhooks.id,
        url: webhooks.url,
        events: webhooks.events,
        isActive: webhooks.isActive,
        lastTriggeredAt: webhooks.lastTriggeredAt,
        failureCount: webhooks.failureCount,
        createdAt: webhooks.createdAt,
      })
      .from(webhooks)
      .where(eq(webhooks.projectId, id));

    return NextResponse.json(projectWebhooks);
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    return NextResponse.json({ error: "Failed to fetch webhooks" }, { status: 500 });
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
    const parsed = createWebhookSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { url, events } = parsed.data;

    const secret = generateWebhookSecret();

    const [webhook] = await db
      .insert(webhooks)
      .values({
        id: nanoid(),
        projectId: id,
        url,
        secret,
        events,
      })
      .returning();

    return NextResponse.json({
      id: webhook.id,
      url: webhook.url,
      events: webhook.events,
      secret,
      message: "Webhook created. Save the secret - it won't be shown again.",
    });
  } catch (error) {
    console.error("Error creating webhook:", error);
    return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 });
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
    const parsed = updateWebhookSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { webhookId, url, events, isActive } = parsed.data;

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (url !== undefined) updateData.url = url;
    if (events !== undefined) updateData.events = events;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [updated] = await db
      .update(webhooks)
      .set(updateData)
      .where(and(eq(webhooks.id, webhookId), eq(webhooks.projectId, id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: updated.id,
      url: updated.url,
      events: updated.events,
      isActive: updated.isActive,
    });
  } catch (error) {
    console.error("Error updating webhook:", error);
    return NextResponse.json({ error: "Failed to update webhook" }, { status: 500 });
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
    const webhookId = searchParams.get("webhookId");

    if (!webhookId) {
      return NextResponse.json({ error: "Webhook ID required" }, { status: 400 });
    }

    await db
      .delete(webhooks)
      .where(and(eq(webhooks.id, webhookId), eq(webhooks.projectId, id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting webhook:", error);
    return NextResponse.json({ error: "Failed to delete webhook" }, { status: 500 });
  }
}
