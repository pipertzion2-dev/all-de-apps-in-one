import { db } from "@/lib/db";
import { projects } from "@/lib/schema";
import { versionRepository } from "@/lib/repositories";
import { eq } from "drizzle-orm";

export async function rollbackProjectToVersion(projectId: string, versionId: string) {
  const version = await versionRepository.findById(versionId);
  if (!version || version.projectId !== projectId) {
    throw new Error("Version not found for this project");
  }

  await db
    .update(projects)
    .set({
      systemPrompt: version.systemPrompt,
      outputSchema: version.outputSchema,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId));

  return version;
}
