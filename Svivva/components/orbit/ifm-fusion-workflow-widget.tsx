"use client";

import Link from "next/link";
import type { IfmFusionProductSpec } from "@/lib/orbit/roadmap/roadmap-types";

export function IfmFusionWorkflowWidget({ spec }: { spec: IfmFusionProductSpec }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{spec.fusionTitle}</h2>
        <p className="text-sm text-muted-foreground mt-1">{spec.description}</p>
      </div>

      <ol className="list-decimal list-inside text-sm space-y-1 text-muted-foreground">
        {spec.workflowSteps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <label className="block space-y-2">
        <span className="text-sm font-medium">Hand-off buffer</span>
        <textarea
          rows={4}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono"
          placeholder={`Paste ${spec.toolAName} output here…`}
          aria-label="Fusion hand-off buffer"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <ButtonLink href={spec.toolAPath} primary>
          {spec.toolAName} →
        </ButtonLink>
        <ButtonLink href={spec.toolBPath}>{spec.toolBName} →</ButtonLink>
      </div>
    </div>
  );
}

function ButtonLink({
  href,
  children,
  primary,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex h-9 items-center rounded-lg px-4 text-sm font-semibold ${
        primary
          ? "text-white"
          : "border border-border text-foreground hover:border-[#5B8DA8]/40"
      }`}
      style={primary ? { background: "linear-gradient(135deg, #5B8DA8, #6B2C4E)" } : undefined}
    >
      {children}
    </Link>
  );
}
