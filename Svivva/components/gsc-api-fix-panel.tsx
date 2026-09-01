"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";
import type { GoogleApiEnableLinks } from "@/lib/google-cloud-project";
import { authFetch } from "@/hooks/use-auth";

type Props = {
  enableLinks: GoogleApiEnableLinks | null;
  compact?: boolean;
  onFixed?: () => void;
};

/** One-tap fix when Google Indexing API is disabled on the OAuth GCP project. */
export function GscApiFixPanel({ enableLinks, compact, onFixed }: Props) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!enableLinks?.projectNumber) return null;

  const autoFix = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await authFetch("/api/gsc/ensure-apis", { method: "POST" });
      const d = (await r.json()) as {
        ok?: boolean;
        message?: string;
        needsReconnect?: boolean;
      };
      setMsg(d.message || (d.ok ? "APIs enabled — retry indexing in 1–2 minutes." : "Could not enable automatically."));
      if (d.ok) onFixed?.();
    } catch {
      setMsg("Request failed — use the manual enable links below.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={`rounded-lg border border-red-500/30 bg-red-500/5 space-y-2 ${compact ? "p-2" : "p-3"}`}
      data-testid="gsc-api-fix-panel"
    >
      <p className={`font-semibold text-red-400 ${compact ? "text-[10px]" : "text-xs"}`}>
        Indexing API disabled on Google Cloud project {enableLinks.projectNumber}
      </p>
      <p className={`text-muted-foreground leading-relaxed ${compact ? "text-[10px]" : "text-[11px]"}`}>
        Enable the API once on OAuth project <strong>{enableLinks.projectNumber}</strong>, then retry
        indexing. If you already enabled it, confirm it is{" "}
        <strong>Web Search Indexing API</strong> (not just Search Console API) on that exact project,
        wait 2 minutes, and re-run launch.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          className="text-white font-bold h-8 text-xs"
          style={{ background: "linear-gradient(135deg,#5B8DA8,#6B2C4E)" }}
          disabled={busy}
          onClick={autoFix}
          data-testid="btn-enable-google-apis"
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
          {busy ? "Enabling…" : "Auto-enable APIs"}
        </Button>
        <Button type="button" size="sm" variant="outline" className="h-8 text-xs" asChild>
          <a href={enableLinks.indexingApi} target="_blank" rel="noopener noreferrer">
            Enable Indexing API <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </Button>
        <Button type="button" size="sm" variant="ghost" className="h-8 text-xs" asChild>
          <a href={enableLinks.searchConsoleApi} target="_blank" rel="noopener noreferrer">
            Search Console API
          </a>
        </Button>
      </div>
      {msg && <p className="text-[10px] text-muted-foreground">{msg}</p>}
    </div>
  );
}
