"use client";

import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { AdminCodeForm } from "@/components/admin-code-form";

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

/** Cash App pay + subscriber code — not Orbit admin. */
export function UrrthangSubscriberGate() {
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
          <h1 className="text-2xl font-black">urrthang</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Subscribe with Cash App (${cashAppTag}), then enter your access code to run marketing
            autopilot. This is <strong>not</strong> Orbit admin — owner tools stay separate.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {starter?.paymentLink ? (
            <a
              href={starter.paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold border border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
              data-testid="urrthang-gate-cashapp-starter"
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
              data-testid="urrthang-gate-cashapp-pro"
            >
              Pro {pro.priceLabel}/mo
              <ExternalLink className="w-4 h-4" />
            </a>
          ) : null}
        </div>

        <AdminCodeForm
          scope="membership"
          title="Subscriber access code"
          description={
            plansData?.membershipUnlock?.instructions ??
            "After Cash App payment, enter your subscriber code to run urrthang only."
          }
          codeHint={plansData?.membershipUnlock?.code ?? null}
          successMessage="Unlocked — you can run urrthang now. Orbit admin stays owner-only."
          onSuccess={() => window.location.reload()}
        />
      </div>
    </div>
  );
}
