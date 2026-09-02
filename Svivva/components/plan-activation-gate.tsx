"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { AdminCodeForm } from "@/components/admin-code-form";
import { Button } from "@/components/ui/button";

const FeatureThreeBg = dynamic(
  () =>
    import("@/components/feature-three-background").then((m) => ({
      default: m.FeatureThreeBackground,
    })),
  { ssr: false },
);

type PlansResponse = {
  plans: {
    tier: string;
    priceLabel: string;
    paymentLink: string | null;
    checkoutAvailable: boolean;
  }[];
  membershipUnlock?: { instructions: string; code: string };
  paymentOptions?: { cashAppTag?: string };
};

/** Cash App subscription — not Orbit admin, not urrthang. */
export function PlanActivationGate() {
  const { data: plansData } = useQuery<PlansResponse>({
    queryKey: ["/api/billing/plans"],
    queryFn: () => fetch("/api/billing/plans").then((r) => r.json()),
  });

  const cashAppTag = plansData?.paymentOptions?.cashAppTag ?? "pipertzion";
  const starter = plansData?.plans.find((p) => p.tier === "starter");
  const pro = plansData?.plans.find((p) => p.tier === "pro");

  return (
    <div className="relative bg-transparent overflow-x-hidden" data-feature-page>
      <FeatureThreeBg variant="orbit" scope="page" />
      <div className="relative z-10 max-w-md mx-auto py-12 px-4 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black">Subscribe with Cash App</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Pay ${cashAppTag} for Starter ($20/mo) or Pro ($50/mo), then enter your access code to
            activate your plan. Orbit and urrthang are owner tools — not part of customer billing.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {starter?.paymentLink ? (
            <a
              href={starter.paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold border border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
              data-testid="plan-gate-cashapp-starter"
            >
              Starter {starter.priceLabel}/mo
              <ExternalLink className="w-4 h-4" />
            </a>
          ) : null}
          {pro?.paymentLink ? (
            <a
              href={pro.paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold border border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
              data-testid="plan-gate-cashapp-pro"
            >
              Pro {pro.priceLabel}/mo
              <ExternalLink className="w-4 h-4" />
            </a>
          ) : null}
        </div>

        <AdminCodeForm
          scope="membership"
          title="Plan access code"
          description={
            plansData?.membershipUnlock?.instructions ??
            "After Cash App payment, enter your code to activate your plan."
          }
          codeHint={plansData?.membershipUnlock?.code ?? null}
          successMessage="Plan activated — open Billing to see your subscription."
          onSuccess={() => window.location.assign("/dashboard/billing")}
        />

        <Link href="/dashboard/billing" className="block">
          <Button variant="outline" className="w-full">
            Open Billing &amp; Plans
          </Button>
        </Link>
      </div>
    </div>
  );
}
