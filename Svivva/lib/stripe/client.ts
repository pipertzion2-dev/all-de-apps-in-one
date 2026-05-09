import Stripe from "stripe";

export function hasCompleteStripeEnvKeys(): boolean {
  return !!getEnvStripeKeys();
}

function getEnvStripeKeys(): { publishableKey: string; secretKey: string } | null {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const publishableKey =
    process.env.STRIPE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  if (secretKey && publishableKey) {
    return { publishableKey, secretKey };
  }
  return null;
}

async function getCredentialsFromReplitConnector() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!hostname || !xReplitToken) {
    throw new Error(
      "Stripe: set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY (or NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY), or run on Replit with the Stripe connector.",
    );
  }

  const connectorName = "stripe";
  const isProduction = process.env.REPLIT_DEPLOYMENT === "1";
  const targetEnvironment = isProduction ? "production" : "development";

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set("include_secrets", "true");
  url.searchParams.set("connector_names", connectorName);
  url.searchParams.set("environment", targetEnvironment);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "X-Replit-Token": xReplitToken,
    },
  });

  const data = await response.json();
  const connectionSettings = data.items?.[0];

  if (
    !connectionSettings ||
    !connectionSettings.settings.publishable ||
    !connectionSettings.settings.secret
  ) {
    throw new Error(`Stripe ${targetEnvironment} connection not found`);
  }

  return {
    publishableKey: connectionSettings.settings.publishable,
    secretKey: connectionSettings.settings.secret,
  };
}

async function getCredentials() {
  const fromEnv = getEnvStripeKeys();
  if (fromEnv) return fromEnv;
  return getCredentialsFromReplitConnector();
}

export async function getUncachableStripeClient() {
  const { secretKey } = await getCredentials();
  return new Stripe(secretKey, {
    apiVersion: "2025-08-27.basil" as any,
  });
}

export async function getStripePublishableKey() {
  const { publishableKey } = await getCredentials();
  return publishableKey;
}

export async function getStripeSecretKey() {
  const { secretKey } = await getCredentials();
  return secretKey;
}
