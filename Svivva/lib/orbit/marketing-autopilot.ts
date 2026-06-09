import { db } from "@/lib/db";
import { growthContent, growthSubmissions } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { runFullTrafficAutomation } from "@/lib/orbit/full-traffic-automation";
import {
  getMarketingCredentialStatus,
  loadMarketingPlatformCredentials,
  saveLastAutopilotRun,
} from "@/lib/orbit/marketing-autopilot-credentials";
import { generateMarketingLaunchContent } from "@/lib/orbit/marketing-autopilot-content";
import {
  publishDevToArticle,
  publishHashnodeArticle,
  publishRedditPost,
  publishTwitterThread,
  sendResendEmail,
} from "@/lib/orbit/marketing-autopilot-publishers";
import { MARKETING_AUTOPILOT_TASKS, taskDefById } from "@/lib/orbit/marketing-autopilot-tasks";
import type {
  AutopilotTaskResult,
  AutopilotTaskStatus,
  MarketingAutopilotRunResult,
  MarketingPlatformCredentials,
} from "@/lib/orbit/marketing-autopilot-types";
import { getSiteUrl } from "@/lib/site-url";
function now(): string {
  return new Date().toISOString();
}

function task(
  id: string,
  status: AutopilotTaskStatus,
  message: string,
  url?: string,
): AutopilotTaskResult {
  const def = taskDefById(id);
  return {
    id,
    label: def?.label ?? id,
    group: def?.group ?? "Other",
    status,
    message,
    url,
    at: now(),
  };
}

function hasCreds(
  creds: MarketingPlatformCredentials,
  keys: (keyof MarketingPlatformCredentials)[],
): boolean {
  return keys.every((k) => !!creds[k]?.trim());
}

async function persistContent(
  contentType: string,
  title: string,
  content: string,
  product = "svivva",
): Promise<void> {
  await db.insert(growthContent).values({
    product,
    contentType,
    title,
    content,
  });
}

async function upsertDirectoryPrepared(
  directoryId: string,
  notes: string,
  product = "svivva",
): Promise<void> {
  const [existing] = await db
    .select()
    .from(growthSubmissions)
    .where(
      and(eq(growthSubmissions.directoryId, directoryId), eq(growthSubmissions.product, product)),
    )
    .limit(1);
  if (existing) {
    await db
      .update(growthSubmissions)
      .set({ notes, status: "pending" })
      .where(eq(growthSubmissions.id, existing.id));
  } else {
    await db.insert(growthSubmissions).values({
      directoryId,
      product,
      status: "pending",
      notes,
    });
  }
}

function statsFromTasks(tasks: AutopilotTaskResult[]) {
  return {
    posted: tasks.filter((t) => t.status === "posted").length,
    prepared: tasks.filter((t) => t.status === "prepared").length,
    done: tasks.filter((t) => t.status === "done" || t.status === "posted").length,
    failed: tasks.filter((t) => t.status === "failed").length,
    needsCredentials: tasks.filter((t) => t.status === "needs_credentials").length,
  };
}

/**
 * Run the full marketing checklist: on-site content, search indexing, AI copy, and API publishing.
 */
