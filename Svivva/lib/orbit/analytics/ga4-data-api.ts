import { db } from "@/lib/db";
import { seedCredentials } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getPrimaryAdminUserId } from "@/lib/auth/admin";
import { createSign } from "crypto";

type ServiceAccount = {
  private_key: string;
  client_email: string;
  token_uri: string;
};

function base64url(str: string | Buffer): string {
  const b = typeof str === "string" ? Buffer.from(str) : str;
  return b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function getAnalyticsAccessToken(saJson: string): Promise<string | null> {
  try {
    const sa: ServiceAccount = JSON.parse(saJson);
    const now = Math.floor(Date.now() / 1000);
    const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const payload = base64url(
      JSON.stringify({
        iss: sa.client_email,
        scope: "https://www.googleapis.com/auth/analytics.readonly",
        aud: sa.token_uri,
        exp: now + 3600,
        iat: now,
      }),
    );
    const sigInput = `${header}.${payload}`;
    const sign = createSign("RSA-SHA256");
    sign.update(sigInput);
    const signature = base64url(sign.sign(sa.private_key));
    const jwt = `${sigInput}.${signature}`;

    const res = await fetch(sa.token_uri, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token ?? null;
  } catch {
    return null;
  }
}

async function loadServiceAccountJson(): Promise<string | null> {
  const adminUserId = getPrimaryAdminUserId();
  if (!adminUserId) return null;
  const [row] = await db
    .select({ sa: seedCredentials.googleServiceAccountJson })
    .from(seedCredentials)
    .where(eq(seedCredentials.userId, adminUserId))
    .limit(1);
  return row?.sa?.trim() || null;
}

export type Ga4PullResult = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  sessions7d?: number;
  conversions7d?: number;
};

/** Pull 7-day sessions + conversions from GA4 Data API when credentials + property id are configured. */
export async function pullGa4Metrics(propertyId: string): Promise<Ga4PullResult> {
  const saJson = await loadServiceAccountJson();
  if (!saJson) {
    return { ok: false, skipped: true, reason: "no_service_account" };
  }

  const token = await getAnalyticsAccessToken(saJson);
  if (!token) {
    return { ok: false, skipped: true, reason: "token_failed" };
  }

  const property = propertyId.startsWith("properties/") ? propertyId : `properties/${propertyId}`;
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/${property}:runReport`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      metrics: [{ name: "sessions" }, { name: "conversions" }],
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    return { ok: false, skipped: true, reason: `api_${res.status}` };
  }

  const data = await res.json();
  const values = data.rows?.[0]?.metricValues || [];
  const sessions7d = Number(values[0]?.value || 0);
  const conversions7d = Number(values[1]?.value || 0);

  return { ok: true, sessions7d, conversions7d };
}

export async function pullGa4MetricsForProject(
  projectId: string,
  userId: string,
): Promise<Ga4PullResult & { ingested?: boolean }> {
  const { getOrbitProjectById } = await import("../ingest");
  const { parseExternalAnalyticsConfig, ingestExternalMetrics, syncExternalSignalsForProject } =
    await import("../analytics/external-signals");

  const project = await getOrbitProjectById(projectId, userId);
  if (!project) throw new Error("Orbit project not found");

  const config = parseExternalAnalyticsConfig(project.metadata as Record<string, unknown>);
  const propertyId = config.ga4PropertyId?.trim();
  if (!propertyId) {
    return { ok: false, skipped: true, reason: "no_ga4_property_id" };
  }

  const previous = config.sessions7d;
  const pull = await pullGa4Metrics(propertyId);
  if (!pull.ok || pull.skipped) return pull;

  await ingestExternalMetrics(projectId, userId, {
    sessions7d: pull.sessions7d,
    conversions7d: pull.conversions7d,
    previousSessions7d: previous,
  });
  await syncExternalSignalsForProject(projectId, userId);

  return { ...pull, ingested: true };
}
