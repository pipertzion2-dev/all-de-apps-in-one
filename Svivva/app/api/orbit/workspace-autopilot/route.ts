import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seoLandingPages } from "@/lib/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/admin";
import { getSiteUrl } from "@/lib/site-url";
import { getAllWorkspaceProjects } from "@/lib/workspace-external-apps";
import { hasStripeConfigured, hasStripeWebhookConfigured } from "@/lib/env";
import { and, eq, isNotNull } from "drizzle-orm";

export const maxDuration = 60;

type CheckResult = {
  label: string;
  url?: string;
  ok: boolean;
  status?: number;
  action?: string;
};

async function probeUrl(label: string, url: string): Promise<CheckResult> {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": "Svivva-Orbit-Autopilot/1.0" },
      signal: AbortSignal.timeout(12000),
    });
    return {
      label,
      url,
      ok: res.ok,
      status: res.status,
      action: res.ok ? "Connected" : "Fix deployment or remove from indexed pages",
    };
  } catch {
    return { label, url, ok: false, action: "Offline or unreachable" };
  }
}

function isLikelyProductionUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === "svivva.com";
  } catch {
    return false;
  }
}

function isRiskyIndexedTool(title: string, slug: string): boolean {
  const text = `${title} ${slug}`.toLowerCase();
  return (
    text.includes("3d model") ||
    text.includes("3-d model") ||
    text.includes("model generator") ||
    text.includes("ai model generator") ||
    text.includes("text to 3d") ||
    text.includes("text-to-3d")
  );
}

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const siteUrl = getSiteUrl();
    const checks: CheckResult[] = [];
    const actions: string[] = [];

    checks.push({
      label: "Production domain",
      url: siteUrl,
      ok: isLikelyProductionUrl(siteUrl),
      action: isLikelyProductionUrl(siteUrl)
        ? "svivva.com is the canonical production URL"
        : "Set NEXT_PUBLIC_SITE_URL=https://svivva.com in Vercel",
    });

    checks.push({
      label: "Stripe checkout keys",
      ok: hasStripeConfigured(),
      action: hasStripeConfigured()
        ? "Stripe secret + publishable keys are available"
        : "Paste Stripe secret and publishable keys in Orbit or Vercel env",
    });

    checks.push({
      label: "Stripe webhook secret",
      ok: hasStripeWebhookConfigured(),
      action: hasStripeWebhookConfigured()
        ? "Stripe webhook secret is available"
        : `Create Stripe webhook at ${siteUrl}/api/stripe/webhook and save whsec_*`,
    });

    const allProjects = getAllWorkspaceProjects();
    const projectChecks = await Promise.all(
      allProjects.map((project) => probeUrl(project.name, project.url)),
    );
    checks.push(...projectChecks);

    const infraChecks = await Promise.all([
      probeUrl("Sitemap", `${siteUrl}/sitemap.xml`),
      probeUrl("Robots", `${siteUrl}/robots.txt`),
    ]);
    checks.push(...infraChecks);

    const toolPages = await db
      .select({
        id: seoLandingPages.id,
        slug: seoLandingPages.slug,
        title: seoLandingPages.title,
        toolUrl: seoLandingPages.toolUrl,
      })
      .from(seoLandingPages)
      .where(and(eq(seoLandingPages.published, true), isNotNull(seoLandingPages.toolUrl)))
      .limit(200);

    const unpublished: { slug: string; reason: string }[] = [];
    for (const page of toolPages) {
      const toolUrl = page.toolUrl || "";
      let shouldUnpublish = false;
      let reason = "";

      if (isRiskyIndexedTool(page.title, page.slug)) {
        shouldUnpublish = true;
        reason = "Risky/non-verified AI generator feature should not index until manually verified";
      } else if (toolUrl.startsWith("http")) {
        const probe = await probeUrl(page.slug, toolUrl);
        if (!probe.ok) {
          shouldUnpublish = true;
          reason = `Tool URL unreachable${probe.status ? ` (${probe.status})` : ""}`;
        }
      }

      if (shouldUnpublish) {
        await db
          .update(seoLandingPages)
          .set({ published: false })
          .where(eq(seoLandingPages.id, page.id));
        unpublished.push({ slug: page.slug, reason });
      }
    }

    if (!hasStripeConfigured())
      actions.push("Open the Stripe card in Orbit and save sk_live_* + pk_live_* keys.");
    if (!hasStripeWebhookConfigured())
      actions.push(`Add Stripe webhook URL: ${siteUrl}/api/stripe/webhook.`);
    if (!isLikelyProductionUrl(siteUrl))
      actions.push("Set Vercel NEXT_PUBLIC_SITE_URL to https://svivva.com.");
    if (unpublished.length) {
      actions.push(
        `${unpublished.length} broken/risky indexed tool pages were unpublished so Google stops seeing them.`,
      );
    }
    actions.push("Use the Launch Everything button after this to create/submit growth pages.");

    return NextResponse.json({
      summary: [
        "Orbit autopilot completed.",
        `Checks passed: ${checks.filter((c) => c.ok).length}/${checks.length}`,
        unpublished.length
          ? `Unpublished from indexing: ${unpublished.length}`
          : "No broken indexed tool pages found.",
        "",
        ...actions.map((a) => `• ${a}`),
      ].join("\n"),
      checks,
      unpublished,
      actions,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
