import { getRouteTemplate, getHybridRouteSceneByStrategy } from "./route-templates";
import { IFM_ROUTE_SCENE } from "./ifm-route-scenes";
import { createOrbitRoute, listOrbitRoutesForProject } from "./route-repository";
import { runOrbitRoute } from "./route-runner";
import type { RouteRunResult } from "./route-types";

export type SceneMatrixEntry = {
  id: string;
  templateId?: string;
  hybridStrategyId?: string;
  label: string;
};

export type SceneMatrix = {
  id: string;
  name: string;
  description: string;
  scenes: SceneMatrixEntry[];
};

/** Default OaaS growth matrix — IFM → AEO hybrid → growth pipeline. */
export const OAAS_GROWTH_MATRIX: SceneMatrix = {
  id: "oaas_growth_matrix",
  name: "OaaS Growth Matrix",
  description: "Weekly IFM pairings, answer-shaped hybrid scene, then core growth pipeline",
  scenes: [
    { id: "ifm", templateId: "ifm_weekly", label: "Intent Fusion Matrix" },
    {
      id: "aeo",
      hybridStrategyId: "answer-shaped-aeo",
      label: "Answer-shaped AEO scene",
    },
    { id: "growth", templateId: "growth_pipeline", label: "Growth pipeline" },
  ],
};

export function getSceneMatrix(matrixId: string): SceneMatrix | undefined {
  if (matrixId === OAAS_GROWTH_MATRIX.id) return OAAS_GROWTH_MATRIX;
  return undefined;
}

export function resolveSceneTemplate(entry: SceneMatrixEntry) {
  if (entry.templateId) return getRouteTemplate(entry.templateId);
  if (entry.hybridStrategyId) return getHybridRouteSceneByStrategy(entry.hybridStrategyId);
  return undefined;
}

export type RunSceneMatrixResult = {
  matrixId: string;
  routesCreated: number;
  routesRun: number;
  results: Array<{ sceneId: string; routeId: string; run?: RouteRunResult; error?: string }>;
};

export async function runSceneMatrixForProject(
  userId: string,
  projectId: string,
  matrixId: string,
  opts: { createMissing?: boolean; runRoutes?: boolean } = {},
): Promise<RunSceneMatrixResult> {
  const matrix = getSceneMatrix(matrixId);
  if (!matrix) throw new Error(`Unknown scene matrix: ${matrixId}`);

  const createMissing = opts.createMissing !== false;
  const runRoutes = opts.runRoutes !== false;
  const existing = await listOrbitRoutesForProject(projectId, userId);
  const output: RunSceneMatrixResult = {
    matrixId,
    routesCreated: 0,
    routesRun: 0,
    results: [],
  };

  for (const entry of matrix.scenes) {
    const template = resolveSceneTemplate(entry);
    if (!template) {
      output.results.push({ sceneId: entry.id, routeId: "", error: "Template not found" });
      continue;
    }

    let route = existing.find(
      (r) =>
        r.metadata &&
        typeof r.metadata === "object" &&
        (r.metadata as { matrix?: { sceneId?: string } }).matrix?.sceneId === entry.id,
    );

    if (!route && createMissing) {
      route = await createOrbitRoute({
        userId,
        orbitProjectId: projectId,
        name: `${matrix.name} — ${entry.label}`,
        description: template.description,
        sourceChannel: template.sourceChannel,
        destinations: template.destinations,
        status: "active",
        retryPolicy: { maxAttempts: 3, backoffMs: 2000 },
        metadata: {
          matrix: { matrixId, sceneId: entry.id },
          scene: entry.hybridStrategyId
            ? { type: "hybrid", hybridStrategyId: entry.hybridStrategyId }
            : entry.templateId === IFM_ROUTE_SCENE.id
              ? { type: "ifm" }
              : { type: "core", templateId: entry.templateId },
        },
      });
      output.routesCreated += 1;
      existing.push(route);
    }

    if (!route) {
      output.results.push({ sceneId: entry.id, routeId: "", error: "Route missing" });
      continue;
    }

    if (runRoutes) {
      try {
        const run = await runOrbitRoute(route.id, userId);
        output.routesRun += 1;
        output.results.push({ sceneId: entry.id, routeId: route.id, run });
      } catch (e) {
        output.results.push({
          sceneId: entry.id,
          routeId: route.id,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    } else {
      output.results.push({ sceneId: entry.id, routeId: route.id });
    }
  }

  return output;
}
