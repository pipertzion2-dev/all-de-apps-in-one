export type {
  CreateRouteInput,
  UpdateRouteInput,
  RouteRunContext,
  RouteStepResult,
  RouteRunResult,
} from "./route-types";

export { sortDestinations, validateRouteDestinations } from "./route-types";

export {
  ROUTE_TEMPLATES,
  GROWTH_PIPELINE_DESTINATIONS,
  FULL_PIPELINE_DESTINATIONS,
  getRouteTemplate,
  listAllRouteTemplates,
  isOrbitRouteChannel,
  HYBRID_ROUTE_SCENES,
  getHybridRouteScene,
  getHybridRouteSceneByStrategy,
  isHybridRouteSceneId,
  type RouteTemplate,
  type HybridRouteScene,
} from "./route-templates";

export { runFusionStep, type FusionStepResult } from "./run-fusion-step";
export { resolveFusionRunStep, FUSION_TASK_RUN_STEPS } from "./fusion-task-map";
export { buildHybridSceneDestinations } from "./hybrid-route-scenes";
export { IFM_ROUTE_SCENE, IFM_COMPOUND_ROUTE_SCENE, IFM_ROADMAP_ROUTE_SCENE, getIfmRouteScene, getIfmCompoundRouteScene, getIfmRoadmapRouteScene } from "./ifm-route-scenes";
export {
  OAAS_GROWTH_MATRIX,
  getSceneMatrix,
  runSceneMatrixForProject,
  type SceneMatrix,
} from "./scene-matrix";
export { runBridgeShipStep, runQualityGateStep, runSeoOpsGateStep } from "./route-quality-steps";
export {
  runSeoOpsGate,
  evaluateSeoOpsGate,
  parseSeoOpsSnapshot,
  saveSeoOpsSnapshot,
  type SeoOpsGateResult,
} from "./seo-ops-gate";

export {
  createOrbitRoute,
  listOrbitRoutesForUser,
  listOrbitRoutesForProject,
  listActiveOrbitRoutes,
  getOrbitRouteById,
  updateOrbitRoute,
  deleteOrbitRoute,
  markRouteRunning,
  completeRouteRun,
  getRoutePauseState,
  saveRoutePauseState,
  clearRoutePauseState,
} from "./route-repository";

export {
  computeRouteRetryDelay,
  shouldRetryStep,
} from "./route-retry";

export {
  checkRouteApprovalGate,
  assertRouteApprovalGate,
  RouteAwaitingApprovalError,
} from "./route-approval";

export { runOrbitRoute, runActiveOrbitRoutes } from "./route-runner";
export type { RunOrbitRouteOptions } from "./route-types";
