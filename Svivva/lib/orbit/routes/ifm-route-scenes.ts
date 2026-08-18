import type { OrbitRouteDestination } from "../graph-constants";
import type { RouteTemplate } from "../routes/route-templates";

export const IFM_WEEKLY_DESTINATIONS: OrbitRouteDestination[] = [
  { channel: "ifm", order: 1, config: { pairCount: 3 } },
  {
    channel: "plan",
    order: 2,
    config: { mode: "assisted", objective: "traffic", durationDays: 14 },
  },
  { channel: "generate", order: 3, config: { templateOnly: true } },
  { channel: "approval", order: 4 },
  { channel: "index_submit", order: 5 },
  { channel: "distribute", order: 6, config: { processNow: false, failIfUnapproved: true } },
  { channel: "analytics", order: 7 },
];

export const IFM_ROUTE_SCENE: RouteTemplate = {
  id: "ifm_weekly",
  name: "Intent Fusion Matrix (weekly)",
  description:
    "Generate cross-hub tool pairings → plan bridge pages → index and measure intent fusion loops",
  sourceChannel: "url",
  destinations: IFM_WEEKLY_DESTINATIONS,
};

export function getIfmRouteScene(): RouteTemplate {
  return IFM_ROUTE_SCENE;
}
