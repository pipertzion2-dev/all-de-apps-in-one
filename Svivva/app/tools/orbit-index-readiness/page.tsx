"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MiniAppShell } from "@/components/tools/mini-app-shell";
import { getFeatureMiniApp } from "@/lib/tools/feature-mini-apps";
import { scoreOrbitIndexUrls } from "@/lib/tools/mini-slices/feature-tool-helpers";

const APP = getFeatureMiniApp("orbit-index-readiness")!;

export default function OrbitIndexReadinessPage() {
  const [raw, setRaw] = useState("https://zzaizzai.com/tools\nhttps://zzaizzai.com/orbit");
  const result = useMemo(() => scoreOrbitIndexUrls(raw), [raw]);

  return (
    <MiniAppShell app={APP} nextLabel="Marketing Orbit">
      <label className="space-y-2 block text-sm">
        <span className="text-muted-foreground">Canonical URLs (one per line)</span>
        <Textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={5}
          data-testid="input-orbit-urls"
        />
      </label>
      <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
        <p className="text-sm" data-testid="text-orbit-summary">
          {result.urls.length} URL(s) · {result.httpsOk} https · {result.uniqueHosts.length} host(s)
        </p>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
          {result.tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <Link href="/orbit">
          <Button className="mt-2 gap-2 bg-[#5B8DA8]">
            <Rocket className="w-4 h-4" />
            Open Marketing Orbit
          </Button>
        </Link>
      </div>
    </MiniAppShell>
  );
}
