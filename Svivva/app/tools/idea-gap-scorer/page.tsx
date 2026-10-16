"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MiniAppShell } from "@/components/tools/mini-app-shell";
import { getFeatureMiniApp } from "@/lib/tools/feature-mini-apps";
import { scoreIdeaGap } from "@/lib/tools/mini-slices/feature-tool-helpers";

const APP = getFeatureMiniApp("idea-gap-scorer")!;

export default function IdeaGapScorerPage() {
  const [problem, setProblem] = useState("8");
  const [audience, setAudience] = useState("7");
  const [diff, setDiff] = useState("6");
  const score = useMemo(
    () =>
      scoreIdeaGap({
        problemClarity: Number(problem),
        audienceSize: Number(audience),
        differentiation: Number(diff),
      }),
    [problem, audience, diff],
  );

  return (
    <MiniAppShell app={APP} nextLabel="Idea Engine">
      <p className="text-sm text-muted-foreground">Rate each 0–10.</p>
      <div className="grid sm:grid-cols-3 gap-3">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Problem clarity</span>
          <Input value={problem} onChange={(e) => setProblem(e.target.value)} inputMode="numeric" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Audience size</span>
          <Input value={audience} onChange={(e) => setAudience(e.target.value)} inputMode="numeric" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Differentiation</span>
          <Input value={diff} onChange={(e) => setDiff(e.target.value)} inputMode="numeric" />
        </label>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-2">
        <p className="text-4xl font-black tabular-nums" data-testid="text-idea-score">
          {score.total}
        </p>
        <p className="text-sm text-muted-foreground">{score.label}</p>
        <Link href="/dashboard/idea-engine">
          <Button className="mt-2 gap-2 bg-[#5B8DA8]">
            <Lightbulb className="w-4 h-4" />
            Open Idea Engine
          </Button>
        </Link>
      </div>
    </MiniAppShell>
  );
}
