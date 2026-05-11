"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Rocket,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Zap,
  Globe,
  Target,
  BookOpen,
  Radio,
  Github,
  Mail,
  TrendingUp,
  Shield,
  BarChart2,
  Newspaper,
  Brain,
  ChevronDown,
  ChevronUp,
  Play,
} from "lucide-react";

type Product = "svivva" | "pyracrypt" | "mini_apps";
type DirStatus = "pending" | "submitted" | "live" | "rejected";
type DirCategory = "ai_tools" | "saas" | "developer" | "pr" | "social" | "security";

const PRODUCTS: { id: Product; label: string; emoji: string }[] = [
  { id: "svivva", label: "Svivva", emoji: "🌱" },
  { id: "pyracrypt", label: "Pyracrypt", emoji: "🔐" },
  { id: "mini_apps", label: "Mini Apps", emoji: "⚡" },
];

const CONTENT_TYPES = [
  { id: "tweet_thread", label: "Twitter/X Thread", icon: "🐦", desc: "Hook + 8-tweet thread" },
  { id: "reddit_post", label: "Reddit Post", icon: "👾", desc: "Genuine builder post" },
  { id: "linkedin_post", label: "LinkedIn Post", icon: "💼", desc: "Professional reach" },
  { id: "producthunt_copy", label: "Product Hunt Kit", icon: "🚀", desc: "Full launch package" },
  { id: "blog_outline", label: "Blog Post Outline", icon: "📝", desc: "SEO-targeted outline" },
  { id: "press_release", label: "Press Release", icon: "📰", desc: "Submit to free PR sites" },
  { id: "aeo_content", label: "AEO Content", icon: "🤖", desc: "Perplexity/ChatGPT citations" },
  { id: "competitor_comparison", label: "Competitor Pages", icon: "📊", desc: '"vs" SEO pages' },
  { id: "podcast_pitch", label: "Podcast Pitches", icon: "🎙️", desc: "3 personalized emails" },
  { id: "github_seo", label: "GitHub SEO", icon: "💻", desc: "Dev content + links" },
  { id: "email_newsletter", label: "Email Newsletter", icon: "📧", desc: "Weekly draft" },
];

const CATEGORY_LABELS: Record<DirCategory, string> = {
  ai_tools: "AI Tools",
  saas: "SaaS",
  developer: "Developer",
  pr: "Free PR",
  social: "Social",
  security: "Security",
};

const STATUS_STYLES: Record<DirStatus, string> = {
  pending: "bg-muted/30 text-muted-foreground border-border",
  submitted: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  live: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-600 border-red-500/20",
};

const NOVEL_TACTICS = [
  {
    id: "aeo",
    icon: Brain,
    title: "Answer Engine Optimization",
    badge: "🔥 New",
    desc: "Structure your content so AI search engines (Perplexity, ChatGPT, Gemini) cite Svivva when users ask how to ship AI products fast. Most competitors don't do this yet.",
    action: "aeo_content",
    howTo:
      "Generate AEO content → add it to your website as a dedicated FAQ page → AI engines will cite it within weeks.",
  },
  {
    id: "competitor",
    icon: Target,
    title: "Competitor Keyword Hijacking",
    badge: "High Impact",
    desc: 'When someone searches "Zapier alternative" or "Make vs Bubble", your comparison pages rank instead. Captures ready-to-buy traffic.',
    action: "competitor_comparison",
    howTo:
      'Generate comparison content → publish as /vs/zapier, /vs/make pages → target "competitor alternative" searches.',
  },
  {
    id: "github",
    icon: Github,
    title: "GitHub SEO Strategy",
    badge: "Passive",
    desc: "Publish useful code snippets/gists that solve real problems and naturally reference Svivva. GitHub results rank high on Google for developer queries.",
    action: "github_seo",
    howTo:
      "Generate GitHub content → post as Gists → add to relevant GitHub awesome-lists → get passive developer traffic.",
  },
  {
    id: "pr_mill",
    icon: Newspaper,
    title: "Micro-PR Mill",
    badge: "Backlinks",
    desc: "Submit press releases to 6 free PR sites weekly. Each one is indexed by Google within 24h and creates high-authority backlinks. Most founders never do this.",
    action: "press_release",
    howTo:
      "Generate press release → paste into PRLog, OpenPR, PR.com → submit → repeat weekly with new angle.",
  },
  {
    id: "podcast",
    icon: Radio,
    title: "Podcast Pitch Automation",
    badge: "Brand",
    desc: "There are 3M+ podcasts. AI/tech/founder shows are always looking for guests. Being on 1 podcast = hours of evergreen content + backlink + email subscribers.",
    action: "podcast_pitch",
    howTo:
      "Generate 3 pitches → send to target podcasts → 1 in 10 typically responds → each appearance drives traffic for years.",
  },
  {
    id: "newsletter",
    icon: Mail,
    title: "Newsletter SEO",
    badge: "Compound",
    desc: "A weekly newsletter builds your email list AND gets picked up by newsletter aggregators (e.g., Substack Discovery), creating additional discovery channels.",
    action: "email_newsletter",
    howTo:
      "Generate weekly draft → publish on Substack or Beehiiv (free) → optimize for discovery → compounds over time.",
  },
  {
    id: "velocity",
    icon: Zap,
    title: "Content Velocity Engine",
    badge: "SEO",
    desc: "Google rewards consistent publishing. Generate 10 unique landing pages per week targeting long-tail keywords. Each page is a new entry point from search.",
    action: "blog_outline",
    howTo:
      "Generate blog outline → create page → publish to /blog/[slug] → repeat weekly. Volume beats perfection in SEO.",
  },
  {
    id: "embedded",
    icon: Globe,
    title: "Embedded Growth (Powered by Svivva)",
    badge: "Viral Loop",
    desc: 'Every mini app gets a "Powered by Svivva" footer link. As mini apps grow their own traffic, each one sends link equity and visitors back to Svivva automatically.',
    action: null,
    howTo:
      "Add 'Powered by Svivva' badge to all mini app pages with a dofollow link. Deploy more mini apps to expand the network.",
  },
];

