import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ideaSessions, projects } from "@/lib/schema";
import { generateIdeas } from "@/lib/llm/idea-engine";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getCurrentUser } from "@/lib/auth/session";
import { z } from "zod";

const ideaRequestSchema = z.object({
  mode: z.enum(["digital", "physical"]).default("digital"),
  industry: z.string().max(200).optional(),
  context: z.string().max(2000).optional(),
});

const ideaResultSchema = z.object({
  title: z.string().default("Untitled"),
  category: z.string().default("General"),
  description: z.string().default(""),
  uniqueTwist: z.string().default(""),
  marketGap: z.string().default(""),
  feasibility: z.number().min(0).max(100).default(50),
  novelty: z.number().min(0).max(100).default(50),
  lucrativePotential: z.number().min(0).max(100).default(50),
  nextSteps: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await db
      .select()
      .from(ideaSessions)
      .where(eq(ideaSessions.userId, user.id))
      .orderBy(desc(ideaSessions.createdAt))
      .limit(20);

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Idea engine GET error:", error);
    return NextResponse.json({ error: "Failed to fetch ideas" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = ideaRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { mode, industry, context } = parsed.data;

    const userProjects = await db
      .select({ name: projects.name })
      .from(projects)
      .where(eq(projects.ownerId, user.id));

    const sessionId = uuidv4();

    await db.insert(ideaSessions).values({
      id: sessionId,
      userId: user.id,
      mode,
      industry: industry || null,
      context: context || null,
      stage: "scanning",
      ideas: [],
      marketGaps: [],
      competitorInsights: [],
    });

    const result = await generateIdeas({
      mode: mode as "digital" | "physical",
      industry,
      context,
      existingProjects: userProjects.map((p) => p.name),
    });

    if (!result.success) {
      await db.update(ideaSessions).set({ stage: "error" }).where(eq(ideaSessions.id, sessionId));
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const validatedIdeas = result.ideas.map((idea) => {
      const validated = ideaResultSchema.safeParse(idea);
      return validated.success ? validated.data : ideaResultSchema.parse({});
    });

    const avgScore =
      validatedIdeas.length > 0
        ? Math.round(
            validatedIdeas.reduce(
              (sum, i) => sum + (i.novelty + i.lucrativePotential + i.feasibility) / 3,
              0,
            ) / validatedIdeas.length,
          )
        : 0;

    await db
      .update(ideaSessions)
      .set({
        stage: "complete",
        ideas: validatedIdeas,
        marketGaps: result.marketGaps || [],
        competitorInsights: result.competitorInsights || [],
        score: avgScore,
      })
      .where(eq(ideaSessions.id, sessionId));

    const session = await db
      .select()
      .from(ideaSessions)
      .where(eq(ideaSessions.id, sessionId))
      .limit(1);

    return NextResponse.json({ session: session[0] });
  } catch (error) {
    console.error("Idea engine POST error:", error);
    return NextResponse.json({ error: "Failed to generate ideas" }, { status: 500 });
  }
}
