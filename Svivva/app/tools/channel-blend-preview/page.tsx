"use client";

import { useState } from "react";
import { Combine, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MiniAppShell } from "@/components/tools/mini-app-shell";
import { BLEND_PREVIEW_CHANNELS, getFeatureMiniApp } from "@/lib/tools/feature-mini-apps";

const APP = getFeatureMiniApp("channel-blend-preview")!;

export default function ChannelBlendPreviewPage() {
  const [aId, setAId] = useState("seeds");
  const [bId, setBId] = useState("play");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    name: string;
    sketch: string;
    properties: string[];
  } | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/channel-blend-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aId, bId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Blend failed");
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Blend failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MiniAppShell app={APP} nextLabel="Hybrid² Lab">
      <div className="grid sm:grid-cols-2 gap-3">
        <select
          value={aId}
          onChange={(e) => setAId(e.target.value)}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          data-testid="select-blend-a"
        >
          {BLEND_PREVIEW_CHANNELS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          value={bId}
          onChange={(e) => setBId(e.target.value)}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          data-testid="select-blend-b"
        >
          {BLEND_PREVIEW_CHANNELS.map((f) => (
            <option key={`b-${f.id}`} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </div>
      <Button
        className="bg-[#6B2C4E] gap-2"
        onClick={() => void run()}
        disabled={loading || aId === bId}
        data-testid="button-blend-preview"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Combine className="w-4 h-4" />}
        Preview H¹ blend
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {result && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
          <p className="font-semibold">{result.name}</p>
          <p className="text-sm text-muted-foreground">{result.sketch}</p>
          <ul className="text-sm list-disc pl-4 space-y-1">
            {result.properties.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}
    </MiniAppShell>
  );
}
