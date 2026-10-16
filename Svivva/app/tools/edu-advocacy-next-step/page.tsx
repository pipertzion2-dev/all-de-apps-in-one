"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MiniAppShell } from "@/components/tools/mini-app-shell";
import { getFeatureMiniApp } from "@/lib/tools/feature-mini-apps";
import { EDU_ADVOCACY_SITUATIONS } from "@/lib/tools/mini-slices/feature-tool-helpers";

const APP = getFeatureMiniApp("edu-advocacy-next-step")!;

export default function EduAdvocacyNextStepPage() {
  const [id, setId] = useState(EDU_ADVOCACY_SITUATIONS[0]!.id);
  const pick = useMemo(
    () => EDU_ADVOCACY_SITUATIONS.find((s) => s.id === id) ?? EDU_ADVOCACY_SITUATIONS[0]!,
    [id],
  );

  return (
    <MiniAppShell app={APP} nextLabel="Education Advocacy">
      <fieldset className="space-y-3">
        <legend className="text-sm text-muted-foreground">What is going on?</legend>
        {EDU_ADVOCACY_SITUATIONS.map((s) => (
          <label key={s.id} className="flex items-start gap-3 text-sm cursor-pointer">
            <input
              type="radio"
              name="edu-situation"
              checked={id === s.id}
              onChange={() => setId(s.id)}
              className="mt-1"
            />
            <span>{s.label}</span>
          </label>
        ))}
      </fieldset>
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <p className="text-sm" data-testid="text-edu-next">
          {pick.nextStep}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href={pick.href}>
            <Button variant="outline">Go to suggested step</Button>
          </Link>
          <Link href="/dashboard/education-advocacy">
            <Button className="gap-2 bg-[#5B8DA8]">
              <GraduationCap className="w-4 h-4" />
              Open Advocacy Console
            </Button>
          </Link>
        </div>
      </div>
    </MiniAppShell>
  );
}
