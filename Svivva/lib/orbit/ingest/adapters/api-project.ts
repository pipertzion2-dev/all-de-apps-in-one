import { projectRepository } from "@/lib/repositories/projects";
import type { Project } from "@/lib/schema";
import type { IngestSnapshot } from "../types";

export async function loadApiProjectForUser(projectId: string, userId: string): Promise<Project> {
  const project = await projectRepository.findById(projectId);
  if (!project || project.ownerId !== userId) {
    throw new Error("API project not found or access denied");
  }
  return project;
}

export function buildApiProjectIngestSnapshot(project: Project): IngestSnapshot {
  const productRef = "product";
  const apiRef = "api";
  const schema = project.outputSchema as Record<string, unknown>;
  const properties =
    schema && typeof schema.properties === "object"
      ? Object.keys(schema.properties as Record<string, unknown>)
      : [];

  const entities = [
    {
      ref: productRef,
      entityType: "product" as const,
      name: project.name,
      externalId: project.id,
      slug: project.slug,
      description: project.description || undefined,
      metadata: { status: project.status },
    },
    {
      ref: apiRef,
      entityType: "api" as const,
      name: `${project.slug} API`,
      externalId: project.id,
      slug: project.slug,
      url: `/api/run/${project.slug}`,
      metadata: { outputSchemaFields: properties },
    },
  ];

  const links = [
    {
      fromRef: productRef,
      toRef: apiRef,
      linkType: "has_feature" as const,
    },
  ];

  return {
    projectName: project.name,
    description: project.description || undefined,
    productType: "api_project",
    summary: {
      projectId: project.id,
      slug: project.slug,
      schemaFieldCount: properties.length,
      ingestedAt: new Date().toISOString(),
    },
    entities,
    links,
  };
}

export async function buildApiProjectIngestSnapshotForUser(
  projectId: string,
  userId: string,
): Promise<IngestSnapshot> {
  const project = await loadApiProjectForUser(projectId, userId);
  return buildApiProjectIngestSnapshot(project);
}
