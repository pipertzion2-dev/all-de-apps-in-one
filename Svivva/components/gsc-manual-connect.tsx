"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, ExternalLink, Loader2, Link2 } from "lucide-react";
import { GSC_OAUTH_LOGIN_HINT } from "@/lib/gsc-oauth-connect-url";
import { gscOAuthErrorMessage } from "@/lib/gsc-error-messages";

type StartPayload = {
  googleUrl: string;
  state: string;
  redirectUri: string;
  expiresAt: string;
  loginHint?: string;
  instructions?: string[];
};

type DiagSnapshot = {
  oauthConnected?: boolean;
  gscPropertyOk?: boolean;
};

type Props = {
  adminUnlocked: boolean;
  onRequestAdminUnlock?: () => void;
  onConnected?: (message: string) => void;
  onError?: (message: string) => void;
};

/**
 * Alternate Google Search Console connect — avoids same-tab redirect/cookie failures.
 * 1) Generate a Google URL (PKCE state in DB for 1 hour)
 * 2) Open it in a new tab
 * 3) Paste the callback URL to finish if auto-return fails
 */
export function GscManualConnectPanel({
  adminUnlocked,
  onRequestAdminUnlock,
  onConnected,
  onError,
}: Props) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [session, setSession] = useState<StartPayload | null>(null);
  const [callbackUrl, setCallbackUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectedNotifiedRef = useRef(false);

  const { data: diag } = useQuery<DiagSnapshot>({
    queryKey: ["/api/gsc/diagnose"],
    queryFn: async () => {
      const r = await authFetch("/api/gsc/diagnose");
      if (r.status === 403) throw new Error("admin_required");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    enabled: waiting && adminUnlocked,
    refetchInterval: waiting ? 3000 : false,
    staleTime: 0,
  });

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setWaiting(false);
  }, []);

  const notifyConnected = useCallback(
    (message: string) => {
      if (connectedNotifiedRef.current) return;
      connectedNotifiedRef.current = true;
      stopPolling();
      setSession(null);
      setCallbackUrl("");
      void queryClient.invalidateQueries({ queryKey: ["/api/gsc/diagnose"] });
      onConnected?.(message);
    },
    [onConnected, queryClient, stopPolling],
  );

  useEffect(() => () => stopPolling(), [stopPolling]);

  useEffect(() => {
    if (!waiting || !diag?.oauthConnected) return;
    notifyConnected(
      diag.gscPropertyOk
        ? "Google connected — property matched via alternate sign-in."
        : "Google signed in — click Sync property above if Search Console still needs setup.",
    );
  }, [waiting, diag?.oauthConnected, diag?.gscPropertyOk, notifyConnected]);

  const start = async () => {
    if (!adminUnlocked) {
      onError?.(gscOAuthErrorMessage("admin_required"));
      onRequestAdminUnlock?.();
      return;
    }
    setBusy(true);
    connectedNotifiedRef.current = false;
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
      if (!res.ok) {
        throw new Error(gscOAuthErrorMessage(data.error || "oauth_start_failed"));
      }
      setSession(data as StartPayload);
      setWaiting(true);
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
    const trimmed = callbackUrl.trim();
    if (!trimmed) {
      onError?.("Paste the full redirect URL from your browser after Google sign-in.");
      return;
    }
    setFinishing(true);
    try {
      const res = await authFetch("/api/gsc/oauth/manual/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callbackUrl: trimmed,
          state: session?.state,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not finish connect");
      }
      notifyConnected(data.message || "Google Search Console connected.");
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Finish failed");
    } finally {
      setFinishing(false);
    }
  };

  const checkStatus = async () => {
    try {
      const r = await authFetch("/api/gsc/diagnose");
      const d = (await r.json()) as DiagSnapshot;
      if (d.oauthConnected) {
        notifyConnected(
          d.gscPropertyOk
            ? "Google is connected."
            : "Google signed in — finish property setup with Sync property above.",
        );
      } else {
        onError?.("Not connected yet — complete Google sign-in, then paste the redirect URL.");
      }
    } catch {
      onError?.("Could not check status — enter admin passcode first.");
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
        {!adminUnlocked && (
          <p className="text-xs text-amber-700 dark:text-amber-400 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
            Enter admin passcode <strong>272727</strong> above before starting alternate connect.
          </p>
        )}

        {!session ? (
          <Button
            onClick={() => void start()}
            disabled={busy || !adminUnlocked}
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
              <Button type="button" variant="outline" size="sm" onClick={() => void checkStatus()}>
                Check if connected
              </Button>
              {waiting ? (
                <span className="text-[11px] text-muted-foreground self-center inline-flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Waiting for connection…
                </span>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gsc-manual-callback" className="text-[11px]">
                Paste Google redirect URL (required if auto-return fails)
              </Label>
              <Textarea
                id="gsc-manual-callback"
                rows={3}
                value={callbackUrl}
                onChange={(e) => setCallbackUrl(e.target.value)}
                placeholder={`https://zzaizzai.com/api/gsc/oauth/callback?code=…&state=${session.state}`}
                className="font-mono text-[11px]"
              />
              <p className="text-[10px] text-muted-foreground">
                Sign in as{" "}
                <span className="font-medium text-foreground">{GSC_OAUTH_LOGIN_HINT}</span>. After
                Google redirects, copy the <strong>entire</strong> address bar URL (must include{" "}
                <code className="text-[10px]">code=</code> and{" "}
                <code className="text-[10px]">state=</code>). Session expires{" "}
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
                  connectedNotifiedRef.current = false;
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
