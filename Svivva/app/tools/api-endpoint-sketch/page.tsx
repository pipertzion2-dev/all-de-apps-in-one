"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MiniAppShell } from "@/components/tools/mini-app-shell";
import { getFeatureMiniApp } from "@/lib/tools/feature-mini-apps";
import { sketchApiEndpoint } from "@/lib/tools/mini-slices/feature-tool-helpers";

const APP = getFeatureMiniApp("api-endpoint-sketch")!;

export default function ApiEndpointSketchPage() {
  const [job, setJob] = useState("create signed upload URL for media");
  const sketch = useMemo(() => sketchApiEndpoint(job), [job]);

  return (
    <MiniAppShell app={APP} nextLabel="API Builder">
      <label className="space-y-2 block text-sm">
        <span className="text-muted-foreground">What should the endpoint do?</span>
        <Input
          value={job}
          onChange={(e) => setJob(e.target.value)}
          data-testid="input-api-job"
        />
      </label>
      <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
        <p className="font-mono text-sm text-[#5B8DA8]" data-testid="text-api-sketch">
          {sketch.method} {sketch.path}
        </p>
        <p className="text-sm text-muted-foreground">{sketch.note}</p>
        <Link href="/dashboard/api-builder">
          <Button className="mt-2 gap-2 bg-[#5B8DA8]">
            <Code2 className="w-4 h-4" />
            Open API Builder
          </Button>
        </Link>
      </div>
    </MiniAppShell>
  );
}
