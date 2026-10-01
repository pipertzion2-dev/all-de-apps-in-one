import type {
  OrbitCampaignObjective,
  OrbitCampaignPhase,
  OrbitContentPlatform,
} from "../graph-constants";
import type {
  CampaignPlan,
  CampaignPhasePlan,
  GraphContext,
  PlanCampaignInput,
  PlannedAsset,
} from "./plan-types";

let assetCounter = 0;

function nextAssetId(prefix: string): string {
  assetCounter += 1;
  return `${prefix}-${assetCounter}`;
}

function entitiesOf(ctx: GraphContext, type: string) {
  return ctx.entities.filter((e) => e.entityType === type);
}

function asset(partial: Omit<PlannedAsset, "id"> & { idPrefix?: string }): PlannedAsset {
  const { idPrefix = "asset", ...rest } = partial;
  return { id: nextAssetId(idPrefix), ...rest };
}

function phaseBlock(
  phase: OrbitCampaignPhase,
  label: string,
  goals: string[],
  assets: PlannedAsset[],
): CampaignPhasePlan {
  return { phase, label, goals, assets };
}

function baseWebsitePlan(
  ctx: GraphContext,
  objective: OrbitCampaignObjective,
): CampaignPhasePlan[] {
  const pages = entitiesOf(ctx, "page");
  const keywords = entitiesOf(ctx, "keyword").map((k) => k.name);
  const pageIds = pages.slice(0, 5).map((p) => p.id);

  return [
    phaseBlock(
      "discovery",
      "Discovery",
      ["Map indexable surfaces and search intent"],
      [
        asset({
          assetType: "seo_audit",
          platform: "web",
          phase: "discovery",
          title: "SEO gap analysis",
          purpose: "Identify missing landing pages and thin content from ingested site graph",
          priority: "high",
          distributionIntent: "indexing",
          targetEntityIds: pageIds,
          keywords: keywords.slice(0, 8),
        }),
      ],
    ),
    phaseBlock(
      "pre_launch",
      "Pre-launch",
      ["Prepare indexable pages before announcement"],
      [
        asset({
          assetType: "landing_page",
          platform: "web",
          phase: "pre_launch",
          title: `${ctx.projectName} — primary landing page`,
          purpose: "Core conversion page with unique value prop and CTA",
          priority: "high",
          distributionIntent: "indexing",
        }),
        asset({
          assetType: "faq_page",
          platform: "web",
          phase: "pre_launch",
          title: `${ctx.projectName} FAQ`,
          purpose: "Answer top buyer questions; supports rich results",
          priority: "medium",
          distributionIntent: "indexing",
        }),
      ],
    ),
    phaseBlock(
      "announcement",
      "Announcement",
      ["Tease launch across social"],
      [
        asset({
          assetType: "social_post",
          platform: "x",
          phase: "announcement",
          title: "Launch teaser thread",
          purpose: "Short thread introducing the product and link to landing page",
          priority: "high",
          distributionIntent: "auto_if_configured",
        }),
        asset({
          assetType: "social_post",
          platform: "linkedin",
          phase: "announcement",
          title: "LinkedIn launch post",
          purpose: "Professional announcement with problem/solution framing",
          priority: "medium",
          distributionIntent: "auto_if_configured",
        }),
      ],
    ),
    phaseBlock(
      "launch",
      "Launch",
      ["Ship discoverable URLs and social proof"],
      [
        asset({
          assetType: "indexing_submit",
          platform: "web",
          phase: "launch",
          title: "Submit sitemap + IndexNow",
          purpose: "Notify supported search engines of new/updated URLs",
          priority: "high",
          distributionIntent: "indexing",
          targetEntityIds: pageIds,
        }),
        asset({
          assetType: "launch_announcement",
          platform: "hn",
          phase: "launch",
          title: "Show HN draft",
          purpose: "Community launch post — manual submit",
          priority: "medium",
          distributionIntent: "manual_ready",
        }),
        asset({
          assetType: "blog_post",
          platform: "devto",
          phase: "launch",
          title: "Launch story article",
          purpose: "Technical narrative for developers",
          priority: "medium",
          distributionIntent: "auto_if_configured",
        }),
      ],
    ),
    phaseBlock(
      "evergreen",
      "Evergreen",
      ["Sustain organic traffic"],
      [
        asset({
          assetType: "use_case_page",
          platform: "web",
          phase: "evergreen",
          title: "Use-case landing page",
          purpose: "Target a specific search intent not covered by homepage",
          priority: "medium",
          distributionIntent: "indexing",
          keywords: keywords.slice(0, 3),
        }),
        asset({
          assetType: "comparison_page",
          platform: "web",
          phase: "evergreen",
          title: "Comparison / alternative page",
          purpose: "Capture evaluation-stage search traffic",
          priority: "low",
          distributionIntent: "indexing",
        }),
      ],
    ),
  ];
}

