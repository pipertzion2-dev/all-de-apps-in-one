/**
 * Orbit SEO & Indexing — tenant-aware tables for public mini-apps at /apps/{slug}.
 * Reusable for future Orbit content types via contentType column.
 */
import {
  pgTable,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  real,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const orbitPublicApps = pgTable(
  "orbit_public_apps",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    /** Workspace / owner — matches Orbit userId isolation. */
    workspaceId: text("workspace_id").notNull(),
    contentType: text("content_type").notNull().default("mini_app"),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    category: text("category").notNull().default("general"),
    /** Interactive tool path (e.g. /tools/…) embedded on the same public URL. */
    toolPath: text("tool_path"),
    status: text("status").notNull().default("draft"), // draft | published | private | archived
    isPublic: boolean("is_public").notNull().default(false),
    indexable: boolean("indexable").notNull().default(true),
    sitemapIncluded: boolean("sitemap_included").notNull().default(false),
    publishedAt: timestamp("published_at"),
    unpublishedAt: timestamp("unpublished_at"),
    contentLastmod: timestamp("content_lastmod").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    slugWorkspace: uniqueIndex("orbit_public_apps_workspace_slug").on(t.workspaceId, t.slug),
    statusIdx: index("orbit_public_apps_status_idx").on(t.status, t.isPublic),
  }),
);

export const orbitAppSeoConfig = pgTable("orbit_app_seo_config", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  appId: text("app_id")
    .notNull()
    .references(() => orbitPublicApps.id, { onDelete: "cascade" }),
  seoTitle: text("seo_title"),
  metaDescription: text("meta_description"),
  canonicalUrl: text("canonical_url"),
  /** When true, use canonicalUrl even if it differs from self URL. */
  canonicalOverride: boolean("canonical_override").notNull().default(false),
  ogTitle: text("og_title"),
  ogDescription: text("og_description"),
  ogImage: text("og_image"),
  robotsDirective: text("robots_directive").notNull().default("index,follow"),
  structuredDataJson: jsonb("structured_data_json").$type<Record<string, unknown>>(),
  crawlableBody: text("crawlable_body").notNull().default(""),
  whoItsFor: text("who_its_for").notNull().default(""),
  howToUse: text("how_to_use").notNull().default(""),
  keyFeatures: text("key_features").array().notNull().default([]),
  faqJson: jsonb("faq_json").$type<Array<{ q: string; a: string }>>().default([]),
  adminOverrides: jsonb("admin_overrides").$type<Record<string, boolean>>().default({}),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orbitSitemapEntries = pgTable(
  "orbit_sitemap_entries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceId: text("workspace_id").notNull(),
    appId: text("app_id").references(() => orbitPublicApps.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    canonical: boolean("canonical").notNull().default(true),
    chunk: text("chunk").notNull().default("apps"),
    lastmod: timestamp("lastmod").notNull().defaultNow(),
    priority: real("priority").notNull().default(0.8),
    changeFrequency: text("change_frequency").notNull().default("weekly"),
    active: boolean("active").notNull().default(true),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    urlUnique: uniqueIndex("orbit_sitemap_entries_url").on(t.url),
    activeIdx: index("orbit_sitemap_entries_active_idx").on(t.active, t.chunk),
  }),
);

export const orbitSeoDomains = pgTable(
  "orbit_seo_domains",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceId: text("workspace_id").notNull(),
    domain: text("domain").notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    domainWs: uniqueIndex("orbit_seo_domains_ws_domain").on(t.workspaceId, t.domain),
  }),
);

