import { pgTable, text, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";

export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  channel: text("channel").notNull(), // email | social | seo | paid | referral | content
  status: text("status").notNull().default("draft"), // draft | active | paused | completed
  budget: real("budget"),
  spent: real("spent").default(0),
  targetAudience: text("target_audience"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  goals: jsonb("goals").$type<{
    clicks?: number;
    conversions?: number;
    leads?: number;
    revenue?: number;
  }>(),
  metrics: jsonb("metrics")
    .$type<{
      clicks: number;
      impressions: number;
      conversions: number;
      leads: number;
      revenue: number;
    }>()
    .default({ clicks: 0, impressions: 0, conversions: 0, leads: 0, revenue: 0 }),
  tags: text("tags").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const marketingLeads = pgTable("marketing_leads", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  company: text("company"),
  phone: text("phone"),
  source: text("source"), // organic | referral | paid | social | email | direct
  campaignId: text("campaign_id"),
  score: integer("score").default(0),
  status: text("status").default("new"), // new | contacted | qualified | converted | lost
  tags: text("tags").array().default([]),
  notes: text("notes"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  metadata: jsonb("metadata").$type<Record<string, string>>(),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const marketingReferrals = pgTable("marketing_referrals", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  referrerId: text("referrer_id").notNull(),
  referrerEmail: text("referrer_email").notNull(),
  referralCode: text("referral_code").notNull().unique(),
  referralLink: text("referral_link").notNull(),
  clicks: integer("clicks").default(0),
  signups: integer("signups").default(0),
  conversions: integer("conversions").default(0),
  rewardType: text("reward_type").default("credit"), // credit | discount | cash | gift
  rewardAmount: real("reward_amount").default(0),
  rewardPaid: boolean("reward_paid").default(false),
  status: text("status").default("active"), // active | paused | expired
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const marketingReferralEvents = pgTable("marketing_referral_events", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  referralId: text("referral_id").notNull(),
  eventType: text("event_type").notNull(), // click | signup | conversion
  referredEmail: text("referred_email"),
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const marketingUtmLinks = pgTable("marketing_utm_links", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  destinationUrl: text("destination_url").notNull(),
  utmSource: text("utm_source").notNull(),
  utmMedium: text("utm_medium").notNull(),
  utmCampaign: text("utm_campaign").notNull(),
  utmTerm: text("utm_term"),
  utmContent: text("utm_content"),
  shortCode: text("short_code").unique(),
  clicks: integer("clicks").default(0),
  campaignId: text("campaign_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const marketingAbTests = pgTable("marketing_ab_tests", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  hypothesis: text("hypothesis"),
  status: text("status").default("draft"), // draft | running | paused | concluded
  winnerVariant: text("winner_variant"),
  targetMetric: text("target_metric").notNull().default("conversion_rate"),
  variants: jsonb("variants")
    .$type<
      Array<{
        id: string;
        name: string;
        description: string;
        traffic: number;
        conversions: number;
        impressions: number;
      }>
    >()
    .default([]),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const marketingAmplifyJobs = pgTable("marketing_amplify_jobs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sourceType: text("source_type").notNull(), // blog | seo-page | custom
  sourceId: text("source_id"),
  sourceContent: text("source_content"),
  outputs: jsonb("outputs")
    .$type<Array<{ channel: string; content: string; status: string }>>()
    .default([]),
  channels: text("channels").array().default([]), // twitter | linkedin | email | instagram | facebook
  status: text("status").default("pending"), // pending | processing | done | failed
  createdAt: timestamp("created_at").defaultNow(),
});

export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;
export type NewMarketingCampaign = typeof marketingCampaigns.$inferInsert;
export type MarketingLead = typeof marketingLeads.$inferSelect;
export type NewMarketingLead = typeof marketingLeads.$inferInsert;
export type MarketingReferral = typeof marketingReferrals.$inferSelect;
export type MarketingUtmLink = typeof marketingUtmLinks.$inferSelect;
export type MarketingAbTest = typeof marketingAbTests.$inferSelect;
