import { NextRequest } from "next/server";
import { isOrbitAdminAllowed } from "@/lib/orbit/admin-access";
import { resolveGscCredentialsUserId } from "@/lib/orbit/gsc-credentials-user";
import { runAutomatableManualActions } from "@/lib/orbit/automate-manual-actions";
import { getGoogleOAuthAccessTokenForUser } from "@/lib/google-gsc-oauth";
import { runGscAutoSetup } from "@/lib/google-gsc-auto-setup";
import { getMarketingCredentialStatus } from "@/lib/orbit/marketing-autopilot-credentials";
import { hasStripeConfigured, hasStripeWebhookConfigured } from "@/lib/env";
import { hydratePlatformSecrets } from "@/lib/platform-runtime-secrets";
import { ensureEasyPeasyForOrbit } from "@/lib/easypeasy/ensure";
import { getUncachableStripeClient } from "@/lib/stripe/client";
import { getSiteUrl } from "@/lib/site-url";
import { forbidden, ok, badRequest } from "@/lib/http-response";
import type { MarketingIndexingSummary } from "@/lib/orbit/marketing-autopilot-types";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type StripeCheck = {
  label: string;
  ok: boolean;
  action: string;
  liveVerified?: boolean;
};

async function verifyStripe(): Promise<{ checks: StripeCheck[]; allOk: boolean }> {
  await hydratePlatformSecrets();
  const siteUrl = getSiteUrl();
  const checks: StripeCheck[] = [];

  const keysOk = hasStripeConfigured();
  checks.push({
    label: "Stripe checkout keys",
    ok: keysOk,
    action: keysOk
      ? "Secret + publishable keys are configured"
      : "Paste sk_live_* and pk_live_* in Orbit → Stripe tab or Vercel env",
  });

  const webhookOk = hasStripeWebhookConfigured();
  checks.push({
    label: "Stripe webhook secret",
    ok: webhookOk || keysOk,
    action: webhookOk
      ? "Webhook secret is configured"
      : keysOk
        ? `Optional: add webhook at ${siteUrl}/api/stripe/webhook`
        : `Create webhook at ${siteUrl}/api/stripe/webhook and save whsec_*`,
  });

  if (keysOk) {
    try {
      const stripe = await getUncachableStripeClient();
      await stripe.balance.retrieve();
      const keyCheck = checks.find((c) => c.label === "Stripe checkout keys");
      if (keyCheck) {
        keyCheck.liveVerified = true;
        keyCheck.action = "Stripe API verified — checkout is ready";
      }
    } catch (e) {
      const keyCheck = checks.find((c) => c.label === "Stripe checkout keys");
      if (keyCheck) {
        keyCheck.ok = false;
        keyCheck.liveVerified = false;
        keyCheck.action = `Keys present but Stripe API rejected them: ${e instanceof Error ? e.message : String(e)}`;
      }
    }
  }

  const allOk = checks.every((c) => c.ok);
  return { checks, allOk };
}

/** Lightweight get-started: Google indexing + Stripe readiness (no content generation). */
export async function POST(req: NextRequest) {
  if (!(await isOrbitAdminAllowed(req))) return forbidden();

  await hydratePlatformSecrets();
  const easypeasy = await ensureEasyPeasyForOrbit({
    tierId: "premium",
    testConnection: false,
  });

  const userId = await resolveGscCredentialsUserId();
  const accessToken = await getGoogleOAuthAccessTokenForUser(userId);
  const credStatus = await getMarketingCredentialStatus();
  const oauthConnected = !!accessToken || credStatus.google.serviceAccount;

  let autoSetup = null;
  if (accessToken) {
    autoSetup = await runGscAutoSetup({ userId, accessToken });
  }

  const indexing = await runAutomatableManualActions({ googleMaxBatches: 5 });

  const gscReady = !!autoSetup?.ok || (oauthConnected && credStatus.google.siteUrl);

  const indexingSummary: MarketingIndexingSummary = {
    indexNow: {
      ok: indexing.indexNow.ok,
      submitted: indexing.indexNow.submittedCount,
      total: indexing.indexNow.totalUrls,
      message: indexing.indexNow.message,
    },
    googleSitemap: indexing.googleSitemap,
    googleIndexing: indexing.googleIndexing,
    bingPing: { ok: indexing.bingPing.ok },
    gscConnected: gscReady,
  };

  const stripe = await verifyStripe();

  const indexingOk =
    indexing.indexNow.ok ||
    indexing.googleSitemap.ok ||
    indexing.googleIndexing.submitted > 0 ||
    indexing.bingPing.ok;

  const summaryLines = [
    indexingOk
      ? "Google indexing submitted."
      : "Indexing ran — connect Google for full GSC coverage.",
    stripe.allOk
      ? "Stripe is connected and ready."
      : "Stripe needs keys — see Orbit Stripe card below.",
    "",
    ...indexing.summaryLines,
    "",
    ...stripe.checks.map((c) => `${c.ok ? "✓" : "•"} ${c.label}: ${c.action}`),
  ];

  return ok({
    ok: indexingOk && stripe.allOk,
    easypeasy,
    indexing: indexingSummary,
    autoSetup,
    stripe,
    summary: summaryLines.join("\n"),
    message: accessToken
      ? autoSetup?.message || "Quick start complete"
      : gscReady
        ? "Indexing run complete"
        : "Connect Google via the camo orb for full Search Console indexing",
  });
}

export async function GET() {
  return badRequest("Use POST");
}