export const orbitGscConnections = pgTable("orbit_gsc_connections", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  workspaceId: text("workspace_id").notNull(),
  domainId: text("domain_id").references(() => orbitSeoDomains.id, { onDelete: "set null" }),
  propertyUri: text("property_uri"),
  /** AES-GCM ciphertext — never send to browser. */
  encryptedRefreshToken: text("encrypted_refresh_token"),
  encryptedAccessToken: text("encrypted_access_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  scopes: text("scopes").array().notNull().default([]),
  status: text("status").notNull().default("disconnected"),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orbitGscDailyMetrics = pgTable(
  "orbit_gsc_daily_metrics",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceId: text("workspace_id").notNull(),
    connectionId: text("connection_id").references(() => orbitGscConnections.id, {
      onDelete: "cascade",
    }),
    date: text("date").notNull(), // YYYY-MM-DD
    clicks: integer("clicks").notNull().default(0),
    impressions: integer("impressions").notNull().default(0),
    ctr: real("ctr").notNull().default(0),
    position: real("position").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    dayUnique: uniqueIndex("orbit_gsc_daily_ws_date").on(t.workspaceId, t.date),
  }),
);

export const orbitGscQueryMetrics = pgTable(
  "orbit_gsc_query_metrics",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceId: text("workspace_id").notNull(),
    date: text("date").notNull(),
    query: text("query").notNull(),
    clicks: integer("clicks").notNull().default(0),
    impressions: integer("impressions").notNull().default(0),
    ctr: real("ctr").notNull().default(0),
    position: real("position").notNull().default(0),
  },
  (t) => ({
    qIdx: index("orbit_gsc_query_idx").on(t.workspaceId, t.date),
  }),
);

export const orbitGscPageMetrics = pgTable(
  "orbit_gsc_page_metrics",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    workspaceId: text("workspace_id").notNull(),
    date: text("date").notNull(),
    pageUrl: text("page_url").notNull(),
    clicks: integer("clicks").notNull().default(0),
    impressions: integer("impressions").notNull().default(0),
    ctr: real("ctr").notNull().default(0),
    position: real("position").notNull().default(0),
  },
  (t) => ({
    pIdx: index("orbit_gsc_page_idx").on(t.workspaceId, t.date),
  }),
);

export const orbitSeoAuditResults = pgTable("orbit_seo_audit_results", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  workspaceId: text("workspace_id").notNull(),
  appId: text("app_id").references(() => orbitPublicApps.id, { onDelete: "cascade" }),
  checkId: text("check_id").notNull(),
  severity: text("severity").notNull(), // error | warning | info | ok
  message: text("message").notNull(),
  details: jsonb("details").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orbitIndexingChecks = pgTable("orbit_indexing_checks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  workspaceId: text("workspace_id").notNull(),
  appId: text("app_id")
    .notNull()
    .references(() => orbitPublicApps.id, { onDelete: "cascade" }),
  published: boolean("published").notNull().default(false),
  isPublic: boolean("is_public").notNull().default(false),
  sitemapIncluded: boolean("sitemap_included").notNull().default(false),
  crawlable: boolean("crawlable").notNull().default(false),
  indexable: boolean("indexable").notNull().default(false),
  canonicalValid: boolean("canonical_valid").notNull().default(false),
  metadataComplete: boolean("metadata_complete").notNull().default(false),
  /** Traffic detected from Orbit GSC snapshots — not a claim of "Google Indexed". */
  googleTrafficDetected: boolean("google_traffic_detected").notNull().default(false),
  needsAttention: boolean("needs_attention").notNull().default(false),
  attentionReasons: text("attention_reasons").array().notNull().default([]),
  checkedAt: timestamp("checked_at").notNull().defaultNow(),
});

export const orbitSeoOpportunities = pgTable("orbit_seo_opportunities", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  workspaceId: text("workspace_id").notNull(),
  appId: text("app_id").references(() => orbitPublicApps.id, { onDelete: "set null" }),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  explanation: text("explanation").notNull(),
  recommendedAction: text("recommended_action").notNull(),
  severity: text("severity").notNull().default("medium"),
  metrics: jsonb("metrics").$type<Record<string, number | string>>(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orbitAhrefsConnections = pgTable("orbit_ahrefs_connections", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  workspaceId: text("workspace_id").notNull(),
  encryptedApiKey: text("encrypted_api_key"),
  enabled: boolean("enabled").notNull().default(false),
  lastSyncAt: timestamp("last_sync_at"),
  status: text("status").notNull().default("disconnected"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