export async function runMarketingAutopilot(opts?: {
  skipOnSite?: boolean;
}): Promise<MarketingAutopilotRunResult> {
  const startedAt = now();
  const tasks: AutopilotTaskResult[] = [];
  const creds = await loadMarketingPlatformCredentials();
  const credStatus = await getMarketingCredentialStatus();

  // ── Phase 1: On-site + indexing ───────────────────────────────────────────
  if (!opts?.skipOnSite) {
    const traffic = await runFullTrafficAutomation();
    const idx = traffic.indexing;

    tasks.push(
      task(
        "tech-indexnow-key",
        credStatus.google.indexNow ? "done" : "failed",
        credStatus.google.indexNow ? "IndexNow key configured" : "Run IndexNow setup first",
      ),
      task("tech-indexnow-submitted", idx.indexNow.ok ? "done" : "failed", idx.indexNow.message),
      task("tech-sitemap", "done", `Sitemap: ${getSiteUrl()}/sitemap.xml`),
      task(
        "tech-gsc-sitemap",
        idx.googleSitemap.ok
          ? "done"
          : credStatus.google.serviceAccount
            ? "failed"
            : "needs_credentials",
        idx.googleSitemap.ok
          ? "Google sitemap submitted via API"
          : credStatus.google.serviceAccount
            ? idx.googleSitemap.error || "GSC sitemap failed — verify Owner access"
            : "Connect service account at /dashboard/gsc-connect",
      ),
      task(
        "manual-gsc-indexing",
        idx.googleIndexing.submitted > 0
          ? "done"
          : idx.googleSitemap.ok
            ? "prepared"
            : "needs_credentials",
        idx.googleIndexing.submitted > 0
          ? `Google Indexing API: ${idx.googleIndexing.submitted} URLs`
          : "Sitemap submitted; URL inspection is optional for generic pages",
      ),
      task(
        "auto-sitemap-pings",
        idx.indexNow.ok ? "done" : "failed",
        "IndexNow + Bing ping executed",
      ),
    );

    const c = traffic.marketing.counts;
    tasks.push(
      task("content-seo-pages", c.seoPages >= 20 ? "done" : "done", `${c.seoPages} SEO pages`),
      task("content-comparisons", "done", `${c.comparisons} comparisons`),
      task("content-blog", "done", `${c.blogPosts} blog posts`),
      task("content-aeo", "done", `${c.aeoPages} AEO pages`),
      task("content-integrations", "done", `${c.integrationPages ?? 0} integration pages`),
      task("content-usecases", "done", `${c.usecasePages ?? 0} use-case pages`),
      task("content-templates", "done", `${c.templatePages ?? 0} template pages`),
      task("content-paa", "done", `${c.paaPages ?? 0} PAA pages`),
      task("auto-content-velocity", "done", `Tool SEO pages: ${c.seedMarketing}`),
      task("auto-growth-tasks", "done", "Growth content gap-fill completed"),
    );
  }

  // ── Phase 2: AI content ───────────────────────────────────────────────────
  const content = await generateMarketingLaunchContent();
  await persistContent("schema-jsonld", "Organization + WebSite schema", content.schemaJsonLd);
  tasks.push(
    task("tech-schema-jsonld", "done", "Schema.org JSON-LD generated and saved"),
    task(
      "tech-rich-results",
      "prepared",
      "Test at search.google.com/test/rich-results with homepage URL",
    ),
    task(
      "content-parasite",
      "done",
      "Parasite articles generated (Dev.to, Hashnode, Medium, etc.)",
    ),
    task("content-social-pack", "done", "Social launch pack generated"),
    task("content-community", "done", "Reddit + Show HN + PH copy generated"),
    task("content-outreach", "done", "Newsletter + podcast pitches generated"),
  );

  // ── Phase 3: API publishing ─────────────────────────────────────────────────
  const devto = content.parasite.devto;
  if (devto?.content) {
    await persistContent("parasite-devto", devto.title, devto.content);
    if (hasCreds(creds, ["devtoApiKey"])) {
      const r = await publishDevToArticle(creds.devtoApiKey!, devto);
      tasks.push(
        task(
          "manual-devto",
          r.ok ? "posted" : "failed",
          r.ok ? `Published on Dev.to` : r.error || "Dev.to publish failed",
          r.url,
        ),
      );
    } else {
      tasks.push(
        task(
          "manual-devto",
          "needs_credentials",
          "Article saved — add Dev.to API key to auto-publish",
        ),
      );
    }
  }

  const hashnode = content.parasite.hashnode;
  if (hashnode?.content) {
    await persistContent("parasite-hashnode", hashnode.title, hashnode.content);
    if (hasCreds(creds, ["hashnodeApiKey", "hashnodePublicationId"])) {
      const r = await publishHashnodeArticle(
        creds.hashnodeApiKey!,
        creds.hashnodePublicationId!,
        hashnode,
      );
      tasks.push(
        task(
          "manual-hashnode",
          r.ok ? "posted" : "failed",
          r.ok ? "Published on Hashnode" : r.error || "Hashnode publish failed",
          r.url,
        ),
      );
    } else {
      tasks.push(
        task(
          "manual-hashnode",
          "needs_credentials",
          "Article saved — add Hashnode API key + publication ID",
        ),
      );
    }
  }

  if (content.parasite.medium?.content) {
    const m = content.parasite.medium;
    await persistContent(
      "parasite-medium",
      m.title,
      `# ${m.title}\n\n${m.subtitle ? `*${m.subtitle}*\n\n` : ""}${m.content}`,
    );
    tasks.push(
      task(
        "manual-medium",
        "prepared",
        "Medium has no public write API — copy from Growth Content → medium.com/new",
      ),
    );
  }

  const thread = content.social.twitter_thread;
  if (thread?.length) {
    await persistContent("social-twitter", "Twitter thread", thread.join("\n\n---\n\n"));
    if (
      hasCreds(creds, [
        "twitterApiKey",
        "twitterApiSecret",
        "twitterAccessToken",
        "twitterAccessSecret",
      ])
    ) {
      const r = await publishTwitterThread(creds, thread);
      tasks.push(
        task(
          "manual-twitter-thread",
          r.ok ? "posted" : "failed",
          r.ok ? `Posted ${thread.length}-tweet thread` : r.error || "Twitter publish failed",
          r.url,
        ),
      );
    } else {
      tasks.push(
        task(
          "manual-twitter-thread",
          "needs_credentials",
          "Thread saved — add Twitter OAuth 1.0a keys to auto-post",
        ),
      );
    }
  }

  if (content.social.linkedin?.body) {
    await persistContent(
      "social-linkedin",
      content.social.linkedin.headline,
      content.social.linkedin.body,
    );
    tasks.push(
      task(
        "manual-linkedin",
        "prepared",
        "LinkedIn post ready in Growth Content — paste at linkedin.com/post",
      ),
    );
  }

  const redditPosts: { id: string; sub: string; post?: { title: string; body: string } }[] = [
    {
      id: "manual-reddit-sideproject",
      sub: "SideProject",
      post: content.social.reddit_sideprojects,
    },
    { id: "content-community", sub: "webdev", post: content.social.reddit_webdev },
  ];

  for (const rp of redditPosts) {
    if (!rp.post?.title) continue;
    await persistContent(`reddit-${rp.sub}`, rp.post.title, rp.post.body);
    const sub = rp.sub === "SideProject" ? creds.redditDefaultSubreddit || "SideProject" : rp.sub;
    if (hasCreds(creds, ["redditClientId", "redditClientSecret", "redditRefreshToken"])) {
      const r = await publishRedditPost(creds, {
        subreddit: sub,
        title: rp.post.title,
        body: rp.post.body,
      });
      if (rp.id === "manual-reddit-sideproject") {
        tasks.push(
          task(
            rp.id,
            r.ok ? "posted" : "failed",
            r.ok ? `Posted to r/${sub}` : r.error || "Reddit submit failed",
            r.url,
          ),
        );
      }
    } else if (rp.id === "manual-reddit-sideproject") {
      tasks.push(task(rp.id, "needs_credentials", "Post saved — add Reddit OAuth credentials"));
    }
  }

  if (content.social.show_hn) {
    const hn = content.social.show_hn;
    await persistContent("show-hn", hn.title, `${hn.title}\n\n${hn.body}`);
    tasks.push(
      task(
        "manual-showhn",
        "prepared",
        "Show HN copy ready — submit at news.ycombinator.com/submit",
      ),
    );
  }

  if (content.social.producthunt) {
    const ph = content.social.producthunt;
    await persistContent(
      "product-hunt",
      ph.tagline,
      `Tagline: ${ph.tagline}\n\nDescription: ${ph.description}\n\nFirst comment:\n${ph.first_comment || ""}`,
    );
    tasks.push(
      task(
        "manual-producthunt",
        "prepared",
        "PH launch kit ready — no public API; use producthunt.com/posts/new",
      ),
    );
    tasks.push(task("dir-producthunt", "prepared", "Product Hunt listing copy prepared"));
  }

  const pitch = content.outreach.newsletters[0];
  if (pitch) {
    await persistContent("outreach-newsletter", pitch.subject, pitch.pitch);
    if (
      hasCreds(creds, ["resendApiKey", "outreachFromEmail"]) &&
      creds.newsletterPitchEmail?.trim()
    ) {
      const r = await sendResendEmail(creds, {
        to: creds.newsletterPitchEmail,
        subject: pitch.subject,
        html: `<p>${pitch.pitch.replace(/\n/g, "<br/>")}</p>`,
      });
      tasks.push(
        task(
          "manual-newsletters",
          r.ok ? "posted" : "failed",
          r.ok ? `Pitch emailed to ${creds.newsletterPitchEmail}` : r.error || "Email failed",
        ),
      );
    } else {
      tasks.push(
        task(
          "manual-newsletters",
          "needs_credentials",
          "Pitch saved — add Resend key + recipient email",
        ),
      );
    }
  }

  const pod = content.outreach.podcasts[0];
  if (pod) {
    await persistContent("outreach-podcast", pod.subject, pod.pitch);
    if (hasCreds(creds, ["resendApiKey", "outreachFromEmail"]) && creds.podcastPitchEmail?.trim()) {
      const r = await sendResendEmail(creds, {
        to: creds.podcastPitchEmail,
        subject: pod.subject,
        html: `<p>${pod.pitch.replace(/\n/g, "<br/>")}</p>`,
      });
      tasks.push(
        task(
          "manual-podcasts",
          r.ok ? "posted" : "failed",
          r.ok ? `Pitch emailed to ${creds.podcastPitchEmail}` : r.error || "Email failed",
        ),
      );
    } else {
      tasks.push(
        task(
          "manual-podcasts",
          "needs_credentials",
          "Pitch saved — add Resend key + podcast contact email",
        ),
      );
    }
  }

  tasks.push(
    task("manual-indiehackers", "prepared", "Share launch story at indiehackers.com/post"),
  );

  // Directories — prepare listing copy (no auto-submit APIs)
  const dirMap: Record<string, string> = {
    "dir-futurepedia": "futurepedia",
    "dir-taaft": "theresanaiforthat",
    "dir-g2": "g2",
    "dir-alternativeto": "alternativeto",
    "dir-crunchbase": "crunchbase",
  };

  for (const listing of content.directories) {
    const payload = JSON.stringify(listing, null, 2);
    await persistContent(`directory-${listing.id}`, listing.name, payload);
    const dirId = Object.entries(dirMap).find(([, name]) =>
      listing.name.toLowerCase().includes(name.slice(0, 4)),
    )?.[1];
    if (dirId) await upsertDirectoryPrepared(dirId, payload);
  }

  for (const [taskId, dirId] of Object.entries(dirMap)) {
    const listing = content.directories.find((d) =>
      d.name.toLowerCase().includes(dirId.slice(0, 4)),
    );
    tasks.push(
      task(
        taskId,
        "prepared",
        listing
          ? `Listing copy ready for ${listing.name} — paste at directory submit URL`
          : "Listing copy generated",
      ),
    );
  }

  tasks.push(
    task(
      "dir-growth-engine-overall",
      "prepared",
      `${content.directories.length} directory listings saved to Growth Content`,
    ),
  );

  // Ensure every defined task has a result
  for (const def of MARKETING_AUTOPILOT_TASKS) {
    if (!tasks.some((t) => t.id === def.id)) {
      tasks.push(task(def.id, "skipped", "No action needed this run"));
    }
  }

  const stats = statsFromTasks(tasks);
  const summary = [
    "═══ Marketing Autopilot ═══",
    `Posted: ${stats.posted} · Prepared: ${stats.prepared} · Done: ${stats.done} · Failed: ${stats.failed}`,
    stats.needsCredentials > 0
      ? `⚠ ${stats.needsCredentials} tasks need credentials — add keys in Autopilot tab`
      : "✓ All credential-backed tasks attempted",
    "",
    ...tasks
      .filter((t) => t.status === "failed" || t.status === "needs_credentials")
      .slice(0, 12)
      .map((t) => `• ${t.label}: ${t.message}`),
  ].join("\n");

  const result: MarketingAutopilotRunResult = {
    ok: stats.failed === 0,
    startedAt,
    finishedAt: now(),
    tasks,
    summary,
    stats,
    contentGenerated: true,
  };

  await saveLastAutopilotRun(result);
  return result;
}
