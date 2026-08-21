"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, ExternalLink, Loader2, Link2 } from "lucide-react";
import { GSC_OAUTH_LOGIN_HINT } from "@/lib/gsc-oauth-connect-url";

type StartPayload = {
  googleUrl: string;
  state: string;
  redirectUri: string;
  expiresAt: string;
  loginHint?: string;
  instructions?: string[];
};

type Props = {
  onConnected?: (message: string) => void;
  onError?: (message: string) => void;
};

/**
 * Alternate Google Search Console connect — avoids same-tab redirect/cookie failures.
 * 1) Generate a Google URL (PKCE state in DB for 1 hour)
 * 2) Open it in a new tab
 * 3) Optionally paste the callback URL to finish if auto-return fails
 */
export function GscManualConnectPanel({ onConnected, onError }: Props) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [session, setSession] = useState<StartPayload | null>(null);
  const [callbackUrl, setCallbackUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setWaiting(false);
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const start = async () => {
    setBusy(true);
    onError?.("");
    try {
      const res = await authFetch("/api/gsc/oauth/manual/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnTo: "/dashboard/gsc-connect",
          email: GSC_OAUTH_LOGIN_HINT,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start alternate connect");
      setSession(data as StartPayload);
      setWaiting(true);
      // Poll diagnose — if redirect callback succeeds, UI refreshes itself
      pollRef.current = setInterval(() => {
        void queryClient.invalidateQueries({ queryKey: ["/api/gsc/diagnose"] });
      }, 3000);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Start failed");
    } finally {
      setBusy(false);
    }
  };

  const openGoogle = () => {
    if (!session?.googleUrl) return;
    window.open(session.googleUrl, "_blank", "noopener,noreferrer");
  };

  const copyLink = async () => {
    if (!session?.googleUrl) return;
    try {
      await navigator.clipboard.writeText(session.googleUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onError?.("Could not copy — select the link and copy manually.");
    }
  };

  const finish = async () => {
    setFinishing(true);
    try {
      const res = await authFetch("/api/gsc/oauth/manual/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callbackUrl: callbackUrl.trim() || undefined,
          state: session?.state,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not finish connect");
      stopPolling();
      setSession(null);
      setCallbackUrl("");
      await queryClient.invalidateQueries({ queryKey: ["/api/gsc/diagnose"] });
      onConnected?.(data.message || "Google Search Console connected.");
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Finish failed");
    } finally {
      setFinishing(false);
    }
  };

  return (
    <Card className="border-[#5B8DA8]/35 bg-[#5B8DA8]/5" data-testid="gsc-manual-connect">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Link2 className="w-4 h-4 text-[#5B8DA8]" />
          Another way to connect
        </CardTitle>
        <CardDescription className="text-xs leading-relaxed">
          If one-click Connect fails (especially on iPhone), use this path: open Google in a new tab
          from a desktop browser, then paste the return URL here if needed. No cookie required — the
          session is stored securely for one hour.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!session ? (
          <Button
            onClick={() => void start()}
            disabled={busy}
            className="text-white font-semibold"
            style={{ background: "linear-gradient(135deg,#5B8DA8,#2d4a3e)" }}
            data-testid="btn-gsc-manual-start"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Start alternate connect
          </Button>
        ) : (
          <div className="space-y-3">
            <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
              {(
                session.instructions || [
                  "Open Google in a new tab and approve access.",
                  "If ZZAI does not return automatically, paste the redirect URL below.",
                ]
              ).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={openGoogle}
                className="text-white font-semibold"
                style={{ background: "linear-gradient(135deg,#5B8DA8,#6B2C4E)" }}
                data-testid="btn-gsc-manual-open"
              >
                Open Google sign-in <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => void copyLink()}>
                <Copy className="w-3.5 h-3.5 mr-1" />
                {copied ? "Copied" : "Copy link"}
              </Button>
              {waiting ? (
                <span className="text-[11px] text-muted-foreground self-center inline-flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Waiting for connection…
                </span>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gsc-manual-callback" className="text-[11px]">
                Paste Google redirect URL (if needed)
              </Label>
              <Textarea
                id="gsc-manual-callback"
                rows={3}
                value={callbackUrl}
                onChange={(e) => setCallbackUrl(e.target.value)}
                placeholder={`${typeof window !== "undefined" ? window.location.origin : ""}/api/gsc/oauth/callback?code=…&state=…`}
                className="font-mono text-[11px]"
              />
              <p className="text-[10px] text-muted-foreground">
                Sign in as{" "}
                <span className="font-medium text-foreground">{GSC_OAUTH_LOGIN_HINT}</span>. Session
                expires{" "}
                {session.expiresAt
                  ? new Date(session.expiresAt).toLocaleTimeString()
                  : "in about 1 hour"}
                .
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => void finish()}
                disabled={finishing || !callbackUrl.trim()}
                data-testid="btn-gsc-manual-finish"
              >
                {finishing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Finish connect with pasted URL
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  stopPolling();
                  setSession(null);
                  setCallbackUrl("");
                }}
              >
                Cancel
              </Button>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Google URL (advanced)</Label>
              <Input readOnly value={session.googleUrl} className="h-8 text-[10px] font-mono" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
