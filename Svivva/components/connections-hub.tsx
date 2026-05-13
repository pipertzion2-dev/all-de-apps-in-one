"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Zap,
  Globe,
  BarChart3,
  Search,
  Link2,
  RefreshCw,
} from "lucide-react";
import { getSuggestedGoDaddyDomain } from "@/lib/site-url-public";

const TEAL = "#5BA8A0";

interface CredsData {
  hasGodaddy: boolean;
  hasGoogle: boolean;
  godaddyDomain: string | null;
  googleSiteUrl: string | null;
  indexnowKey?: string | null;
}

// ── Utility ─────────────────────────────────────────────────────────────────

function SecretInput({
  label,
  placeholder,
  value,
  onChange,
  helpText,
  mono,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  helpText?: string;
  mono?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#5BA8A0] pr-9 ${mono ? "font-mono text-xs" : ""}`}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>
      {helpText && <p className="text-[11px] text-muted-foreground">{helpText}</p>}
    </div>
  );
}

function PlainInput({
  label,
  placeholder,
  value,
  onChange,
  helpText,
  mono,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  helpText?: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#5BA8A0] ${mono ? "font-mono text-xs" : ""}`}
      />
      {helpText && <p className="text-[11px] text-muted-foreground">{helpText}</p>}
    </div>
  );
}

// ── Service Card ─────────────────────────────────────────────────────────────

type ServiceStatus = "connected" | "auto" | "setup" | "optional";

