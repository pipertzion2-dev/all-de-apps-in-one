"use client";

import { useState } from "react";
import Link from "next/link";
import { Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MiniAppShell } from "@/components/tools/mini-app-shell";
import {
  FACE_CHOOSER_JOBS,
  chooseCubeFace,
  getFeatureMiniApp,
} from "@/lib/tools/feature-mini-apps";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";

const APP = getFeatureMiniApp("zzai-face-chooser")!;

export default function ZzaiFaceChooserPage() {
  const [jobId, setJobId] = useState<FeatureId>("seeds");
  const face = chooseCubeFace(jobId);

  return (
    <MiniAppShell app={APP} nextLabel="Homepage cube">
      <div className="grid sm:grid-cols-2 gap-2">
        {FACE_CHOOSER_JOBS.map((job) => (
          <button
            key={job.id}
            type="button"
            onClick={() => setJobId(job.id)}
            className={`text-left rounded-xl border px-3 py-3 text-sm transition-colors ${
              jobId === job.id
                ? "border-[#5B8DA8] bg-[#5B8DA8]/10"
                : "border-border hover:border-[#5B8DA8]/40"
            }`}
            data-testid={`button-face-job-${job.id}`}
          >
            {job.job}
          </button>
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Recommended face</p>
        <p className="text-xl font-semibold" style={{ fontFamily: '"Zc", sans-serif' }}>
          {face.shortLabel}
        </p>
        <p className="text-sm text-muted-foreground">{face.tagline}</p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Link href={face.href}>
            <Button className="bg-[#5B8DA8] gap-2">
              <Box className="w-4 h-4" />
              Open {face.name}
            </Button>
          </Link>
          <Link href="/#nav-cube">
            <Button variant="outline">See the cube</Button>
          </Link>
        </div>
      </div>
    </MiniAppShell>
  );
}
