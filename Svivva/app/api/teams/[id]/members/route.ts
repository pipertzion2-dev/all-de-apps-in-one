import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { teams, teamMembers, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [team] = await db.select().from(teams).where(eq(teams.id, id));

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const isOwner = team.ownerId === user.id;
    const adminMembership = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, id),
          eq(teamMembers.userId, user.id),
          eq(teamMembers.role, "admin"),
        ),
      );

    if (!isOwner && adminMembership.length === 0) {
      return NextResponse.json(
        { error: "Only owners and admins can add members" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { email, role = "member" } = body as { email: string; role?: string };

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!["admin", "member", "viewer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const [targetUser] = await db.select().from(users).where(eq(users.email, email));

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found. They must sign up first." },
        { status: 404 },
      );
    }

    if (targetUser.id === team.ownerId) {
      return NextResponse.json({ error: "Cannot add owner as a member" }, { status: 400 });
    }

    const existingMember = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, id), eq(teamMembers.userId, targetUser.id)));

    if (existingMember.length > 0) {
      return NextResponse.json({ error: "User is already a member" }, { status: 400 });
    }

    const [member] = await db
      .insert(teamMembers)
      .values({
        id: nanoid(),
        teamId: id,
        userId: targetUser.id,
        role,
        invitedBy: user.id,
      })
      .returning();

    return NextResponse.json({
      id: member.id,
      userId: member.userId,
      role: member.role,
      username: targetUser.name,
      email: targetUser.email,
      profileImage: targetUser.avatarUrl,
      joinedAt: member.joinedAt,
    });
  } catch (error) {
    console.error("Error adding member:", error);
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [team] = await db.select().from(teams).where(eq(teams.id, id));

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.ownerId !== user.id) {
      return NextResponse.json({ error: "Only the owner can change roles" }, { status: 403 });
    }

    const body = await request.json();
    const { memberId, role } = body as { memberId: string; role: string };

    if (!memberId || !role) {
      return NextResponse.json({ error: "Member ID and role are required" }, { status: 400 });
    }

    if (!["admin", "member", "viewer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const [updated] = await db
      .update(teamMembers)
      .set({ role })
      .where(and(eq(teamMembers.id, memberId), eq(teamMembers.teamId, id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [team] = await db.select().from(teams).where(eq(teams.id, id));

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json({ error: "Member ID required" }, { status: 400 });
    }

    const [member] = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.id, memberId), eq(teamMembers.teamId, id)));

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const isSelf = member.userId === user.id;
    const isOwner = team.ownerId === user.id;

    if (!isSelf && !isOwner) {
      return NextResponse.json(
        { error: "Only the owner or the member themselves can remove" },
        { status: 403 },
      );
    }

    await db.delete(teamMembers).where(eq(teamMembers.id, memberId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
