"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MiniAppShell } from "@/components/tools/mini-app-shell";
import { getFeatureMiniApp } from "@/lib/tools/feature-mini-apps";
import { testLaunchHeadline } from "@/lib/tools/mini-slices/feature-tool-helpers";

const APP = getFeatureMiniApp("launch-headline-tester")!;

export default function LaunchHeadlineTesterPage() {
  const [headline, setHeadline] = useState("Ship AI APIs from a prompt — no backend build");
  const result = useMemo(() => testLaunchHeadline(headline), [headline]);

  return (
    <MiniAppShell app={APP} nextLabel="Launch Studio">
      <label className="space-y-2 block text-sm">
        <span className="text-muted-foreground">Landing headline</span>
        <Input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          data-testid="input-launch-headline"
        />
      </label>
      <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
        <p className="text-sm" data-testid="text-headline-score">
          Score {result.score}/100 · {result.chars} chars · {result.words} words
        </p>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
          {result.tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <Link href="/dashboard/launch-studio">
          <Button className="mt-2 gap-2 bg-[#5B8DA8]">
            <Megaphone className="w-4 h-4" />
            Open Launch Studio
          </Button>
        </Link>
      </div>
    </MiniAppShell>
  );
}
