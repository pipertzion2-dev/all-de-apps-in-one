"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MiniAppShell } from "@/components/tools/mini-app-shell";
import { getFeatureMiniApp } from "@/lib/tools/feature-mini-apps";
import { buildUtmUrl } from "@/lib/tools/mini-slices/feature-tool-helpers";

const APP = getFeatureMiniApp("utm-campaign-builder")!;

export default function UtmCampaignBuilderPage() {
  const [baseUrl, setBaseUrl] = useState("https://zzaizzai.com/orbit");
  const [source, setSource] = useState("newsletter");
  const [medium, setMedium] = useState("email");
  const [campaign, setCampaign] = useState("spring-launch");
  const url = useMemo(
    () => buildUtmUrl({ baseUrl, source, medium, campaign }),
    [baseUrl, source, medium, campaign],
  );

  return (
    <MiniAppShell app={APP} nextLabel="Marketing Console">
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="space-y-1 text-sm sm:col-span-2">
          <span className="text-muted-foreground">Base URL</span>
          <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">utm_source</span>
          <Input value={source} onChange={(e) => setSource(e.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">utm_medium</span>
          <Input value={medium} onChange={(e) => setMedium(e.target.value)} />
        </label>
        <label className="space-y-1 text-sm sm:col-span-2">
          <span className="text-muted-foreground">utm_campaign</span>
          <Input value={campaign} onChange={(e) => setCampaign(e.target.value)} />
        </label>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <p className="font-mono text-sm break-all" data-testid="text-utm-url">
          {url ?? "Enter a valid absolute URL"}
        </p>
        <Link href="/dashboard/marketing">
          <Button className="gap-2 bg-[#5B8DA8]">
            <Link2 className="w-4 h-4" />
            Open Marketing Console
          </Button>
        </Link>
      </div>
    </MiniAppShell>
  );
}
