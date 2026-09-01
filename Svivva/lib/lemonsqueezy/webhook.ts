import { createHmac, timingSafeEqual } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { loadLemonSqueezyConfig } from "./config";

type LemonWebhookPayload = {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, string>;
  };
  data?: {
    type?: string;
    id?: string;
    attributes?: {
      status?: string;
      customer_id?: number | string;
      variant_id?: number | string;
      user_email?: string;
    };
  };
};

const ACTIVE_STATUSES = new Set(["active", "on_trial", "paused"]);
const INACTIVE_EVENTS = new Set([
  "subscription_cancelled",
  "subscription_expired",
  "subscription_paused",
]);

export function verifyLemonSqueezySignature(rawBody: string, signature: string, secret: string) {
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(digest, "utf8"), Buffer.from(signature, "utf8"));
  } catch {
    return false;
  }
}

async function resolveUserId(payload: LemonWebhookPayload): Promise<string | null> {
  const fromCustom = payload.meta?.custom_data?.user_id?.trim();
  if (fromCustom) return fromCustom;

  const email = payload.data?.attributes?.user_email?.trim();
  if (!email) return null;

  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return row?.id ?? null;
}

export async function processLemonSqueezyWebhook(payload: LemonWebhookPayload) {
  const event = payload.meta?.event_name || "";
  const subscriptionId = payload.data?.id ? String(payload.data.id) : null;
  const status = payload.data?.attributes?.status || "";
  const customerId = payload.data?.attributes?.customer_id
    ? String(payload.data.attributes.customer_id)
    : null;

  if (!subscriptionId || payload.data?.type !== "subscriptions") {
    return { ok: true, action: "ignored", event };
  }

  const userId = await resolveUserId(payload);
  if (!userId) {
    return { ok: false, action: "user_not_found", event };
  }

  const isActive = ACTIVE_STATUSES.has(status) && !INACTIVE_EVENTS.has(event);
  const isInactive =
    INACTIVE_EVENTS.has(event) ||
    status === "cancelled" ||
    status === "expired" ||
    status === "unpaid";

  if (isActive) {
    await db
      .update(users)
      .set({
        lemonSqueezySubscriptionId: subscriptionId,
        lemonSqueezyCustomerId: customerId,
        paymentProvider: "lemonsqueezy",
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    return { ok: true, action: "activated", event, userId, subscriptionId };
  }

  if (isInactive) {
    await db
      .update(users)
      .set({
        lemonSqueezySubscriptionId: null,
        paymentProvider: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    return { ok: true, action: "deactivated", event, userId };
  }

  return { ok: true, action: "no_change", event, status };
}

export async function getLemonSqueezyWebhookSecret() {
  const config = await loadLemonSqueezyConfig();
  return config.webhookSecret;
}