function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return { copied, copy };
}

export default function GrowthPage() {
  const [product, setProduct] = useState<Product>("svivva");
  const [catFilter, setCatFilter] = useState<DirCategory | "all">("all");
  const [contentType, setContentType] = useState("tweet_thread");
  const [generatedContent, setGeneratedContent] = useState<{
    title: string;
    content: string;
  } | null>(null);
  const [expandedTactic, setExpandedTactic] = useState<string | null>(null);
  const { copied, copy } = useCopyToClipboard();

  const {
    data: dirData,
    isLoading: dirLoading,
    refetch: refetchDirs,
  } = useQuery({
    queryKey: ["/api/growth/directories", product],
    queryFn: async () => {
      const r = await authFetch(`/api/growth/directories?product=${product}`);
      return r.json();
    },
    staleTime: 30_000,
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/growth/tasks"],
    queryFn: async () => {
      const r = await authFetch("/api/growth/tasks");
      return r.json();
    },
    staleTime: 30_000,
  });

  const { data: contentHistory, refetch: refetchContent } = useQuery({
    queryKey: ["/api/growth/content", product],
    queryFn: async () => {
      const r = await authFetch(`/api/growth/content?product=${product}`);
      return r.json();
    },
    staleTime: 30_000,
  });

  const submitDirMutation = useMutation({
    mutationFn: async ({ directoryId, status }: { directoryId: string; status: DirStatus }) => {
      const r = await authFetch("/api/growth/directories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directoryId, product, status }),
      });
      return r.json();
    },
    onSuccess: () => refetchDirs(),
  });

  const generateMutation = useMutation({
    mutationFn: async ({ type }: { type: string }) => {
      const r = await authFetch("/api/growth/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, contentType: type }),
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error || "Failed");
      }
      return r.json();
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
      refetchContent();
    },
  });

  const runTasksMutation = useMutation({
    mutationFn: async () => {
      const r = await authFetch("/api/growth/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      return r.json();
    },
  });

  const dirs = dirData?.directories ?? [];
  const stats = dirData?.stats ?? { total: 0, submitted: 0, live: 0 };
  const filteredDirs =
    catFilter === "all" ? dirs : dirs.filter((d: any) => d.category === catFilter);
  const tasks = tasksData?.tasks ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-6 h-6 text-[#5BA8A0]" />
            <h1 className="text-2xl font-bold tracking-tight">Growth Engine</h1>
            <Badge
              variant="outline"
              className="text-xs bg-[#5BA8A0]/10 text-[#5BA8A0] border-[#5BA8A0]/30"
            >
              AI-Powered
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Svivva's AI marketing team — directories, content, and novel tactics that run on
            autopilot.
          </p>
        </div>
        <Button
          size="sm"
          className="bg-[#5BA8A0] hover:bg-[#5BA8A0]/90 text-white gap-2"
          onClick={() => runTasksMutation.mutate()}
          disabled={runTasksMutation.isPending}
          data-testid="btn-run-weekly"
        >
          <Play className="w-3.5 h-3.5" />
          {runTasksMutation.isPending ? "Running…" : "Run Weekly Tasks"}
        </Button>
      </div>

      {/* Product selector */}
      <div className="flex gap-2">
        {PRODUCTS.map((p) => (
          <button
            key={p.id}
            onClick={() => setProduct(p.id)}
            data-testid={`btn-product-${p.id}`}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${product === p.id ? "bg-[#5BA8A0] text-white border-[#5BA8A0]" : "border-border/60 hover:bg-muted/40"}`}
          >
            <span>{p.emoji}</span> {p.label}
          </button>
        ))}
      </div>

      {/* Stats row */}
      {runTasksMutation.isSuccess && (
        <div className="px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-700 dark:text-emerald-400">
          Weekly tasks complete:{" "}
          {(runTasksMutation.data as any)?.results
            ?.map((r: any) => `${r.task} (${r.status})`)
            .join(" · ")}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Directories targeted", value: stats.total, sub: `for ${product}` },
          {
            label: "Submitted",
            value: stats.submitted,
            sub: `${stats.total > 0 ? Math.round((stats.submitted / stats.total) * 100) : 0}% coverage`,
          },
          { label: "Live listings", value: stats.live, sub: "confirmed backlinks" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="py-4 px-5">
              <p className="text-2xl font-bold tabular-nums">{dirLoading ? "—" : s.value}</p>
              <p className="text-xs font-medium text-foreground mt-0.5">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="directories">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="directories" data-testid="tab-directories">
            Directory Blitz
          </TabsTrigger>
          <TabsTrigger value="content" data-testid="tab-content">
            AI Copy Engine
          </TabsTrigger>
          <TabsTrigger value="tactics" data-testid="tab-tactics">
            Novel Tactics
          </TabsTrigger>
          <TabsTrigger value="log" data-testid="tab-log">
            Automation Log
          </TabsTrigger>
        </TabsList>

        {/* ── DIRECTORY BLITZ ── */}
        <TabsContent value="directories" className="space-y-4 mt-4">
          <div className="flex gap-2 flex-wrap">
            {(["all", "ai_tools", "saas", "developer", "pr", "social", "security"] as const).map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setCatFilter(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${catFilter === cat ? "bg-[#5BA8A0] text-white border-[#5BA8A0]" : "border-border/60 hover:bg-muted/40"}`}
                >
                  {cat === "all" ? "All" : CATEGORY_LABELS[cat]}
                </button>
              ),
            )}
            <span className="ml-auto text-xs text-muted-foreground self-center">
              {filteredDirs.length} directories
            </span>
          </div>

          {dirLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))
          ) : (
            <div className="grid gap-2">
              {filteredDirs.map((d: any) => (
                <Card key={d.id} className="border-border/50">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{d.name}</span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${STATUS_STYLES[d.status as DirStatus]}`}
                          >
                            {d.status}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-[10px] border-border/50 text-muted-foreground"
                          >
                            {CATEGORY_LABELS[d.category as DirCategory]}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {(d.estimatedVisitors / 1000).toFixed(0)}K/mo
                          </span>
                        </div>
                        {d.tip && <p className="text-[11px] text-[#5BA8A0] mt-0.5">💡 {d.tip}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {d.status === "pending" && (
                          <>
                            <a href={d.submitUrl} target="_blank" rel="noopener noreferrer">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1 border-[#5BA8A0]/40 text-[#5BA8A0] hover:bg-[#5BA8A0]/10"
                                onClick={() =>
                                  submitDirMutation.mutate({
                                    directoryId: d.id,
                                    status: "submitted",
                                  })
                                }
                                data-testid={`btn-submit-${d.id}`}
                              >
                                Submit <ExternalLink className="w-3 h-3" />
                              </Button>
                            </a>
                          </>
                        )}
                        {d.status === "submitted" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10"
                            onClick={() =>
                              submitDirMutation.mutate({ directoryId: d.id, status: "live" })
                            }
                            data-testid={`btn-mark-live-${d.id}`}
                          >
                            Mark Live
                          </Button>
                        )}
                        {d.status === "live" && <Check className="w-4 h-4 text-emerald-500" />}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── AI COPY ENGINE ── */}
        <TabsContent value="content" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CONTENT_TYPES.map((ct) => (
              <button
                key={ct.id}
                onClick={() => setContentType(ct.id)}
                data-testid={`btn-content-${ct.id}`}
                className={`text-left p-3 rounded-lg border text-sm transition-colors ${contentType === ct.id ? "border-[#5BA8A0] bg-[#5BA8A0]/10" : "border-border/50 hover:bg-muted/30"}`}
              >
                <span className="text-base">{ct.icon}</span>
                <p className="font-semibold text-xs mt-1">{ct.label}</p>
                <p className="text-[10px] text-muted-foreground">{ct.desc}</p>
              </button>
            ))}
          </div>

          <Button
            className="w-full bg-[#5BA8A0] hover:bg-[#5BA8A0]/90 text-white gap-2"
            onClick={() => generateMutation.mutate({ type: contentType })}
            disabled={generateMutation.isPending}
            data-testid="btn-generate-content"
          >
            <Zap className="w-4 h-4" />
            {generateMutation.isPending
              ? "Generating…"
              : `Generate ${CONTENT_TYPES.find((c) => c.id === contentType)?.label} for ${PRODUCTS.find((p) => p.id === product)?.label}`}
          </Button>

          {generateMutation.isError && (
            <p className="text-sm text-red-600">{(generateMutation.error as Error).message}</p>
          )}

          {generatedContent && (
            <Card className="border-[#5BA8A0]/30 bg-[#5BA8A0]/5">
              <CardHeader className="pb-2 pt-4 px-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{generatedContent.title}</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={() => copy(generatedContent.content)}
                    data-testid="btn-copy-content"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed text-foreground/80 max-h-96 overflow-y-auto">
                  {generatedContent.content}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Content history */}
          {(contentHistory?.items?.length ?? 0) > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Recent generations
              </p>
              <div className="space-y-2">
                {contentHistory.items.slice(0, 5).map((item: any) => (
                  <Card key={item.id} className="border-border/50">
                    <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-semibold">{item.title}</span>
                        <span className="text-[10px] text-muted-foreground ml-2">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() =>
                          setGeneratedContent({ title: item.title, content: item.content })
                        }
                      >
                        View
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── NOVEL TACTICS ── */}
        <TabsContent value="tactics" className="space-y-3 mt-4">
          <p className="text-sm text-muted-foreground">
            Unconventional traffic strategies most competitors haven't thought of yet.
          </p>
          {NOVEL_TACTICS.map((tactic) => {
            const Icon = tactic.icon;
            const isExpanded = expandedTactic === tactic.id;
            return (
              <Card key={tactic.id} className="border-border/50">
                <CardContent className="py-4 px-5">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-[#5BA8A0]/10 flex items-center justify-center">
                      <Icon className="w-4.5 h-4.5 text-[#5BA8A0]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm">{tactic.title}</span>
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-[#5BA8A0]/10 text-[#5BA8A0] border-[#5BA8A0]/30"
                        >
                          {tactic.badge}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{tactic.desc}</p>
                      {isExpanded && (
                        <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                          <p className="text-xs font-semibold mb-1">How to execute:</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {tactic.howTo}
                          </p>
                        </div>
                      )}
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs px-2 gap-1"
                          onClick={() => setExpandedTactic(isExpanded ? null : tactic.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                          {isExpanded ? "Less" : "How to"}
                        </Button>
                        {tactic.action && (
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-[#5BA8A0] hover:bg-[#5BA8A0]/90 text-white gap-1"
                            onClick={() => {
                              setContentType(tactic.action!);
                              document
                                .querySelector('[data-testid="tab-content"]')
                                ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
                            }}
                            data-testid={`btn-tactic-generate-${tactic.id}`}
                          >
                            <Zap className="w-3 h-3" /> Generate content
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ── AUTOMATION LOG ── */}
        <TabsContent value="log" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Automated tasks run weekly. Logs last 100 runs.
            </p>
          </div>

          {tasksLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))
          ) : tasks.length === 0 ? (
            <Card className="border-dashed border-border/50">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No tasks run yet. Click <strong>Run Weekly Tasks</strong> to start.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {tasks.map((t: any) => (
                <Card key={t.id} className="border-border/50">
                  <CardContent className="py-3 px-4 flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${t.status === "completed" ? "bg-emerald-500" : t.status === "failed" ? "bg-red-500" : "bg-amber-500"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold">{t.taskType.replace(/_/g, " ")}</span>
                      {t.product && (
                        <span className="text-[10px] text-muted-foreground ml-2">
                          · {t.product}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(t.runAt).toLocaleString()}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
