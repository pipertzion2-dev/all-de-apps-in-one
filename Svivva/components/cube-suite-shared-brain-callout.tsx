"use client";

import Link from "next/link";
import { GitMerge, Layers, Radio } from "lucide-react";
import { CUBE_SUITE } from "@/lib/cube/mini-app-suite";

type CubeSuiteSharedBrainCalloutProps = {
  className?: string;
  /** Tighter layout for billing / checkout sidebars */
  compact?: boolean;
};

/**
 * Explains why Suite Pass beats stacking separate SaaS — one OaaS brain, dual-origin ideas.
 */
export function CubeSuiteSharedBrainCallout({
  className = "",
  compact = false,
}: CubeSuiteSharedBrainCalloutProps) {
  const points = [
    {
      icon: Layers,
      title: CUBE_SUITE.vsManySaasTitle,
      body: CUBE_SUITE.vsManySaasBody,
    },
    {
      icon: Radio,
      title: CUBE_SUITE.sharedBrainTitle,
      body: CUBE_SUITE.sharedBrainBody,
    },
    {
      icon: GitMerge,
      title: CUBE_SUITE.dualCreationTitle,
      body: CUBE_SUITE.dualCreationBody,
    },
  ];

  return (
    <div
      className={`rounded-2xl border border-[#5B8DA8]/30 bg-card/90 p-5 text-left backdrop-blur-sm sm:p-6 ${className}`}
      data-testid="cube-suite-shared-brain-callout"
    >
      <p className="text-[10px] font-mono uppercase tracking-widest text-[#5B8DA8]">
        Why one Suite Pass
      </p>
      <p className={`mt-2 font-semibold text-foreground ${compact ? "text-sm" : "text-base"}`}>
        {CUBE_SUITE.unifiedValueHeadline}
      </p>

      <ul className={`mt-4 space-y-4 ${compact ? "text-xs" : "text-sm"}`}>
        {points.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex gap-3">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#5B8DA8]" aria-hidden />
            <div>
              <p className="font-medium text-foreground">{title}</p>
              <p className="mt-0.5 leading-relaxed text-muted-foreground">{body}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className={`mt-4 text-muted-foreground ${compact ? "text-xs" : "text-sm"}`}>
        <Link href="#oaas" className="font-medium text-[#5B8DA8] underline-offset-2 hover:underline">
          Open the mixing console
        </Link>{" "}
        — the shared brain that routes every mini app to Master out.
      </p>
    </div>
  );
}
