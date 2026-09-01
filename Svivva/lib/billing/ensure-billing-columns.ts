import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { ensureCoreDbTables } from "@/lib/ensure-core-db-tables";

let billingColumnsEnsured = false;

export async function ensureBillingColumns(): Promise<void> {
  if (billingColumnsEnsured) return;
  try {
    await ensureCoreDbTables();
    await db.execute(
      sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS lemon_squeezy_customer_id TEXT`,
    );
    await db.execute(
      sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS lemon_squeezy_subscription_id TEXT`,
    );
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_provider TEXT`);
    await db.execute(
      sql`ALTER TABLE platform_runtime_secrets ADD COLUMN IF NOT EXISTS lemon_squeezy_api_key TEXT`,
    );
    await db.execute(
      sql`ALTER TABLE platform_runtime_secrets ADD COLUMN IF NOT EXISTS lemon_squeezy_store_id TEXT`,
    );
    await db.execute(
      sql`ALTER TABLE platform_runtime_secrets ADD COLUMN IF NOT EXISTS lemon_squeezy_variant_id_pro TEXT`,
    );
    await db.execute(
      sql`ALTER TABLE platform_runtime_secrets ADD COLUMN IF NOT EXISTS lemon_squeezy_variant_id_enterprise TEXT`,
    );
    await db.execute(
      sql`ALTER TABLE platform_runtime_secrets ADD COLUMN IF NOT EXISTS lemon_squeezy_webhook_secret TEXT`,
    );
    await db.execute(
      sql`ALTER TABLE platform_runtime_secrets ADD COLUMN IF NOT EXISTS lemon_squeezy_checkout_url_pro TEXT`,
    );
    await db.execute(
      sql`ALTER TABLE platform_runtime_secrets ADD COLUMN IF NOT EXISTS lemon_squeezy_checkout_url_enterprise TEXT`,
    );
    billingColumnsEnsured = true;
  } catch {
    /* test env */
  }
}
