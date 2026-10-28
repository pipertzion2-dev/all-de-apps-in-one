"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MiniAppShell } from "@/components/tools/mini-app-shell";
import { getFeatureMiniApp } from "@/lib/tools/feature-mini-apps";

const APP = getFeatureMiniApp("bpm-tap-tempo")!;

function bpmFromTimestamps(times: number[]): number | null {
  if (times.length < 2) return null;
  const gaps: number[] = [];
  for (let i = 1; i < times.length; i++) {
    gaps.push(times[i]! - times[i - 1]!);
  }
  const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  if (avg <= 0) return null;
  return Math.round(60000 / avg);
}

export default function BpmTapTempoPage() {
  const tapsRef = useRef<number[]>([]);
  const [tick, setTick] = useState(0);

  const bpm = useMemo(() => {
    void tick;
    return bpmFromTimestamps(tapsRef.current);
  }, [tick]);

  const onTap = useCallback(() => {
    const now = performance.now();
    const next = [...tapsRef.current, now].slice(-12);
    tapsRef.current = next;
    setTick((n) => n + 1);
  }, []);

  const reset = useCallback(() => {
    tapsRef.current = [];
    setTick((n) => n + 1);
  }, []);

  return (
    <MiniAppShell app={APP} nextLabel="ZZAI Play studio">
      <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Current tempo</p>
        <p className="text-5xl font-black tabular-nums" data-testid="text-bpm">
          {bpm ?? "—"}
        </p>
        <p className="text-sm text-muted-foreground">{bpm ? "BPM" : "Tap at least twice"}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            size="lg"
            className="min-w-[160px] bg-[#5B8DA8]"
            onClick={onTap}
            data-testid="button-bpm-tap"
          >
            Tap
          </Button>
          <Button type="button" variant="outline" onClick={reset}>
            Reset
          </Button>
        </div>
      </div>
      <Link href="/play">
        <Button variant="outline" className="gap-2">
          <Music2 className="w-4 h-4" />
          Open ZZAI Play
        </Button>
      </Link>
    </MiniAppShell>
  );
}
