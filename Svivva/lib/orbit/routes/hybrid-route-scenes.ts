import type { OrbitRouteDestination } from "../graph-constants";
import { HYBRID_GTM_STRATEGIES, type HybridGtmStrategy } from "../hybrid-gtm-strategies";
import type { RouteTemplate } from "./route-templates";

const MOTION_PLAN_CONFIG: Record<
  HybridGtmStrategy["motion"],
  { mode: "manual" | "assisted" | "autonomous"; objective: string; durationDays: number }
> = {
  plg: { mode: "autonomous", objective: "signup", durationDays: 21 },
  pls: { mode: "assisted", objective: "signup", durationDays: 30 },
  clg: { mode: "assisted", objective: "traffic", durationDays: 30 },
  aeo: { mode: "assisted", objective: "traffic", durationDays: 45 },
  funnel: { mode: "assisted", objective: "traffic", durationDays: 30 },
};

export type HybridRouteScene = RouteTemplate & {
  hybridStrategyId: string;
  motion: HybridGtmStrategy["motion"];
  sceneType: "hybrid";
};

export function buildHybridSceneDestinations(strategy: HybridGtmStrategy): OrbitRouteDestination[] {
  const plan = MOTION_PLAN_CONFIG[strategy.motion];
  const growthTail: OrbitRouteDestination[] = [
    { channel: "generate", order: 3, config: { templateOnly: true } },
    { channel: "approval", order: 4 },
    { channel: "seo_ops_gate", order: 5, config: { minIndexHealthScore: 70 } },
    { channel: "index_submit", order: 6 },
    { channel: "distribute", order: 7, config: { processNow: false, failIfUnapproved: true } },
    { channel: "analytics", order: 8 },
  ];

  return [
    {
      channel: "fusion",
      order: 1,
      config: {
        hybridStrategyId: strategy.id,
        allowPartial: true,
      },
    },
    {
      channel: "plan",
      order: 2,
      config: {
        mode: plan.mode,
        objective: plan.objective,
        durationDays: plan.durationDays,
      },
    },
    ...growthTail,
    {
      channel: "autopilot",
      order: 9,
      config: { force: false },
    },
  ];
}

export const HYBRID_ROUTE_SCENES: HybridRouteScene[] = HYBRID_GTM_STRATEGIES.map((strategy) => ({
  id: `hybrid:${strategy.id}`,
  hybridStrategyId: strategy.id,
  motion: strategy.motion,
  sceneType: "hybrid" as const,
  name: `${strategy.title} scene`,
  description: strategy.summary,
  sourceChannel: "url",
  destinations: buildHybridSceneDestinations(strategy),
}));

export function getHybridRouteScene(sceneId: string): HybridRouteScene | undefined {
  return HYBRID_ROUTE_SCENES.find((s) => s.id === sceneId);
}

export function getHybridRouteSceneByStrategy(strategyId: string): HybridRouteScene | undefined {
  return HYBRID_ROUTE_SCENES.find((s) => s.hybridStrategyId === strategyId);
}

export function isHybridRouteSceneId(templateId: string): boolean {
  return templateId.startsWith("hybrid:");
}
