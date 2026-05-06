import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { apiKeys, projects } from "@/lib/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { randomBytes, createHash } from "crypto";
import { nanoid } from "nanoid";

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

function generateApiKey(): { key: string; prefix: string; hash: string } {
  const key = `vv_${randomBytes(24).toString("base64url")}`;
  const prefix = key.substring(0, 7);
  const hash = hashKey(key);
  return { key, prefix, hash };
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userProjects = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.ownerId, user.id));
    
    const projectIds = userProjects.map(p => p.id);
    
    if (projectIds.length === 0) {
      return NextResponse.json([]);
    }
    
    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        projectId: apiKeys.projectId,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
        isActive: apiKeys.isActive,
      })
      .from(apiKeys)
      .where(
        and(
          inArray(apiKeys.projectId, projectIds),
          eq(apiKeys.isActive, true)
        )
      );
    
    return NextResponse.json(keys);
  } catch (error: any) {
    console.error("Get keys error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { name, projectId } = await request.json();
    
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    
    const userProjects = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.ownerId, user.id));
    
    const projectIds = userProjects.map(p => p.id);
    
    if (projectIds.length === 0) {
      return NextResponse.json({ error: "No projects found. Create a project first." }, { status: 400 });
    }
    
    const targetProjectId = projectId || projectIds[0];
    
    if (!projectIds.includes(targetProjectId)) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    
    const { key, prefix, hash } = generateApiKey();
    
    const [newKey] = await db.insert(apiKeys).values({
      id: nanoid(),
      projectId: targetProjectId,
      name,
      keyHash: hash,
      keyPrefix: prefix,
    }).returning();
    
    return NextResponse.json({
      id: newKey.id,
      name: newKey.name,
      keyPrefix: newKey.keyPrefix,
      key,
    });
  } catch (error: any) {
    console.error("Create key error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
