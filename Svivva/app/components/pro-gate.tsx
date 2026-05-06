"use client";

import Link from "next/link";
import { Lock, Zap } from "lucide-react";
import { usePlan } from "@/hooks/use-plan";

interface ProGateProps {
  children: React.ReactNode;
  feature?: string;
}

export function ProGate({ children, feature = "this feature" }: ProGateProps) {
  const { isPro, isLoading } = usePlan();

  if (isLoading) return null;
  if (isPro) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, rgba(91,168,160,0.15), rgba(107,44,74,0.15))", border: "1px solid rgba(91,168,160,0.3)" }}>
        <Lock className="w-7 h-7 text-[#5BA8A0]" />
      </div>

      <div className="space-y-2 max-w-sm">
        <h2 className="text-2xl font-black text-foreground">Pro Feature</h2>
        <p className="text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground capitalize">{feature}</span> is available on the Pro plan and above. Upgrade to unlock the full Svivva platform.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/dashboard/billing">
          <button className="h-11 px-6 rounded-xl font-bold text-sm text-white flex items-center gap-2 transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #5BA8A0, #6B2C4A)" }}
            data-testid="button-upgrade-cta">
            <Zap className="w-4 h-4" />
            Upgrade to Pro
          </button>
        </Link>
        <Link href="/dashboard">
          <button className="h-11 px-6 rounded-xl font-bold text-sm border border-border hover:bg-muted/50 transition-colors"
            data-testid="button-back-dashboard">
            Back to Dashboard
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm max-w-sm w-full mt-2">
        {["Unlimited projects", "10,000 API calls/mo", "Full Eval Suite", "Priority support"].map(f => (
          <div key={f} className="flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(91,168,160,0.2)", border: "1px solid rgba(91,168,160,0.4)" }}>
              <span className="text-[#5BA8A0] text-[8px] font-bold">✓</span>
            </div>
            {f}
          </div>
        ))}
      </div>
    </div>
  );
}
