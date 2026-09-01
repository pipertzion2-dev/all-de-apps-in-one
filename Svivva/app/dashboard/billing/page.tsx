"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, CreditCard, Loader2, ExternalLink } from "lucide-react";
import { trackUpgrade } from "@/lib/analytics";
import { AdminCodeForm } from "@/components/admin-code-form";
import { usePlan, type Plan } from "@/hooks/use-plan";
import type { ResolvedBillingPlan } from "@/lib/billing/resolve-plan-offers";

type PlansResponse = {
  plans: ResolvedBillingPlan[];
  paymentOptions: {
    stripe: { checkoutReady: boolean; configured: boolean; detail: string };
    lemonSqueezy: { active: boolean; starter: boolean; pro: boolean };
    interimActive: boolean;
    preferredProvider: string | null;
  };
};

function BillingPageContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { isPro, isMembershipAccess, plan: currentPlanTier } = usePlan();

  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  useEffect(() => {
    if (success) {
      toast({
        title: "Subscription successful!",
        description: "Your plan is active — enjoy ZZAI.",
      });
    }
    if (canceled) {
      toast({
        title: "Checkout canceled",
        description: "Your subscription was not changed.",
        variant: "destructive",
      });
    }
  }, [success, canceled, toast]);

  const { data: plansData, isLoading: plansLoading } = useQuery<PlansResponse>({
    queryKey: ["/api/billing/plans"],
    queryFn: () => fetch("/api/billing/plans").then((r) => r.json()),
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ["/api/stripe/subscription"],
    queryFn: () =>
      fetch("/api/stripe/subscription", { credentials: "include" }).then((r) => r.json()),
  });

  const plans = plansData?.plans ?? [];
  const stripeCheckoutReady = Boolean(plansData?.paymentOptions.stripe.checkoutReady);
  const lemonActive = Boolean(plansData?.paymentOptions.lemonSqueezy?.active);
  const interimActive = Boolean(plansData?.paymentOptions.interimActive);

  const currentPlan =
    (isPro ? currentPlanTier : (subscriptionData?.plan as Plan | undefined)) ?? "free";
  const currentPlanData = plans.find((p) => p.tier === currentPlan) ?? plans[0];

  const hostedCheckoutMutation = useMutation({
    mutationFn: async ({ priceId, tier }: { priceId: string; tier: string }) => {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      return data as { url: string };
    },
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (error: Error) => {
      toast({ title: "Checkout error", description: error.message, variant: "destructive" });
      setLoadingPlan(null);
    },
  });

  const lemonCheckoutMutation = useMutation({
    mutationFn: async (tier: "starter" | "pro") => {
      const res = await fetch("/api/lemonsqueezy/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      return data as { url: string };
    },
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (error: Error) => {
      toast({ title: "Checkout error", description: error.message, variant: "destructive" });
      setLoadingPlan(null);
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to open billing portal");
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubscribe = (plan: ResolvedBillingPlan) => {
    if (plan.tier === "free") return;
    setLoadingPlan(plan.name);
    trackUpgrade(plan.tier);

    if (
      plan.checkoutProvider === "lemonsqueezy" &&
      (plan.tier === "starter" || plan.tier === "pro")
    ) {
      lemonCheckoutMutation.mutate(plan.tier);
      return;
    }

    if (plan.checkoutProvider === "stripe" && plan.priceId) {
      hostedCheckoutMutation.mutate({ priceId: plan.priceId, tier: plan.tier });
      return;
    }

    if (plan.checkoutProvider === "link" && plan.paymentLink) {
      window.open(plan.paymentLink, "_blank", "noopener,noreferrer");
      setLoadingPlan(null);
      return;
    }

    setLoadingPlan(null);
    toast({
      title: "Checkout not configured",
      description:
        "Add Lemon Squeezy checkout URLs in Orbit admin (Launchpad → Lemon Squeezy), or Stripe keys in Vercel.",
      variant: "destructive",
    });
  };

  const checkoutLabel = (plan: ResolvedBillingPlan) => {
    if (plan.checkoutProvider === "lemonsqueezy") {
      return `Subscribe — ${plan.priceLabel}/mo`;
    }
    if (plan.checkoutProvider === "stripe") return `Subscribe — ${plan.priceLabel}/mo`;
    if (plan.checkoutProvider === "link") return `Pay — ${plan.priceLabel}/mo`;
    return "Setup required";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground">
          Starter $20/mo · Pro $50/mo — powered by Lemon Squeezy or Stripe
        </p>
      </div>

      {!isMembershipAccess && !isPro && (
        <AdminCodeForm
          title="Have an access code?"
          description="Enter your access code to unlock Pro without a subscription."
        />
      )}

      {lemonActive && (
        <Card className="border border-lime-500/35 bg-lime-500/5">
          <CardContent className="pt-4 text-sm text-foreground">
            Lemon Squeezy checkout is live — pick Starter ($20) or Pro ($50) below.
          </CardContent>
        </Card>
      )}

      {!lemonActive && !stripeCheckoutReady && !interimActive && !isPro && (
        <Card className="border border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-4 text-sm text-muted-foreground">
            To enable checkout, paste Lemon Squeezy URLs in Orbit admin →{" "}
            <strong className="text-foreground">Lemon Squeezy</strong> (Starter $20 + Pro $50), or
            set Stripe / payment link env vars in Vercel.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            You&apos;re on {currentPlanData?.name ?? "Free"}
            {isMembershipAccess ? " (access code)" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary">{currentPlanData?.name ?? "Free"}</Badge>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-6">Choose a plan</h2>
        {plansLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading plans…
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl">
            {plans.map((plan) => {
              const isCurrent = plan.tier === currentPlan;
              const canCheckout = plan.tier !== "free" && plan.checkoutAvailable && !isCurrent;
              return (
                <Card
                  key={plan.tier}
                  className={`relative ${plan.popular ? "border-[#5B8DA8] border-2 shadow-lg shadow-[#5B8DA8]/10 mt-3" : ""}`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#5B8DA8] text-white z-10">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      {plan.name}
                      {isCurrent && <Badge variant="outline">Current</Badge>}
                    </CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">{plan.priceLabel}</span>
                      {plan.period !== "forever" && (
                        <span className="text-sm text-muted-foreground">/ {plan.period}</span>
                      )}
                    </div>

                    <ul className="space-y-2.5">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-[#5B8DA8] mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full ${plan.popular && !isCurrent ? "bg-[#5B8DA8] hover:bg-[#4A9790]" : ""}`}
                      variant={isCurrent ? "outline" : plan.popular ? "default" : "outline"}
                      disabled={isCurrent || loadingPlan === plan.name || !canCheckout}
                      onClick={() => handleSubscribe(plan)}
                      data-testid={`button-plan-${plan.tier}`}
                    >
                      {loadingPlan === plan.name ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Processing…
                        </>
                      ) : isCurrent ? (
                        "Current Plan"
                      ) : plan.tier === "free" ? (
                        "Included"
                      ) : (
                        <>
                          {checkoutLabel(plan)}
                          {plan.paymentLink && !stripeCheckoutReady ? (
                            <ExternalLink className="w-3.5 h-3.5 ml-1" />
                          ) : null}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Manage cards and invoices in the billing portal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <CreditCard className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                {subscriptionData?.subscription
                  ? "Manage your payment method in the billing portal"
                  : "No payment method on file"}
              </p>
            </div>
            <Button
              variant="outline"
              data-testid="button-manage-billing"
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending || !subscriptionData?.subscription}
            >
              {portalMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Loading…
                </>
              ) : (
                "Manage Billing"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-sm text-muted-foreground">Loading billing...</div>}
    >
      <BillingPageContent />
    </Suspense>
  );
}
