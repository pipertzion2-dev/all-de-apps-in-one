import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  playgroundSessions,
  playgroundCollaborators,
  playgroundRequests,
  projects,
  users,
} from "@/lib/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";

const createSessionSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  visibility: z.enum(["private", "link", "public"]).default("private"),
  allowEditing: z.boolean().default(false),
});

const updateSessionSchema = z.object({
  sessionId: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  visibility: z.enum(["private", "link", "public"]).optional(),
  allowEditing: z.boolean().optional(),
  savedRequest: z
    .object({
      method: z.string(),
      headers: z.record(z.string()),
      body: z.string(),
    })
    .optional(),
  savedResponse: z
    .object({
      status: z.number(),
      body: z.unknown(),
      latencyMs: z.number(),
      timestamp: z.string(),
    })
    .optional(),
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const shareToken = searchParams.get("shareToken");
  const sessionId = searchParams.get("sessionId");

  if (shareToken) {
    const [session] = await db
      .select()
      .from(playgroundSessions)
      .where(eq(playgroundSessions.shareToken, shareToken));

    if (!session) {
      return NextResponse.json({ error: "Playground not found" }, { status: 404 });
    }

    await db
      .update(playgroundSessions)
      .set({ viewCount: session.viewCount + 1 })
      .where(eq(playgroundSessions.id, session.id));

    const [project] = await db
      .select({ name: projects.name, slug: projects.slug })
      .from(projects)
      .where(eq(projects.id, session.projectId));

    const [owner] = await db
      .select({ name: users.name, avatarUrl: users.avatarUrl })
      .from(users)
      .where(eq(users.id, session.ownerId));

    const collaborators = await db
      .select({
        id: playgroundCollaborators.id,
        role: playgroundCollaborators.role,
        lastActiveAt: playgroundCollaborators.lastActiveAt,
        user: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(playgroundCollaborators)
      .innerJoin(users, eq(playgroundCollaborators.userId, users.id))
      .where(eq(playgroundCollaborators.sessionId, session.id));

    const history = await db
      .select()
      .from(playgroundRequests)
      .where(eq(playgroundRequests.sessionId, session.id))
      .orderBy(desc(playgroundRequests.createdAt))
      .limit(50);

    return NextResponse.json({
      session: { ...session, project, owner },
      collaborators,
      history,
      canEdit: user
        ? session.ownerId === user.id ||
          (session.allowEditing &&
            collaborators.some((c) => c.user.id === user.id && c.role === "editor"))
        : false,
    });
  }

  if (sessionId) {
    const [session] = await db
      .select()
      .from(playgroundSessions)
      .where(eq(playgroundSessions.id, sessionId));

    if (!session) {
      return NextResponse.json({ error: "Playground not found" }, { status: 404 });
    }

    if (session.visibility === "private" && (!user || session.ownerId !== user.id)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const [project] = await db
      .select({ name: projects.name, slug: projects.slug })
      .from(projects)
      .where(eq(projects.id, session.projectId));

    return NextResponse.json({ session: { ...session, project } });
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conditions = projectId
    ? and(
        eq(playgroundSessions.projectId, projectId),
        or(eq(playgroundSessions.ownerId, user.id), eq(playgroundSessions.visibility, "public")),
      )
    : eq(playgroundSessions.ownerId, user.id);

  const sessions = await db
    .select({
      id: playgroundSessions.id,
      name: playgroundSessions.name,
      description: playgroundSessions.description,
      visibility: playgroundSessions.visibility,
      viewCount: playgroundSessions.viewCount,
      shareToken: playgroundSessions.shareToken,
      createdAt: playgroundSessions.createdAt,
      updatedAt: playgroundSessions.updatedAt,
      project: {
        id: projects.id,
        name: projects.name,
        slug: projects.slug,
      },
    })
    .from(playgroundSessions)
    .innerJoin(projects, eq(playgroundSessions.projectId, projects.id))
    .where(conditions)
    .orderBy(desc(playgroundSessions.updatedAt));

  return NextResponse.json({ sessions });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { projectId, name, description, visibility, allowEditing } = parsed.data;

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const shareToken = visibility !== "private" ? nanoid(12) : null;

  const [session] = await db
    .insert(playgroundSessions)
    .values({
      id: nanoid(),
      projectId,
      ownerId: user.id,
      name,
      description: description || null,
      visibility,
      allowEditing,
      shareToken,
    })
    .returning();

  return NextResponse.json({ session });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { sessionId, ...updates } = parsed.data;

  const [session] = await db
    .select()
    .from(playgroundSessions)
    .where(eq(playgroundSessions.id, sessionId));

  if (!session) {
    return NextResponse.json({ error: "Playground not found" }, { status: 404 });
  }

  if (session.ownerId !== user.id) {
    const [collab] = await db
      .select()
      .from(playgroundCollaborators)
      .where(
        and(
          eq(playgroundCollaborators.sessionId, sessionId),
          eq(playgroundCollaborators.userId, user.id),
          eq(playgroundCollaborators.role, "editor"),
        ),
      );

    if (!collab && !session.allowEditing) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (updates.name) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.visibility) {
    updateData.visibility = updates.visibility;
    if (updates.visibility !== "private" && !session.shareToken) {
      updateData.shareToken = nanoid(12);
    }
  }
  if (updates.allowEditing !== undefined) updateData.allowEditing = updates.allowEditing;
  if (updates.savedRequest) updateData.savedRequest = updates.savedRequest;
  if (updates.savedResponse) updateData.savedResponse = updates.savedResponse;

  const [updated] = await db
    .update(playgroundSessions)
    .set(updateData)
    .where(eq(playgroundSessions.id, sessionId))
    .returning();

  return NextResponse.json({ session: updated });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "Session ID required" }, { status: 400 });
  }

  const [session] = await db
    .select()
    .from(playgroundSessions)
    .where(eq(playgroundSessions.id, sessionId));

  if (!session) {
    return NextResponse.json({ error: "Playground not found" }, { status: 404 });
  }

  if (session.ownerId !== user.id) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  await db.delete(playgroundSessions).where(eq(playgroundSessions.id, sessionId));

  return NextResponse.json({ success: true });
}
