/**
 * SEO Learning Roadmap — tracks Orbit admin progress through the 4-week SEO curriculum.
 * Progress is inferred from DB counts, GSC connection, and routine run history.
 */
import { db } from "@/lib/db";
import { blogPosts, growthTasks, seoLandingPages } from "@/lib/schema";
import { eq, sql, desc } from "drizzle-orm";
import { seedCredentials } from "@/lib/schema";
import { resolveGscCredentialsUserId } from "@/lib/orbit/gsc-credentials-user";
import { getGoogleOAuthAccessTokenForUser } from "@/lib/google-gsc-oauth";
import { sumMarketingPages } from "@/lib/orbit/marketing-targets";

export type RoadmapItem = {
  id: string;
  label: string;
  done: boolean;
  detail?: string;
};

export type RoadmapWeek = {
  week: number;
  title: string;
  items: RoadmapItem[];
  percent: number;
};

export type SeoLearningRoadmap = {
  weeks: RoadmapWeek[];
  overallPercent: number;
  currentWeek: number;
  generatedAt: string;
};

const TASK_TYPE = "seo_weekly_routine";

async function countPublished(category?: string): Promise<number> {
  try {
    if (category) {
      const cat = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(seoLandingPages)
        .where(eq(seoLandingPages.category, category));
      return cat[0]?.n ?? 0;
    }
    const rows = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(seoLandingPages)
      .where(eq(seoLandingPages.published, true));
    return rows[0]?.n ?? 0;
  } catch {
    return 0;
  }
}

async function hasGscConnected(): Promise<boolean> {
  try {
    const userId = await resolveGscCredentialsUserId();
    const token = await getGoogleOAuthAccessTokenForUser(userId);
    if (token) return true;
    const [row] = await db
      .select({ sa: seedCredentials.googleServiceAccountJson })
      .from(seedCredentials)
      .where(eq(seedCredentials.userId, userId))
      .limit(1);
    return !!row?.sa?.trim();
  } catch {
    return false;
  }
}

async function hasWeeklyRoutineRun(): Promise<boolean> {
  try {
    const rows = await db
      .select({ id: growthTasks.id })
      .from(growthTasks)
      .where(eq(growthTasks.taskType, TASK_TYPE))
      .orderBy(desc(growthTasks.runAt))
      .limit(1);
    return rows.length > 0;
  } catch {
    return false;
  }
}

function weekPercent(items: RoadmapItem[]): number {
  if (!items.length) return 0;
  return Math.round((items.filter((i) => i.done).length / items.length) * 100);
}

/** Build the 4-week SEO learning roadmap with live completion status. */
export async function buildSeoLearningRoadmap(): Promise<SeoLearningRoadmap> {
  const [seoCount, blogCount, fusionCount, gsc, routineRun] = await Promise.all([
    countPublished(),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(blogPosts)
      .where(eq(blogPosts.published, true))
      .then((r) => r[0]?.n ?? 0)
      .catch(() => 0),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(seoLandingPages)
      .where(eq(seoLandingPages.category, "fusion"))
      .then((r) => r[0]?.n ?? 0)
      .catch(() => 0),
    hasGscConnected(),
    hasWeeklyRoutineRun(),
  ]);

  const totalPages = sumMarketingPages({
    seoPages: seoCount,
    comparisons: 0,
    blogPosts: blogCount,
    aeoPages: 0,
    seedMarketing: seoCount,
    integrationPages: 0,
    usecasePages: 0,
    templatePages: 0,
    paaPages: 0,
  });

  const week1: RoadmapWeek = {
    week: 1,
    title: "SEO Fundamentals",
    items: [
      { id: "w1-gsc", label: "Google Search Console connected", done: gsc },
      { id: "w1-sitemap", label: "Sitemap.xml live", done: true, detail: "/sitemap.xml" },
      { id: "w1-robots", label: "Robots.txt configured", done: true, detail: "/robots.txt" },
      { id: "w1-canonical", label: "Canonical URLs on SEO pages", done: seoCount > 0 },
      { id: "w1-routine", label: "Weekly SEO routine has run", done: routineRun },
    ],
    percent: 0,
  };
  week1.percent = weekPercent(week1.items);

  const week2: RoadmapWeek = {
    week: 2,
    title: "Keywords & On-Page SEO",
    items: [
      { id: "w2-keywords", label: "Keyword research executed", done: routineRun || seoCount >= 5 },
      { id: "w2-titles", label: "Unique SEO titles on landing pages", done: seoCount >= 5 },
      { id: "w2-meta", label: "Meta descriptions on landing pages", done: seoCount >= 5 },
      { id: "w2-headings", label: "H1/H2 structure on SEO template", done: true },
      { id: "w2-links", label: "Internal linking active", done: seoCount >= 10 },
    ],
    percent: 0,
  };
  week2.percent = weekPercent(week2.items);

  const week3: RoadmapWeek = {
    week: 3,
    title: "Build SEO Pages",
    items: [
      { id: "w3-landing", label: "5+ high-quality landing pages", done: seoCount >= 5 },
      { id: "w3-tools", label: "Tool SEO pages published", done: seoCount >= 20 },
      { id: "w3-product", label: "Product-intent keywords targeted", done: seoCount >= 10 },
      { id: "w3-fusion", label: "Intent Fusion pages live", done: fusionCount >= 1 },
      { id: "w3-index", label: "URLs submitted to search engines", done: gsc },
    ],
    percent: 0,
  };
  week3.percent = weekPercent(week3.items);

  const week4: RoadmapWeek = {
    week: 4,
    title: "Content & Authority",
    items: [
      { id: "w4-blog", label: "Educational blog content", done: blogCount >= 3 },
      { id: "w4-comparison", label: "Comparison pages", done: seoCount >= 15 },
      { id: "w4-templates", label: "Templates / free tools indexed", done: seoCount >= 30 },
      { id: "w4-autopilot", label: "Orbit autopilot running weekly", done: routineRun },
      { id: "w4-scale", label: "50+ indexable marketing pages", done: totalPages >= 50 },
    ],
    percent: 0,
  };
  week4.percent = weekPercent(week4.items);

  const weeks = [week1, week2, week3, week4];
  const overallPercent = Math.round(weeks.reduce((s, w) => s + w.percent, 0) / weeks.length);
  const currentWeek = weeks.find((w) => w.percent < 100)?.week ?? 4;

  return {
    weeks,
    overallPercent,
    currentWeek,
    generatedAt: new Date().toISOString(),
  };
}

export { TASK_TYPE as SEO_WEEKLY_ROUTINE_TASK_TYPE };
