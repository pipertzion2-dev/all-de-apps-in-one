"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, CreditCard, Sparkles, Loader2 } from "lucide-react";
import { trackUpgrade } from "@/lib/analytics";
import { inferBillingTier } from "@/lib/stripe/catalog";
import { AdminCodeForm } from "@/components/admin-code-form";
import { usePlan } from "@/hooks/use-plan";
import { InterimPaymentCard } from "@/components/interim-payment-card";
import type { InterimPaymentPublic } from "@/lib/interim-payments";
import type { BillingPaymentOptions } from "@/lib/billing/payment-options";

interface Price {
  id: string;
  unitAmount: number;
  currency: string;
  recurring: { interval: string } | null;
  metadata: Record<string, string>;
}

interface Product {
  id: string;
  name: string;
  description: string;
  metadata: Record<string, string>;
  prices: Price[];
}

const defaultPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out ZZAI",
    features: ["1 project", "100 API calls/month", "Basic eval suite", "Community support"],
    priceId: null as string | null,
    tier: "free",
  },
  {
    name: "Pro",
    price: "$49",
    period: "per month",
    description: "For growing teams and projects",
    features: [
      "10 projects",
      "10,000 API calls/month",
      "Full eval suite with auto-rollback",
      "Priority support",
      "Custom training data",
      "Version history",
    ],
    priceId: null as string | null,
    tier: "pro",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$299",
    period: "per month",
    description: "For large-scale deployments",
    features: [
      "Unlimited projects",
      "Unlimited API calls",
      "SLA guarantee",
      "Dedicated support",
      "Custom integrations",
      "On-premise option",
    ],
    priceId: null as string | null,
    tier: "enterprise",
  },
];

function BillingPageContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [plans, setPlans] = useState(defaultPlans);
  const { isPro, isMembershipAccess } = usePlan();

  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  useEffect(() => {
    if (success) {
      toast({
        title: "Subscription successful!",
        description: "Welcome to ZZAI Pro. Your new features are now available.",
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

  const { data: pricesData } = useQuery({
    queryKey: ["/api/stripe/prices"],
    queryFn: async () => {
      const res = await fetch("/api/stripe/prices");
      return res.json();
    },
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ["/api/stripe/subscription"],
    queryFn: async () => {
      const res = await fetch("/api/stripe/subscription", { credentials: "include" });
      return res.json();
    },
  });

  const { data: paymentOptions } = useQuery<BillingPaymentOptions>({
    queryKey: ["/api/billing/payment-options"],
    queryFn: async () => {
      const res = await fetch("/api/billing/payment-options");
      return res.json();
    },
  });

  const interimPayments = paymentOptions?.interim as InterimPaymentPublic | undefined;

  useEffect(() => {
    if (pricesData?.products) {
      const updatedPlans = [...defaultPlans];

      for (const product of pricesData.products as Product[]) {
        const tier = inferBillingTier(product.name, product.metadata);
        if (tier && product.prices.length > 0) {
          const monthlyPrice =
            product.prices.find((p: Price) => p.recurring?.interval === "month") ||
            product.prices[0];

          const planIndex = updatedPlans.findIndex((p) => p.tier === tier);
          if (planIndex !== -1 && monthlyPrice) {
            updatedPlans[planIndex] = {
              ...updatedPlans[planIndex],
              price: `$${(monthlyPrice.unitAmount / 100).toFixed(0)}`,
              priceId: monthlyPrice.id,
            };
          }
        }
      }

      setPlans(updatedPlans);
    }
  }, [pricesData]);

  const checkoutMutation = useMutation({
    mutationFn: async ({ priceId, tier }: { priceId: string; tier: string }) => {
      return { priceId, tier };
    },
    onSuccess: (data) => {
      window.location.href = `/dashboard/checkout?tier=${data.tier}&priceId=${encodeURIComponent(data.priceId)}`;
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const currentPlan = isPro ? "pro" : subscriptionData?.plan || "free";
  const currentPlanData = plans.find((p) => p.tier === currentPlan);
  const stripeCheckoutReady = Boolean(paymentOptions?.stripe.checkoutReady && plans[1]?.priceId);
  const showInterimPayments =
    !isPro &&
    (interimPayments?.active || paymentOptions?.lemonSqueezy.active) &&
    !stripeCheckoutReady;

  const lemonCheckoutMutation = useMutation({
    mutationFn: async (tier: "pro" | "enterprise") => {
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

  const handleInterimPay = (tier: "pro" | "enterprise") => {
    const url =
      tier === "enterprise"
        ? interimPayments?.stripePaymentLinkEnterprise
        : interimPayments?.stripePaymentLinkPro;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleAlternativePay = (plan: (typeof plans)[0]) => {
    if (plan.tier === "pro" || plan.tier === "enterprise") {
      if (paymentOptions?.lemonSqueezy[plan.tier === "enterprise" ? "enterprise" : "pro"]) {
        setLoadingPlan(plan.name);
        lemonCheckoutMutation.mutate(plan.tier);
        return;
      }
      if (plan.tier === "pro" && interimPayments?.paypalUrl) {
        window.open(interimPayments.paypalUrl, "_blank", "noopener,noreferrer");
        return;
      }
      handleInterimPay(plan.tier);
    }
  };

  const canPayWithoutStripe = (plan: (typeof plans)[0]) => {
    if (plan.tier === "free" || plan.tier === "enterprise") return false;
    if (paymentOptions?.lemonSqueezy.pro) return true;
    if (interimPayments?.stripePaymentLinkPro) return true;
    if (interimPayments?.paypalUrl) return true;
    return false;
  };

  const handleUpgrade = (plan: (typeof plans)[0]) => {
    if (plan.priceId && stripeCheckoutReady) {
      setLoadingPlan(plan.name);
      trackUpgrade(plan.tier);
      checkoutMutation.mutate({ priceId: plan.priceId, tier: plan.tier });
      return;
    }
    if (canPayWithoutStripe(plan)) {
      handleAlternativePay(plan);
      return;
    }
    if (plan.tier === "enterprise") {
      trackUpgrade("enterprise");
      window.location.href = "mailto:hello@zzaizzai.com?subject=Enterprise%20Plan%20Inquiry";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and billing</p>
      </div>

      {!isMembershipAccess && !isPro && (
        <AdminCodeForm
          title="Have an access code?"
          description="Enter your Pro access code to unlock digital and hardware without a membership."
        />
      )}

      {showInterimPayments && interimPayments && (
        <InterimPaymentCard
          config={interimPayments}
          stripeCheckoutReady={stripeCheckoutReady}
          showAlways
          lemonSqueezyActive={paymentOptions?.lemonSqueezy.active}
          onLemonSqueezyCheckout={() => {
            setLoadingPlan("Pro");
            lemonCheckoutMutation.mutate("pro");
          }}
        />
      )}

      {!stripeCheckoutReady && paymentOptions?.stripe.configured && !isPro && (
        <Card className="border border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-4 text-sm text-muted-foreground">
            Stripe is configured but still verifying — use Lemon Squeezy or PayPal below until card
            checkout is ready.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            You're currently on the {currentPlanData?.name || "Free"} plan
            {isMembershipAccess ? " (access code)" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{currentPlanData?.name || "Free"}</Badge>
                {subscriptionData?.subscription?.status && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground capitalize">
                      {subscriptionData.subscription.status}
                    </span>
                  </>
                )}
              </div>
            </div>
            {currentPlan === "free" && (
              <Button
                className="bg-[#7B8DAC] hover:bg-[#6B7D9C] gap-2"
                data-testid="button-upgrade"
                onClick={() => handleUpgrade(plans[1])}
                disabled={
                  checkoutMutation.isPending ||
                  lemonCheckoutMutation.isPending ||
                  (!plans[1].priceId && !canPayWithoutStripe(plans[1]))
                }
              >
                {checkoutMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Upgrade
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-6">Available Plans</h2>
        <div className="grid gap-8 md:grid-cols-3 max-w-4xl">
          {plans.map((plan) => {
            const isCurrent = plan.tier === currentPlan;
            return (
              <Card
                key={plan.name}
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
                    <span className="text-3xl font-bold">{plan.price}</span>
                    {plan.period && plan.period !== "forever" && (
                      <span className="text-sm text-muted-foreground">/ {plan.period}</span>
                    )}
                    {plan.tier === "free" && (
                      <span className="text-sm text-muted-foreground">forever</span>
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
                    disabled={
                      isCurrent ||
                      loadingPlan === plan.name ||
                      (plan.tier !== "enterprise" &&
                        plan.tier !== "free" &&
                        !plan.priceId &&
                        !canPayWithoutStripe(plan))
                    }
                    onClick={() => {
                      if (!plan.priceId && canPayWithoutStripe(plan)) {
                        handleAlternativePay(plan);
                        return;
                      }
                      if (
                        plan.tier === "pro" &&
                        !plan.priceId &&
                        interimPayments?.stripePaymentLinkPro
                      ) {
                        handleInterimPay("pro");
                        return;
                      }
                      if (
                        plan.tier === "enterprise" &&
                        !plan.priceId &&
                        interimPayments?.stripePaymentLinkEnterprise
                      ) {
                        handleInterimPay("enterprise");
                        return;
                      }
                      handleUpgrade(plan);
                    }}
                    data-testid={`button-plan-${plan.name.toLowerCase()}`}
                  >
                    {loadingPlan === plan.name ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : isCurrent ? (
                      "Current Plan"
                    ) : plan.tier === "enterprise" ? (
                      "Contact Sales"
                    ) : plan.tier === "free" ? (
                      "Downgrade"
                    ) : !plan.priceId ? (
                      paymentOptions?.lemonSqueezy.pro && plan.tier === "pro" ? (
                        "Subscribe — Lemon Squeezy"
                      ) : interimPayments?.paypalUrl && plan.tier === "pro" ? (
                        "Pay with PayPal"
                      ) : interimPayments?.stripePaymentLinkPro && plan.tier === "pro" ? (
                        "Pay with link"
                      ) : interimPayments?.stripePaymentLinkEnterprise &&
                        plan.tier === "enterprise" ? (
                        "Pay with link"
                      ) : (
                        "Coming Soon"
                      )
                    ) : (
                      "Upgrade"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Manage your payment information</CardDescription>
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
              disabled={portalMutation.isPending}
            >
              {portalMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Loading...
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
