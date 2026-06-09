import {
  openai,
  getDefaultModel,
  isOrbitFreeAIConfigured,
} from "@/lib/llm/openai";
import { getSiteUrl } from "@/lib/site-url";
import {
  generateSocialPack,
  generateMiniParasite,
  generateOutreach,
  generateSchemaOrg,
  generateMiniDirectories,
} from "@/lib/orbit/content-templates";

export type ParasiteArticles = {
  devto?: { title: string; content: string; tags?: string[] };
  hashnode?: { title: string; content: string; tags?: string[] };
  medium?: { title: string; subtitle?: string; content: string };
  hackernoon?: { title: string; content: string };
  substack?: { title: string; content: string };
};

export type SocialLaunchPack = {
  twitter_thread: string[];
  linkedin: { headline: string; body: string; cta?: string };
  reddit_webdev?: { title: string; body: string };
  reddit_saas?: { title: string; body: string };
  reddit_sideprojects?: { title: string; body: string };
  producthunt?: { tagline: string; description: string; first_comment?: string };
  show_hn?: { title: string; body: string };
};

export type OutreachPack = {
  newsletters: { name: string; subject: string; pitch: string }[];
  podcasts: { name: string; subject: string; pitch: string }[];
};

export type DirectoryListing = {
  id: string;
  name: string;
  title: string;
  description: string;
  tags: string;
};

export type MarketingLaunchContent = {
  social: SocialLaunchPack;
  parasite: ParasiteArticles;
  outreach: OutreachPack;
  schemaJsonLd: string;
  directories: DirectoryListing[];
};

async function withAiOrFallback<T>(
  aiCall: () => Promise<T>,
  fallback: () => T,
  label: string,
): Promise<T> {
  if (isOrbitFreeAIConfigured()) {
    try {
      return await aiCall();
    } catch (e) {
      console.warn(`[MarketingAutopilot] AI ${label} failed:`, String(e).slice(0, 120));
    }
  }
  return fallback();
}

function tplParasite(targetUrl: string): ParasiteArticles {
  const tpl = generateMiniParasite();
  const pick = (needle: string) => tpl.find((x) => x.platform.toLowerCase().includes(needle));
  const dev = pick("dev");
  return {
    devto: {
      title: dev?.title || "Building a free AI tools hub",
      tags: ["ai", "tools", "javascript"],
      content: `${dev?.content || ""}\n\nTool hub: ${targetUrl}`,
    },
    hashnode: {
      title: pick("hashnode")?.title || "Ship AI tools faster",
      tags: ["ai", "tools"],
      content: `${pick("hashnode")?.content || ""}\n\n${targetUrl}`,
    },
    medium: {
      title: pick("medium")?.title || "What we learned shipping free tools",
      subtitle: "Practical founder notes",
      content: `${pick("medium")?.content || ""}\n\n${targetUrl}`,
    },
    hackernoon: {
      title: pick("linkedin")?.title || "Why free mini-apps beat bloated suites",
      content: `${pick("medium")?.content || ""}\n\n${targetUrl}`,
    },
    substack: {
      title: pick("substack")?.title || "Free tools worth bookmarking",
      content: `${pick("substack")?.content || ""}\n\n${targetUrl}`,
    },
  };
}

function tplSocial(): SocialLaunchPack {
  const s = generateSocialPack();
  const reddit = (sub: string) => s.redditPosts.find((r) => r.subreddit.toLowerCase().includes(sub));
  return {
    twitter_thread: s.twitterThread,
    linkedin: {
      headline: "50 Free AI Tools — What We Learned",
      body: s.linkedInPost,
      cta: getSiteUrl(),
    },
    reddit_webdev: reddit("webdev")
      ? { title: reddit("webdev")!.title, body: reddit("webdev")!.body }
      : undefined,
    reddit_saas: reddit("saas")
      ? { title: reddit("saas")!.title, body: reddit("saas")!.body }
      : undefined,
    reddit_sideprojects: reddit("entrepreneur") || reddit("side")
      ? {
          title: (reddit("entrepreneur") || reddit("side"))!.title,
          body: (reddit("entrepreneur") || reddit("side"))!.body,
        }
      : undefined,
    producthunt: {
      tagline: "AI APIs from natural language",
      description: "Turn prompts into production APIs with schema enforcement and a marketplace.",
      first_comment: `Built with Svivva — try free tools at ${getSiteUrl()}/ai-tools-hub`,
    },
    show_hn: {
      title: "Show HN: Svivva — natural language to production AI APIs",
      body: s.showHN,
    },
  };
}

function tplOutreach(): OutreachPack {
  const o = generateOutreach();
  return {
    newsletters: o.newsletters.map((n) => ({
      name: n.name,
      subject: `Story pitch: ${n.name}`,
      pitch: n.pitch,
    })),
    podcasts: o.podcasts.map((p) => ({
      name: p.name,
      subject: `Podcast guest pitch — Svivva`,
      pitch: p.pitch,
    })),
  };
}

export async function generateMarketingLaunchContent(): Promise<MarketingLaunchContent> {
  const targetUrl = `${getSiteUrl()}/ai-tools-hub`;
  const site = getSiteUrl();

  const social = await withAiOrFallback(
    async () => {
      const gen = await openai.chat.completions.create({
        model: getDefaultModel(),
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Social media manager for Svivva — AI platform turning natural language into production APIs.",
          },
          {
            role: "user",
            content: `Create launch pack JSON: {
  twitter_thread: [8 tweets],
  linkedin: { headline, body, cta },
  reddit_webdev: { title, body },
  reddit_saas: { title, body },
  reddit_sideprojects: { title, body },
  producthunt: { tagline (≤60 chars), description (260 chars), first_comment },
  show_hn: { title, body }
}. Link: ${site}`,
          },
        ],
      });
      return JSON.parse(gen.choices[0].message.content || "{}") as SocialLaunchPack;
    },
    tplSocial,
    "social",
  );

  const parasite = await withAiOrFallback(
    async () => {
      const gen = await openai.chat.completions.create({
        model: getDefaultModel(),
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: `Write platform-native articles about free AI tools at ${targetUrl}. Return JSON with devto, hashnode, medium, hackernoon, substack — each { title, content (markdown 700w), tags? }.`,
          },
        ],
      });
      return JSON.parse(gen.choices[0].message.content || "{}") as ParasiteArticles;
    },
    () => tplParasite(targetUrl),
    "parasite",
  );

  const outreach = await withAiOrFallback(
    async () => {
      const gen = await openai.chat.completions.create({
        model: getDefaultModel(),
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: `Newsletter and podcast pitches for Svivva (${site}). Return JSON: { newsletters: [{name, subject, pitch}], podcasts: [{name, subject, pitch}] }`,
          },
        ],
      });
      return JSON.parse(gen.choices[0].message.content || "{}") as OutreachPack;
    },
    tplOutreach,
    "outreach",
  );

  const dirs = generateMiniDirectories();
  const directories: DirectoryListing[] = dirs.map((d, i) => ({
    id: d.name.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
    name: d.name,
    title: d.title,
    description: d.description,
    tags: d.tags,
  }));

  return {
    social,
    parasite,
    outreach,
    schemaJsonLd: generateSchemaOrg(),
    directories,
  };
}
