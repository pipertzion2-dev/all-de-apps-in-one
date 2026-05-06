"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, CreditCard, Sparkles, Loader2 } from "lucide-react";
import { trackUpgrade } from "@/lib/analytics";

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
    description: "Perfect for trying out Svivva",
    features: [
      "1 project",
      "100 API calls/month",
      "Basic eval suite",
      "Community support",
    ],
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

export default function BillingPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [plans, setPlans] = useState(defaultPlans);

  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  useEffect(() => {
    if (success) {
      toast({
        title: "Subscription successful!",
        description: "Welcome to Svivva Pro. Your new features are now available.",
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

  useEffect(() => {
    if (pricesData?.products) {
      const updatedPlans = [...defaultPlans];
      
      for (const product of pricesData.products as Product[]) {
        const tier = product.metadata?.tier;
        if (tier && product.prices.length > 0) {
          const monthlyPrice = product.prices.find(
            (p: Price) => p.recurring?.interval === "month"
          ) || product.prices[0];
          
          const planIndex = updatedPlans.findIndex(p => p.tier === tier);
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

  const currentPlan = subscriptionData?.plan || "free";

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

  const handleUpgrade = (plan: typeof plans[0]) => {
    if (plan.priceId) {
      setLoadingPlan(plan.name);
      trackUpgrade(plan.tier);
      checkoutMutation.mutate({ priceId: plan.priceId, tier: plan.tier });
    } else if (plan.tier === "enterprise") {
      trackUpgrade("enterprise");
      window.location.href = "mailto:hello@svivva.com?subject=Enterprise%20Plan%20Inquiry";
    }
  };

  const currentPlanData = plans.find(p => p.tier === currentPlan);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and billing</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            You're currently on the {currentPlanData?.name || "Free"} plan
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
                className="bg-[#7BA3AC] hover:bg-[#6B939C] gap-2" 
                data-testid="button-upgrade"
                onClick={() => handleUpgrade(plans[1])}
                disabled={checkoutMutation.isPending || !plans[1].priceId}
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
                className={`relative ${plan.popular ? "border-[#5BA8A0] border-2 shadow-lg shadow-[#5BA8A0]/10 mt-3" : ""}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#5BA8A0] text-white z-10">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    {plan.name}
                    {isCurrent && (
                      <Badge variant="outline">Current</Badge>
                    )}
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
                        <Check className="w-4 h-4 text-[#5BA8A0] mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className={`w-full ${plan.popular && !isCurrent ? "bg-[#5BA8A0] hover:bg-[#4A9790]" : ""}`}
                    variant={isCurrent ? "outline" : plan.popular ? "default" : "outline"}
                    disabled={isCurrent || loadingPlan === plan.name || (plan.tier !== "enterprise" && plan.tier !== "free" && !plan.priceId)}
                    onClick={() => handleUpgrade(plan)}
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
                      "Coming Soon"
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
