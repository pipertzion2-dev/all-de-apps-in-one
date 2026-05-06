import { runMigrations } from 'stripe-replit-sync';
import { getStripeSync } from "./stripeClient.js";
import app from "./app.js";
import { logger } from "./lib/logger.js";

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required for Stripe integration');

  try {
    logger.info('Initializing Stripe schema...');
    await runMigrations({ databaseUrl });
    logger.info('Stripe schema ready');

    const stripeSync = await getStripeSync();

    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
    try {
      await stripeSync.findOrCreateManagedWebhook(`${webhookBaseUrl}/api/stripe/webhook`);
      logger.info('Stripe webhook configured');
    } catch (webhookErr: any) {
      logger.warn({ err: webhookErr }, 'Webhook setup failed (non-fatal) — will retry on next restart');
    }

    stripeSync.syncBackfill()
      .then(() => logger.info('Stripe data synced'))
      .catch((err: any) => logger.warn({ err }, 'Stripe backfill failed (non-fatal)'));
  } catch (error) {
    logger.error({ err: error }, 'Failed to initialize Stripe schema');
    throw error;
  }
}

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required");
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT value: "${rawPort}"`);

await initStripe();

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});
