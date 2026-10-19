"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MiniAppShell } from "@/components/tools/mini-app-shell";
import { getFeatureMiniApp } from "@/lib/tools/feature-mini-apps";
import { extractKeywordScan } from "@/lib/tools/mini-slices/feature-tool-helpers";

const APP = getFeatureMiniApp("channel-intel-keyword-scan")!;

export default function ChannelIntelKeywordScanPage() {
  const [text, setText] = useState(
    "Today we talk about seeds, seeds, and how hybrid labs fuse play with protect. Orbit indexes using search console.",
  );
  const keywords = useMemo(() => extractKeywordScan(text), [text]);

  return (
    <MiniAppShell app={APP} nextLabel="Channel Intel">
      <label className="space-y-2 block text-sm">
        <span className="text-muted-foreground">Transcript snippet</span>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          data-testid="input-intel-transcript"
        />
      </label>
      <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
        <ul className="text-sm space-y-1" data-testid="list-intel-keywords">
          {keywords.map((k) => (
            <li key={k.word} className="flex justify-between gap-4">
              <span>{k.word}</span>
              <span className="text-muted-foreground tabular-nums">{k.count}</span>
            </li>
          ))}
        </ul>
        <Link href="/dashboard/marketing/channel-intel">
          <Button className="mt-2 gap-2 bg-[#5B8DA8]">
            <Radar className="w-4 h-4" />
            Open Channel Intel
          </Button>
        </Link>
      </div>
    </MiniAppShell>
  );
}
