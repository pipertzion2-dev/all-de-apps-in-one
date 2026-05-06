import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { apiKeys, projects } from "@/lib/schema";
import { eq, and, inArray } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { id } = await params;
    
    const userProjects = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.ownerId, user.id));
    
    const projectIds = userProjects.map(p => p.id);
    
    if (projectIds.length === 0) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }
    
    const [key] = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.id, id),
          inArray(apiKeys.projectId, projectIds)
        )
      );
    
    if (!key) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }
    
    await db
      .update(apiKeys)
      .set({ isActive: false })
      .where(eq(apiKeys.id, id));
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete key error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
