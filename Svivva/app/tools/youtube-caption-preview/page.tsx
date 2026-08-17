"use client";

import { useState } from "react";
import { Loader2, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MiniAppShell } from "@/components/tools/mini-app-shell";
import { getFeatureMiniApp } from "@/lib/tools/feature-mini-apps";

const APP = getFeatureMiniApp("youtube-caption-preview")!;

export default function YoutubeCaptionPreviewPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    title: string;
    authorName: string;
    caption: string;
    truncated: boolean;
  } | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tools/youtube-caption-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Preview failed");
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MiniAppShell app={APP} nextLabel="Seeds factory">
      <form
        className="flex flex-col sm:flex-row gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (url.trim()) void run();
        }}
      >
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=…"
          data-testid="input-caption-url"
        />
        <Button
          type="submit"
          className="bg-[#5B8DA8] gap-2"
          disabled={loading || url.trim().length < 8}
          data-testid="button-caption-preview"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Youtube className="w-4 h-4" />}
          Preview captions
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {result && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
          <p className="font-semibold">{result.title}</p>
          <p className="text-xs text-muted-foreground">{result.authorName}</p>
          <pre className="text-sm whitespace-pre-wrap text-muted-foreground max-h-80 overflow-auto">
            {result.caption}
          </pre>
          {result.truncated && (
            <p className="text-xs text-muted-foreground">
              Preview truncated. Open Seeds to parse captions into apps and deploy.
            </p>
          )}
        </div>
      )}
    </MiniAppShell>
  );
}
