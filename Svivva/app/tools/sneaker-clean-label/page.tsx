"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MiniAppShell } from "@/components/tools/mini-app-shell";
import { getFeatureMiniApp } from "@/lib/tools/feature-mini-apps";
import { cleanLabelFrom, streakLabelFrom } from "@/lib/clean-sneaks/assets";

const APP = getFeatureMiniApp("sneaker-clean-label")!;

export default function SneakerCleanLabelPage() {
  const [cleanliness, setCleanliness] = useState("72");
  const [streak, setStreak] = useState("4");

  const labels = useMemo(() => {
    const c = Number(cleanliness);
    const s = Number(streak);
    if (!Number.isFinite(c) || !Number.isFinite(s)) return null;
    return {
      clean: cleanLabelFrom(c),
      streak: streakLabelFrom(s),
    };
  }, [cleanliness, streak]);

  return (
    <MiniAppShell app={APP} nextLabel="Klean Sneaks HUD">
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Cleanliness (%)</span>
          <Input
            value={cleanliness}
            onChange={(e) => setCleanliness(e.target.value)}
            inputMode="decimal"
            data-testid="input-clean-pct"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Streak</span>
          <Input
            value={streak}
            onChange={(e) => setStreak(e.target.value)}
            inputMode="numeric"
            data-testid="input-streak"
          />
        </label>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 space-y-2">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">HUD would show</p>
        <p className="text-2xl font-bold" data-testid="text-clean-label">
          {labels?.clean ?? "—"}
        </p>
        <p className="text-sm text-muted-foreground">{labels?.streak ?? "—"}</p>
      </div>
      <Link href="/clean-sneaks">
        <Button className="gap-2 bg-[#5B8DA8]">
          <Sparkles className="w-4 h-4" />
          See labels in the 3D run
        </Button>
      </Link>
    </MiniAppShell>
  );
}
