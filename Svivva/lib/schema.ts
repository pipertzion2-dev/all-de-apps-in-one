import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  unique,
  serial,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// USERS
// ============================================================================
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  passwordHash: text("password_hash"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// SESSIONS (for token-based auth when cookies are blocked)
// ============================================================================
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Session = typeof sessions.$inferSelect;

// ============================================================================
// PROJECTS
// ============================================================================
export const projects = pgTable(
  "projects",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    systemPrompt: text("system_prompt").notNull(),
    outputSchema: jsonb("output_schema").notNull().$type<Record<string, unknown>>().default({}),
    status: text("status").notNull().default("draft"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.ownerId, t.slug)],
);

// ============================================================================
// PROJECT VERSIONS
// ============================================================================
export const projectVersions = pgTable(
  "project_versions",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    systemPrompt: text("system_prompt").notNull(),
    outputSchema: jsonb("output_schema").notNull().$type<Record<string, unknown>>().default({}),
    changeSummary: text("change_summary"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.projectId, t.version)],
);

// ============================================================================
// TRAINING EXAMPLES
// ============================================================================
export const trainingExamples = pgTable("training_examples", {
  id: text("id").primaryKey(),
  versionId: text("version_id")
    .notNull()
    .references(() => projectVersions.id, { onDelete: "cascade" }),
  input: text("input").notNull(),
  output: jsonb("output").notNull().$type<Record<string, unknown>>(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// EVAL SUITES
// ============================================================================
export const evalSuites = pgTable(
  "eval_suites",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.projectId, t.name)],
);

// ============================================================================
// EVAL CASES
// ============================================================================
export const evalCases = pgTable(
  "eval_cases",
  {
    id: text("id").primaryKey(),
    suiteId: text("suite_id")
      .notNull()
      .references(() => evalSuites.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    input: text("input").notNull(),
    expectedOutput: jsonb("expected_output").$type<Record<string, unknown>>(),
    assertionType: text("assertion_type").notNull().default("exact"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.suiteId, t.name)],
);

// ============================================================================
// EVAL RUNS
// ============================================================================
export const evalRuns = pgTable("eval_runs", {
  id: text("id").primaryKey(),
  suiteId: text("suite_id")
    .notNull()
    .references(() => evalSuites.id, { onDelete: "cascade" }),
  versionId: text("version_id")
    .notNull()
    .references(() => projectVersions.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  totalCases: integer("total_cases").notNull().default(0),
  passedCases: integer("passed_cases").notNull().default(0),
  failedCases: integer("failed_cases").notNull().default(0),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// EVAL RUN RESULTS
// ============================================================================
export const evalRunResults = pgTable("eval_run_results", {
  id: text("id").primaryKey(),
  runId: text("run_id")
    .notNull()
    .references(() => evalRuns.id, { onDelete: "cascade" }),
  caseId: text("case_id")
    .notNull()
    .references(() => evalCases.id, { onDelete: "cascade" }),
  actualOutput: jsonb("actual_output").$type<Record<string, unknown>>(),
  passed: boolean("passed"),
  error: text("error"),
  latencyMs: integer("latency_ms"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// DEPLOYMENTS
// ============================================================================
export const deployments = pgTable(
  "deployments",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    versionId: text("version_id")
      .notNull()
      .references(() => projectVersions.id, { onDelete: "cascade" }),
    environment: text("environment").notNull().default("production"),
    deployedBy: text("deployed_by").references(() => users.id, { onDelete: "set null" }),
    deployedAt: timestamp("deployed_at").notNull().defaultNow(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.projectId, t.environment)],
);

// ============================================================================
// API KEYS
// ============================================================================
export const apiKeys = pgTable("api_keys", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull(),
  keyPrefix: text("key_prefix").notNull(),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// PROJECT BRANDING
// ============================================================================
export const projectBrands = pgTable("project_brands", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" })
    .unique(),
  brandName: text("brand_name"),
  tagline: text("tagline"),
  icon: text("icon"),
  colorPalette: jsonb("color_palette").$type<{
    primary: string;
    secondary: string;
    accent: string;
  }>(),
  category: text("category"),
  personality: text("personality"),
  suggestedNames: jsonb("suggested_names").$type<string[]>(),
  suggestedIcons: jsonb("suggested_icons").$type<string[]>(),
  suggestedPalettes:
    jsonb("suggested_palettes").$type<
      { name: string; colors: { primary: string; secondary: string; accent: string } }[]
    >(),
  onboardingStep: text("onboarding_step").default("define"),
  onboardingAnswers: jsonb("onboarding_answers").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// USAGE LOGS
// ============================================================================
export const usageLogs = pgTable("usage_logs", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  versionId: text("version_id").references(() => projectVersions.id, { onDelete: "set null" }),
  apiKeyId: text("api_key_id").references(() => apiKeys.id, { onDelete: "set null" }),
  input: text("input"),
  output: jsonb("output").$type<Record<string, unknown>>(),
  latencyMs: integer("latency_ms"),
  tokensUsed: integer("tokens_used"),
  status: text("status").notNull(),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// TEAMS / ORGANIZATIONS
// ============================================================================
export const teams = pgTable("teams", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  description: text("description"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const teamMembers = pgTable(
  "team_members",
  {
    id: text("id").primaryKey(),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"), // owner, admin, member, viewer
    invitedBy: text("invited_by").references(() => users.id, { onDelete: "set null" }),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.teamId, t.userId)],
);

export const projectPermissions = pgTable("project_permissions", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  teamId: text("team_id").references(() => teams.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("viewer"), // owner, editor, viewer
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// PROMPT COMMENTS
// ============================================================================
export const promptComments = pgTable("prompt_comments", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  versionId: text("version_id").references(() => projectVersions.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  lineStart: integer("line_start"),
  lineEnd: integer("line_end"),
  resolved: boolean("resolved").notNull().default(false),
  parentId: text("parent_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// USAGE ALERTS
// ============================================================================
export const usageAlerts = pgTable("usage_alerts", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  thresholdType: text("threshold_type").notNull().default("percent"), // percent, absolute
  thresholdValue: integer("threshold_value").notNull().default(80),
  emailEnabled: boolean("email_enabled").notNull().default(true),
  slackEnabled: boolean("slack_enabled").notNull().default(false),
  slackWebhook: text("slack_webhook"),
  lastTriggeredAt: timestamp("last_triggered_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// WEBHOOKS
// ============================================================================
export const webhooks = pgTable("webhooks", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  secret: text("secret").notNull(),
  events: jsonb("events").notNull().$type<string[]>().default([]), // error, success, threshold
  isActive: boolean("is_active").notNull().default(true),
  lastTriggeredAt: timestamp("last_triggered_at"),
  failureCount: integer("failure_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// A/B EXPERIMENTS
// ============================================================================
export const promptExperiments = pgTable("prompt_experiments", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"), // draft, running, paused, completed
  winnerVersionId: text("winner_version_id").references(() => projectVersions.id, {
    onDelete: "set null",
  }),
  autoPromote: boolean("auto_promote").notNull().default(false),
  minSampleSize: integer("min_sample_size").notNull().default(100),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const experimentVariants = pgTable(
  "experiment_variants",
  {
    id: text("id").primaryKey(),
    experimentId: text("experiment_id")
      .notNull()
      .references(() => promptExperiments.id, { onDelete: "cascade" }),
    versionId: text("version_id")
      .notNull()
      .references(() => projectVersions.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    trafficWeight: integer("traffic_weight").notNull().default(50), // percentage 0-100
    impressions: integer("impressions").notNull().default(0),
    conversions: integer("conversions").notNull().default(0),
    avgLatencyMs: integer("avg_latency_ms"),
    errorRate: integer("error_rate"), // stored as percentage * 100
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.experimentId, t.versionId)],
);

// ============================================================================
// MARKETPLACE
// ============================================================================
export const marketplaceListings = pgTable("marketplace_listings", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" })
    .unique(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  shortDescription: text("short_description"),
  category: text("category").notNull().default("general"),
  tags: jsonb("tags").$type<string[]>().default([]),
  priceType: text("price_type").notNull().default("free"), // free, one_time, subscription
  priceAmount: integer("price_amount"), // in cents
  currency: text("currency").default("usd"),
  status: text("status").notNull().default("draft"), // draft, pending_review, published, rejected
  featuredAt: timestamp("featured_at"),
  totalPurchases: integer("total_purchases").notNull().default(0),
  totalRevenue: integer("total_revenue").notNull().default(0),
  averageRating: integer("average_rating"), // stored as rating * 100
  reviewCount: integer("review_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const marketplacePurchases = pgTable(
  "marketplace_purchases",
  {
    id: text("id").primaryKey(),
    listingId: text("listing_id")
      .notNull()
      .references(() => marketplaceListings.id, { onDelete: "cascade" }),
    buyerId: text("buyer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stripePaymentId: text("stripe_payment_id"),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("usd"),
    status: text("status").notNull().default("pending"), // pending, completed, refunded
    purchasedAt: timestamp("purchased_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.listingId, t.buyerId)],
);

export const marketplaceReviews = pgTable(
  "marketplace_reviews",
  {
    id: text("id").primaryKey(),
    listingId: text("listing_id")
      .notNull()
      .references(() => marketplaceListings.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(), // 1-5
    title: text("title"),
    body: text("body"),
    isVerifiedPurchase: boolean("is_verified_purchase").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.listingId, t.userId)],
);

// ============================================================================
// FINE-TUNING
// ============================================================================
export const fineTuneJobs = pgTable("fine_tune_jobs", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  baseModel: text("base_model").notNull().default("gpt-4o-mini"),
  status: text("status").notNull().default("pending"), // pending, training, completed, failed
  trainingFile: text("training_file"),
  validationFile: text("validation_file"),
  fineTunedModel: text("fine_tuned_model"),
  trainingLoss: integer("training_loss"), // stored as loss * 10000
  validationLoss: integer("validation_loss"),
  trainedTokens: integer("trained_tokens"),
  epochs: integer("epochs").notNull().default(3),
  estimatedCost: integer("estimated_cost"), // in cents
  actualCost: integer("actual_cost"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const fineTuneDeployments = pgTable("fine_tune_deployments", {
  id: text("id").primaryKey(),
  jobId: text("job_id")
    .notNull()
    .references(() => fineTuneJobs.id, { onDelete: "cascade" }),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  versionId: text("version_id").references(() => projectVersions.id, { onDelete: "set null" }),
  isActive: boolean("is_active").notNull().default(false),
  deployedAt: timestamp("deployed_at").notNull().defaultNow(),
});

// ============================================================================
// COST POLICIES
// ============================================================================
export const costPolicies = pgTable("cost_policies", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" })
    .unique(),
  budgetLimit: integer("budget_limit"), // monthly budget in cents
  budgetAlertThreshold: integer("budget_alert_threshold").default(80), // percentage
  modelPreference: text("model_preference").default("balanced"), // cost, balanced, quality
  autoSwitch: boolean("auto_switch").notNull().default(false),
  fallbackModel: text("fallback_model").default("gpt-4o-mini"),
  complexityThreshold: integer("complexity_threshold").default(50), // token count threshold
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// SDK EXPORTS
// ============================================================================
export const sdkExports = pgTable("sdk_exports", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  language: text("language").notNull(), // python, nodejs, typescript, go
  version: text("version").notNull(),
  downloadUrl: text("download_url"),
  specHash: text("spec_hash"),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
});

// ============================================================================
// ANALYTICS ROLLUPS
// ============================================================================
export const analyticsRollups = pgTable(
  "analytics_rollups",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    interval: text("interval").notNull(), // hourly, daily, weekly, monthly
    periodStart: timestamp("period_start").notNull(),
    periodEnd: timestamp("period_end").notNull(),
    totalCalls: integer("total_calls").notNull().default(0),
    successfulCalls: integer("successful_calls").notNull().default(0),
    failedCalls: integer("failed_calls").notNull().default(0),
    avgLatencyMs: integer("avg_latency_ms"),
    p50LatencyMs: integer("p50_latency_ms"),
    p95LatencyMs: integer("p95_latency_ms"),
    p99LatencyMs: integer("p99_latency_ms"),
    totalTokens: integer("total_tokens").notNull().default(0),
    totalCost: integer("total_cost").notNull().default(0), // in cents
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.projectId, t.interval, t.periodStart)],
);

// ============================================================================
// PLAYGROUND SESSIONS
// ============================================================================
export const playgroundSessions = pgTable("playground_sessions", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  shareToken: text("share_token").unique(), // null = private, non-null = shareable
  visibility: text("visibility").notNull().default("private"), // private, link, public
  allowEditing: boolean("allow_editing").notNull().default(false), // collaborators can edit
  savedRequest: jsonb("saved_request").$type<{
    method: string;
    headers: Record<string, string>;
    body: string;
  }>(),
  savedResponse: jsonb("saved_response").$type<{
    status: number;
    body: unknown;
    latencyMs: number;
    timestamp: string;
  }>(),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// PLAYGROUND COLLABORATORS
// ============================================================================
export const playgroundCollaborators = pgTable(
  "playground_collaborators",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => playgroundSessions.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("viewer"), // viewer, editor
    lastActiveAt: timestamp("last_active_at"),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.sessionId, t.userId)],
);

// ============================================================================
// PLAYGROUND REQUEST HISTORY
// ============================================================================
export const playgroundRequests = pgTable("playground_requests", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => playgroundSessions.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  request: jsonb("request").notNull().$type<{
    method: string;
    headers: Record<string, string>;
    body: string;
  }>(),
  response: jsonb("response").$type<{
    status: number;
    body: unknown;
    latencyMs: number;
  }>(),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// CHAOS RUNS (Adversarial stress testing)
// ============================================================================
export const chaosRuns = pgTable("chaos_runs", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  totalInputs: integer("total_inputs").notNull().default(0),
  passedInputs: integer("passed_inputs").notNull().default(0),
  failedInputs: integer("failed_inputs").notNull().default(0),
  resilienceScore: integer("resilience_score"),
  categories:
    jsonb("categories").$type<Record<string, { total: number; passed: number; failed: number }>>(),
  results: jsonb("results").$type<
    {
      input: string;
      category: string;
      passed: boolean;
      output?: Record<string, unknown>;
      error?: string;
      latencyMs: number;
    }[]
  >(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// PROMPT BREEDS (Genetic prompt combination)
// ============================================================================
export const promptBreeds = pgTable("prompt_breeds", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  parentAVersionId: text("parent_a_version_id")
    .notNull()
    .references(() => projectVersions.id, { onDelete: "cascade" }),
  parentBVersionId: text("parent_b_version_id")
    .notNull()
    .references(() => projectVersions.id, { onDelete: "cascade" }),
  offspringPrompt: text("offspring_prompt"),
  offspringVersionId: text("offspring_version_id").references(() => projectVersions.id, {
    onDelete: "set null",
  }),
  status: text("status").notNull().default("pending"),
  parentAScore: integer("parent_a_score"),
  parentBScore: integer("parent_b_score"),
  offspringScore: integer("offspring_score"),
  evalResults: jsonb("eval_results").$type<{
    parentA: { passed: number; total: number };
    parentB: { passed: number; total: number };
    offspring: { passed: number; total: number };
  }>(),
  reasoning: text("reasoning"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// API AUTOPSIES (Forensic failure analysis)
// ============================================================================
export const apiAutopsies = pgTable("api_autopsies", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  failedInput: text("failed_input").notNull(),
  failedOutput: jsonb("failed_output").$type<Record<string, unknown>>(),
  errorMessage: text("error_message"),
  rootCause: text("root_cause"),
  causeChain: jsonb("cause_chain").$type<string[]>(),
  contributingFactors: jsonb("contributing_factors").$type<string[]>(),
  suggestedFix: text("suggested_fix"),
  fixedPrompt: text("fixed_prompt"),
  severity: text("severity").notNull().default("medium"),
  similarFailures: integer("similar_failures").notNull().default(0),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// SVIVVA PLAY - SESSIONS
// ============================================================================
export const playSessions = pgTable("play_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  name: text("name").notNull().default("Untitled Session"),
  mode: text("mode").notNull().default("composition"),
  status: text("status").notNull().default("draft"),
  sourceAudioUrl: text("source_audio_url"),
  sourceAudioName: text("source_audio_name"),
  sourceAudioDuration: integer("source_audio_duration"),
  analysisId: text("analysis_id"),
  stylePreset: text("style_preset"),
  userPrompt: text("user_prompt"),
  settings: jsonb("settings").$type<Record<string, unknown>>(),
  seed: integer("seed"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// SVIVVA PLAY - ANALYSES
// ============================================================================
export const playAnalyses = pgTable("play_analyses", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => playSessions.id, { onDelete: "cascade" }),
  bpm: integer("bpm"),
  timeSignature: text("time_signature"),
  key: text("key"),
  keyConfidence: integer("key_confidence"),
  chords: jsonb("chords").$type<{ t0: number; t1: number; symbol: string; confidence: number }[]>(),
  sections: jsonb("sections").$type<{ name: string; t0: number; t1: number }[]>(),
  downbeats: jsonb("downbeats").$type<number[]>(),
  styleCompatibility: jsonb("style_compatibility").$type<string[]>(),
  timbreDescriptors: jsonb("timbre_descriptors").$type<Record<string, unknown>>(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// SVIVVA PLAY - GENERATIONS
// ============================================================================
export const playGenerations = pgTable("play_generations", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => playSessions.id, { onDelete: "cascade" }),
  mode: text("mode").notNull(),
  status: text("status").notNull().default("pending"),
  plan: jsonb("plan").$type<Record<string, unknown>>(),
  midiData: jsonb("midi_data").$type<Record<string, unknown>>(),
  renderQuality: text("render_quality").notNull().default("preview"),
  version: integer("version").notNull().default(1),
  seed: integer("seed"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// ============================================================================
// SVIVVA PLAY - STEMS
// ============================================================================
export const playStems = pgTable("play_stems", {
  id: text("id").primaryKey(),
  generationId: text("generation_id")
    .notNull()
    .references(() => playGenerations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role").notNull().default("melody"),
  instrumentHint: text("instrument_hint"),
  audioUrl: text("audio_url"),
  midiEvents: jsonb("midi_events").$type<unknown[]>(),
  pan: integer("pan").notNull().default(0),
  gainDb: integer("gain_db").notNull().default(0),
  muted: boolean("muted").notNull().default(false),
  soloed: boolean("soloed").notNull().default(false),
  expression: jsonb("expression").$type<{ mpe: boolean; meend: boolean }>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// SVIVVA PLAY - PATCHES (Synth Patch Creator)
// ============================================================================
export const playPatches = pgTable("play_patches", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => playSessions.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("Untitled Patch"),
  synthFamily: text("synth_family").notNull().default("subtractive"),
  patchData: jsonb("patch_data").$type<Record<string, unknown>>(),
  instructions: text("instructions"),
  macros: jsonb("macros").$type<{
    brightness: number;
    movement: number;
    bite: number;
    space: number;
  }>(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// INSERT SCHEMAS
// ============================================================================
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertProjectVersionSchema = createInsertSchema(projectVersions).omit({
  id: true,
  createdAt: true,
});
export const insertTrainingExampleSchema = createInsertSchema(trainingExamples).omit({
  id: true,
  createdAt: true,
});
export const insertEvalSuiteSchema = createInsertSchema(evalSuites).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertEvalCaseSchema = createInsertSchema(evalCases).omit({
  id: true,
  createdAt: true,
});
export const insertEvalRunSchema = createInsertSchema(evalRuns).omit({ id: true, createdAt: true });
export const insertEvalRunResultSchema = createInsertSchema(evalRunResults).omit({
  id: true,
  createdAt: true,
});
export const insertDeploymentSchema = createInsertSchema(deployments).omit({
  id: true,
  createdAt: true,
});
export const insertApiKeySchema = createInsertSchema(apiKeys).omit({ id: true, createdAt: true });
export const insertUsageLogSchema = createInsertSchema(usageLogs).omit({
  id: true,
  createdAt: true,
});
export const insertProjectBrandSchema = createInsertSchema(projectBrands).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  joinedAt: true,
});
export const insertProjectPermissionSchema = createInsertSchema(projectPermissions).omit({
  id: true,
  createdAt: true,
});
export const insertPromptCommentSchema = createInsertSchema(promptComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertUsageAlertSchema = createInsertSchema(usageAlerts).omit({
  id: true,
  createdAt: true,
});
export const insertWebhookSchema = createInsertSchema(webhooks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertPromptExperimentSchema = createInsertSchema(promptExperiments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertExperimentVariantSchema = createInsertSchema(experimentVariants).omit({
  id: true,
  createdAt: true,
});
export const insertMarketplaceListingSchema = createInsertSchema(marketplaceListings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertMarketplacePurchaseSchema = createInsertSchema(marketplacePurchases).omit({
  id: true,
  purchasedAt: true,
});
export const insertMarketplaceReviewSchema = createInsertSchema(marketplaceReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertFineTuneJobSchema = createInsertSchema(fineTuneJobs).omit({
  id: true,
  createdAt: true,
});
export const insertFineTuneDeploymentSchema = createInsertSchema(fineTuneDeployments).omit({
  id: true,
  deployedAt: true,
});
export const insertCostPolicySchema = createInsertSchema(costPolicies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertSdkExportSchema = createInsertSchema(sdkExports).omit({
  id: true,
  generatedAt: true,
});
export const insertAnalyticsRollupSchema = createInsertSchema(analyticsRollups).omit({
  id: true,
  createdAt: true,
});
export const insertPlaygroundSessionSchema = createInsertSchema(playgroundSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertPlaygroundCollaboratorSchema = createInsertSchema(playgroundCollaborators).omit({
  id: true,
  joinedAt: true,
});
export const insertPlaygroundRequestSchema = createInsertSchema(playgroundRequests).omit({
  id: true,
  createdAt: true,
});
export const insertChaosRunSchema = createInsertSchema(chaosRuns).omit({
  id: true,
  createdAt: true,
});
export const insertPromptBreedSchema = createInsertSchema(promptBreeds).omit({
  id: true,
  createdAt: true,
});
export const insertApiAutopsySchema = createInsertSchema(apiAutopsies).omit({
  id: true,
  createdAt: true,
});
export const insertPlaySessionSchema = createInsertSchema(playSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertPlayAnalysisSchema = createInsertSchema(playAnalyses).omit({
  id: true,
  createdAt: true,
});
export const insertPlayGenerationSchema = createInsertSchema(playGenerations).omit({
  id: true,
  createdAt: true,
});
export const insertPlayStemSchema = createInsertSchema(playStems).omit({
  id: true,
  createdAt: true,
});
export const insertPlayPatchSchema = createInsertSchema(playPatches).omit({
  id: true,
  createdAt: true,
});

// ============================================================================
// NEURAL AUDIO - DATASETS
// ============================================================================
export const audioDatasets = pgTable("audio_datasets", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  genre: text("genre"),
  status: text("status").notNull().default("draft"),
  totalItems: integer("total_items").notNull().default(0),
  totalDurationSec: integer("total_duration_sec").notNull().default(0),
  validationStatus: text("validation_status").default("pending"),
  validationIssues: jsonb("validation_issues").$type<{ issues: string[] }>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const audioDatasetItems = pgTable("audio_dataset_items", {
  id: text("id").primaryKey(),
  datasetId: text("dataset_id")
    .notNull()
    .references(() => audioDatasets.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url"),
  durationSec: integer("duration_sec"),
  bpm: integer("bpm"),
  key: text("key"),
  genre: text("genre"),
  instrument: text("instrument"),
  mood: text("mood"),
  tags: text("tags").array(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================================
// NEURAL AUDIO - MODELS & TRAINING JOBS
// ============================================================================
export const neuralModels = pgTable("neural_models", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  modelType: text("model_type").notNull().default("diffusion"),
  baseModel: text("base_model"),
  description: text("description"),
  params: jsonb("params").$type<Record<string, unknown>>(),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const neuralTrainingJobs = pgTable("neural_training_jobs", {
  id: text("id").primaryKey(),
  modelId: text("model_id")
    .notNull()
    .references(() => neuralModels.id, { onDelete: "cascade" }),
  datasetId: text("dataset_id")
    .notNull()
    .references(() => audioDatasets.id, { onDelete: "cascade" }),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("queued"),
  progress: integer("progress").notNull().default(0),
  epochs: integer("epochs").notNull().default(100),
  learningRate: text("learning_rate").default("0.0001"),
  batchSize: integer("batch_size").default(8),
  logs: jsonb("logs").$type<{ entries: { time: string; message: string; level: string }[] }>(),
  metrics: jsonb("metrics").$type<Record<string, number>>(),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAudioDatasetSchema = createInsertSchema(audioDatasets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertAudioDatasetItemSchema = createInsertSchema(audioDatasetItems).omit({
  id: true,
  createdAt: true,
});
export const insertNeuralModelSchema = createInsertSchema(neuralModels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertNeuralTrainingJobSchema = createInsertSchema(neuralTrainingJobs).omit({
  id: true,
  createdAt: true,
});

// ============================================================================
// NEURAL API FEATURES - PROMPT OPTIMIZER, SCHEMA ENHANCER, QUALITY GATE, etc.
// ============================================================================
export const neuralPromptAnalyses = pgTable("neural_prompt_analyses", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  versionId: text("version_id"),
  originalPrompt: text("original_prompt").notNull(),
  optimizedPrompt: text("optimized_prompt").notNull(),
  rationale: text("rationale").notNull(),
  improvementScore: integer("improvement_score").notNull(),
  weaknesses: jsonb("weaknesses").$type<string[]>().notNull(),
  strengths: jsonb("strengths").$type<string[]>().notNull(),
  applied: boolean("applied").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const neuralSchemaAnalyses = pgTable("neural_schema_analyses", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  originalSchema: jsonb("original_schema").notNull(),
  suggestedSchema: jsonb("suggested_schema").notNull(),
  rationale: text("rationale").notNull(),
  riskLevel: text("risk_level").notNull(),
  improvements: jsonb("improvements")
    .$type<{ field: string; change: string; reason: string }[]>()
    .notNull(),
  applied: boolean("applied").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const neuralQualityScores = pgTable("neural_quality_scores", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  versionId: text("version_id"),
  input: text("input").notNull(),
  output: jsonb("output").notNull(),
  confidenceScore: integer("confidence_score").notNull(),
  coherenceScore: integer("coherence_score").notNull(),
  completenessScore: integer("completeness_score").notNull(),
  flags: jsonb("flags").$type<string[]>(),
  explanation: text("explanation"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const neuralAugmentationJobs = pgTable("neural_augmentation_jobs", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  strategy: text("strategy").notNull(),
  requestedCount: integer("requested_count").notNull(),
  generatedCount: integer("generated_count").notNull().default(0),
  approvedCount: integer("approved_count").notNull().default(0),
  status: text("status").notNull().default("pending"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const neuralAnomalies = pgTable("neural_anomalies", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  signalType: text("signal_type").notNull(),
  severity: text("severity").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  pattern: jsonb("pattern"),
  recommendations: jsonb("recommendations").$type<string[]>(),
  resolved: boolean("resolved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNeuralPromptAnalysisSchema = createInsertSchema(neuralPromptAnalyses).omit({
  id: true,
  createdAt: true,
});
export const insertNeuralSchemaAnalysisSchema = createInsertSchema(neuralSchemaAnalyses).omit({
  id: true,
  createdAt: true,
});
export const insertNeuralQualityScoreSchema = createInsertSchema(neuralQualityScores).omit({
  id: true,
});
export const insertNeuralAugmentationJobSchema = createInsertSchema(neuralAugmentationJobs).omit({
  id: true,
  createdAt: true,
});
export const insertNeuralAnomalySchema = createInsertSchema(neuralAnomalies).omit({
  id: true,
  createdAt: true,
});

// ============================================================================
// IDEA ENGINE
// ============================================================================
export const ideaSessions = pgTable("idea_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  mode: text("mode").notNull().default("digital"),
  industry: text("industry"),
  context: text("context"),
  stage: text("stage").notNull().default("scanning"),
  ideas: jsonb("ideas").$type<IdeaResult[]>().default([]),
  marketGaps: jsonb("market_gaps").$type<string[]>().default([]),
  competitorInsights: jsonb("competitor_insights").$type<string[]>().default([]),
  score: integer("score"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export interface IdeaResult {
  title: string;
  category: string;
  description: string;
  uniqueTwist: string;
  marketGap: string;
  feasibility: number;
  novelty: number;
  lucrativePotential: number;
  nextSteps: string[];
  tags: string[];
}

export const insertIdeaSessionSchema = createInsertSchema(ideaSessions).omit({
  id: true,
  createdAt: true,
});

// ============================================================================
// SVIVVA SEEDS
// ============================================================================
export interface SeedAppSpec {
  appName: string;
  problemStatement: string;
  targetUsers: string;
  features: string[];
  userFlows: string[];
  databaseSchema: string;
  apiEndpoints: string[];
  uiComponents: string[];
  businessModel: string;
  deploymentPreferences: string;
}

export interface SeedEngineeringDocs {
  apiDocumentation: string;
  systemArchitecture: string;
  databaseDiagram: string;
  deploymentGuide: string;
  testingStrategy: string;
  cicdPipeline: string;
}

export interface SeedMarketingContent {
  landingPageCopy: string;
  valueProposition: string;
  competitiveDifferentiation: string;
  investorPitchSummary: string;
  appStoreDescription: string;
  launchEmailSequence: string;
}

export const seedSessions = pgTable("seed_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  status: text("status").notNull().default("uploading"),
  seedCount: integer("seed_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const seeds = pgTable("seeds", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => seedSessions.id, { onDelete: "cascade" }),
  appName: text("app_name").notNull(),
  spec: jsonb("spec").$type<SeedAppSpec>().notNull(),
  status: text("status").notNull().default("parsed"),
  buildProgress: integer("build_progress").notNull().default(0),
  engineeringDocs: jsonb("engineering_docs").$type<SeedEngineeringDocs | null>().default(null),
  marketingContent: jsonb("marketing_content").$type<SeedMarketingContent | null>().default(null),
  generatedCode: jsonb("generated_code").$type<Record<string, string> | null>().default(null),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSeedSessionSchema = createInsertSchema(seedSessions).omit({
  id: true,
  createdAt: true,
});
export const insertSeedSchema = createInsertSchema(seeds).omit({ id: true, createdAt: true });

// ============================================================================
// TYPES
// ============================================================================
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type ProjectVersion = typeof projectVersions.$inferSelect;
export type InsertProjectVersion = z.infer<typeof insertProjectVersionSchema>;
export type TrainingExample = typeof trainingExamples.$inferSelect;
export type InsertTrainingExample = z.infer<typeof insertTrainingExampleSchema>;
export type EvalSuite = typeof evalSuites.$inferSelect;
export type InsertEvalSuite = z.infer<typeof insertEvalSuiteSchema>;
export type EvalCase = typeof evalCases.$inferSelect;
export type InsertEvalCase = z.infer<typeof insertEvalCaseSchema>;
export type EvalRun = typeof evalRuns.$inferSelect;
export type InsertEvalRun = z.infer<typeof insertEvalRunSchema>;
export type EvalRunResult = typeof evalRunResults.$inferSelect;
export type InsertEvalRunResult = z.infer<typeof insertEvalRunResultSchema>;
export type Deployment = typeof deployments.$inferSelect;
export type InsertDeployment = z.infer<typeof insertDeploymentSchema>;
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type UsageLog = typeof usageLogs.$inferSelect;
export type InsertUsageLog = z.infer<typeof insertUsageLogSchema>;
export type ProjectBrand = typeof projectBrands.$inferSelect;
export type InsertProjectBrand = z.infer<typeof insertProjectBrandSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type ProjectPermission = typeof projectPermissions.$inferSelect;
export type InsertProjectPermission = z.infer<typeof insertProjectPermissionSchema>;
export type PromptComment = typeof promptComments.$inferSelect;
export type InsertPromptComment = z.infer<typeof insertPromptCommentSchema>;
export type UsageAlert = typeof usageAlerts.$inferSelect;
export type InsertUsageAlert = z.infer<typeof insertUsageAlertSchema>;
export type Webhook = typeof webhooks.$inferSelect;
export type InsertWebhook = z.infer<typeof insertWebhookSchema>;
export type PromptExperiment = typeof promptExperiments.$inferSelect;
export type InsertPromptExperiment = z.infer<typeof insertPromptExperimentSchema>;
export type ExperimentVariant = typeof experimentVariants.$inferSelect;
export type InsertExperimentVariant = z.infer<typeof insertExperimentVariantSchema>;
export type MarketplaceListing = typeof marketplaceListings.$inferSelect;
export type InsertMarketplaceListing = z.infer<typeof insertMarketplaceListingSchema>;
export type MarketplacePurchase = typeof marketplacePurchases.$inferSelect;
export type InsertMarketplacePurchase = z.infer<typeof insertMarketplacePurchaseSchema>;
export type MarketplaceReview = typeof marketplaceReviews.$inferSelect;
export type InsertMarketplaceReview = z.infer<typeof insertMarketplaceReviewSchema>;
export type FineTuneJob = typeof fineTuneJobs.$inferSelect;
export type InsertFineTuneJob = z.infer<typeof insertFineTuneJobSchema>;
export type FineTuneDeployment = typeof fineTuneDeployments.$inferSelect;
export type InsertFineTuneDeployment = z.infer<typeof insertFineTuneDeploymentSchema>;
export type CostPolicy = typeof costPolicies.$inferSelect;
export type InsertCostPolicy = z.infer<typeof insertCostPolicySchema>;
export type SdkExport = typeof sdkExports.$inferSelect;
export type InsertSdkExport = z.infer<typeof insertSdkExportSchema>;
export type AnalyticsRollup = typeof analyticsRollups.$inferSelect;
export type InsertAnalyticsRollup = z.infer<typeof insertAnalyticsRollupSchema>;
export type PlaygroundSession = typeof playgroundSessions.$inferSelect;
export type InsertPlaygroundSession = z.infer<typeof insertPlaygroundSessionSchema>;
export type PlaygroundCollaborator = typeof playgroundCollaborators.$inferSelect;
export type InsertPlaygroundCollaborator = z.infer<typeof insertPlaygroundCollaboratorSchema>;
export type PlaygroundRequest = typeof playgroundRequests.$inferSelect;
export type InsertPlaygroundRequest = z.infer<typeof insertPlaygroundRequestSchema>;
export type ChaosRun = typeof chaosRuns.$inferSelect;
export type InsertChaosRun = z.infer<typeof insertChaosRunSchema>;
export type PromptBreed = typeof promptBreeds.$inferSelect;
export type InsertPromptBreed = z.infer<typeof insertPromptBreedSchema>;
export type ApiAutopsy = typeof apiAutopsies.$inferSelect;
export type InsertApiAutopsy = z.infer<typeof insertApiAutopsySchema>;
export type PlaySession = typeof playSessions.$inferSelect;
export type InsertPlaySession = z.infer<typeof insertPlaySessionSchema>;
export type PlayAnalysis = typeof playAnalyses.$inferSelect;
export type InsertPlayAnalysis = z.infer<typeof insertPlayAnalysisSchema>;
export type PlayGeneration = typeof playGenerations.$inferSelect;
export type InsertPlayGeneration = z.infer<typeof insertPlayGenerationSchema>;
export type PlayStem = typeof playStems.$inferSelect;
export type InsertPlayStem = z.infer<typeof insertPlayStemSchema>;
export type PlayPatch = typeof playPatches.$inferSelect;
export type InsertPlayPatch = z.infer<typeof insertPlayPatchSchema>;
export type AudioDataset = typeof audioDatasets.$inferSelect;
export type InsertAudioDataset = z.infer<typeof insertAudioDatasetSchema>;
export type AudioDatasetItem = typeof audioDatasetItems.$inferSelect;
export type InsertAudioDatasetItem = z.infer<typeof insertAudioDatasetItemSchema>;
export type NeuralModel = typeof neuralModels.$inferSelect;
export type InsertNeuralModel = z.infer<typeof insertNeuralModelSchema>;
export type NeuralTrainingJob = typeof neuralTrainingJobs.$inferSelect;
export type InsertNeuralTrainingJob = z.infer<typeof insertNeuralTrainingJobSchema>;
export type NeuralPromptAnalysis = typeof neuralPromptAnalyses.$inferSelect;
export type InsertNeuralPromptAnalysis = z.infer<typeof insertNeuralPromptAnalysisSchema>;
export type NeuralSchemaAnalysis = typeof neuralSchemaAnalyses.$inferSelect;
export type InsertNeuralSchemaAnalysis = z.infer<typeof insertNeuralSchemaAnalysisSchema>;
export type NeuralQualityScore = typeof neuralQualityScores.$inferSelect;
export type InsertNeuralQualityScore = z.infer<typeof insertNeuralQualityScoreSchema>;
export type NeuralAugmentationJob = typeof neuralAugmentationJobs.$inferSelect;
export type InsertNeuralAugmentationJob = z.infer<typeof insertNeuralAugmentationJobSchema>;
export type NeuralAnomaly = typeof neuralAnomalies.$inferSelect;
export type InsertNeuralAnomaly = z.infer<typeof insertNeuralAnomalySchema>;
export type IdeaSession = typeof ideaSessions.$inferSelect;
export type InsertIdeaSession = z.infer<typeof insertIdeaSessionSchema>;
export type SeedSession = typeof seedSessions.$inferSelect;
export type InsertSeedSession = z.infer<typeof insertSeedSessionSchema>;
export type Seed = typeof seeds.$inferSelect;
export type InsertSeed = z.infer<typeof insertSeedSchema>;

// ============================================================================
// BLOG POSTS
// ============================================================================
export const blogPosts = pgTable("blog_posts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  author: text("author").notNull().default("Svivva Team"),
  category: text("category").notNull().default("general"),
  tags: text("tags").array().notNull().default([]),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  ogImage: text("og_image"),
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

// ============================================================================
// SEO LANDING PAGES
// ============================================================================
export const seoLandingPages = pgTable("seo_landing_pages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  keyword: text("keyword").notNull(),
  title: text("title").notNull(),
  headline: text("headline").notNull(),
  subheadline: text("subheadline"),
  content: text("content").notNull(),
  benefits: text("benefits").array().notNull().default([]),
  howItWorks: text("how_it_works").notNull(),
  whoItsFor: text("whos_it_for").notNull(),
  relatedSlugs: text("related_slugs").array().notNull().default([]),
  category: text("category").notNull().default("general"),
  toolUrl: text("tool_url"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSeoLandingPageSchema = createInsertSchema(seoLandingPages).omit({
  id: true,
  createdAt: true,
});
export type SeoLandingPage = typeof seoLandingPages.$inferSelect;
export type InsertSeoLandingPage = z.infer<typeof insertSeoLandingPageSchema>;

// ============================================================================
// PAGE CATEGORIES
// ============================================================================
export const pageCategories = pgTable("page_categories", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
});

export const insertPageCategorySchema = createInsertSchema(pageCategories).omit({ id: true });
export type PageCategory = typeof pageCategories.$inferSelect;
export type InsertPageCategory = z.infer<typeof insertPageCategorySchema>;

export const seoKeywords = pgTable("seo_keywords", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  keyword: text("keyword").notNull(),
  searchVolume: integer("search_volume").notNull().default(0),
  intent: text("intent").notNull().default("medium"),
  assignedPage: text("assigned_page"),
  assignedArticle: text("assigned_article"),
  status: text("status").notNull().default("planned"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSeoKeywordSchema = createInsertSchema(seoKeywords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type SeoKeyword = typeof seoKeywords.$inferSelect;
export type InsertSeoKeyword = z.infer<typeof insertSeoKeywordSchema>;

// ============================================================================
// SEED CREDENTIALS (per-user marketing funnel credentials)
// ============================================================================
export const seedCredentials = pgTable("seed_credentials", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().unique(),
  replitToken: text("replit_token"),
  replitUsername: text("replit_username"),
  godaddyApiKey: text("godaddy_api_key"),
  godaddyApiSecret: text("godaddy_api_secret"),
  godaddyDomain: text("godaddy_domain"),
  googleSiteUrl: text("google_site_url"),
  googleVerificationToken: text("google_verification_token"),
  customDomain: text("custom_domain"),
  domainToken: text("domain_token"),
  domainVerified: boolean("domain_verified").default(false),
  indexnowKey: text("indexnow_key"),
  googleServiceAccountJson: text("google_service_account_json"),
  googleIndexingEnabled: boolean("google_indexing_enabled").default(false),
  lastIndexnowSubmit: timestamp("last_indexnow_submit"),
  lastGoogleIndexing: timestamp("last_google_indexing"),
  miniAppsUrl: text("mini_apps_url"),
  miniAppsSubdomain: text("mini_apps_subdomain"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type SeedCredentials = typeof seedCredentials.$inferSelect;

// ============================================================================
// GROWTH MARKETING SYSTEM
// ============================================================================
export const growthSubmissions = pgTable("growth_submissions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  directoryId: text("directory_id").notNull(),
  product: text("product").notNull(), // "svivva" | "pyracrypt" | "mini_apps"
  status: text("status").notNull().default("pending"), // "pending" | "submitted" | "live" | "rejected"
  submittedAt: timestamp("submitted_at"),
  liveUrl: text("live_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const growthContent = pgTable("growth_content", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  product: text("product").notNull(),
  contentType: text("content_type").notNull(),
  title: text("title"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const growthTasks = pgTable("growth_tasks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  taskType: text("task_type").notNull(),
  product: text("product"),
  status: text("status").notNull().default("completed"),
  details: jsonb("details").$type<Record<string, unknown>>(),
  runAt: timestamp("run_at").notNull().defaultNow(),
});

// ============================================================================
// REPLIT SUB APPS (legacy — integer serial PK)
// ============================================================================
export const replitSubApps = pgTable("replit_sub_apps", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id"),
  parentReplId: varchar("parent_repl_id"),
  parentReplTitle: varchar("parent_repl_title"),
  subAppName: varchar("sub_app_name"),
  subAppDescription: text("sub_app_description").default(""),
  subAppPath: varchar("sub_app_path").default(""),
  subAppUrl: varchar("sub_app_url").default(""),
  marketingSlugs: jsonb("marketing_slugs").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================================
// USER APPS (legacy — integer serial PK)
// ============================================================================
export const userApps = pgTable("user_apps", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id"),
  name: varchar("name"),
  url: varchar("url"),
  description: text("description").default(""),
  platform: varchar("platform").default("custom"),
  hostingProvider: varchar("hosting_provider").default(""),
  domain: varchar("domain").default(""),
  marketingSlugs: jsonb("marketing_slugs").$type<string[]>().default([]),
  subApps: jsonb("sub_apps").$type<unknown[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================================
// PLATFORM RUNTIME SECRETS (optional DB-backed keys when env vars are unset)
// ============================================================================
export const platformRuntimeSecrets = pgTable("platform_runtime_secrets", {
  id: text("id").primaryKey(),
  openaiApiKey: text("openai_api_key"),
  openaiBaseUrl: text("openai_base_url"),
  stripeSecretKey: text("stripe_secret_key"),
  stripePublishableKey: text("stripe_publishable_key"),
  stripeWebhookSecret: text("stripe_webhook_secret"),
  nextPublicSiteUrl: text("next_public_site_url"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// OAUTH STATES (PKCE state management for OAuth flow)
// ============================================================================
export const oauthStates = pgTable("oauth_states", {
  state: text("state").primaryKey(),
  codeVerifier: text("code_verifier").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  redirectAfter: text("redirect_after"),
  callbackBase: text("callback_base"),
});

// ============================================================================
// REFERRALS (Multi-level referral system)
// ============================================================================
export const referrals = pgTable("referrals", {
  id: text("id").primaryKey(),
  referrerId: text("referrer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  referredId: text("referred_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  level: integer("level").notNull().default(1), // Level in hierarchy (1 = direct, 2 = indirect, etc.)
  commissionRate: integer("commission_rate").notNull().default(10), // Percentage commission
  totalEarnings: integer("total_earnings").notNull().default(0), // Total earnings in cents
  status: text("status").notNull().default("active"), // active, paused, completed
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================================
// REFERRAL REWARDS (Individual reward transactions)
// ============================================================================
export const referralRewards = pgTable("referral_rewards", {
  id: text("id").primaryKey(),
  referralId: text("referral_id")
    .notNull()
    .references(() => referrals.id, { onDelete: "cascade" }),
  referrerId: text("referrer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // Amount in cents
  source: text("source").notNull(), // subscription, upgrade, etc.
  sourceId: text("source_id"), // Related subscription/payment ID
  level: integer("level").notNull(), // Level at which reward was earned
  status: text("status").notNull().default("pending"), // pending, paid, failed
  createdAt: timestamp("created_at").notNull().defaultNow(),
  paidAt: timestamp("paid_at"),
});

// ============================================================================
// REFERRAL CAMPAIGNS (Promotional campaigns for referrals)
// ============================================================================
export const referralCampaigns = pgTable("referral_campaigns", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  commissionRate: integer("commission_rate").notNull().default(10), // Base commission rate
  level2Rate: integer("level_2_rate").notNull().default(5), // Second level commission
  level3Rate: integer("level_3_rate").notNull().default(2), // Third level commission
  maxLevels: integer("max_levels").notNull().default(3), // Maximum referral depth
  bonusPerSignup: integer("bonus_per_signup").notNull().default(0), // Bonus in cents per signup
  bonusPerUpgrade: integer("bonus_per_upgrade").notNull().default(500), // Bonus in cents per upgrade
  active: boolean("active").notNull().default(true),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export * from "./marketing/schema";
