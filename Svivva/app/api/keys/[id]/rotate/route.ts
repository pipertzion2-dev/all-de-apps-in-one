import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { apiKeys, projects } from "@/lib/schema";
import { eq, and, inArray } from "drizzle-orm";
import { randomBytes, createHash } from "crypto";

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

function generateApiKey(): { key: string; prefix: string; hash: string } {
  const key = `vv_${randomBytes(24).toString("base64url")}`;
  const prefix = key.substring(0, 7);
  const hash = hashKey(key);
  return { key, prefix, hash };
}

export async function POST(
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

    const projectIds = userProjects.map((p) => p.id);

    if (projectIds.length === 0) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    const [existingKey] = await db
      .select()
      .from(apiKeys)
      .where(
        and(eq(apiKeys.id, id), inArray(apiKeys.projectId, projectIds))
      );

    if (!existingKey) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    const { key, prefix, hash } = generateApiKey();

    const [updatedKey] = await db
      .update(apiKeys)
      .set({
        keyHash: hash,
        keyPrefix: prefix,
        createdAt: new Date(),
      })
      .where(eq(apiKeys.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      id: updatedKey.id,
      name: updatedKey.name,
      keyPrefix: updatedKey.keyPrefix,
      key,
      message: "API key rotated successfully. Save the new key - it won't be shown again.",
    });
  } catch (error: unknown) {
    console.error("Rotate key error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
