"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, Loader2, ExternalLink } from "lucide-react";
import { trackUpgrade } from "@/lib/analytics";
import { AdminCodeForm } from "@/components/admin-code-form";
import { usePlan, type Plan } from "@/hooks/use-plan";
import type { ResolvedBillingPlan } from "@/lib/billing/resolve-plan-offers";

type PlansResponse = {
  plans: ResolvedBillingPlan[];
  membershipUnlock?: { instructions: string; code: string };
  paymentOptions: {
    cashAppPlansActive: boolean;
    cashAppTag: string;
    preferredProvider: string | null;
    interim: { active: boolean; note: string | null };
  };
};

function BillingPageContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { isPro, isMembershipAccess, plan: currentPlanTier } = usePlan();

  useEffect(() => {
    if (searchParams.get("success")) {
      toast({
        title: "Welcome!",
        description:
          "Enter your access code if you haven't already — your plan activates instantly.",
      });
    }
  }, [searchParams, toast]);

  const { data: plansData, isLoading: plansLoading } = useQuery<PlansResponse>({
    queryKey: ["/api/billing/plans"],
    queryFn: () => fetch("/api/billing/plans").then((r) => r.json()),
  });

  const plans = plansData?.plans ?? [];
  const cashAppTag = plansData?.paymentOptions.cashAppTag ?? "pipertzion";
  const payNote = plansData?.paymentOptions.interim.note ?? null;

  const currentPlan = (isPro ? currentPlanTier : "free") as Plan;
  const currentPlanData = plans.find((p) => p.tier === currentPlan) ?? plans[0];

  const handleSubscribe = (plan: ResolvedBillingPlan) => {
    if (plan.tier === "free" || !plan.paymentLink) return;
    setLoadingPlan(plan.name);
    trackUpgrade(plan.tier);
    window.open(plan.paymentLink, "_blank", "noopener,noreferrer");
    toast({
      title: "Complete payment in Cash App",
      description: plansData?.membershipUnlock?.code
        ? `Then enter access code ${plansData.membershipUnlock.code} on this page or Launchpad.`
        : "Then enter your access code on this page or Launchpad.",
    });
    setLoadingPlan(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Plans</h1>
        <p className="text-muted-foreground">
          Subscribe with Cash App — ${cashAppTag} · Starter $20/mo · Pro $50/mo
        </p>
      </div>

      {!isMembershipAccess && !isPro && (
        <AdminCodeForm
          scope="membership"
          title="Unlock after Cash App payment"
          description={
            plansData?.membershipUnlock?.instructions ??
            "After you pay on Cash App, enter your access code here to activate your plan and run urrthang."
          }
          codeHint={plansData?.membershipUnlock?.code ?? null}
        />
      )}

      {!isPro && (
        <Card className="border border-[#00D632]/40 bg-[#00D632]/8">
          <CardContent className="pt-4 text-sm text-foreground space-y-2">
            <p>
              <strong>Cash App is how you subscribe.</strong> Pick a plan below — Cash App opens with
              the right amount. No card or Stripe required.
            </p>
            {plansData?.membershipUnlock?.code ? (
              <p className="text-emerald-800 dark:text-emerald-200">
                After payment, use access code{" "}
                <strong className="font-mono tracking-widest">{plansData.membershipUnlock.code}</strong>{" "}
                to run urrthang on Launchpad — not Orbit admin.
              </p>
            ) : null}
          </CardContent>
        </Card>
      )}

      {payNote && (
        <p className="text-sm text-muted-foreground border border-border rounded-lg px-3 py-2">
          {payNote}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            You&apos;re on {currentPlanData?.name ?? "Free"}
            {isMembershipAccess ? " (Cash App + access code)" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary">{currentPlanData?.name ?? "Free"}</Badge>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-6">Choose a Cash App plan</h2>
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
                  className={`relative ${plan.popular ? "border-[#00D632] border-2 shadow-lg shadow-[#00D632]/10 mt-3" : ""}`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00D632] text-black z-10">
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
                          <Check className="w-4 h-4 text-[#00D632] mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full ${plan.popular && !isCurrent ? "bg-[#00D632] hover:bg-[#00bd2d] text-black" : ""}`}
                      variant={isCurrent ? "outline" : plan.popular ? "default" : "outline"}
                      disabled={isCurrent || loadingPlan === plan.name || !canCheckout}
                      onClick={() => handleSubscribe(plan)}
                      data-testid={`button-plan-${plan.tier}`}
                    >
                      {loadingPlan === plan.name ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Opening Cash App…
                        </>
                      ) : isCurrent ? (
                        "Current Plan"
                      ) : plan.tier === "free" ? (
                        "Included"
                      ) : (
                        <>
                          Cash App — {plan.priceLabel}/mo
                          <ExternalLink className="w-3.5 h-3.5 ml-1" />
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
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading plans...</div>}>
      <BillingPageContent />
    </Suspense>
  );
}
