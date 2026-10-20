import type { OrbitRouteChannel, OrbitRouteDestination } from "../graph-constants";
import {
  HYBRID_ROUTE_SCENES,
  getHybridRouteScene,
  getHybridRouteSceneByStrategy,
  isHybridRouteSceneId,
  type HybridRouteScene,
} from "./hybrid-route-scenes";
import { IFM_ROUTE_SCENE } from "./ifm-route-scenes";

/** Default growth pipeline for an existing ingested project. */
export const GROWTH_PIPELINE_DESTINATIONS: OrbitRouteDestination[] = [
  { channel: "plan", order: 1 },
  { channel: "generate", order: 2, config: { templateOnly: true } },
  { channel: "approval", order: 3 },
  { channel: "index_submit", order: 4 },
  { channel: "distribute", order: 5, config: { processNow: false, failIfUnapproved: true } },
  { channel: "analytics", order: 6 },
];

/** Full pipeline including ingest for new sources. */
export const FULL_PIPELINE_DESTINATIONS: OrbitRouteDestination[] = [
  { channel: "ingest", order: 1 },
  ...GROWTH_PIPELINE_DESTINATIONS.map((d) => ({ ...d, order: d.order + 1 })),
  { channel: "autopilot", order: 8, config: { force: true } },
];

export type RouteTemplate = {
  id: string;
  name: string;
  description: string;
  sourceChannel: string;
  destinations: OrbitRouteDestination[];
};

export const ROUTE_TEMPLATES: RouteTemplate[] = [
  {
    id: "growth_pipeline",
    name: "Growth pipeline",
    description: "Plan → generate → index → distribute → analytics for an ingested project",
    sourceChannel: "url",
    destinations: GROWTH_PIPELINE_DESTINATIONS,
  },
  {
    id: "full_pipeline",
    name: "Full pipeline",
    description: "Ingest → growth pipeline → autopilot for a new source",
    sourceChannel: "url",
    destinations: FULL_PIPELINE_DESTINATIONS,
  },
  {
    id: "index_and_distribute",
    name: "Index and distribute",
    description: "Submit indexing and enqueue distribution for an active campaign",
    sourceChannel: "campaign",
    destinations: [
      { channel: "index_submit", order: 1 },
      { channel: "distribute", order: 2, config: { processNow: true } },
      { channel: "analytics", order: 3 },
    ],
  },
];

export function getRouteTemplate(templateId: string): RouteTemplate | undefined {
  if (templateId === IFM_ROUTE_SCENE.id) return IFM_ROUTE_SCENE;
  if (isHybridRouteSceneId(templateId)) {
    return getHybridRouteScene(templateId);
  }
  return ROUTE_TEMPLATES.find((t) => t.id === templateId);
}

export function listAllRouteTemplates(): RouteTemplate[] {
  return [...ROUTE_TEMPLATES, IFM_ROUTE_SCENE, ...HYBRID_ROUTE_SCENES];
}

export function isOrbitRouteChannel(value: string): value is OrbitRouteChannel {
  return (
    value === "ingest" ||
    value === "fusion" ||
    value === "ifm" ||
    value === "bridge_ship" ||
    value === "quality_gate" ||
    value === "plan" ||
    value === "generate" ||
    value === "approval" ||
    value === "index_submit" ||
    value === "distribute" ||
    value === "analytics" ||
    value === "autopilot"
  );
}

export {
  HYBRID_ROUTE_SCENES,
  getHybridRouteScene,
  getHybridRouteSceneByStrategy,
  isHybridRouteSceneId,
  type HybridRouteScene,
};
