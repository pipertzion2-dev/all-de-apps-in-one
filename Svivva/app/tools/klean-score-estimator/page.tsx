"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MiniAppShell } from "@/components/tools/mini-app-shell";
import { getFeatureMiniApp } from "@/lib/tools/feature-mini-apps";
import { FINISH_DISTANCE } from "@/lib/clean-sneaks/run-engine";
import { estimateKleanRunScore } from "@/lib/tools/mini-slices/klean-run-estimate";

const APP = getFeatureMiniApp("klean-score-estimator")!;

export default function KleanScoreEstimatorPage() {
  const [distance, setDistance] = useState("120");
  const [cleanliness, setCleanliness] = useState("85");
  const [streak, setStreak] = useState("5");

  const estimate = useMemo(() => {
    const d = Number(distance);
    const c = Number(cleanliness);
    const s = Number(streak);
    if (!Number.isFinite(d) || !Number.isFinite(c) || !Number.isFinite(s)) return null;
    return estimateKleanRunScore({ distanceM: d, cleanliness: c, streak: s });
  }, [distance, cleanliness, streak]);

  return (
    <MiniAppShell app={APP} nextLabel="Klean Sneaks game">
      <div className="grid sm:grid-cols-3 gap-3">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Distance (m)</span>
          <Input
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            inputMode="decimal"
            data-testid="input-klean-distance"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Cleanliness (%)</span>
          <Input
            value={cleanliness}
            onChange={(e) => setCleanliness(e.target.value)}
            inputMode="decimal"
            data-testid="input-klean-clean"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Streak</span>
          <Input
            value={streak}
            onChange={(e) => setStreak(e.target.value)}
            inputMode="numeric"
            data-testid="input-klean-streak"
          />
        </label>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-2">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Estimated score</p>
        <p className="text-4xl font-black tabular-nums" data-testid="text-klean-estimate">
          {estimate === null ? "—" : estimate.toLocaleString()}
        </p>
        <p className="text-sm text-muted-foreground">
          Past {FINISH_DISTANCE}m adds bonus-zone multiplier in the real game.
        </p>
        <Link href="/clean-sneaks">
          <Button className="mt-2 gap-2 bg-[#5B8DA8]">
            <Gamepad2 className="w-4 h-4" />
            Play Klean Sneaks
          </Button>
        </Link>
      </div>
    </MiniAppShell>
  );
}