function playReleasePlan(
  ctx: GraphContext,
  objective: OrbitCampaignObjective,
): CampaignPhasePlan[] {
  const release = entitiesOf(ctx, "release")[0];
  const song = entitiesOf(ctx, "song")[0];
  const targetIds = [release?.id, song?.id].filter(Boolean) as string[];
  const meta = (song?.metadata || release?.metadata || {}) as Record<string, unknown>;
  const bpm = meta.bpm as number | undefined;
  const key = meta.key as string | undefined;

  return [
    phaseBlock(
      "discovery",
      "Discovery",
      ["Position the release and audience"],
      [
        asset({
          assetType: "audience_research",
          platform: "web",
          phase: "discovery",
          title: "Release positioning notes",
          purpose: "Document genre, mood, and comparable artists from Play session metadata",
          priority: "high",
          distributionIntent: "manual_ready",
          targetEntityIds: targetIds,
        }),
      ],
    ),
    phaseBlock(
      "pre_launch",
      "Pre-launch",
      ["Build release destination"],
      [
        asset({
          assetType: "release_page",
          platform: "web",
          phase: "pre_launch",
          title: `${ctx.projectName} — release page`,
          purpose: "Official release landing with artwork, credits, and streaming CTA",
          priority: "high",
          distributionIntent: "indexing",
          targetEntityIds: targetIds,
        }),
        asset({
          assetType: "structured_data",
          platform: "web",
          phase: "pre_launch",
          title: "Music release JSON-LD",
          purpose: "Schema.org MusicRecording / MusicAlbum markup where appropriate",
          priority: "high",
          distributionIntent: "indexing",
        }),
      ],
    ),
    phaseBlock(
      "announcement",
      "Announcement",
      ["Build anticipation"],
      [
        asset({
          assetType: "social_post",
          platform: "instagram",
          phase: "announcement",
          title: "Release announcement caption",
          purpose: "Visual-first caption with release date and pre-save CTA",
          priority: "high",
          distributionIntent: "manual_ready",
        }),
        asset({
          assetType: "social_post",
          platform: "x",
          phase: "announcement",
          title: "Release day thread",
          purpose: "Thread: story behind the track, BPM/key hooks for musicians",
          priority: "medium",
          distributionIntent: "auto_if_configured",
          keywords: [key, bpm ? `${bpm}bpm` : ""].filter(Boolean) as string[],
        }),
      ],
    ),
    phaseBlock(
      "launch",
      "Launch",
      ["Maximize day-one discovery"],
      [
        asset({
          assetType: "youtube_description",
          platform: "youtube",
          phase: "launch",
          title: "YouTube / Shorts description",
          purpose: "SEO-rich description with credits, links, and timestamps",
          priority: "high",
          distributionIntent: "manual_ready",
        }),
        asset({
          assetType: "video_concept",
          platform: "tiktok",
          phase: "launch",
          title: "Short-form video concept",
          purpose: "15–30s hook concept for TikTok/Reels (not auto-posted)",
          priority: "medium",
          distributionIntent: "manual_ready",
        }),
        asset({
          assetType: "newsletter",
          platform: "email",
          phase: "launch",
          title: "Release newsletter",
          purpose: "Email to list with streaming links and behind-the-scenes note",
          priority: "medium",
          distributionIntent: "auto_if_configured",
        }),
      ],
    ),
    phaseBlock(
      "post_launch",
      "Post-launch",
      ["Extend the story"],
      [
        asset({
          assetType: "press_release",
          platform: "web",
          phase: "post_launch",
          title: "Press / EPK description",
          purpose: "Third-person release summary for blogs and playlists",
          priority: "low",
          distributionIntent: "manual_ready",
        }),
      ],
    ),
    phaseBlock(
      "evergreen",
      "Evergreen",
      ["Rediscovery"],
      [
        asset({
          assetType: "social_post",
          platform: "x",
          phase: "evergreen",
          title: "Rediscovery post",
          purpose: "Resurface the release with a new angle months later",
          priority: "low",
          distributionIntent: "auto_if_configured",
        }),
      ],
    ),
  ];
}

