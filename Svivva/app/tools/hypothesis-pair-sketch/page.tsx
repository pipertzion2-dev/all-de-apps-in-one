"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MiniAppShell } from "@/components/tools/mini-app-shell";
import { getFeatureMiniApp } from "@/lib/tools/feature-mini-apps";
import { sketchHypothesisPair } from "@/lib/tools/mini-slices/feature-tool-helpers";

const APP = getFeatureMiniApp("hypothesis-pair-sketch")!;

export default function HypothesisPairSketchPage() {
  const [a, setA] = useState("battery pack");
  const [b, setB] = useState("sneaker sole sensor");
  const line = useMemo(() => sketchHypothesisPair(a, b), [a, b]);

  return (
    <MiniAppShell app={APP} nextLabel="Hypothesis Lab">
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Component A</span>
          <Input value={a} onChange={(e) => setA(e.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Component B</span>
          <Input value={b} onChange={(e) => setB(e.target.value)} />
        </label>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <p className="text-sm" data-testid="text-hypothesis-line">
          {line}
        </p>
        <Link href="/dashboard/hypothesis-hardware">
          <Button className="gap-2 bg-[#5B8DA8]">
            <FlaskConical className="w-4 h-4" />
            Open Hypothesis Lab
          </Button>
        </Link>
      </div>
    </MiniAppShell>
  );
}
