"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { authFetch, parseAuthJsonResponse } from "@/hooks/use-auth";
import { parseGscOAuthCredentialsFromFields } from "@/lib/gsc-oauth-credentials";
import { gscOAuthErrorMessage } from "@/lib/gsc-error-messages";
import { gscOAuthConnectUrl } from "@/lib/gsc-oauth-connect-url";
import { followOAuthLink } from "@/lib/follow-oauth-link";
import {
  CHROME_SILVER_BUTTON_CLASS,
  CHROME_SILVER_BUTTON_STYLE,
} from "@/lib/ui-chrome-silver-button";

type Props = {
  /** Tighter layout for Orbit Admin mission control */
  compact?: boolean;
  /** OAuth client already saved or set in Vercel — show Connect bro only (no paste fields). */
  oauthReady?: boolean;
  /** Where Google sends the user after OAuth (Orbit Admin path). */
  connectReturnTo?: string;
  onSaved?: () => void;
  "data-testid"?: string;
};

export function GscOAuthClientSavePanel({
  compact = false,
  oauthReady = false,
  connectReturnTo = "/dashboard/orbit",
  onSaved,
  "data-testid": testId = "orbit-admin-save-oauth-client",
}: Props) {
  const [oauthClientId, setOauthClientId] = useState("");
  const [oauthClientSecret, setOauthClientSecret] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const parsedOAuth = useMemo(
    () => parseGscOAuthCredentialsFromFields(oauthClientId, oauthClientSecret),
    [oauthClientId, oauthClientSecret],
  );

  const canSave = Boolean(parsedOAuth.clientId && parsedOAuth.clientSecret);
  const connectUrl = gscOAuthConnectUrl(connectReturnTo);

  const openGoogleSignIn = useCallback(() => {
    onSaved?.();
    followOAuthLink(connectUrl);
  }, [connectUrl, onSaved]);

  const applyOAuthPaste = useCallback((value: string) => {
    if (!value.trim().startsWith("{")) return false;
    const { clientId, clientSecret } = parseGscOAuthCredentialsFromFields(value, value);
    if (clientId) setOauthClientId(clientId);
    if (clientSecret) setOauthClientSecret(clientSecret);
    return Boolean(clientId && clientSecret);
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { clientId, clientSecret } = parseGscOAuthCredentialsFromFields(
        oauthClientId,
        oauthClientSecret,
      );
      if (!clientId || !clientSecret) {
        throw new Error("clientId and clientSecret required");
      }
      const r = await authFetch("/api/gsc/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_oauth_client",
          clientId,
          clientSecret,
        }),
      });
      const d = await parseAuthJsonResponse<{ error?: string; message?: string }>(r);
      if (!r.ok) throw new Error(d.error || "Failed");
      return d;
    },
    onSuccess: () => {
      openGoogleSignIn();
    },
    onError: (e: Error) => setFeedback({ ok: false, text: gscOAuthErrorMessage(e.message) }),
  });

  const inputClass = compact
    ? "w-full h-8 text-[11px] px-2.5 rounded-lg border border-border/60 bg-card/80 focus:outline-none focus:border-[#b8b8c8] text-foreground font-mono placeholder:text-muted-foreground/50"
    : "w-full h-9 text-xs px-3 rounded-lg border border-border bg-background focus:outline-none focus:border-[#b8b8c8] text-foreground font-mono";

  return (
    <div
      className={`w-full max-w-md mx-auto rounded-xl border border-[#b8b8c8]/35 bg-gradient-to-b from-white/[0.06] to-transparent ${compact ? "p-3 space-y-2" : "p-4 space-y-3"}`}
      data-testid={testId}
    >
      <p className={`font-bold text-foreground ${compact ? "text-[11px]" : "text-xs"}`}>
        Google OAuth client
      </p>
      <p className={`text-muted-foreground leading-relaxed ${compact ? "text-[10px]" : "text-xs"}`}>
        {oauthReady
          ? "OAuth client is ready — Connect bro opens Google sign-in."
          : "Paste Client ID + secret, then Connect bro saves credentials and opens Google sign-in."}
      </p>
      {!oauthReady && (
        <div className="space-y-2">
          <input
            type="text"
            value={oauthClientId}
            onChange={(e) => {
              const v = e.target.value;
              if (applyOAuthPaste(v)) return;
              setOauthClientId(v);
            }}
            onPaste={(e) => {
              const v = e.clipboardData.getData("text");
              if (applyOAuthPaste(v)) e.preventDefault();
            }}
            placeholder="Client ID or full JSON"
            className={inputClass}
            aria-label="Google OAuth client ID"
          />
          <input
            type="password"
            value={oauthClientSecret}
            onChange={(e) => {
              const v = e.target.value;
              if (applyOAuthPaste(v)) return;
              setOauthClientSecret(v);
            }}
            onPaste={(e) => {
              const v = e.clipboardData.getData("text");
              if (applyOAuthPaste(v)) e.preventDefault();
            }}
            placeholder="Client secret (GOCSPX-…)"
            className={inputClass}
            aria-label="Google OAuth client secret"
          />
        </div>
      )}
      <button
        type="button"
        disabled={oauthReady ? saveMutation.isPending : !canSave || saveMutation.isPending}
        onClick={() => (oauthReady ? openGoogleSignIn() : saveMutation.mutate())}
        className={`w-full rounded-lg px-4 py-2 text-sm ${CHROME_SILVER_BUTTON_CLASS} ${compact ? "h-9 text-xs" : "h-10"}`}
        style={CHROME_SILVER_BUTTON_STYLE}
        data-testid={`${testId}-button`}
      >
        {saveMutation.isPending ? "Connecting bro…" : "Connect bro"}
      </button>
      {feedback && (
        <p
          className={`text-[10px] px-2 py-1.5 rounded-md border ${
            feedback.ok
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400"
              : "bg-red-500/10 border-red-500/25 text-red-600 dark:text-red-400"
          }`}
        >
          {feedback.text}
        </p>
      )}
    </div>
  );
}
