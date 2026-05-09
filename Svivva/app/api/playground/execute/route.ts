import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  projects,
  usageLogs,
  playgroundSessions,
  playgroundCollaborators,
  playgroundRequests,
} from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { executeRuntime } from "@/lib/llm/runtime";
import type { JsonSchema } from "@/lib/spec";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const user = await getCurrentUser();
    const { projectId, sessionId, shareToken, input } = await request.json();

    if (!input || typeof input !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Input text is required",
        },
        { status: 400 },
      );
    }

    let project;
    let session = null;

    if (shareToken) {
      const [sessionData] = await db
        .select()
        .from(playgroundSessions)
        .where(eq(playgroundSessions.shareToken, shareToken));

      if (!sessionData) {
        return NextResponse.json(
          {
            success: false,
            error: "Playground not found",
          },
          { status: 404 },
        );
      }

      session = sessionData;

      if (session.visibility === "private") {
        return NextResponse.json(
          {
            success: false,
            error: "This playground is private",
          },
          { status: 403 },
        );
      }

      const isOwner = user && session.ownerId === user.id;
      const isCollaboratorEditor = user
        ? await db
            .select()
            .from(playgroundCollaborators)
            .where(
              and(
                eq(playgroundCollaborators.sessionId, session.id),
                eq(playgroundCollaborators.userId, user.id),
                eq(playgroundCollaborators.role, "editor"),
              ),
            )
            .then((rows) => rows.length > 0)
        : false;

      if (!isOwner && !isCollaboratorEditor && !session.allowEditing) {
        return NextResponse.json(
          {
            success: false,
            error: "Editing not allowed on this playground",
          },
          { status: 403 },
        );
      }

      const [projectData] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, session.projectId));

      if (!projectData) {
        return NextResponse.json(
          {
            success: false,
            error: "Project not found",
          },
          { status: 404 },
        );
      }

      project = projectData;
    } else if (sessionId) {
      if (!user) {
        return NextResponse.json(
          { success: false, error: "Unauthorized - use share token for public access" },
          { status: 401 },
        );
      }

      const [sessionData] = await db
        .select()
        .from(playgroundSessions)
        .where(eq(playgroundSessions.id, sessionId));

      if (!sessionData) {
        return NextResponse.json(
          {
            success: false,
            error: "Playground session not found",
          },
          { status: 404 },
        );
      }

      session = sessionData;

      const isOwner = session.ownerId === user.id;
      const isCollaboratorEditor = await db
        .select()
        .from(playgroundCollaborators)
        .where(
          and(
            eq(playgroundCollaborators.sessionId, sessionId),
            eq(playgroundCollaborators.userId, user.id),
            eq(playgroundCollaborators.role, "editor"),
          ),
        )
        .then((rows) => rows.length > 0);

      if (!isOwner && !isCollaboratorEditor) {
        return NextResponse.json(
          {
            success: false,
            error: "Access denied",
          },
          { status: 403 },
        );
      }

      const [projectData] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, session.projectId));

      if (!projectData) {
        return NextResponse.json(
          {
            success: false,
            error: "Project not found",
          },
          { status: 404 },
        );
      }

      project = projectData;
    } else if (projectId) {
      if (!user) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
      }

      const [projectData] = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.ownerId, user.id)));

      if (!projectData) {
        return NextResponse.json(
          {
            success: false,
            error: "Project not found or access denied",
          },
          { status: 404 },
        );
      }

      project = projectData;
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Project ID or Session ID is required",
        },
        { status: 400 },
      );
    }

    const result = await executeRuntime(input, {
      systemPrompt: project.systemPrompt,
      outputSchema: project.outputSchema as JsonSchema,
    });

    const latencyMs = Date.now() - startTime;

    await db.insert(usageLogs).values({
      id: nanoid(),
      projectId: project.id,
      input: input.substring(0, 1000),
      output: result.output || null,
      latencyMs,
      status: result.success ? "success" : "error",
      error: result.error || null,
    });

    if (session) {
      const requestData = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: input,
      };

      const responseData = {
        status: result.success ? 200 : 500,
        body: result.output || result.error,
        latencyMs,
      };

      await db.insert(playgroundRequests).values({
        id: nanoid(),
        sessionId: session.id,
        userId: user?.id || null,
        request: requestData,
        response: responseData,
        error: result.error || null,
      });

      await db
        .update(playgroundSessions)
        .set({
          savedRequest: requestData,
          savedResponse: { ...responseData, timestamp: new Date().toISOString() },
          updatedAt: new Date(),
        })
        .where(eq(playgroundSessions.id, session.id));
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Playground execution error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Execution failed",
      },
      { status: 500 },
    );
  }
}
