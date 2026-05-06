"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Globe, CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp,
  Key, Rocket, TrendingUp, ExternalLink, Search, Package, Layers,
  Plus, Trash2, Zap, FileText, ArrowRight, X, Eye, EyeOff, Copy,
  Twitter, Linkedin, MessageSquare, Share2, MonitorPlay, Code2, Megaphone,
  Bot, Send,
} from "lucide-react";

interface FunnelStatus {
  hasReplit: boolean;
  hasGodaddy: boolean;
  hasGoogle: boolean;
  googleSiteUrl: string | null;
}

interface ManualApp { id: number; name: string; url: string; description: string; platform: string; hostingProvider: string; domain: string; slugs: string[]; subApps: { name: string; description: string; url: string }[]; source: "manual" }
interface ReplitAppRow { replId: string; title: string; pages: { slug: string; title: string }[]; subApps: { name: string; pages: { slug: string; title: string }[] }[] }
interface AppsListData { manualApps: ManualApp[]; replitApps: ReplitAppRow[] }

const PLATFORMS = ["Vercel", "Netlify", "Railway", "Render", "Fly.io", "AWS", "Google Cloud", "Azure", "DigitalOcean", "GitHub Pages", "Cloudflare Pages", "Heroku", "Hosted Platform", "Other"];
const REPLIT_ORANGE = "#F26207";
const TEAL = "#5BA8A0";

