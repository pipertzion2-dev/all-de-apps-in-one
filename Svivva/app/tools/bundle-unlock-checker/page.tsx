"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MiniAppShell } from "@/components/tools/mini-app-shell";
import { getFeatureMiniApp } from "@/lib/tools/feature-mini-apps";
import {
  BUNDLE_CARD_MIN_SCORE,
  evaluateBundleUnlock,
} from "@/lib/clean-sneaks/bundle-unlock";
import { FINISH_DISTANCE } from "@/lib/clean-sneaks/run-engine";

const APP = getFeatureMiniApp("bundle-unlock-checker")!;

export default function BundleUnlockCheckerPage() {
  const [score, setScore] = useState("950");
  const [distance, setDistance] = useState("120");
  const [previousBest, setPreviousBest] = useState("800");

  const result = useMemo(() => {
    const s = Number(score);
    const d = Number(distance);
    const b = Number(previousBest);
    if (!Number.isFinite(s) || !Number.isFinite(d) || !Number.isFinite(b)) return null;
    return evaluateBundleUnlock({ score: s, distance: d, previousBest: b });
  }, [score, distance, previousBest]);

  return (
    <MiniAppShell app={APP} nextLabel="Steal the Bundle">
      <div className="grid sm:grid-cols-3 gap-3">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Run score</span>
          <Input value={score} onChange={(e) => setScore(e.target.value)} inputMode="numeric" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Distance (m)</span>
          <Input value={distance} onChange={(e) => setDistance(e.target.value)} inputMode="decimal" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Previous best</span>
          <Input
            value={previousBest}
            onChange={(e) => setPreviousBest(e.target.value)}
            inputMode="numeric"
          />
        </label>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <p className="text-sm text-muted-foreground">
          Needs {FINISH_DISTANCE}m, score {BUNDLE_CARD_MIN_SCORE}+, and a new personal best on that
          run.
        </p>
        {result && (
          <>
            <p
              className={`text-lg font-semibold ${result.unlocked ? "text-[#7EC8D9]" : "text-amber-400"}`}
              data-testid="text-bundle-result"
            >
              {result.unlocked ? "Would unlock Steal the Bundle" : "Would not unlock yet"}
            </p>
            {result.reason ? (
              <p className="text-sm text-muted-foreground">{result.reason}</p>
            ) : null}
          </>
        )}
        <Link href="/clean-sneaks">
          <Button variant="outline" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Chase the bundle in-game
          </Button>
        </Link>
      </div>
    </MiniAppShell>
  );
}
