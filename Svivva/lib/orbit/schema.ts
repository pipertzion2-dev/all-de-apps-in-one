/**
 * Orbit growth graph — additive schema (Phase 2).
 * Extends existing marketing_campaigns / seo_landing_pages; does not replace them.
 */
import { pgTable, text, timestamp, integer, jsonb, unique, index } from "drizzle-orm/pg-core";
import type { OrbitApprovalPolicy, OrbitRouteDestination } from "./graph-constants";

// ============================================================================
// ORBIT PROJECTS — root ingest container (URL, Seed, Play, API project, etc.)
// ============================================================================
export const orbitProjects = pgTable(
  "orbit_projects",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    slug: text("slug"),
    description: text("description"),
    /** url | seed | play | api_project | manual | campaign */
    sourceType: text("source_type").notNull(),
    /** Upstream id: seed id, play_session id, projects.id, canonical URL hash, etc. */
    sourceRef: text("source_ref"),
    /** ingesting | ready | archived | error */
    status: text("status").notNull().default("ingesting"),
    /** Cached normalized ingest summary — avoids re-crawling for downstream AI */
    normalizedSummary: jsonb("normalized_summary").$type<Record<string, unknown>>(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    ingestError: text("ingest_error"),
    ingestedAt: timestamp("ingested_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("idx_orbit_projects_user_id").on(t.userId),
    index("idx_orbit_projects_source").on(t.sourceType, t.sourceRef),
    unique("uq_orbit_projects_user_source").on(t.userId, t.sourceType, t.sourceRef),
  ],
);

// ============================================================================
// ORBIT ENTITIES — graph nodes (pages, releases, keywords, assets, …)
// ============================================================================
export const orbitEntities = pgTable(
  "orbit_entities",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    orbitProjectId: text("orbit_project_id")
      .notNull()
      .references(() => orbitProjects.id, { onDelete: "cascade" }),
    entityType: text("entity_type").notNull(),
    externalId: text("external_id"),
    name: text("name").notNull(),
    slug: text("slug"),
    url: text("url"),
    description: text("description"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("idx_orbit_entities_project").on(t.orbitProjectId),
    index("idx_orbit_entities_type").on(t.orbitProjectId, t.entityType),
    index("idx_orbit_entities_external").on(t.externalId),
  ],
);

// ============================================================================
// ORBIT ENTITY LINKS — explicit relationships (HAS_PAGE, PROMOTES, TARGETS, …)
// ============================================================================
export const orbitEntityLinks = pgTable(
  "orbit_entity_links",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    orbitProjectId: text("orbit_project_id")
      .notNull()
      .references(() => orbitProjects.id, { onDelete: "cascade" }),
    fromEntityId: text("from_entity_id")
      .notNull()
      .references(() => orbitEntities.id, { onDelete: "cascade" }),
    toEntityId: text("to_entity_id")
      .notNull()
      .references(() => orbitEntities.id, { onDelete: "cascade" }),
    linkType: text("link_type").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("idx_orbit_entity_links_project").on(t.orbitProjectId),
    index("idx_orbit_entity_links_from").on(t.fromEntityId),
    index("idx_orbit_entity_links_to").on(t.toEntityId),
    unique("uq_orbit_entity_links_edge").on(t.fromEntityId, t.toEntityId, t.linkType),
  ],
);

