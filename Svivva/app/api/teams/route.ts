import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { teams, teamMembers, users } from "@/lib/schema";
import { eq, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required").max(100),
  description: z.string().max(500).optional(),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ownedTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        slug: teams.slug,
        description: teams.description,
        avatarUrl: teams.avatarUrl,
        createdAt: teams.createdAt,
      })
      .from(teams)
      .where(eq(teams.ownerId, user.id));

    const memberTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        slug: teams.slug,
        description: teams.description,
        avatarUrl: teams.avatarUrl,
        createdAt: teams.createdAt,
        memberRole: teamMembers.role,
      })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, user.id));

    const ownedWithRole = ownedTeams.map((t) => ({ ...t, role: "owner" as const }));
    const memberWithRole = memberTeams.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      description: t.description,
      avatarUrl: t.avatarUrl,
      createdAt: t.createdAt,
      role: t.memberRole,
    }));

    const allTeams = [...ownedWithRole, ...memberWithRole];
    const uniqueTeams = Array.from(new Map(allTeams.map((t) => [t.id, t])).values());

    return NextResponse.json(uniqueTeams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createTeamSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { name, description } = parsed.data;

    const baseSlug = slugify(name);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await db
        .select({ id: teams.id })
        .from(teams)
        .where(eq(teams.slug, slug))
        .limit(1);

      if (existing.length === 0) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const [team] = await db
      .insert(teams)
      .values({
        id: nanoid(),
        name,
        slug,
        ownerId: user.id,
        description: description || null,
      })
      .returning();

    return NextResponse.json(team);
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
  }
}
