"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink, Loader2, DollarSign, RefreshCw, Check } from "lucide-react";
import { SITE_ADSENSE_CLIENT } from "@/lib/adsense-credentials";

type StatusPayload = {
  stored: {
    adsenseClient?: boolean;
    adsenseSlotBanner?: boolean;
    adsenseSlotInterstitial?: boolean;
    adsenseSlotRewarded?: boolean;
  };
  deploymentOverrides: {
    adsenseClient?: boolean;
    adsenseSlotBanner?: boolean;
    adsenseSlotInterstitial?: boolean;
    adsenseSlotRewarded?: boolean;
  };
  effective: {
    adsenseClient?: boolean;
    adsenseSlotBanner?: boolean;
    adsenseSlotInterstitial?: boolean;
    adsenseSlotRewarded?: boolean;
  };
  adsense?: {
    clientId: string | null;
    slotBanner: string | null;
    slotInterstitial: string | null;
    slotRewarded: string | null;
    adsTxtUrl: string;
    gameUrl: string;
  };
};

function Dot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${ok ? "bg-emerald-500" : "bg-muted-foreground/35"}`}
      title={ok ? "Configured" : "Missing"}
    />
  );
}

type Props = {
  onConfiguredChange?: (ready: boolean) => void;
};

function autoAdsReadyFromStatus(status: StatusPayload | null): boolean {
  if (!status) return false;
  if (status.effective.adsenseClient) return true;
  if (status.adsense?.clientId) return true;
  return Boolean(SITE_ADSENSE_CLIENT);
}

function inGameSlotsReadyFromStatus(status: StatusPayload | null): boolean {
  if (!status) return false;
  const e = status.effective;
  return Boolean(e.adsenseSlotBanner || e.adsenseSlotInterstitial || e.adsenseSlotRewarded);
}

/**
 * Orbit admin — paste Google AdSense publisher id + slots to earn from Klean Sneaks ads.
 * Saves to Platform Secrets (DB) and hydrates at runtime — no Vercel redeploy required for client id.
 */
export function OrbitAdsenseSetup({ onConfiguredChange }: Props) {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [clientId, setClientId] = useState("");
  const [slotBanner, setSlotBanner] = useState("");
  const [slotInterstitial, setSlotInterstitial] = useState("");
  const [slotRewarded, setSlotRewarded] = useState("");

  const [clearClient, setClearClient] = useState(false);
  const [clearBanner, setClearBanner] = useState(false);
  const [clearInterstitial, setClearInterstitial] = useState(false);
  const [clearRewarded, setClearRewarded] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/platform-secrets");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || res.statusText);
      }
      const next = (await res.json()) as StatusPayload;
      setStatus(next);
      if (next.adsense?.clientId) setClientId(next.adsense.clientId);
      else setClientId(SITE_ADSENSE_CLIENT);
      if (next.adsense?.slotBanner) setSlotBanner(next.adsense.slotBanner);
      if (next.adsense?.slotInterstitial) setSlotInterstitial(next.adsense.slotInterstitial);
      if (next.adsense?.slotRewarded) setSlotRewarded(next.adsense.slotRewarded);
      onConfiguredChange?.(autoAdsReadyFromStatus(next));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
    }
  }, [onConfiguredChange]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const body: Record<string, string> = {};
      if (clearClient) body.adsenseClientId = "";
      else if (clientId.trim()) body.adsenseClientId = clientId.trim();
      if (clearBanner) body.adsenseSlotBanner = "";
      else if (slotBanner.trim()) body.adsenseSlotBanner = slotBanner.trim();
      if (clearInterstitial) body.adsenseSlotInterstitial = "";
      else if (slotInterstitial.trim()) body.adsenseSlotInterstitial = slotInterstitial.trim();
      if (clearRewarded) body.adsenseSlotRewarded = "";
      else if (slotRewarded.trim()) body.adsenseSlotRewarded = slotRewarded.trim();

      if (Object.keys(body).length === 0) {
        setSaveMessage("Enter a ca-pub-… client id (and optional slot numbers), then save.");
        return;
      }

      const res = await fetch("/api/admin/platform-secrets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || res.statusText);

      setClearClient(false);
      setClearBanner(false);
      setClearInterstitial(false);
      setClearRewarded(false);
      setSaveMessage("Saved. Reload the site — Google ads load from your publisher id.");
      await load();
    } catch (e) {
      setSaveMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const autoAdsReady = autoAdsReadyFromStatus(status);
  const inGameReady = inGameSlotsReadyFromStatus(status);

  return (
    <div
      className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4"
      data-testid="orbit-adsense-setup"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
            <DollarSign className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-foreground">Google AdSense — get paid</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed max-w-xl">
              Paste your publisher id so Klean Sneaks shows real Google ads. Payouts go to your
              AdSense account. Auto ads work with just the client id; slots unlock in-game banner /
              interstitial / rewarded units.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <Dot ok={autoAdsReady} />
          <span
            className={autoAdsReady ? "text-emerald-600 font-semibold" : "text-muted-foreground"}
          >
            {autoAdsReady ? "Site ads live" : "Not connected"}
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => void load()}
            className="h-7 px-2"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {loadError && (
        <p className="text-xs text-destructive" data-testid="adsense-load-error">
          {loadError}
        </p>
      )}

      <div
        className="grid gap-2 sm:grid-cols-3 text-[11px]"
        data-testid="orbit-adsense-dual-status"
      >
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <Dot ok={autoAdsReady} /> Site-wide Auto ads
          </p>
          <p className="text-muted-foreground mt-0.5 leading-snug">
            {autoAdsReady
              ? "Publisher script + Auto ads in AdSense = placements on blog, tools, and game page."
              : "Add publisher client id first."}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <Dot ok={inGameReady} /> Klean Sneaks units
          </p>
          <p className="text-muted-foreground mt-0.5 leading-snug">
            {inGameReady
              ? "Banner / interstitial / rewarded slots saved — reload the game to test."
              : "Paste at least one display slot below (Auto ads does not replace in-game units)."}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <Dot ok={autoAdsReady} /> Privacy &amp; messaging
          </p>
          <p className="text-muted-foreground mt-0.5 leading-snug">
            Consent Mode is on-site. European regulations message for zzaizzai.com is managed in
            AdSense (EEA/UK/CH only — not shown on US phones).
          </p>
        </div>
      </div>

      <div
        className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-3 sm:p-4 space-y-3"
        data-testid="orbit-adsense-cmp-cta"
      >
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5" />
          AdSense CMP · no site error
        </p>
        <p className="text-sm font-bold text-foreground leading-snug">
          Publisher script, ads.txt, and Consent Mode are live. Your European regulations message
          with <span className="text-emerald-700 dark:text-emerald-400">Do not consent</span> On is
          configured in Google AdSense — this panel is not a Fix failure.
        </p>
        <ul className="text-[11px] text-foreground/80 space-y-1">
          <li>✓ Publisher script on zzaizzai.com ({SITE_ADSENSE_CLIENT})</li>
          <li>✓ ads.txt + Consent Mode ready</li>
          <li>✓ EU consent banner only shows for EEA/UK/CH visitors (0 US views is normal)</li>
        </ul>
        <details
          className="rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-[11px]"
          data-testid="orbit-adsense-fix-urls"
        >
          <summary className="cursor-pointer font-semibold text-foreground">
            If Google ever asks for privacy / logo URLs (optional)
          </summary>
          <div className="mt-2 space-y-1.5 text-muted-foreground">
            <p>
              Privacy:{" "}
              <a
                href="https://zzaizzai.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono font-semibold text-foreground underline break-all"
              >
                https://zzaizzai.com/privacy
              </a>
            </p>
            <p>
              Logo:{" "}
              <a
                href="https://zzaizzai.com/zzai-logo-adsense.png"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono font-semibold text-foreground underline break-all"
              >
                https://zzaizzai.com/zzai-logo-adsense.png
              </a>
            </p>
          </div>
        </details>
        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="font-semibold"
            data-testid="orbit-open-adsense-cmp"
          >
            <a
              href="https://adsense.google.com/adsense/new/privacymessaging"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Privacy &amp; messaging
              <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
            </a>
          </Button>
          <Button asChild variant="outline" size="sm" data-testid="orbit-open-adsense-sites">
            <a
              href="https://adsense.google.com/adsense/new/sites"
              target="_blank"
              rel="noopener noreferrer"
            >
              Sites · Auto ads
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </Button>
          <Button asChild variant="outline" size="sm" data-testid="orbit-open-adsense-adunits">
            <a
              href="https://adsense.google.com/adsense/new/adunits"
              target="_blank"
              rel="noopener noreferrer"
            >
              Display units (slots)
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Blank ads mean Google returned no creative (or the same Display unit was pasted into
          banner + interstitial + rewarded). Create <strong>three separate</strong> Display units in
          AdSense and paste distinct slot IDs below — never reuse one ID.
        </p>
      </div>

      <ol className="list-decimal list-inside space-y-1 text-[11px] text-muted-foreground">
        <li>
          European regulations →{" "}
          <a
            href="https://adsense.google.com/adsense/new/privacymessaging"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline inline-flex items-center gap-0.5 font-semibold"
            data-testid="orbit-adsense-cmp-link"
          >
            Privacy &amp; messaging <ExternalLink className="h-2.5 w-2.5" />
          </a>{" "}
          — published with Do not consent On ✓
        </li>
        <li>
          Sites → <strong>Auto ads ON</strong> (site-wide) — you did this ✓
        </li>
        <li>
          Optional: create <strong>three separate</strong> Display units in AdSense (banner,
          interstitial, rewarded) and paste distinct slot ids below — never the same ID three times
        </li>
      </ol>

      {(slotBanner &&
        ((slotInterstitial && slotBanner.trim() === slotInterstitial.trim()) ||
          (slotRewarded && slotBanner.trim() === slotRewarded.trim()))) ||
      (slotInterstitial && slotRewarded && slotInterstitial.trim() === slotRewarded.trim()) ? (
        <p
          className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-900 dark:text-amber-100"
          data-testid="adsense-duplicate-slot-warning"
        >
          These slot IDs match each other. Reusing one Display unit causes blank white ads — create
          unique units in AdSense Ad units, then paste each ID here.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="adsense-client">Publisher client ID</Label>
          <Input
            id="adsense-client"
            placeholder="ca-pub-1234567890123456"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            disabled={status?.deploymentOverrides.adsenseClient}
            data-testid="input-adsense-client"
          />
          {status?.deploymentOverrides.adsenseClient ? (
            <p className="text-[10px] text-amber-600">
              Locked by Vercel env NEXT_PUBLIC_ADSENSE_CLIENT
            </p>
          ) : (
            <label className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <Checkbox checked={clearClient} onCheckedChange={(v) => setClearClient(v === true)} />
              Clear saved client id
            </label>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="adsense-banner">Banner slot</Label>
          <Input
            id="adsense-banner"
            placeholder="1234567890"
            value={slotBanner}
            onChange={(e) => setSlotBanner(e.target.value)}
            disabled={status?.deploymentOverrides.adsenseSlotBanner}
            data-testid="input-adsense-slot-banner"
          />
          <label className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <Checkbox checked={clearBanner} onCheckedChange={(v) => setClearBanner(v === true)} />
            Clear
          </label>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="adsense-interstitial">Interstitial slot</Label>
          <Input
            id="adsense-interstitial"
            placeholder="1234567890"
            value={slotInterstitial}
            onChange={(e) => setSlotInterstitial(e.target.value)}
            disabled={status?.deploymentOverrides.adsenseSlotInterstitial}
            data-testid="input-adsense-slot-interstitial"
          />
          <label className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <Checkbox
              checked={clearInterstitial}
              onCheckedChange={(v) => setClearInterstitial(v === true)}
            />
            Clear
          </label>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="adsense-rewarded">Rewarded slot</Label>
          <Input
            id="adsense-rewarded"
            placeholder="1234567890"
            value={slotRewarded}
            onChange={(e) => setSlotRewarded(e.target.value)}
            disabled={status?.deploymentOverrides.adsenseSlotRewarded}
            data-testid="input-adsense-slot-rewarded"
          />
          <label className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <Checkbox
              checked={clearRewarded}
              onCheckedChange={(v) => setClearRewarded(v === true)}
            />
            Clear
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="bg-[#d4af37] text-[#1a1008] hover:bg-[#e0c15a]"
          data-testid="button-save-adsense"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          <span className="ml-1.5">Save AdSense</span>
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href="/ads.txt" target="_blank">
            Check ads.txt
          </Link>
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href="/clean-sneaks" target="_blank">
            Open game
          </Link>
        </Button>
      </div>

      {saveMessage && (
        <p className="text-xs text-muted-foreground" data-testid="adsense-save-message">
          {saveMessage}
        </p>
      )}

      {autoAdsReady && (
        <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
          Active publisher:{" "}
          <code className="font-mono font-semibold">
            {status?.adsense?.clientId || SITE_ADSENSE_CLIENT}
          </code>
          {!inGameReady ? <> — Auto ads only until you save slot ids for in-game units.</> : null}.
          Earnings appear in your{" "}
          <a
            href="https://www.google.com/adsense/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            AdSense dashboard
          </a>
          .
        </p>
      )}
    </div>
  );
}
