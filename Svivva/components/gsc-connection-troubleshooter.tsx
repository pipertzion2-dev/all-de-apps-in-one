"use client";

import { CheckCircle2, Circle, AlertTriangle, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { getPublicSiteUrl } from "@/lib/site-url-public";
import { GSC_OAUTH_LOGIN_HINT } from "@/lib/gsc-oauth-connect-url";

type Props = {
  adminUnlocked: boolean;
  oauthAvailable: boolean;
  oauthConnected: boolean;
  propertyOk: boolean;
  lastError?: string | null;
  gscSitesSample?: string[];
};

const SITE = getPublicSiteUrl();
const REDIRECT_URI = `${SITE}/api/gsc/oauth/callback`;
const DOMAIN = new URL(SITE).hostname.replace(/^www\./, "");

export function GscConnectionTroubleshooter({
  adminUnlocked,
  oauthAvailable,
  oauthConnected,
  propertyOk,
  lastError,
  gscSitesSample,
}: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const steps = [
    {
      id: "admin",
      label: "Enter admin passcode",
      done: adminUnlocked,
      detail: "Required before Google sign-in. Use the unlock form at the top of this page.",
    },
    {
      id: "oauth",
      label: "Google OAuth client configured",
      done: oauthAvailable,
      detail: oauthAvailable
        ? "OAuth client is ready."
        : "Paste Client ID + Secret on this page, or set GOOGLE_GSC_CLIENT_ID + SECRET in Vercel.",
    },
    {
      id: "redirect",
      label: "Redirect URI in Google Cloud Console",
      done: oauthAvailable,
      detail: `Must include exactly: ${REDIRECT_URI}`,
      copyValue: REDIRECT_URI,
      copyKey: "redirect",
    },
    {
      id: "signin",
      label: `Sign in as ${GSC_OAUTH_LOGIN_HINT}`,
      done: oauthConnected,
      detail: oauthConnected
        ? "Google account linked."
        : "Use Connect with Google, or “Another way to connect” if one-click fails (iPhone/desktop).",
    },
    {
      id: "property",
      label: `Verify ${DOMAIN} in Search Console (Owner)`,
      done: propertyOk,
      detail: propertyOk
        ? "Property matched."
        : `Add sc-domain:${DOMAIN} or ${SITE}/ in Search Console, verify DNS, then click Sync property.`,
      link: "https://search.google.com/search-console",
    },
  ];

  const blockedStep = steps.find((s) => !s.done);

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-foreground">Connection troubleshooter</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {propertyOk
              ? "All steps complete — GSC is connected."
              : blockedStep
                ? `Stuck at: ${blockedStep.label}`
                : "Follow these steps in order."}
          </p>
        </div>
      </div>

      {lastError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-800 dark:text-red-200">
          {lastError}
        </div>
      )}

      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={step.id} className="flex gap-2 text-xs">
            {step.done ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <span className={step.done ? "text-muted-foreground line-through" : "font-medium"}>
                {i + 1}. {step.label}
              </span>
              {!step.done && (
                <p className="text-muted-foreground mt-0.5 leading-relaxed">{step.detail}</p>
              )}
              {step.copyValue && !step.done && (
                <button
                  type="button"
                  className="mt-1 inline-flex items-center gap-1 text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded hover:bg-muted/80"
                  onClick={() => void copy(step.copyValue!, step.copyKey!)}
                >
                  <Copy className="w-3 h-3" />
                  {copied === step.copyKey ? "Copied!" : step.copyValue}
                </button>
              )}
              {step.link && !step.done && (
                <a
                  href={step.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-[11px] underline"
                >
                  Open Search Console <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>

      {oauthConnected && !propertyOk && gscSitesSample && gscSitesSample.length > 0 && (
        <p className="text-[10px] text-muted-foreground border-t border-border/50 pt-2">
          Properties on your Google account: {gscSitesSample.join(", ")}
          {gscSitesSample.length >= 8 ? "…" : ""}. None match {SITE} — add the domain property
          above.
        </p>
      )}

      {!oauthAvailable && (
        <div className="text-[10px] text-muted-foreground space-y-1 border-t border-border/50 pt-2">
          <p className="font-semibold text-foreground">Google Cloud setup (one time)</p>
          <p>
            1.{" "}
            <a
              href="https://console.cloud.google.com/apis/library/searchconsole.googleapis.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Enable Search Console API
            </a>
          </p>
          <p>
            2.{" "}
            <a
              href="https://console.cloud.google.com/apis/library/indexing.googleapis.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Enable Web Search Indexing API
            </a>
          </p>
          <p>3. Create OAuth 2.0 Web client → add redirect URI → paste credentials on this page</p>
        </div>
      )}
    </div>
  );
}
