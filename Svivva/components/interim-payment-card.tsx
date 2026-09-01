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
};

export function InterimPaymentCard({
  config,
  showAlways = false,
  stripeCheckoutReady = false,
}: Props) {
  if (!config.active) return null;
  if (!showAlways && stripeCheckoutReady) return null;

  return (
    <Card
      className="border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-transparent"
      data-testid="interim-payment-card"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-amber-700 dark:text-amber-300" />
          <CardTitle className="text-lg">Pay while Stripe finishes verifying</CardTitle>
        </div>
        <CardDescription>
          {stripeCheckoutReady
            ? "Card checkout on this page is still setting up — use one of these options now."
            : "Subscribe to ZZAI Pro now with a secure link or PayPal. We'll activate your account after payment."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
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