function seedOrApiPlan(
  ctx: GraphContext,
  objective: OrbitCampaignObjective,
  isApi: boolean,
): CampaignPhasePlan[] {
  const features = entitiesOf(ctx, "feature");
  const apis = entitiesOf(ctx, "api");
  const featureNames = features.map((f) => f.name).slice(0, 6);

  return [
    phaseBlock(
      "discovery",
      "Discovery",
      ["Align messaging with product capabilities"],
      [
        asset({
          assetType: "positioning_doc",
          platform: "web",
          phase: "discovery",
          title: "ICP + messaging map",
          purpose: "Summarize problem, features, and target users from ingested graph",
          priority: "high",
          distributionIntent: "manual_ready",
          keywords: featureNames,
        }),
      ],
    ),
    phaseBlock(
      "pre_launch",
      "Pre-launch",
      ["Build conversion surfaces"],
      [
        asset({
          assetType: "landing_page",
          platform: "web",
          phase: "pre_launch",
          title: `${ctx.projectName} landing page`,
          purpose: "Hero, features, social proof, primary CTA",
          priority: "high",
          distributionIntent: "indexing",
        }),
        ...(isApi
          ? [
              asset({
                assetType: "documentation_page",
                platform: "web",
                phase: "pre_launch",
                title: "API quickstart docs",
                purpose: "Developer onboarding with example request/response",
                priority: "high",
                distributionIntent: "indexing",
                targetEntityIds: apis.map((a) => a.id),
              }),
            ]
          : []),
      ],
    ),
    phaseBlock(
      "announcement",
      "Announcement",
      ["Developer / builder channels"],
      [
        asset({
          assetType: "social_post",
          platform: "x",
          phase: "announcement",
          title: "Build-in-public thread",
          purpose: "Highlight key features and link to demo",
          priority: "high",
          distributionIntent: "auto_if_configured",
        }),
        asset({
          assetType: "social_post",
          platform: "reddit",
          phase: "announcement",
          title: "r/SideProject draft",
          purpose: "Community launch post — manual or OAuth publish",
          priority: "medium",
          distributionIntent: "auto_if_configured",
        }),
      ],
    ),
    phaseBlock(
      "launch",
      "Launch",
      ["Ship and index"],
      [
        asset({
          assetType: "blog_post",
          platform: "devto",
          phase: "launch",
          title: "Technical launch article",
          purpose: "Deep dive on architecture or API design",
          priority: "high",
          distributionIntent: "auto_if_configured",
        }),
        asset({
          assetType: "launch_announcement",
          platform: "product_hunt",
          phase: "launch",
          title: "Product Hunt copy",
          purpose: "Tagline, description, maker comment — manual submit",
          priority: "medium",
          distributionIntent: "manual_ready",
        }),
        asset({
          assetType: "indexing_submit",
          platform: "web",
          phase: "launch",
          title: "Index new URLs",
          purpose: "Sitemap + IndexNow for new landing/docs pages",
          priority: "high",
          distributionIntent: "indexing",
        }),
      ],
    ),
    phaseBlock(
      "evergreen",
      "Evergreen",
      [isApi ? "Drive API adoption" : "Drive signups"],
      [
        asset({
          assetType: "use_case_page",
          platform: "web",
          phase: "evergreen",
          title: "Use-case SEO page",
          purpose: "Target one feature-specific search query",
          priority: "medium",
          distributionIntent: "indexing",
          keywords: featureNames.slice(0, 2),
        }),
        asset({
          assetType: "comparison_page",
          platform: "web",
          phase: "evergreen",
          title: "Alternative comparison page",
          purpose: "Evaluation-stage SEO content",
          priority: "low",
          distributionIntent: "indexing",
        }),
      ],
    ),
  ];
}

function trimPlan(phases: CampaignPhasePlan[], maxAssets: number): CampaignPhasePlan[] {
  let count = 0;
  const trimmed: CampaignPhasePlan[] = [];
  for (const block of phases) {
    const remaining = maxAssets - count;
    if (remaining <= 0) break;
    const assets = block.assets.slice(0, remaining);
    count += assets.length;
    trimmed.push({ ...block, assets });
  }
  return trimmed;
}

function defaultObjective(productType: string): OrbitCampaignObjective {
  if (productType === "play_release") return "stream";
  if (productType === "api_project") return "api_adoption";
  if (productType === "seed_app") return "signup";
  return "traffic";
}

/** Deterministic campaign plan from ingested project graph — no LLM required. */
export function buildCampaignPlanFromGraph(
  ctx: GraphContext,
  input: PlanCampaignInput = {},
): CampaignPlan {
  assetCounter = 0;

  const productType = ctx.productType || "website";
  const objective = input.objective || defaultObjective(productType);
  const maxAssets = input.maxAssets ?? 24;

  let phases: CampaignPhasePlan[];

  switch (productType) {
    case "play_release":
      phases = playReleasePlan(ctx, objective);
      break;
    case "api_project":
      phases = seedOrApiPlan(ctx, objective, true);
      break;
    case "seed_app":
      phases = seedOrApiPlan(ctx, objective, false);
      break;
    default:
      phases = baseWebsitePlan(ctx, objective);
  }

  phases = trimPlan(phases, maxAssets);

  const recommendedChannels = [
    ...new Set(phases.flatMap((p) => p.assets.map((a) => a.platform))),
  ] as OrbitContentPlatform[];

  const notes = [
    "Plan generated from Orbit project graph — content not yet generated.",
    "Default campaign mode is manual; nothing publishes without approval.",
    productType === "play_release"
      ? "Play releases use the same Orbit infrastructure as apps and APIs."
      : "Re-run plan after re-ingest to refresh entity targets.",
  ];

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    productType,
    projectName: ctx.projectName,
    objective,
    phases,
    recommendedChannels,
    notes,
  };
}

export function graphContextFromProject(
  project: {
    id: string;
    name: string;
    description?: string | null;
    normalizedSummary?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
  },
  entities: GraphContext["entities"],
): GraphContext {
  const meta = (project.metadata || {}) as Record<string, unknown>;
  return {
    projectId: project.id,
    projectName: project.name,
    productType: String(meta.productType || "website"),
    description: project.description || undefined,
    summary: project.normalizedSummary || undefined,
    entities,
  };
}

export function countPlannedAssets(plan: CampaignPlan): number {
  return plan.phases.reduce((n, p) => n + p.assets.length, 0);
}
