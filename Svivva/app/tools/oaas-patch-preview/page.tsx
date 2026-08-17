"use client";

import { useState } from "react";
import { Loader2, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MiniAppShell } from "@/components/tools/mini-app-shell";
import { getFeatureMiniApp } from "@/lib/tools/feature-mini-apps";

const APP = getFeatureMiniApp("oaas-patch-preview")!;

export default function OaasPatchPreviewPage() {
  const [goal, setGoal] = useState("Blend Seeds with Protect then launch");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    patch: string;
    summary: string;
    picks: { title: string; href: string; reason: string }[];
  } | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/oaas-patch-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Patch failed");
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Patch failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MiniAppShell app={APP} nextLabel="OaaS mixing board">
      <form
        className="flex flex-col sm:flex-row gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void run();
        }}
      >
        <Input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="What do you want to ship?"
          data-testid="input-oaas-goal"
        />
        <Button
          type="submit"
          className="bg-[#5B8DA8] gap-2"
          disabled={loading || goal.trim().length < 8}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <SlidersHorizontal className="w-4 h-4" />
          )}
          Preview patch
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {result && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <p className="font-mono text-sm text-[#5B8DA8]">{result.patch}</p>
          <p className="text-sm text-muted-foreground">{result.summary}</p>
          <ul className="text-sm space-y-2">
            {result.picks.map((p) => (
              <li key={p.title}>
                <a href={p.href} className="font-medium hover:text-[#5B8DA8]">
                  {p.title}
                </a>
                <span className="text-muted-foreground"> — {p.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </MiniAppShell>
  );
}
