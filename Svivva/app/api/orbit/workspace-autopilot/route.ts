import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { seoLandingPages } from "@/lib/schema";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { getSiteUrl } from "@/lib/site-url";
import { getAllWorkspaceProjects } from "@/lib/workspace-external-apps";
import { hasStripeConfigured, hasStripeWebhookConfigured } from "@/lib/env";
import { hydratePlatformSecrets } from "@/lib/platform-runtime-secrets";
import { ensureOrbitHubPages } from "@/lib/orbit/ensure-hub-pages";
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
    if (!(await isOrbitAdminAllowed()))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await hydratePlatformSecrets();
    const hubSteps = await ensureOrbitHubPages();

    const siteUrl = getSiteUrl();
    const checks: CheckResult[] = [];
    const actions: string[] = [...hubSteps.map((s) => (s.startsWith("✓") ? s : `• ${s}`))];

    const productionOk = isLikelyProductionUrl(siteUrl);
    checks.push({
      label: "Production domain",
      url: siteUrl,
      ok: productionOk,
      action: productionOk
        ? "svivva.com is the canonical production URL"
        : "Set NEXT_PUBLIC_SITE_URL=https://svivva.com in Vercel",
    });

    const stripeKeysOk = hasStripeConfigured();
    checks.push({
      label: "Stripe checkout keys",
      ok: stripeKeysOk,
      action: stripeKeysOk
        ? "Stripe secret + publishable keys are available"
        : "Paste Stripe secret and publishable keys in Orbit or Vercel env",
    });

    const stripeWebhookOk = hasStripeWebhookConfigured();
    checks.push({
      label: "Stripe webhook secret",
      ok: stripeWebhookOk || stripeKeysOk,
      action: stripeWebhookOk
        ? "Stripe webhook secret is available"
        : stripeKeysOk
          ? `Optional: add webhook at ${siteUrl}/api/stripe/webhook for subscription events`
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

    if (!stripeKeysOk)
      actions.push("Open the Stripe card in Orbit and save sk_live_* + pk_live_* keys.");
    if (!stripeWebhookOk && stripeKeysOk)
      actions.push(`Optional: add Stripe webhook URL: ${siteUrl}/api/stripe/webhook.`);
    if (!productionOk)
      actions.push("Set Vercel NEXT_PUBLIC_SITE_URL to https://svivva.com.");
    if (unpublished.length) {
      actions.push(
        `${unpublished.length} broken/risky indexed tool pages were unpublished so Google stops seeing them.`,
      );
    }
    actions.push("Use the Launch Everything button after this to create/submit growth pages.");

    const passed = checks.filter((c) => c.ok).length;
    const total = checks.length;
    const allPassed = passed === total;

    return NextResponse.json({
      summary: [
        allPassed ? "Orbit autopilot completed — all checks passed." : "Orbit autopilot completed.",
        `Checks passed: ${passed}/${total}`,
        unpublished.length
          ? `Unpublished from indexing: ${unpublished.length}`
          : "No broken indexed tool pages found.",
        "",
        ...actions.map((a) => `• ${a}`),
      ].join("\n"),
      checks,
      unpublished,
      actions,
      allPassed,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