// ============================================================================
// ORBIT CAMPAIGNS — phased growth campaigns (extends marketing_campaigns concept)
// ============================================================================
export const orbitCampaigns = pgTable(
  "orbit_campaigns",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    orbitProjectId: text("orbit_project_id")
      .notNull()
      .references(() => orbitProjects.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    /** Optional bridge to existing marketing_hub campaigns */
    marketingCampaignId: text("marketing_campaign_id"),
    name: text("name").notNull(),
    description: text("description"),
    phase: text("phase").notNull().default("discovery"),
    mode: text("mode").notNull().default("manual"),
    status: text("status").notNull().default("draft"),
    objective: text("objective").notNull().default("traffic"),
    sourceChannel: text("source_channel"),
    sourceRef: text("source_ref"),
    startsAt: timestamp("starts_at"),
    endsAt: timestamp("ends_at"),
    approvalPolicy: jsonb("approval_policy").$type<OrbitApprovalPolicy>(),
    planSnapshot: jsonb("plan_snapshot").$type<Record<string, unknown>>(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("idx_orbit_campaigns_project").on(t.orbitProjectId),
    index("idx_orbit_campaigns_user").on(t.userId),
    index("idx_orbit_campaigns_status").on(t.status),
  ],
);

// ============================================================================
// ORBIT CONTENT ASSETS — versioned marketing content with approval + publish state
// ============================================================================
export const orbitContentAssets = pgTable(
  "orbit_content_assets",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    orbitProjectId: text("orbit_project_id")
      .notNull()
      .references(() => orbitProjects.id, { onDelete: "cascade" }),
    orbitCampaignId: text("orbit_campaign_id").references(() => orbitCampaigns.id, {
      onDelete: "set null",
    }),
    entityId: text("entity_id").references(() => orbitEntities.id, { onDelete: "set null" }),
    assetType: text("asset_type").notNull(),
    platform: text("platform").notNull().default("web"),
    version: integer("version").notNull().default(1),
    parentAssetId: text("parent_asset_id"),
    title: text("title"),
    body: text("body").notNull(),
    bodyFormat: text("body_format").notNull().default("markdown"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    promptTemplateVersion: text("prompt_template_version"),
    model: text("model"),
    estimatedCostUsd: text("estimated_cost_usd"),
    validationStatus: text("validation_status").notNull().default("pending"),
    validationResults: jsonb("validation_results").$type<Record<string, unknown>>(),
    approvalStatus: text("approval_status").notNull().default("pending"),
    approvedBy: text("approved_by"),
    approvedAt: timestamp("approved_at"),
    publishStatus: text("publish_status").notNull().default("draft"),
    publishedUrl: text("published_url"),
    publishedAt: timestamp("published_at"),
    publishedBy: text("published_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("idx_orbit_content_assets_project").on(t.orbitProjectId),
    index("idx_orbit_content_assets_campaign").on(t.orbitCampaignId),
    index("idx_orbit_content_assets_publish").on(t.publishStatus),
    index("idx_orbit_content_assets_parent").on(t.parentAssetId),
  ],
);

// ============================================================================
// ORBIT DISTRIBUTION JOBS — provider publish / schedule / manual-ready queue
// ============================================================================
export const orbitDistributionJobs = pgTable(
  "orbit_distribution_jobs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    orbitProjectId: text("orbit_project_id")
      .notNull()
      .references(() => orbitProjects.id, { onDelete: "cascade" }),
    orbitCampaignId: text("orbit_campaign_id").references(() => orbitCampaigns.id, {
      onDelete: "set null",
    }),
    contentAssetId: text("content_asset_id")
      .notNull()
      .references(() => orbitContentAssets.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    action: text("action").notNull().default("publish"),
    status: text("status").notNull().default("pending"),
    scheduledAt: timestamp("scheduled_at"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    externalId: text("external_id"),
    externalUrl: text("external_url"),
    errorMessage: text("error_message"),
    retryCount: integer("retry_count").notNull().default(0),
    maxRetries: integer("max_retries").notNull().default(3),
    idempotencyKey: text("idempotency_key").notNull(),
    requestPayload: jsonb("request_payload").$type<Record<string, unknown>>(),
    responsePayload: jsonb("response_payload").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    unique("uq_orbit_distribution_jobs_idempotency").on(t.idempotencyKey),
    index("idx_orbit_distribution_jobs_asset").on(t.contentAssetId),
    index("idx_orbit_distribution_jobs_status").on(t.status),
    index("idx_orbit_distribution_jobs_provider").on(t.provider),
  ],
);

// ============================================================================
// ORBIT INDEX RECORDS — URL discovery / submission lifecycle
// ============================================================================
export const orbitIndexRecords = pgTable(
  "orbit_index_records",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    orbitProjectId: text("orbit_project_id")
      .notNull()
      .references(() => orbitProjects.id, { onDelete: "cascade" }),
    contentAssetId: text("content_asset_id").references(() => orbitContentAssets.id, {
      onDelete: "set null",
    }),
    url: text("url").notNull(),
    canonicalUrl: text("canonical_url"),
    status: text("status").notNull().default("created"),
    provider: text("provider").notNull().default("indexnow"),
    submittedAt: timestamp("submitted_at"),
    lastCheckedAt: timestamp("last_checked_at"),
    nextCheckAt: timestamp("next_check_at"),
    failureReason: text("failure_reason"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    unique("uq_orbit_index_records_url_provider").on(t.url, t.provider),
    index("idx_orbit_index_records_project").on(t.orbitProjectId),
    index("idx_orbit_index_records_status").on(t.status),
    index("idx_orbit_index_records_next_check").on(t.nextCheckAt),
  ],
);

// ============================================================================
// ORBIT ROUTES — persisted OaaS patch-bay workflows
// ============================================================================
export const orbitRoutes = pgTable(
  "orbit_routes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull(),
    orbitProjectId: text("orbit_project_id").references(() => orbitProjects.id, {
      onDelete: "set null",
    }),
    name: text("name"),
    description: text("description"),
    sourceChannel: text("source_channel").notNull(),
    sourceRef: text("source_ref"),
    destinations: jsonb("destinations").$type<OrbitRouteDestination[]>().notNull().default([]),
    status: text("status").notNull().default("draft"),
    lastRunAt: timestamp("last_run_at"),
    lastRunResult: jsonb("last_run_result").$type<Record<string, unknown>>(),
    lastError: text("last_error"),
    retryPolicy: jsonb("retry_policy").$type<{
      maxAttempts?: number;
      backoffMs?: number;
    }>(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("idx_orbit_routes_user").on(t.userId),
    index("idx_orbit_routes_project").on(t.orbitProjectId),
    index("idx_orbit_routes_status").on(t.status),
  ],
);

export type OrbitProject = typeof orbitProjects.$inferSelect;
export type NewOrbitProject = typeof orbitProjects.$inferInsert;
export type OrbitEntity = typeof orbitEntities.$inferSelect;
export type NewOrbitEntity = typeof orbitEntities.$inferInsert;
export type OrbitEntityLink = typeof orbitEntityLinks.$inferSelect;
export type OrbitCampaign = typeof orbitCampaigns.$inferSelect;
export type NewOrbitCampaign = typeof orbitCampaigns.$inferInsert;
export type OrbitContentAsset = typeof orbitContentAssets.$inferSelect;
export type NewOrbitContentAsset = typeof orbitContentAssets.$inferInsert;
export type OrbitDistributionJob = typeof orbitDistributionJobs.$inferSelect;
export type OrbitIndexRecord = typeof orbitIndexRecords.$inferSelect;
export type OrbitRoute = typeof orbitRoutes.$inferSelect;

export * from "./seo/schema";
