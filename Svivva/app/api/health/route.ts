import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getSiteUrl, getSitemapUrl } from "@/lib/site-url";
import { hasStripeConfigured, hasStripeWebhookConfigured } from "@/lib/env";
import { hasCompleteStripeEnvKeys } from "@/lib/stripe/client";
import { isCronSecretAuthorized, isOrbitAdminAllowed } from "@/lib/orbit/admin-access";

export async function GET(req: NextRequest) {
  const isProd = process.env.NODE_ENV === "production";
  const privileged =
    isCronSecretAuthorized(req) ||
    (await isOrbitAdminAllowed(req));

  if (isProd && !privileged) {
    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  }

  const health: {
    status: "ok" | "error";
    timestamp: string;
    siteUrl: string;
    sitemapUrl: string;
    database: {
      connected: boolean;
      latencyMs?: number;
      playTablesReady?: boolean;
      error?: string;
    };
    environment: {
      hasOpenAI: boolean;
      hasStripe: boolean;
      hasStripeWebhook: boolean;
      orbitInternalSecret: boolean;
      cronSecret: boolean;
    };
  } = {
    status: "ok",
    timestamp: new Date().toISOString(),
    siteUrl: getSiteUrl(),
    sitemapUrl: getSitemapUrl(),
    database: {
      connected: false,
    },
    environment: {
      hasOpenAI: !!(process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY),
      hasStripe: hasStripeConfigured(),
      hasStripeWebhook: hasStripeWebhookConfigured(),
      orbitInternalSecret: !!process.env.ORBIT_INTERNAL_SECRET?.trim(),
      cronSecret: !!process.env.CRON_SECRET?.trim(),
    },
  };

  try {
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    const latencyMs = Date.now() - start;

    let playTablesReady = false;
    try {
      await db.execute(sql`SELECT 1 FROM play_sessions LIMIT 1`);
      playTablesReady = true;
    } catch {
      playTablesReady = false;
    }

    health.database = {
      connected: true,
      latencyMs,
      playTablesReady,
    };
  } catch (error) {
    health.status = "error";
    health.database = {
      connected: false,
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }

  const statusCode = health.status === "ok" ? 200 : 503;

  const stripeConnected = health.environment.hasStripe;
  return NextResponse.json(
    {
      ...health,
      stripe: {
        connected: stripeConnected,
        webhookConfigured: health.environment.hasStripeWebhook,
        envKeysComplete: hasCompleteStripeEnvKeys(),
      },
    },
    { status: statusCode },
  );
}
