import { getOrbitProjectById } from "@/lib/orbit/ingest";
import { db } from "@/lib/db";
import { orbitProjects } from "@/lib/orbit/schema";
import { eq, and } from "drizzle-orm";
import type { OrbitExternalAnalyticsConfig } from "../graph-constants";
import { emitExternalEvent } from "./emit-outcomes";

export function parseExternalAnalyticsConfig(
  metadata: Record<string, unknown> | null | undefined,
): OrbitExternalAnalyticsConfig {
  const raw = metadata?.externalAnalytics;
  if (!raw || typeof raw !== "object") return {};
  return raw as OrbitExternalAnalyticsConfig;
}

export type ExternalMetricsInput = {
  sessions7d?: number;
  conversions7d?: number;
  previousSessions7d?: number;
};

export async function updateExternalAnalyticsConfig(
  projectId: string,
  userId: string,
  patch: Partial<OrbitExternalAnalyticsConfig>,
): Promise<OrbitExternalAnalyticsConfig> {
  const project = await getOrbitProjectById(projectId, userId);
  if (!project) throw new Error("Orbit project not found");

  const meta = (project.metadata || {}) as Record<string, unknown>;
  const current = parseExternalAnalyticsConfig(meta);
  const next: OrbitExternalAnalyticsConfig = { ...current, ...patch };

  await db
    .update(orbitProjects)
    .set({
      metadata: { ...meta, externalAnalytics: next },
      updatedAt: new Date(),
    })
    .where(and(eq(orbitProjects.id, projectId), eq(orbitProjects.userId, userId)));

  return next;
}

export async function ingestExternalMetrics(
  projectId: string,
  userId: string,
  metrics: ExternalMetricsInput,
): Promise<OrbitExternalAnalyticsConfig> {
  const project = await getOrbitProjectById(projectId, userId);
  if (!project) throw new Error("Orbit project not found");

  const meta = (project.metadata || {}) as Record<string, unknown>;
  const current = parseExternalAnalyticsConfig(meta);
  const next: OrbitExternalAnalyticsConfig = {
    ...current,
    ...metrics,
    lastSyncedAt: new Date().toISOString(),
  };

  await db
    .update(orbitProjects)
    .set({
      metadata: { ...meta, externalAnalytics: next },
      updatedAt: new Date(),
    })
    .where(and(eq(orbitProjects.id, projectId), eq(orbitProjects.userId, userId)));

  return next;
}

/** Compare stored metrics and emit normalized external signal events. */
export async function syncExternalSignalsForProject(
  projectId: string,
  userId: string,
): Promise<{ emitted: number; config: OrbitExternalAnalyticsConfig }> {
  const project = await getOrbitProjectById(projectId, userId);
  if (!project) throw new Error("Orbit project not found");

  const config = parseExternalAnalyticsConfig(project.metadata as Record<string, unknown>);
  let emitted = 0;

  if (config.conversions7d != null && config.conversions7d > 0) {
    await emitExternalEvent({
      orbitProjectId: projectId,
      eventType: "external_conversion",
      source: "ga4",
      idempotencyKey: `external:${projectId}:conversion:${config.lastSyncedAt || "snapshot"}`,
      metrics: { conversions7d: config.conversions7d, sessions7d: config.sessions7d },
    });
    emitted += 1;
  }

  if (config.sessions7d != null && config.sessions7d > 0) {
    await emitExternalEvent({
      orbitProjectId: projectId,
      eventType: "external_page_view",
      source: "ga4",
      idempotencyKey: `external:${projectId}:sessions:${config.lastSyncedAt || "snapshot"}`,
      metrics: { sessions7d: config.sessions7d },
    });
    emitted += 1;
  }

  if (
    config.sessions7d != null &&
    config.previousSessions7d != null &&
    config.previousSessions7d > 0 &&
    config.sessions7d < config.previousSessions7d * 0.7
  ) {
    const dropPct = Math.round(
      (1 - config.sessions7d / config.previousSessions7d) * 100,
    );
    await emitExternalEvent({
      orbitProjectId: projectId,
      eventType: "external_traffic_drop",
      source: "ga4",
      idempotencyKey: `external:${projectId}:traffic_drop:${config.lastSyncedAt || "snapshot"}`,
      metrics: {
        sessions7d: config.sessions7d,
        previousSessions7d: config.previousSessions7d,
        dropPct,
      },
    });
    emitted += 1;
  }

  return { emitted, config };
}
