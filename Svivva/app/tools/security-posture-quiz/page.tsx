"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MiniAppShell } from "@/components/tools/mini-app-shell";
import { getFeatureMiniApp } from "@/lib/tools/feature-mini-apps";
import {
  SECURITY_POSTURE_QUESTIONS,
  scoreSecurityPosture,
} from "@/lib/tools/mini-slices/feature-tool-helpers";

const APP = getFeatureMiniApp("security-posture-quiz")!;

export default function SecurityPostureQuizPage() {
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const score = useMemo(() => scoreSecurityPosture(answers), [answers]);

  return (
    <MiniAppShell app={APP} nextLabel="Security / Clutety">
      <ul className="space-y-3">
        {SECURITY_POSTURE_QUESTIONS.map((q) => (
          <li key={q.id}>
            <label className="flex items-center gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={!!answers[q.id]}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [q.id]: e.target.checked }))
                }
              />
              {q.label}
            </label>
          </li>
        ))}
      </ul>
      <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
        <p className="text-2xl font-bold" data-testid="text-posture-score">
          {score.percent}%
        </p>
        <p className="text-sm text-muted-foreground">{score.label}</p>
        <Link href="/dashboard/security">
          <Button className="gap-2 bg-[#5B8DA8]">
            <Shield className="w-4 h-4" />
            Open Security / Clutety
          </Button>
        </Link>
      </div>
    </MiniAppShell>
  );
}
