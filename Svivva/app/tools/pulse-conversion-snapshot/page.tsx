"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MiniAppShell } from "@/components/tools/mini-app-shell";
import { getFeatureMiniApp } from "@/lib/tools/feature-mini-apps";
import { pulseConversionRate } from "@/lib/tools/mini-slices/feature-tool-helpers";

const APP = getFeatureMiniApp("pulse-conversion-snapshot")!;

export default function PulseConversionSnapshotPage() {
  const [visits, setVisits] = useState("1000");
  const [conversions, setConversions] = useState("42");
  const rate = useMemo(
    () => pulseConversionRate(Number(visits), Number(conversions)),
    [visits, conversions],
  );

  return (
    <MiniAppShell app={APP} nextLabel="Pulse">
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Visits</span>
          <Input value={visits} onChange={(e) => setVisits(e.target.value)} inputMode="numeric" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Conversions</span>
          <Input
            value={conversions}
            onChange={(e) => setConversions(e.target.value)}
            inputMode="numeric"
          />
        </label>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-2">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Conversion rate</p>
        <p className="text-4xl font-black tabular-nums" data-testid="text-pulse-rate">
          {rate === null ? "—" : `${rate}%`}
        </p>
        <Link href="/dashboard/pulse">
          <Button className="mt-2 gap-2 bg-[#5B8DA8]">
            <Activity className="w-4 h-4" />
            Open Pulse
          </Button>
        </Link>
      </div>
    </MiniAppShell>
  );
}
