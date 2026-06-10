"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { getPublicSiteUrl } from "@/lib/site-url-public";

const STRIPE_DASHBOARD = "https://dashboard.stripe.com";
const STRIPE_KEYS = "https://dashboard.stripe.com/apikeys";
const WEBHOOK_DOCS = "https://stripe.com/docs/webhooks";

export default function StripeSetupPage() {
  const [stripeStatus, setStripeStatus] = useState<"connected" | "disconnected" | "loading">(
    "loading",
  );
  const [webhookOk, setWebhookOk] = useState<boolean | null>(null);
  const [envKeysComplete, setEnvKeysComplete] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStripe = async () => {
      try {
        const response = await fetch("/api/health");
        const data = await response.json();

        if (data.stripe?.connected) {
          setStripeStatus("connected");
        } else {
          setStripeStatus("disconnected");
        }
        setWebhookOk(data.stripe?.webhookConfigured ?? null);
        setEnvKeysComplete(data.stripe?.envKeysComplete ?? null);
      } catch {
        setStripeStatus("disconnected");
        setWebhookOk(null);
        setEnvKeysComplete(null);
      }
    };

    checkStripe();
  }, []);

  const siteUrl = getPublicSiteUrl();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Stripe Setup</h1>
        <p className="text-muted-foreground">
          Connect Stripe to accept payments on billing and checkout
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Connection Status</CardTitle>
              <CardDescription>Derived from /api/health (keys + optional webhook)</CardDescription>
            </div>
            {stripeStatus === "loading" && (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            )}
            {stripeStatus === "connected" && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-950/30">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  Ready
                </span>
              </div>
            )}
            {stripeStatus === "disconnected" && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/30">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                  Not configured
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {stripeStatus === "connected" && (
            <div className="space-y-4">
              <p className="text-sm text-foreground">
                API keys are configured (secret + publishable). Billing and Elements can load.
              </p>
              {envKeysComplete === true && webhookOk === false && (
                <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
                  <strong>Webhook missing.</strong> Add{" "}
                  <code className="text-xs">STRIPE_WEBHOOK_SECRET</code> and point Stripe to{" "}
                  <code className="text-xs break-all">{siteUrl}/api/stripe/webhook</code> with event{" "}
                  <code className="text-xs">checkout.session.completed</code> and{" "}
                  <code className="text-xs">customer.subscription.deleted</code> so subscriptions
                  sync to your database.
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <a href={STRIPE_DASHBOARD} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    Stripe Dashboard
                    <ExternalLink className="w-3.5 h-3.5 ml-2" />
                  </Button>
                </a>
                <a href={STRIPE_KEYS} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    API keys
                    <ExternalLink className="w-3.5 h-3.5 ml-2" />
                  </Button>
                </a>
                <a href={WEBHOOK_DOCS} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    Webhook docs
                    <ExternalLink className="w-3.5 h-3.5 ml-2" />
                  </Button>
                </a>
              </div>
            </div>
          )}

          {stripeStatus === "disconnected" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Set <strong>STRIPE_SECRET_KEY</strong> and <strong>STRIPE_PUBLISHABLE_KEY</strong>{" "}
                in your deployment environment, or paste the same keys under{" "}
                <Link href="/dashboard/settings/runtime-keys" className="text-primary underline">
                  Settings → Runtime keys
                </Link>{" "}
                (admin) so the server loads them from Postgres on boot.
              </p>
              <ol className="space-y-3 text-sm list-decimal list-inside">
                <li>
                  <a
                    href="https://stripe.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Create a Stripe account
                  </a>
                </li>
                <li>
                  In{" "}
                  <a
                    href={STRIPE_KEYS}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    API keys
                  </a>
                  , copy the <strong>Secret</strong> and <strong>Publishable</strong> keys into env
                  vars.
                </li>
                <li>
                  Run <code className="text-xs bg-muted px-1 rounded">npm run stripe:seed</code>{" "}
                  once to create Pro / Enterprise products (metadata{" "}
                  <code className="text-xs">tier=pro|enterprise</code>).
                </li>
                <li>
                  Add webhook endpoint{" "}
                  <code className="text-xs break-all">{siteUrl}/api/stripe/webhook</code> and set{" "}
                  <code className="text-xs">STRIPE_WEBHOOK_SECRET</code>.
                </li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reusing a Stripe account you already set up</CardTitle>
          <CardDescription>No second Stripe account required</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Open your{" "}
            <a
              href={STRIPE_DASHBOARD}
              className="text-primary underline"
              target="_blank"
              rel="noreferrer"
            >
              existing Stripe Dashboard
            </a>{" "}
            and copy the same <strong>Secret</strong> and <strong>Publishable</strong> keys into
            this deployment (Vercel env or{" "}
            <Link href="/dashboard/settings/runtime-keys" className="text-primary underline">
              Runtime keys
            </Link>
            ).
          </p>
          <p>
            If the public site URL changed, create a <strong>new webhook endpoint</strong> in Stripe
            pointing at{" "}
            <code className="text-xs break-all rounded bg-muted px-1 py-0.5">
              {siteUrl}/api/stripe/webhook
            </code>{" "}
            and update <code className="text-xs">STRIPE_WEBHOOK_SECRET</code> with the new signing
            secret. Existing customers and products stay in Stripe; only the endpoint URL and env
            need to match this app.
          </p>
          <p>
            Use <strong>test</strong> vs <strong>live</strong> keys consistently with the mode
            toggle in the Stripe Dashboard so checkout and webhooks hit the same account mode.
          </p>
        </CardContent>
      </Card>

      <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-base">How billing works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Prices</strong> load from the Stripe API using the
            keys you configured (same products as in your Stripe Dashboard).
          </p>
          <p>
            <strong className="text-foreground">Checkout</strong> uses Stripe Checkout or the
            Payment Element flow on <code className="text-xs">/dashboard/checkout</code>.
            Success/cancel URLs use <code className="text-xs">NEXT_PUBLIC_SITE_URL</code> when set.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