function ServiceCard({
  icon: Icon,
  name,
  description,
  status,
  statusLabel,
  statusColor,
  accentColor,
  expandedContent,
  externalLinks,
  onSave,
  saving,
}: {
  icon: React.ElementType;
  name: string;
  description: string;
  status: ServiceStatus;
  statusLabel: string;
  statusColor: string;
  accentColor: string;
  expandedContent?: React.ReactNode;
  externalLinks?: { label: string; href: string }[];
  onSave?: () => void;
  saving?: boolean;
}) {
  const [open, setOpen] = useState(status === "setup");

  const statusBg: Record<ServiceStatus, string> = {
    connected: "bg-green-50 dark:bg-green-950/20 border-green-300/60",
    auto: "bg-[#5BA8A0]/5 border-[#5BA8A0]/30",
    setup: "bg-amber-50 dark:bg-amber-950/15 border-amber-300/60",
    optional: "bg-card border-border",
  };

  return (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all ${statusBg[status]}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
            style={{ background: accentColor }}
          >
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-foreground">{name}</p>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border`}
                style={{
                  color: statusColor,
                  borderColor: `${statusColor}40`,
                  background: `${statusColor}10`,
                }}
              >
                {statusLabel}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
          </div>
          {/* Toggle if has expandable content */}
          {(expandedContent || externalLinks) && status !== "connected" && status !== "auto" && (
            <button
              onClick={() => setOpen(!open)}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
          {(status === "connected" || status === "auto") && externalLinks?.[0] && (
            <a
              href={externalLinks[0].href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* External links for non-expanded state */}
        {(status === "setup" || status === "optional") && !open && externalLinks && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {externalLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-muted/40 transition-colors font-medium text-muted-foreground"
              >
                {l.label} <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
              </a>
            ))}
            <button
              onClick={() => setOpen(true)}
              className="text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition-colors text-white"
              style={{ background: accentColor, borderColor: accentColor }}
            >
              Connect
            </button>
          </div>
        )}
      </div>

      {/* Expanded form */}
      {open && expandedContent && (
        <div className="border-t border-border/60 bg-background/50 p-4 space-y-3">
          {expandedContent}
          {onSave && (
            <button
              onClick={onSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 transition-all active:scale-95"
              style={{ background: accentColor }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? "Saving…" : "Save Connection"}
            </button>
          )}
          {externalLinks && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {externalLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-muted/40 transition-colors text-muted-foreground"
                >
                  {l.label} <ExternalLink className="w-2.5 h-2.5" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN: ConnectionsHub
// ═══════════════════════════════════════════════════════════════════════════
export function ConnectionsHub({ compact = false }: { compact?: boolean }) {
  const [collapsed, setCollapsed] = useState(false);

  // Credential form state
  const [godaddyKey, setGodaddyKey] = useState("");
  const [godaddySecret, setGodaddySecret] = useState("");
  const [godaddyDomain, setGodaddyDomain] = useState("");
  const [googleSiteUrl, setGoogleSiteUrl] = useState("");
  const { toast } = useToast();

  useAuth(); // kept for side effects only

  const { data: creds, isLoading: credsLoading } = useQuery<CredsData>({
    queryKey: ["/api/seeds/credentials"],
    queryFn: async () => {
      const r = await fetch("/api/seeds/credentials");
      if (!r.ok) return null as unknown as CredsData;
      return r.json();
    },
    retry: 2,
  });

  // Pre-fill form fields from server data
  useEffect(() => {
    if (creds?.godaddyDomain) setGodaddyDomain(creds.godaddyDomain);
    if (creds?.googleSiteUrl) setGoogleSiteUrl(creds.googleSiteUrl);
  }, [creds?.godaddyDomain, creds?.googleSiteUrl]);

  const isLoading = credsLoading;

  const saveMut = useMutation({
    mutationFn: async (payload: Record<string, string>) => {
      const res = await fetch("/api/seeds/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Save failed: ${res.status}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seeds/credentials"] });
      toast({ title: "Saved!", description: "Connection saved successfully.", duration: 3000 });
    },
    onError: (err) => {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const BASE_URL =
    typeof window !== "undefined" ? `https://${window.location.hostname}` : "https://svivva.com";

  const connectedCount = [
    true, // IndexNow = always auto
    creds?.hasGodaddy,
    creds?.hasGoogle,
  ].filter(Boolean).length;

  if (isLoading)
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading connections…
      </div>
    );

  return (
    <div className="space-y-3">
      {/* Section header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: `${TEAL}20` }}
          >
            <Link2 className="w-4 h-4" style={{ color: TEAL }} />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-foreground">Connected Services</p>
            <p className="text-xs text-muted-foreground">{connectedCount}/3 services ready</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Progress dots */}
          <div className="flex gap-1">
            {[true, creds?.hasGodaddy, creds?.hasGoogle].map((ok, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${ok ? "bg-green-500" : "bg-muted-foreground/25"}`}
              />
            ))}
          </div>
          {collapsed ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {!collapsed && (
        <div className="space-y-2.5">
          {/* ── 1. IndexNow (auto) ────────────────────────────────────────────── */}
          <ServiceCard
            icon={Zap}
            name="IndexNow"
            description="Auto-generated key submits all your pages to Bing, Yandex, Yahoo & DuckDuckGo instantly. No account needed — run the IndexNow step in Orbit to activate."
            status="auto"
            statusLabel={creds?.indexnowKey ? "Active" : "Auto — Run in Orbit"}
            statusColor={TEAL}
            accentColor={TEAL}
            externalLinks={[
              { label: "Bing Webmaster", href: "https://www.bing.com/webmasters" },
              { label: "Yandex Webmaster", href: "https://webmaster.yandex.com/welcome" },
            ]}
          />

          {/* ── 2. Google Search Console ─────────────────────────────────────── */}
          <ServiceCard
            icon={Search}
            name="Google Search Console"
            description={
              creds?.hasGoogle
                ? `Verified: ${creds.googleSiteUrl}. Submit sitemap at /sitemap.xml to accelerate Google indexing.`
                : "Free tool to verify your site with Google and submit your sitemap. Required for Google to index your pages."
            }
            status={creds?.hasGoogle ? "connected" : "setup"}
            statusLabel={creds?.hasGoogle ? "Site Verified" : "Not Set Up"}
            statusColor={creds?.hasGoogle ? "#16a34a" : "#d97706"}
            accentColor="#4285F4"
            externalLinks={(() => {
              const siteUrl = creds?.googleSiteUrl?.trim() || "";
              const normalizedUrl = siteUrl && !siteUrl.endsWith("/") ? siteUrl + "/" : siteUrl;
              const links: { label: string; href: string }[] = [
                {
                  label: creds?.hasGoogle ? "Open Console" : "Create Free Account",
                  href: "https://search.google.com/search-console/welcome",
                },
              ];
              if (creds?.hasGoogle && normalizedUrl) {
                links.push({
                  label: "Submit Sitemap",
                  href: `https://search.google.com/search-console/sitemaps?resource_id=${encodeURIComponent(normalizedUrl)}`,
                });
              }
              return links;
            })()}
            onSave={() => {
              // Normalize URL: add https:// if missing
              let url = (googleSiteUrl || "").trim();
              if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
                url = `https://${url}`;
              }
              if (!url) {
                toast({
                  title: "Enter a URL",
                  description: "Please enter your site URL first.",
                  variant: "destructive",
                });
                return;
              }
              setGoogleSiteUrl(url);
              saveMut.mutate({ googleSiteUrl: url });
            }}
            saving={saveMut.isPending}
            expandedContent={
              <div className="space-y-3">
                <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 px-4 py-3 space-y-2">
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                    2-step Google setup
                  </p>
                  <ol className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-decimal list-inside">
                    <li>Create a free account at Google Search Console → add your site URL</li>
                    <li>Verify ownership (HTML tag or DNS record method)</li>
                    <li>Come back and enter your site URL below to save it</li>
                    <li>
                      Submit your sitemap:{" "}
                      <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">
                        {BASE_URL}/sitemap.xml
                      </code>
                    </li>
                  </ol>
                </div>
                <PlainInput
                  label="Your Site URL"
                  placeholder="https://svivva.com"
                  value={googleSiteUrl}
                  onChange={setGoogleSiteUrl}
                  helpText="The URL you verified in Google Search Console (e.g. https://svivva.com)"
                />
                {!googleSiteUrl && (
                  <button
                    type="button"
                    onClick={() => setGoogleSiteUrl(BASE_URL)}
                    className="w-full py-2 rounded-xl text-xs font-semibold border border-blue-400/40 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                  >
                    Use {BASE_URL}
                  </button>
                )}
              </div>
            }
          />

          {/* ── 3. GoDaddy ────────────────────────────────────────────────────── */}
          <ServiceCard
            icon={Globe}
            name="GoDaddy"
            description={
              creds?.hasGodaddy
                ? `Domain: ${creds.godaddyDomain || "connected"}. DNS records can be updated automatically by Orbit.`
                : "Connect your GoDaddy domain so Orbit can automatically add DNS records (CNAME for apps.yourdomain.com)."
            }
            status={creds?.hasGodaddy ? "connected" : "setup"}
            statusLabel={creds?.hasGodaddy ? "Connected" : "Not Connected"}
            statusColor={creds?.hasGodaddy ? "#16a34a" : "#d97706"}
            accentColor="#1F6B36"
            externalLinks={[
              {
                label: creds?.hasGodaddy ? "GoDaddy DNS" : "Create GoDaddy Account",
                href: creds?.hasGodaddy
                  ? `https://dcc.godaddy.com/manage/${creds.godaddyDomain}/dns`
                  : "https://www.godaddy.com",
              },
              { label: "Get API Keys", href: "https://developer.godaddy.com/keys" },
            ]}
            onSave={() =>
              saveMut.mutate({
                godaddyApiKey: godaddyKey,
                godaddyApiSecret: godaddySecret,
                godaddyDomain,
              })
            }
            saving={saveMut.isPending}
            expandedContent={
              <div className="space-y-3">
                <div className="rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 px-4 py-3 space-y-2">
                  <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                    Get your GoDaddy API keys
                  </p>
                  <ol className="text-xs text-green-700 dark:text-green-400 space-y-1 list-decimal list-inside">
                    <li>
                      Go to <strong>developer.godaddy.com/keys</strong> and create a Production API
                      key
                    </li>
                    <li>Copy the Key and Secret shown below</li>
                    <li>Enter your domain name (e.g. svivva.com)</li>
                  </ol>
                </div>
                <SecretInput
                  label="API Key"
                  placeholder="GoDaddy API Key (from developer.godaddy.com/keys)"
                  value={godaddyKey}
                  onChange={setGodaddyKey}
                  mono
                />
                <SecretInput
                  label="API Secret"
                  placeholder="GoDaddy API Secret"
                  value={godaddySecret}
                  onChange={setGodaddySecret}
                  mono
                />
                <PlainInput
                  label="Domain registered at GoDaddy"
                  placeholder="example.com"
                  value={godaddyDomain || creds?.godaddyDomain || ""}
                  onChange={setGodaddyDomain}
                  helpText="Apex domain only (the name you bought at GoDaddy). We strip https:// and www automatically when you save."
                />
                <button
                  type="button"
                  onClick={() => {
                    const d = getSuggestedGoDaddyDomain();
                    if (d) setGodaddyDomain(d);
                  }}
                  className="w-full py-2 rounded-xl text-xs font-semibold border border-[#1F6B36]/40 text-[#1F6B36] hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors"
                >
                  Use domain from this app (NEXT_PUBLIC_SITE_URL)
                </button>
                <p className="text-[11px] text-muted-foreground">
                  In GoDaddy → <strong>My Products</strong> → your domain → <strong>DNS</strong> —
                  keep managing records there; this connection lets Svivva add CNAMEs via API when
                  you run Orbit.
                </p>
              </div>
            }
          />

          {/* ── 5. Analytics (Clarity + GA4) ─────────────────────────────── */}
          {(() => {
            const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID || "";
            const clarityConnected = !!clarityId && clarityId !== "undefined";
            const gaId = process.env.NEXT_PUBLIC_GA_ID || "";
            const gaConnected = !!gaId && gaId !== "undefined" && gaId.startsWith("G-");
            const anyConnected = clarityConnected || gaConnected;

            return (
              <ServiceCard
                icon={BarChart3}
                name="Analytics"
                description={
                  anyConnected
                    ? [
                        clarityConnected ? `Clarity active (${clarityId})` : "",
                        gaConnected ? `GA4 active (${gaId})` : "",
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : "Track visitors and see what they do on your site. Microsoft Clarity is the easiest option — free, instant setup, includes heatmaps and session recordings."
                }
                status={anyConnected ? "connected" : "setup"}
                statusLabel={
                  anyConnected
                    ? [clarityConnected ? "Clarity ✓" : "", gaConnected ? "GA4 ✓" : ""]
                        .filter(Boolean)
                        .join(" + ")
                    : "Not Connected"
                }
                statusColor={anyConnected ? "#16a34a" : "#9ca3af"}
                accentColor="#0078D4"
                externalLinks={[
                  {
                    label: clarityConnected
                      ? "Open Clarity Dashboard"
                      : "Create Free Clarity Account",
                    href: "https://clarity.microsoft.com",
                  },
                  ...(gaConnected
                    ? [{ label: "Open GA4 Dashboard", href: "https://analytics.google.com" }]
                    : []),
                ]}
                expandedContent={
                  <div className="space-y-4">
                    {/* Clarity section */}
                    <div
                      className={`rounded-xl border px-4 py-3 space-y-2 ${clarityConnected ? "bg-green-50 dark:bg-green-950/20 border-green-200" : "bg-blue-50 dark:bg-blue-950/20 border-blue-200"}`}
                    >
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm font-bold ${clarityConnected ? "text-green-800 dark:text-green-300" : "text-blue-800 dark:text-blue-300"}`}
                        >
                          {clarityConnected
                            ? "✓ Microsoft Clarity connected"
                            : "★ Recommended: Microsoft Clarity (free)"}
                        </p>
                        {!clarityConnected && (
                          <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                            EASIER
                          </span>
                        )}
                      </div>
                      {clarityConnected ? (
                        <p className={`text-xs text-green-700 dark:text-green-400`}>
                          Project ID: <code className="font-mono font-bold">{clarityId}</code> ·
                          Heatmaps and session recordings are live.
                        </p>
                      ) : (
                        <>
                          <p className="text-xs text-blue-700 dark:text-blue-400">
                            No account needed beyond signup. Shows exactly where users click,
                            scroll, and drop off — more useful than GA4 alone.
                          </p>
                          <ol className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-decimal list-inside">
                            <li>
                              Go to <strong>clarity.microsoft.com</strong> → sign in with Microsoft
                              or GitHub
                            </li>
                            <li>
                              Click <strong>New Project</strong> → enter your site URL
                            </li>
                            <li>
                              Copy the <strong>Project ID</strong> (short code like{" "}
                              <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">
                                abc123de
                              </code>
                              )
                            </li>
                            <li>
                              In your hosting dashboard → Secrets → add:{" "}
                              <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded font-mono">
                                NEXT_PUBLIC_CLARITY_ID
                              </code>{" "}
                              = your ID
                            </li>
                            <li>Restart the app — data starts flowing immediately</li>
                          </ol>
                        </>
                      )}
                    </div>

                    {/* GA4 section */}
                    <div
                      className={`rounded-xl border px-4 py-3 space-y-2 ${gaConnected ? "bg-green-50 dark:bg-green-950/20 border-green-200" : "bg-muted/20 border-border"}`}
                    >
                      <p
                        className={`text-sm font-semibold ${gaConnected ? "text-green-800 dark:text-green-300" : "text-foreground"}`}
                      >
                        {gaConnected
                          ? "✓ Google Analytics 4 connected"
                          : "Google Analytics 4 (optional)"}
                      </p>
                      {gaConnected ? (
                        <p className="text-xs text-green-700 dark:text-green-400">
                          Tracking ID: <code className="font-mono font-bold">{gaId}</code>
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Add{" "}
                          <code className="font-mono bg-muted px-1 rounded">
                            NEXT_PUBLIC_GA_ID = G-XXXXXXXXXX
                          </code>{" "}
                          to your app Secrets to enable.
                        </p>
                      )}
                    </div>
                  </div>
                }
              />
            );
          })()}

          {/* Help tip */}
          <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: TEAL }} />
            <span>
              <strong className="text-foreground">Minimum to get indexed:</strong> Just run IndexNow
              in Orbit — that covers Bing, Yandex, Yahoo & DuckDuckGo automatically. Google Search
              Console is optional but recommended for Google indexing visibility.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
