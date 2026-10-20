import { getAllWorkspaceProjects } from "@/lib/workspace-external-apps";
import { findOrbitProjectBySource, runOrbitIngest } from "../ingest";
import { createOrbitRoute, listOrbitRoutesForProject } from "../routes/route-repository";
import { getRouteTemplate } from "../routes/route-templates";
import type { OrbitProjectSourceType } from "../graph-constants";

export type WorkspaceSyncResult = {
  scanned: number;
  ingested: number;
  routesCreated: number;
  skipped: number;
  items: Array<{ name: string; url: string; projectId?: string; routeId?: string; action: string }>;
};

export async function syncWorkspaceRoutesForUser(
  userId: string,
  opts: { templateId?: string; createRoutes?: boolean } = {},
): Promise<WorkspaceSyncResult> {
  const templateId = opts.templateId || "growth_pipeline";
  const template = getRouteTemplate(templateId);
  const result: WorkspaceSyncResult = {
    scanned: 0,
    ingested: 0,
    routesCreated: 0,
    skipped: 0,
    items: [],
  };

  if (!template) return result;

  for (const app of getAllWorkspaceProjects()) {
    result.scanned += 1;
    const sourceType: OrbitProjectSourceType = "url";
    const sourceRef = app.url;

    let project = await findOrbitProjectBySource(userId, sourceType, sourceRef);
    if (!project) {
      try {
        const ingested = await runOrbitIngest({
          userId,
          sourceType,
          sourceRef,
        });
        result.ingested += 1;
        project = await findOrbitProjectBySource(userId, sourceType, sourceRef);
        result.items.push({
          name: app.name,
          url: app.url,
          projectId: ingested.projectId,
          action: "ingested",
        });
      } catch (e) {
        result.skipped += 1;
        result.items.push({
          name: app.name,
          url: app.url,
          action: e instanceof Error ? e.message : "ingest_failed",
        });
        continue;
      }
    }

    if (!project || !opts.createRoutes) {
      result.skipped += 1;
      result.items.push({
        name: app.name,
        url: app.url,
        projectId: project?.id,
        action: project ? "project_exists" : "skipped",
      });
      continue;
    }

    const existing = await listOrbitRoutesForProject(project.id, userId);
    if (existing.length > 0) {
      result.skipped += 1;
      result.items.push({
        name: app.name,
        url: app.url,
        projectId: project.id,
        routeId: existing[0].id,
        action: "route_exists",
      });
      continue;
    }

    const route = await createOrbitRoute({
      userId,
      orbitProjectId: project.id,
      name: `${app.name} — growth`,
      description: app.description,
      sourceChannel: sourceType,
      sourceRef,
      destinations: template.destinations,
      status: "active",
      retryPolicy: { maxAttempts: 3, backoffMs: 2000 },
    });
    result.routesCreated += 1;
    result.items.push({
      name: app.name,
      url: app.url,
      projectId: project.id,
      routeId: route.id,
      action: "route_created",
    });
  }

  return result;
}
