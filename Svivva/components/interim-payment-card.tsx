"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Wallet } from "lucide-react";
import type { InterimPaymentPublic } from "@/lib/interim-payments";

type Props = {
  config: InterimPaymentPublic;
  /** Hide when embedded checkout works and interim is not required */
  showAlways?: boolean;
  stripeCheckoutReady?: boolean;
  lemonSqueezyActive?: boolean;
  onLemonSqueezyCheckout?: () => void;
};

export function InterimPaymentCard({
  config,
  showAlways = false,
  stripeCheckoutReady = false,
  lemonSqueezyActive = false,
  onLemonSqueezyCheckout,
}: Props) {
  if (!config.active && !lemonSqueezyActive) return null;
  if (!showAlways && stripeCheckoutReady && !lemonSqueezyActive) return null;

  return (
    <Card
      className="border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-transparent"
      data-testid="interim-payment-card"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-amber-700 dark:text-amber-300" />
          <CardTitle className="text-lg">
            {stripeCheckoutReady ? "Other payment options" : "Subscribe while Stripe verifies"}
          </CardTitle>
        </div>
        <CardDescription>
          {lemonSqueezyActive
            ? "Lemon Squeezy activates Pro automatically after payment. PayPal/Venmo require manual activation (access code)."
            : stripeCheckoutReady
              ? "Card checkout on this page is still setting up — use one of these options now."
              : "Subscribe to ZZAI Pro now. We'll activate your account after payment (or instantly with Lemon Squeezy)."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          {lemonSqueezyActive && onLemonSqueezyCheckout && (
            <Button
              type="button"
              className="bg-lime-600 hover:bg-lime-700 text-white gap-2"
              data-testid="btn-pay-lemon-squeezy"
              onClick={onLemonSqueezyCheckout}
            >
              Subscribe — Lemon Squeezy $49/mo
            </Button>
          )}
          {config.stripePaymentLinkPro && (
            <Button
              asChild
              className="bg-[#5B8DA8] hover:bg-[#4A9790] gap-2"
              data-testid="btn-pay-stripe-link-pro"
            >
              <a href={config.stripePaymentLinkPro} target="_blank" rel="noopener noreferrer">
                Pay with Stripe — Pro $49
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
          {config.stripePaymentLinkEnterprise && (
            <Button asChild variant="outline" className="gap-2">
              <a
                href={config.stripePaymentLinkEnterprise}
                target="_blank"
                rel="noopener noreferrer"
              >
                Enterprise $299
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
          {config.paypalUrl && (
            <Button asChild variant="outline" className="gap-2" data-testid="btn-pay-paypal">
              <a href={config.paypalUrl} target="_blank" rel="noopener noreferrer">
                Pay with PayPal
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
          {config.venmoUrl && (
            <Button asChild variant="outline" className="gap-2">
              <a href={config.venmoUrl} target="_blank" rel="noopener noreferrer">
                Pay with Venmo
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
        {config.note && (
          <p className="text-sm text-muted-foreground leading-relaxed border-t border-border/60 pt-3">
            {config.note}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
