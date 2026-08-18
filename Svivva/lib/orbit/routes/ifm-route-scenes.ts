import type { OrbitRouteDestination } from "../graph-constants";
import type { RouteTemplate } from "../routes/route-templates";

export const IFM_WEEKLY_DESTINATIONS: OrbitRouteDestination[] = [
  { channel: "ifm", order: 1, config: { pairCount: 3 } },
  { channel: "bridge_ship", order: 2, config: { allowPartial: true } },
  { channel: "micro_tool_ship", order: 3 },
  {
    channel: "plan",
    order: 4,
    config: { mode: "assisted", objective: "traffic", durationDays: 14 },
  },
  { channel: "generate", order: 5, config: { templateOnly: true } },
  { channel: "approval", order: 6 },
  { channel: "quality_gate", order: 7, config: { requireIfmBridges: true, requireMicroTools: true } },
  { channel: "seo_ops_gate", order: 8, config: { minIndexHealthScore: 70 } },
  { channel: "index_submit", order: 9 },
  { channel: "distribute", order: 10, config: { processNow: false, failIfUnapproved: true } },
  { channel: "analytics", order: 11 },
];

export const IFM_ROUTE_SCENE: RouteTemplate = {
  id: "ifm_weekly",
  name: "Intent Fusion Matrix (weekly)",
  description:
    "Generate cross-hub tool pairings → plan bridge pages → index and measure intent fusion loops",
  sourceChannel: "url",
  destinations: IFM_WEEKLY_DESTINATIONS,
};

export const IFM_COMPOUND_DESTINATIONS: OrbitRouteDestination[] = [
  { channel: "ifm_compound", order: 1, config: { expandCount: 2, shipExpanded: true } },
  { channel: "quality_gate", order: 2, config: { requireIfmBridges: true } },
  { channel: "seo_ops_gate", order: 3, config: { minIndexHealthScore: 70 } },
  { channel: "index_submit", order: 4 },
  { channel: "analytics", order: 5 },
];

export const IFM_COMPOUND_ROUTE_SCENE: RouteTemplate = {
  id: "ifm_compound_weekly",
  name: "IFM winner compounding (weekly)",
  description:
    "Rescore with per-pair GA4 → expand top winners → ship bridges → index and measure",
  sourceChannel: "url",
  destinations: IFM_COMPOUND_DESTINATIONS,
};

export function getIfmRouteScene(): RouteTemplate {
  return IFM_ROUTE_SCENE;
}

export const IFM_ROADMAP_DESTINATIONS: OrbitRouteDestination[] = [
  { channel: "roadmap_promote", order: 1, config: { maxPromote: 3 } },
  { channel: "micro_tool_ship", order: 2 },
  { channel: "roadmap_approve", order: 3 },
  { channel: "analytics", order: 4 },
];

export const IFM_PRODUCT_SHIP_DESTINATIONS: OrbitRouteDestination[] = [
  { channel: "roadmap_product_ship", order: 1, config: { maxShip: 2 } },
  { channel: "quality_gate", order: 2, config: { requireFusionProducts: true } },
  { channel: "seo_ops_gate", order: 3, config: { minIndexHealthScore: 70 } },
  { channel: "index_submit", order: 4 },
  { channel: "analytics", order: 5 },
];

export const IFM_PRODUCT_SHIP_ROUTE_SCENE: RouteTemplate = {
  id: "ifm_product_ship_weekly",
  name: "IFM product ship (weekly)",
  description:
    "Ship approved roadmap items as fusion mini-apps, run quality + SEO gates, then index",
  sourceChannel: "url",
  destinations: IFM_PRODUCT_SHIP_DESTINATIONS,
};

export const IFM_ROADMAP_ROUTE_SCENE: RouteTemplate = {
  id: "ifm_roadmap_weekly",
  name: "IFM roadmap feed (weekly)",
  description: "Promote proven IFM winners to the product roadmap and ship interactive micro-tools",
  sourceChannel: "url",
  destinations: IFM_ROADMAP_DESTINATIONS,
};

export function getIfmCompoundRouteScene(): RouteTemplate {
  return IFM_COMPOUND_ROUTE_SCENE;
}

export function getIfmRoadmapRouteScene(): RouteTemplate {
  return IFM_ROADMAP_ROUTE_SCENE;
}

export function getIfmProductShipRouteScene(): RouteTemplate {
  return IFM_PRODUCT_SHIP_ROUTE_SCENE;
}
