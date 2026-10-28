"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MiniAppShell } from "@/components/tools/mini-app-shell";
import { getFeatureMiniApp } from "@/lib/tools/feature-mini-apps";
import { estimateBomLine } from "@/lib/tools/mini-slices/feature-tool-helpers";

const APP = getFeatureMiniApp("hardware-bom-line-estimator")!;

export default function HardwareBomLineEstimatorPage() {
  const [part, setPart] = useState("MCU");
  const [qty, setQty] = useState("100");
  const [unit, setUnit] = useState("1.25");
  const total = useMemo(() => estimateBomLine(Number(qty), Number(unit)), [qty, unit]);

  return (
    <MiniAppShell app={APP} nextLabel="Hardware Builder">
      <div className="grid sm:grid-cols-3 gap-3">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Part</span>
          <Input value={part} onChange={(e) => setPart(e.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Qty</span>
          <Input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="decimal" />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Unit cost ($)</span>
          <Input value={unit} onChange={(e) => setUnit(e.target.value)} inputMode="decimal" />
        </label>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-2">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{part || "Line"} total</p>
        <p className="text-4xl font-black tabular-nums" data-testid="text-bom-total">
          ${total.toFixed(2)}
        </p>
        <Link href="/dashboard/hardware-builder">
          <Button className="mt-2 gap-2 bg-[#5B8DA8]">
            <Cpu className="w-4 h-4" />
            Open Hardware Builder
          </Button>
        </Link>
      </div>
    </MiniAppShell>
  );
}
