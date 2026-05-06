import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { teams, teamMembers, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

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

    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, id));

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const isOwner = team.ownerId === user.id;
    const membership = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, id), eq(teamMembers.userId, user.id)));

    if (!isOwner && membership.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const members = await db
      .select({
        id: teamMembers.id,
        userId: teamMembers.userId,
        role: teamMembers.role,
        joinedAt: teamMembers.joinedAt,
        username: users.name,
        email: users.email,
        profileImage: users.avatarUrl,
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, id));

    const [owner] = await db
      .select({
        id: users.id,
        username: users.name,
        email: users.email,
        profileImage: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, team.ownerId));

    return NextResponse.json({
      ...team,
      owner,
      members,
      userRole: isOwner ? "owner" : membership[0]?.role || "member",
    });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, id));

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.ownerId !== user.id) {
      return NextResponse.json({ error: "Only the owner can update the team" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, avatarUrl } = body as {
      name?: string;
      description?: string;
      avatarUrl?: string;
    };

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    const [updated] = await db
      .update(teams)
      .set(updateData)
      .where(eq(teams.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json({ error: "Failed to update team" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, id));

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.ownerId !== user.id) {
      return NextResponse.json({ error: "Only the owner can delete the team" }, { status: 403 });
    }

    await db.delete(teams).where(eq(teams.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json({ error: "Failed to delete team" }, { status: 500 });
  }
}