// ── Shared helpers ─────────────────────────────────────────────────────────────
function CredInput({ label, placeholder, value, onChange, secret, testId, mono }: { label: string; placeholder: string; value: string; onChange: (v: string) => void; secret?: boolean; testId?: string; mono?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        <input type={secret && !show ? "password" : "text"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} data-testid={testId}
          className={`w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#5BA8A0] pr-8 ${mono ? "font-mono text-xs" : ""}`} />
        {secret && (
          <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
      className="text-xs text-[#5BA8A0] hover:underline flex items-center gap-1 flex-shrink-0">
      <Copy className="w-3 h-3" /> {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function SocialCard({ icon: Icon, platform, content, color }: { icon: React.ElementType; platform: string; content: string; color: string }) {
  return (
    <div className="border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5" style={{ color }} />
          <span className="text-xs font-medium">{platform}</span>
        </div>
        <CopyButton text={content} />
      </div>
      <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{content}</p>
    </div>
  );
}

// ── Replit Connect ─────────────────────────────────────────────────────────────
function ReplitConnectBlock({ connected }: { connected: boolean }) {
  if (connected) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium" style={{ background: `${REPLIT_ORANGE}15`, border: `1px solid ${REPLIT_ORANGE}30`, color: REPLIT_ORANGE }}>
        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
        <span>App platform connected — your apps are ready to import</span>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-[#F26207]/20 bg-[#F26207]/5 p-3 space-y-2">
      <p className="text-xs font-semibold text-foreground">Connect your app platform to bulk-import your apps</p>
      <p className="text-xs text-muted-foreground">Your account is linked automatically when you log in. Log out and log back in to connect.</p>
      <a href="/api/auth/logout"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition-all"
        style={{ background: REPLIT_ORANGE }}>
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M4 4h7v7H4V4zm0 9h7v7H4v-7zm9-9h7v7h-7V4zm0 9h7v7h-7v-7z" /></svg>
        Log out → Log back in to connect
      </a>
    </div>
  );
}

// ── Traffic AI Chat ────────────────────────────────────────────────────────────
interface ChatMsg { role: "user" | "assistant"; content: string; action?: any }

const TRAFFIC_SUGGESTIONS = [
  { label: "Run AI autopilot", prompt: "Run AI autopilot in balanced mode" },
  { label: "Generate social posts", prompt: "Generate social media posts for my recent pages" },
  { label: "Set up IndexNow", prompt: "Set up IndexNow and submit all URLs to Bing and Yandex" },
  { label: "Check my status", prompt: "What's my marketing status?" },
];

function TrafficChat() {
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { role: "assistant", content: "I'm your Marketing AI. Tell me what to do — generate pages, run autopilot, submit to search engines, or create social posts." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    setMsgs((p) => [...p, { role: "user", content: text.trim() }]);
    setInput("");
    setLoading(true);
    try {
      const history = msgs.map((m) => ({ role: m.role, content: m.content }));
      const res = await authFetch("/api/marketing/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text.trim(), history }) });
      const data = await res.json();
      setMsgs((p) => [...p, { role: "assistant", content: data.reply || data.error || "Something went wrong.", action: data.action }]);
      if (data.action?.type !== "advice") {
        queryClient.invalidateQueries({ queryKey: ["/api/marketing/infrastructure"] });
        queryClient.invalidateQueries({ queryKey: ["/api/marketing/google-search"] });
      }
    } catch { setMsgs((p) => [...p, { role: "assistant", content: "Error — please try again." }]); }
    finally { setLoading(false); }
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Chat header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border" style={{ background: `linear-gradient(135deg, #E91E8C15, #9c27b015)` }}>
        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#E91E8C" }}>
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-xs font-bold text-foreground">Marketing AI</span>
        <span className="text-xs text-muted-foreground ml-auto">Ask me anything — I execute it for you</span>
      </div>

      {/* Messages */}
      <div className="space-y-3 p-3 max-h-64 overflow-y-auto bg-muted/10">
        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            {m.role === "assistant" && (
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "#E91E8C" }}>
                <Bot className="w-3 h-3 text-white" />
              </div>
            )}
            <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${m.role === "user" ? "text-white rounded-tr-none" : "bg-white dark:bg-card border border-border rounded-tl-none"}`}
              style={m.role === "user" ? { background: "#E91E8C" } : {}}>
              {m.content}
              {/* Compact action result */}
              {m.action && m.role === "assistant" && (
                <div className="mt-1.5 pt-1.5 border-t border-border/50">
                  {m.action.type === "autopilot" && m.action.created > 0 && (
                    <p className="text-green-600 font-medium">✓ {m.action.created} pieces created{m.action.indexnow?.submitted ? ` · ${m.action.indexnow.count} URLs indexed` : ""}</p>
                  )}
                  {m.action.type === "indexnow" && (
                    <p className={m.action.success ? "text-green-600 font-medium" : "text-red-500"}>
                      {m.action.success ? `✓ ${m.action.message}` : m.action.message}
                    </p>
                  )}
                  {m.action.type === "mini_apps" && (
                    <p className="text-green-600 font-medium">✓ {m.action.totalApps} mini-apps · {m.action.firstBatch?.length || 0} pages created</p>
                  )}
                  {m.action.type === "social" && m.action.posts?.length > 0 && (
                    <p className="text-green-600 font-medium">✓ {m.action.posts.length} social posts ready — go to Marketing HQ to copy them</p>
                  )}
                  {m.action.type === "status" && (
                    <div className="space-y-0.5 mt-1">
                      <p>Mini-app pages: <strong>{m.action.data?.miniAppPages || 0}</strong></p>
                      <p>Total pages: <strong>{m.action.data?.totalPages || 0}</strong></p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#E91E8C" }}>
              <Bot className="w-3 h-3 text-white" />
            </div>
            <div className="bg-white dark:bg-card border border-border rounded-xl rounded-tl-none px-3 py-2 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" style={{ color: "#E91E8C" }} />
              <span className="text-xs text-muted-foreground">Working...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips — show only at start */}
      {msgs.length <= 1 && (
        <div className="flex flex-wrap gap-1.5 px-3 py-2 border-t border-border bg-muted/5">
          {TRAFFIC_SUGGESTIONS.map(({ label, prompt }) => (
            <button key={label} onClick={() => send(prompt)}
              className="px-2.5 py-1 rounded-full border border-border bg-white dark:bg-card text-xs text-foreground hover:border-pink-300 hover:bg-pink-50 dark:hover:bg-pink-950/20 transition-all font-medium"
              data-testid={`chip-${label.replace(/\s+/g, "-").toLowerCase()}`}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 p-2 border-t border-border bg-white dark:bg-card">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(input); } }}
          placeholder="Generate pages, run autopilot, submit to Bing..."
          className="flex-1 bg-transparent text-sm focus:outline-none px-2 py-2 min-h-[36px]"
          data-testid="input-traffic-chat" />
        <button onClick={() => send(input)} disabled={!input.trim() || loading}
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 flex-shrink-0"
          style={{ background: "#E91E8C" }} data-testid="button-traffic-chat-send">
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}

// ── Add App Panel ──────────────────────────────────────────────────────────────
function AddAppPanel({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");
  const [platform, setPlatform] = useState("");
  const [hosting, setHosting] = useState("");
  const [domain, setDomain] = useState("");

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!name || !url) throw new Error("App name and URL are required");
      const res = await authFetch("/api/seeds/app", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, url, description: desc, platform, hostingProvider: hosting, domain }) });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/seeds/apps-list"] }); onDone(); },
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2"><Plus className="w-4 h-4 text-[#5BA8A0]" /> Add Any App</h3>
        <button onClick={onDone} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <CredInput label="App Name *" placeholder="My SaaS" value={name} onChange={setName} testId="input-app-name" />
        <CredInput label="App URL *" placeholder="https://myapp.com" value={url} onChange={setUrl} testId="input-app-url" />
      </div>
      <CredInput label="Description" placeholder="What does it do? Who's it for?" value={desc} onChange={setDesc} testId="input-app-desc" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Platform / Framework</label>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#5BA8A0]"
            data-testid="select-platform">
            <option value="">Any platform</option>
            {["Next.js", "React", "Vue", "Svelte", "Django", "Rails", "Laravel", "FastAPI", "Express", "Flutter", "Swift", "Kotlin", "Other"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Hosting</label>
          <select value={hosting} onChange={(e) => setHosting(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#5BA8A0]"
            data-testid="select-hosting">
            <option value="">Any host</option>
            {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <CredInput label="Custom Domain (optional)" placeholder="myapp.com" value={domain} onChange={setDomain} testId="input-app-domain" />
      </div>
      {addMutation.isError && <p className="text-xs text-red-500">{(addMutation.error as Error).message}</p>}
      {addMutation.isSuccess && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-xs text-green-600">
          {addMutation.data?.skipped ? "App already registered." : `${addMutation.data?.slugs?.length || 3} marketing pages generated and published live!`}
        </div>
      )}
      <Button size="sm" className="bg-[#5BA8A0] gap-1.5" disabled={!name || !url || addMutation.isPending} onClick={() => addMutation.mutate()} data-testid="button-add-app">
        {addMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
        {addMutation.isPending ? "Generating Pages..." : "Add App + Auto-Generate Marketing Pages"}
      </Button>
    </div>
  );
}

// ── Domain Panel ───────────────────────────────────────────────────────────────
function DomainPanel() {
  const [domain, setDomain] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [tokenData, setTokenData] = useState<{ token: string; record: string; domain: string } | null>(null);
  const [verifyResult, setVerifyResult] = useState<{ verified: boolean; domain: string } | null>(null);
  const [provider, setProvider] = useState("any");

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!domain) throw new Error("Enter your domain first");
      const res = await authFetch("/api/seeds/domain-verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "generate", domain }) });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
    onSuccess: (data) => setTokenData(data),
  });

  const checkMutation = useMutation({
    mutationFn: async () => {
      const res = await authFetch("/api/seeds/domain-verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "check" }) });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
    onSuccess: (data) => setVerifyResult(data),
  });

  const googleMutation = useMutation({
    mutationFn: async () => {
      if (!siteUrl) throw new Error("Enter your site URL");
      const res = await authFetch("/api/seeds/domain-verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "save-google", siteUrl }) });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
  });

  const providerInstructions: Record<string, { name: string; steps: string[] }> = {
    cloudflare: { name: "Cloudflare", steps: ["Go to DNS → Records → Add Record", "Type: TXT, Name: @, Content: paste the token, TTL: Auto", "Click Save"] },
    godaddy: { name: "GoDaddy", steps: ["Go to DNS Management for your domain", "Add → TXT record, Host: @, Value: paste token, TTL: 1 hour"] },
    namecheap: { name: "Namecheap", steps: ["Domain List → Manage → Advanced DNS", "Add New Record → TXT Record, Host: @, Value: paste token"] },
    route53: { name: "Route 53", steps: ["Hosted Zones → your domain → Create Record", "Type: TXT, Record name: leave blank, Value: paste token"] },
    any: { name: "Any Provider", steps: ["Log in to your DNS provider", "Add a TXT record for @ (root domain)", "Paste the verification token as the value", "Wait 5–60 min for DNS to propagate, then click Verify"] },
  };
  const instr = providerInstructions[provider] || providerInstructions.any;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm flex items-center gap-2"><Globe className="w-4 h-4 text-[#5BA8A0]" /> Domain Verification — Any Provider</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <CredInput label="Your Domain" placeholder="myapp.com" value={domain} onChange={setDomain} testId="input-domain" />
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">DNS Provider</label>
          <select value={provider} onChange={(e) => setProvider(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#5BA8A0]"
            data-testid="select-dns-provider">
            <option value="any">Any / Other</option>
            <option value="cloudflare">Cloudflare</option>
            <option value="godaddy">GoDaddy</option>
            <option value="namecheap">Namecheap</option>
            <option value="route53">AWS Route 53</option>
          </select>
        </div>
      </div>
      <Button size="sm" className="bg-[#5BA8A0] gap-1.5" disabled={!domain || generateMutation.isPending} onClick={() => generateMutation.mutate()} data-testid="button-generate-dns">
        {generateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
        Generate DNS Verification Record
      </Button>
      {tokenData && (
        <div className="space-y-3">
          <div className="bg-muted/40 rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium">Add this TXT record to <span className="text-[#5BA8A0]">{tokenData.domain}</span>:</p>
            <div className="flex items-center gap-2 bg-background rounded-md px-3 py-2 border border-border font-mono text-xs break-all">
              <span className="flex-1">{tokenData.record}</span>
              <CopyButton text={tokenData.token} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{instr.name} instructions:</p>
              <ol className="list-decimal pl-4 space-y-0.5 text-xs text-muted-foreground">
                {instr.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </div>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 border-[#5BA8A0]/30 text-[#5BA8A0]" disabled={checkMutation.isPending} onClick={() => checkMutation.mutate()} data-testid="button-verify-dns">
            {checkMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            {checkMutation.isPending ? "Checking DNS..." : "Verify Domain"}
          </Button>
          {verifyResult && (
            <div className={`rounded-lg p-3 text-xs border ${verifyResult.verified ? "bg-green-500/10 border-green-500/20 text-green-600" : "bg-yellow-500/10 border-yellow-500/20 text-yellow-700"}`}>
              {verifyResult.verified ? `✓ ${verifyResult.domain} verified!` : "DNS not propagated yet. Wait a few minutes and try again."}
            </div>
          )}
        </div>
      )}
      <div className="border-t border-border pt-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Google Search Console — submit sitemap for indexing</p>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <CredInput label="Site URL" placeholder="https://myapp.com" value={siteUrl} onChange={setSiteUrl} testId="input-gsc-url" />
          </div>
          <Button size="sm" variant="outline" className="gap-1 border-[#4285F4]/30 text-[#4285F4] hover:bg-[#4285F4]/10 flex-shrink-0" disabled={!siteUrl || googleMutation.isPending} onClick={() => googleMutation.mutate()} data-testid="button-submit-sitemap">
            {googleMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            Submit Sitemap
          </Button>
        </div>
        {googleMutation.isSuccess && <p className="text-xs text-green-600">Sitemap submitted. Google will index new pages within 24–48 hours.</p>}
      </div>
    </div>
  );
}

// ── Traffic Panel ──────────────────────────────────────────────────────────────
function TrafficPanel({ apps, replitApps }: { apps: ManualApp[]; replitApps: ReplitAppRow[] }) {
  const allApps = [
    ...apps.map((a) => ({ name: a.name, url: a.url, description: a.description })),
    ...replitApps.map((r) => ({ name: r.title, url: r.replId ? `https://svivva.com/${r.replId}` : "", description: "" })),
  ];
  const [selectedApp, setSelectedApp] = useState<typeof allApps[0] | null>(allApps[0] ?? null);
  const [socialContent, setSocialContent] = useState<Record<string, string> | null>(null);

  const socialMutation = useMutation({
    mutationFn: async () => {
      if (!selectedApp) throw new Error("Select an app first");
      const res = await authFetch("/api/seeds/social-content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ appName: selectedApp.name, appUrl: selectedApp.url, description: selectedApp.description }) });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
    onSuccess: (data) => setSocialContent(data.content),
  });

  const channels = [
    { id: "search", icon: Search, label: "Google Search Console", color: "#4285F4", desc: "Free organic traffic via sitemap submission and indexing", href: "https://search.google.com/search-console", cta: "Open GSC →" },
    { id: "ads", icon: Megaphone, label: "Google Ads", color: "#FBBC04", desc: "Paid search traffic — target exact keywords with intent to buy", href: `https://ads.google.com/home/campaigns/new-campaign/?campaignType=SEARCH`, cta: "Create Campaign →" },
    { id: "ph", icon: Rocket, label: "Product Hunt", color: "#DA552F", desc: "Launch to 500k+ early adopters — best for B2C and dev tools", href: "https://www.producthunt.com/posts/new", cta: "Submit →" },
    { id: "hn", icon: Code2, label: "Hacker News — Show HN", color: "#FF6600", desc: "Highly technical audience, great for developer tools and APIs", href: "https://news.ycombinator.com/submit", cta: "Submit →" },
    { id: "devto", icon: FileText, label: "Dev.to Article", color: "#0a0a0a", desc: "Technical articles drive long-term SEO + developer community traffic", href: "https://dev.to/new", cta: "Write Article →" },
    { id: "reddit", icon: MessageSquare, label: "Reddit", color: "#FF4500", desc: "Niche subreddits for your use case — authentic community traffic", href: "https://reddit.com/r/SideProject/submit", cta: "Post →" },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#5BA8A0]" /> Traffic Channels</h3>

      {/* AI Chat */}
      <TrafficChat />

      {/* Channel cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {channels.map(({ id, icon: Icon, label, color, desc, href, cta }) => (
          <a key={id} href={href} target="_blank" rel="noopener noreferrer"
            className="border border-border rounded-lg p-3 hover:bg-muted/30 transition-colors space-y-1.5 group"
            data-testid={`card-traffic-${id}`}>
            <div className="flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
              <span className="text-xs font-medium truncate">{label}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            <span className="text-xs text-[#5BA8A0] group-hover:underline">{cta}</span>
          </a>
        ))}
      </div>

      {/* Social launch pack */}
      <div className="border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-[#5BA8A0]" />
          <h4 className="font-semibold text-sm">Auto-Generate Social Launch Pack</h4>
        </div>
        <p className="text-xs text-muted-foreground">Pick an app and generate ready-to-post content for every platform instantly.</p>
        {allApps.length > 0 ? (
          <>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Select App</label>
              <select value={selectedApp?.name || ""} onChange={(e) => setSelectedApp(allApps.find((a) => a.name === e.target.value) || null)}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#5BA8A0]"
                data-testid="select-social-app">
                {allApps.map((a) => <option key={a.name} value={a.name}>{a.name}</option>)}
              </select>
            </div>
            <Button size="sm" className="bg-[#5BA8A0] gap-1.5" disabled={socialMutation.isPending || !selectedApp} onClick={() => socialMutation.mutate()} data-testid="button-gen-social">
              {socialMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              {socialMutation.isPending ? "Generating..." : "Generate Social Pack"}
            </Button>
            {socialMutation.isError && <p className="text-xs text-red-500">{(socialMutation.error as Error).message}</p>}
            {socialContent && (
              <div className="space-y-2 mt-2">
                {socialContent.twitter && <SocialCard icon={Twitter} platform="Twitter / X" content={socialContent.twitter} color="#1DA1F2" />}
                {socialContent.linkedin && <SocialCard icon={Linkedin} platform="LinkedIn" content={socialContent.linkedin} color="#0077B5" />}
                {socialContent.reddit && <SocialCard icon={MessageSquare} platform="Reddit" content={socialContent.reddit} color="#FF4500" />}
                {socialContent.producthunt && <SocialCard icon={Rocket} platform="Product Hunt" content={socialContent.producthunt} color="#DA552F" />}
                {socialContent.hackernews && <SocialCard icon={Code2} platform="Hacker News" content={socialContent.hackernews} color="#FF6600" />}
                {socialContent.devto && <SocialCard icon={FileText} platform="Dev.to" content={socialContent.devto} color="#0a0a0a" />}
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Add an app first using the Apps tab to generate social content.</p>
        )}
      </div>
    </div>
  );
}

// ── Apps List ──────────────────────────────────────────────────────────────────
function AppsList({ apps, replitApps, onAddApp, onImportReplit, importPending }: {
  apps: ManualApp[]; replitApps: ReplitAppRow[]; onAddApp: () => void; onImportReplit: () => void; importPending: boolean;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" className="bg-[#5BA8A0] gap-1.5" onClick={onAddApp} data-testid="button-open-add-app">
          <Plus className="w-3.5 h-3.5" /> Add Any App
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5 border-[#F26207]/30 text-[#F26207] hover:bg-[#F26207]/10" disabled={importPending} onClick={onImportReplit} data-testid="button-import-replit">
          {importPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Package className="w-3.5 h-3.5" />}
          {importPending ? "Importing..." : "Import Apps"}
        </Button>
      </div>
      <div className="rounded-xl border border-[#6B2C4A]/20 bg-[#6B2C4A]/5 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-foreground">Pyracrypt</p>
            <p className="text-xs text-muted-foreground">Connect your separate mini-app workspace to Orbit and generate Svivva marketing pages for it.</p>
          </div>
          <Button size="sm" className="bg-[#6B2C4A] gap-1.5" onClick={onImportReplit} disabled={importPending} data-testid="button-import-pyracrypt">
            {importPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
            Connect Pyracrypt
          </Button>
        </div>
      </div>
      {apps.length === 0 && replitApps.length === 0 ? (
        <div className="text-xs text-muted-foreground p-3 bg-muted/20 rounded-lg border border-border">
          No apps yet. Add any app above or import your apps.
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {apps.map((app) => (
            <div key={app.id} className="border border-border rounded-xl overflow-hidden">
              <button className="w-full flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/40 text-left" onClick={() => setExpandedId(expandedId === `m-${app.id}` ? null : `m-${app.id}`)}>
                <div className="flex items-center gap-2 min-w-0">
                  <Globe className="w-4 h-4 text-[#5BA8A0] flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{app.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{app.url} {app.hostingProvider && `· ${app.hostingProvider}`}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <Badge variant="secondary" className="text-xs">{app.slugs.length} pages</Badge>
                  {expandedId === `m-${app.id}` ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
              </button>
              {expandedId === `m-${app.id}` && (
                <div className="px-3 pb-3 pt-1 space-y-1 border-t border-border bg-muted/10">
                  {app.slugs.map((slug) => (
                    <a key={slug} href={`/${slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[#5BA8A0] hover:underline">
                      <ArrowRight className="w-2.5 h-2.5" /> /{slug} <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
          {replitApps.map((app) => (
            <div key={app.replId} className="border border-border rounded-xl overflow-hidden">
              <button className="w-full flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/40 text-left" onClick={() => setExpandedId(expandedId === `r-${app.replId}` ? null : `r-${app.replId}`)}>
                <div className="flex items-center gap-2 min-w-0">
                  <Package className="w-4 h-4 text-[#F26207] flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{app.title}</p>
                    <p className="text-xs text-muted-foreground">{app.pages.length} pages{app.subApps.length > 0 ? ` · ${app.subApps.length} mini-apps` : ""}</p>
                  </div>
                </div>
                {expandedId === `r-${app.replId}` ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>
              {expandedId === `r-${app.replId}` && (
                <div className="px-3 pb-3 pt-1 border-t border-border bg-muted/10 space-y-2">
                  {app.pages.map((p) => (
                    <a key={p.slug} href={`/${p.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[#5BA8A0] hover:underline">
                      <ArrowRight className="w-2.5 h-2.5" /> /{p.slug} <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </a>
                  ))}
                  {app.subApps.length > 0 && (
                    <div className="pt-1 border-t border-border space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Layers className="w-3 h-3" /> Mini-apps</p>
                      {app.subApps.map((sub) => (
                        <div key={sub.name} className="pl-3 border-l-2 border-[#5BA8A0]/30">
                          <p className="text-xs font-medium">{sub.name}</p>
                          {sub.pages.map((p) => (
                            <a key={p.slug} href={`/${p.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[#5BA8A0] hover:underline">
                              <ArrowRight className="w-2.5 h-2.5" /> /{p.slug} <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                            </a>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export function SeedsFunnelSetup() {
  const [activeTab, setActiveTab] = useState<"apps" | "domain" | "traffic">("apps");
  const [showAddApp, setShowAddApp] = useState(false);
  const [importResult, setImportResult] = useState<{ totalApps: number; totalPages: number } | null>(null);

  const { data: status, refetch: refetchStatus } = useQuery<FunnelStatus>({
    queryKey: ["/api/seeds/credentials"],
    queryFn: () => authFetch("/api/seeds/credentials").then((r) => r.json()),
  });

  const { data: appList, isLoading: appsLoading } = useQuery<AppsListData>({
    queryKey: ["/api/seeds/apps-list"],
    queryFn: () => authFetch("/api/seeds/apps-list").then((r) => r.json()),
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      const res = await authFetch("/api/seeds/replit-apps", { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Import failed");
      return res.json();
    },
    onSuccess: (data) => {
      setImportResult({ totalApps: data.totalApps, totalPages: data.totalPages });
      queryClient.invalidateQueries({ queryKey: ["/api/seeds/apps-list"] });
    },
  });

  const manualApps = appList?.manualApps || [];
  const replitApps = appList?.replitApps || [];
  const totalApps = manualApps.length + replitApps.length;
  const tabs = [
    { id: "apps" as const, label: "Apps", count: totalApps },
    { id: "domain" as const, label: "Domain" },
    { id: "traffic" as const, label: "Traffic + AI Chat" },
  ];

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-4 space-y-4">
            <div className="flex gap-1 bg-muted/40 rounded-lg p-1">
              {tabs.map((t) => (
                <button key={t.id} onClick={() => { setActiveTab(t.id); setShowAddApp(false); }}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${activeTab === t.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  data-testid={`tab-${t.id}`}>
                  {t.label}{t.count !== undefined && t.count > 0 ? ` (${t.count})` : ""}
                </button>
              ))}
            </div>

            {/* Apps tab */}
            {activeTab === "apps" && !showAddApp && (
              <div className="space-y-3">
                <ReplitConnectBlock connected={!!status?.hasReplit} />
                {appsLoading ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground p-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...</div>
                ) : (
                  <AppsList apps={manualApps} replitApps={replitApps} onAddApp={() => setShowAddApp(true)} onImportReplit={() => importMutation.mutate()} importPending={importMutation.isPending} />
                )}
                {importMutation.isError && <p className="text-xs text-red-500">{(importMutation.error as Error).message}</p>}
                {importResult && <p className="text-xs text-green-600">{importResult.totalApps} apps imported → {importResult.totalPages} marketing pages live.</p>}
              </div>
            )}

            {activeTab === "apps" && showAddApp && (
              <AddAppPanel onDone={() => { setShowAddApp(false); queryClient.invalidateQueries({ queryKey: ["/api/seeds/apps-list"] }); }} />
            )}

            {activeTab === "domain" && <DomainPanel />}
            {activeTab === "traffic" && <TrafficPanel apps={manualApps} replitApps={replitApps} />}
          </CardContent>
      </Card>
    </div>
  );
}
