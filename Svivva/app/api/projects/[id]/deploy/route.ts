import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { projects, projectVersions, deployments } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const projectRows = await db.select().from(projects).where(eq(projects.id, id));

    if (!projectRows[0]) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = projectRows[0];
    if (project.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const versions = await db
      .select()
      .from(projectVersions)
      .where(eq(projectVersions.projectId, id))
      .orderBy(desc(projectVersions.version))
      .limit(1);

    if (!versions[0]) {
      return NextResponse.json({ error: "No version to deploy" }, { status: 400 });
    }

    const latestVersion = versions[0];

    // Upsert deployment (one per project/environment)
    const existing = await db
      .select()
      .from(deployments)
      .where(eq(deployments.projectId, id))
      .limit(1);

    if (existing[0]) {
      await db
        .update(deployments)
        .set({
          versionId: latestVersion.id,
          deployedBy: user.id,
          deployedAt: new Date(),
          isActive: true,
        })
        .where(eq(deployments.id, existing[0].id));
    } else {
      await db.insert(deployments).values({
        id: uuidv4(),
        projectId: id,
        versionId: latestVersion.id,
        environment: "production",
        deployedBy: user.id,
        deployedAt: new Date(),
        isActive: true,
      });
    }

    // Mark project as deployed
    await db
      .update(projects)
      .set({ status: "deployed", updatedAt: new Date() })
      .where(eq(projects.id, id));

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://svivva.com";
    const liveUrl = `${baseUrl}/api/run/${project.slug}`;
    const cardUrl = `${baseUrl}/api-card/${id}`;

    return NextResponse.json({
      success: true,
      liveUrl,
      cardUrl,
      slug: project.slug,
      versionDeployed: latestVersion.version,
    });
  } catch (error) {
    console.error("Deploy error:", error);
    return NextResponse.json({ error: "Deploy failed" }, { status: 500 });
  }
}
