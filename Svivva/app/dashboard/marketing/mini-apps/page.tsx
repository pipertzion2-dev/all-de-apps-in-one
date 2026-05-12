"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authFetch } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Globe,
  FileText,
  ArrowRight,
  Rocket,
  Copy,
  Edit3,
  Trash2,
  Plus,
  Play,
  List,
  Bot,
  Search,
  Zap,
  RefreshCw,
  X,
  Check,
  LayoutGrid,
  Package,
} from "lucide-react";

const PINK = "#E91E8C";
const STEPS = [
  { id: 1, label: "Your App", icon: Globe },
  { id: 2, label: "50 Mini Apps", icon: List },
  { id: 3, label: "Generate Pages", icon: Sparkles },
  { id: 4, label: "Go Live", icon: Rocket },
];

interface MiniApp {
  name: string;
  path: string;
  description: string;
}
interface GeneratedPage {
  name: string;
  slug: string;
  url: string;
  ok: boolean;
  error?: string;
}

function PinkBtn({
  children,
  onClick,
  disabled,
  variant = "primary",
  size = "sm",
  testId,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  testId?: string;
}) {
  const sz =
    size === "lg"
      ? "px-6 py-3 text-sm"
      : size === "md"
        ? "px-4 py-2 text-xs"
        : "px-3 py-1.5 text-xs";
  const v = {
    primary: { background: disabled ? "#f9a8d4" : PINK, color: "white", border: "none" },
    outline: { background: "transparent", color: PINK, border: `2px solid ${PINK}` },
    ghost: { background: "transparent", color: PINK, border: "none" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className={`inline-flex items-center gap-1.5 rounded-xl font-semibold transition-all disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] ${sz}`}
      style={v[variant]}
    >
      {children}
    </button>
  );
}

function Step({
  n,
  label,
  icon: Icon,
  active,
  done,
}: {
  n: number;
  label: string;
  icon: any;
  active: boolean;
  done: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 ${active ? "opacity-100" : done ? "opacity-70" : "opacity-35"}`}
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
        style={{
          background: done ? "#22c55e" : active ? PINK : "#e5e7eb",
          color: done || active ? "white" : "#9ca3af",
        }}
      >
        {done ? <Check className="w-3.5 h-3.5" /> : n}
      </div>
      <span
        className="text-sm font-medium hidden sm:block"
        style={{ color: active ? PINK : done ? "#16a34a" : "#6b7280" }}
      >
        {label}
      </span>
    </div>
  );
}

function AppRow({
  app,
  i,
  onEdit,
  onRemove,
}: {
  app: MiniApp;
  i: number;
  onEdit: (i: number, field: keyof MiniApp, v: string) => void;
  onRemove: (i: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="grid grid-cols-[2fr_3fr_auto] gap-2 p-2 rounded-lg border border-border bg-white dark:bg-card text-xs items-start">
      <div>
        {editing ? (
          <input
            className="w-full border border-border rounded px-2 py-1 text-xs"
            value={app.name}
            onChange={(e) => onEdit(i, "name", e.target.value)}
          />
        ) : (
          <span className="font-semibold text-foreground">{app.name}</span>
        )}
        {editing ? (
          <input
            className="w-full border border-border rounded px-2 py-1 text-xs mt-1 font-mono"
            value={app.path}
            onChange={(e) => onEdit(i, "path", e.target.value)}
            placeholder="/tools/name"
          />
        ) : (
          <span className="block text-muted-foreground font-mono">{app.path}</span>
        )}
      </div>
      <div>
        {editing ? (
          <textarea
            className="w-full border border-border rounded px-2 py-1 text-xs resize-none"
            rows={2}
            value={app.description}
            onChange={(e) => onEdit(i, "description", e.target.value)}
          />
        ) : (
          <span className="text-muted-foreground line-clamp-2">{app.description}</span>
        )}
      </div>
      <div className="flex gap-1">
        <button onClick={() => setEditing(!editing)} className="p-1 rounded hover:bg-muted/50">
          <Edit3 className="w-3 h-3 text-muted-foreground" />
        </button>
        <button onClick={() => onRemove(i)} className="p-1 rounded hover:bg-red-50">
          <X className="w-3 h-3 text-red-400" />
        </button>
      </div>
    </div>
  );
}

export default function MiniAppsGuide() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [appName, setAppName] = useState("");
  const [appUrl, setAppUrl] = useState("");
  const [replId, setReplId] = useState("");
  const [appDescription, setAppDescription] = useState("");
  const [miniApps, setMiniApps] = useState<MiniApp[]>([]);
  const [pasteText, setPasteText] = useState("");
  const [inputMode, setInputMode] = useState<"ai" | "paste" | "manual">("ai");
  const [generatedPages, setGeneratedPages] = useState<GeneratedPage[]>([]);
  const [batchProgress, setBatchProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [indexnowResult, setIndexnowResult] = useState<{
    submitted: boolean;
    count: number;
  } | null>(null);
  const [googleIndexingResult, setGoogleIndexingResult] = useState<{
    submitted: number;
    errors: string[];
  } | null>(null);
  const [comparisons, setComparisons] = useState<
    { name: string; slug: string; url: string; ok: boolean }[]
  >([]);
  const [isGeneratingComparisons, setIsGeneratingComparisons] = useState(false);
  const [competitorInput, setCompetitorInput] = useState("");
  const progressRef = useRef<boolean>(false);

  const { data: me, isLoading: meLoading } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/auth/me"],
    queryFn: () => authFetch("/api/auth/me").then((r) => r.json()),
  });

  useEffect(() => {
    if (!meLoading && me && !me.isAdmin) router.replace("/dashboard");
  }, [me, meLoading, router]);

  const { data: existingPages, refetch: refetchPages } = useQuery<{ pages: any[]; total: number }>({
    queryKey: ["/api/marketing/mini-apps"],
    queryFn: () => authFetch("/api/marketing/mini-apps").then((r) => r.json()),
    enabled: !!me?.isAdmin,
  });

  const discoverMutation = useMutation({
    mutationFn: async () => {
      if (!appName || !appDescription) throw new Error("Enter your app name and description first");
      const res = await authFetch("/api/marketing/mini-apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ai-discover-apps",
          appName,
          appUrl,
          appDescription,
          count: 50,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: (data) => setMiniApps(data.apps || []),
  });

  const parsePaste = () => {
    const lines = pasteText.trim().split("\n").filter(Boolean);
    const parsed: MiniApp[] = lines.map((line) => {
      const [name, desc] = line.split("|").map((s) => s.trim());
      const path = "/tools/" + (name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return { name: name || line.trim(), path, description: desc || "" };
    });
    setMiniApps(parsed);
  };

  const addManual = () =>
    setMiniApps((prev) => [
      ...prev,
      { name: "New Tool", path: "/tools/new-tool", description: "" },
    ]);
  const editApp = (i: number, field: keyof MiniApp, v: string) =>
    setMiniApps((prev) => {
      const n = [...prev];
      n[i] = { ...n[i], [field]: v };
      return n;
    });
  const removeApp = (i: number) => setMiniApps((prev) => prev.filter((_, idx) => idx !== i));

  const runGeneration = async () => {
    if (!miniApps.length || !replId) return;
    setIsGenerating(true);
    progressRef.current = true;
    setBatchProgress(0);
    setGeneratedPages([]);
    setIndexnowResult(null);
    setGoogleIndexingResult(null);

    const BATCH = 5;
    let start = 0;
    let allCreated: GeneratedPage[] = [];
    let lastIndexnow = { submitted: false, count: 0 };
    let totalGoogleSubmitted = 0;

    while (start < miniApps.length && progressRef.current) {
      try {
        const res = await authFetch("/api/marketing/mini-apps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "generate-pages-batch",
            apps: miniApps,
            replId,
            replTitle: appName,
            replUrl: appUrl,
            batchStart: start,
            batchSize: BATCH,
          }),
        });
        const data = await res.json();
        if (data.created) {
          allCreated = [...allCreated, ...data.created];
          setGeneratedPages([...allCreated]);
        }
        if (data.indexnow) lastIndexnow = data.indexnow;
        if (data.googleIndexing?.submitted) totalGoogleSubmitted += data.googleIndexing.submitted;
        setBatchProgress(Math.min(allCreated.length, miniApps.length));
        start += BATCH;
        if (data.remaining === 0) break;
      } catch (e) {
        console.error("Batch error", e);
        break;
      }
    }

    setIndexnowResult(lastIndexnow);
    if (totalGoogleSubmitted > 0)
      setGoogleIndexingResult({ submitted: totalGoogleSubmitted, errors: [] });
    setIsGenerating(false);
    progressRef.current = false;
    refetchPages();
    if (allCreated.filter((c) => c.ok).length > 0) setStep(4);
  };

  const runComparisonGeneration = async () => {
    if (!miniApps.length || !replId) return;
    setIsGeneratingComparisons(true);
    const competitors = competitorInput.trim()
      ? competitorInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;
    try {
      const res = await authFetch("/api/marketing/mini-apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-comparison-pages",
          apps: miniApps,
          replId,
          replTitle: appName,
          replUrl: appUrl,
          ...(competitors ? { competitors } : {}),
        }),
      });
      const data = await res.json();
      setComparisons(data.created || []);
      refetchPages();
    } catch (e) {
      console.error("Comparison error", e);
    }
    setIsGeneratingComparisons(false);
  };

  if (meLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  if (!me?.isAdmin) return null;

  const successCount = generatedPages.filter((p) => p.ok).length;
  const canProceedStep1 = appName && appUrl && replId && appDescription;
  const canProceedStep2 = miniApps.length > 0;
  const canGenerate = miniApps.length > 0 && replId && !isGenerating;

  return (
    <div
      className="min-h-screen p-6"
      style={{ background: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 20%, #ffffff 60%)" }}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <div
          className="rounded-2xl p-6 text-white shadow-lg relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${PINK} 0%, #9c27b0 60%, #673ab7 100%)` }}
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 50%)",
            }}
          />
          <div className="relative flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold mb-1">50 Mini-App Marketing Setup</h1>
              <p className="text-pink-100 text-sm leading-relaxed">
                Turn your single Replit app's 50 internal tools into 50 individual SEO landing pages
                — each with its own URL, Google ranking, and traffic funnel. AI writes all the
                content.
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard/marketing")}
              className="text-white/60 hover:text-white text-xs flex items-center gap-1"
            >
              ← Back
            </button>
          </div>

          {existingPages && existingPages.total > 0 && (
            <div className="relative mt-4 bg-white/15 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-300" />
                <span>{existingPages.total} mini-app pages already live</span>
              </div>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-pink-100 hover:text-white flex items-center gap-1"
              >
                View in sitemap <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        <div className="bg-white/80 dark:bg-card/80 rounded-2xl border border-pink-100 dark:border-pink-900/20 p-4 shadow-sm">
          <div className="flex items-center gap-6">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3">
                <Step
                  n={s.id}
                  label={s.label}
                  icon={s.icon}
                  active={step === s.id}
                  done={step > s.id}
                />
                {i < STEPS.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {step === 1 && (
          <div className="bg-white dark:bg-card rounded-2xl border border-pink-100 dark:border-pink-900/20 shadow-sm overflow-hidden">
            <div
              className="p-5 border-b border-pink-50 dark:border-pink-900/10"
              style={{ background: `${PINK}08` }}
            >
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Globe className="w-5 h-5" style={{ color: PINK }} /> Step 1: Tell us about your app
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                We need the basics to generate 50 unique, on-brand marketing pages for your
                mini-apps.
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">App Name *</label>
                  <input
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="e.g. Svivva Play"
                    data-testid="input-app-name"
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-background"
                    style={{ "--tw-ring-color": PINK } as any}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Replit App URL *
                  </label>
                  <input
                    value={appUrl}
                    onChange={(e) => setAppUrl(e.target.value)}
                    placeholder="https://your-app.vercel.app or https://tools.yourdomain.com"
                    data-testid="input-app-url"
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none font-mono bg-background"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Replit App ID (replId) *
                </label>
                <input
                  value={replId}
                  onChange={(e) => setReplId(e.target.value)}
                  placeholder="e.g. svivva-play or the repl slug from your URL"
                  data-testid="input-repl-id"
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none font-mono bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Used as a unique key — can be your app's slug or any stable identifier
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  What does your app do? (describe all 50 tools briefly) *
                </label>
                <textarea
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  placeholder="e.g. Svivva Play is an AI music production platform with tools for beat making, melody generation, chord progression builder, drum sequencer, audio effects, mastering, collaboration, lyric writing, sample packs, MIDI editor, etc."
                  rows={4}
                  data-testid="input-app-description"
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none resize-none bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  The more detail you give, the better AI will generate unique descriptions for each
                  mini-app.
                </p>
              </div>

              <div
                className="bg-pink-50 dark:bg-pink-950/20 rounded-xl p-3 text-xs space-y-1"
                style={{ border: `1px solid ${PINK}20` }}
              >
                <p className="font-semibold" style={{ color: PINK }}>
                  What happens next:
                </p>
                <p className="text-muted-foreground">
                  AI will read your description and automatically generate names, paths, and
                  descriptions for all 50 mini-apps. You can edit them before generating pages.
                </p>
              </div>

              <PinkBtn
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                size="lg"
                testId="button-step1-next"
              >
                Continue — Set up 50 mini-apps <ChevronRight className="w-4 h-4" />
              </PinkBtn>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white dark:bg-card rounded-2xl border border-pink-100 dark:border-pink-900/20 shadow-sm overflow-hidden">
            <div
              className="p-5 border-b border-pink-50 dark:border-pink-900/10"
              style={{ background: `${PINK}08` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-lg flex items-center gap-2">
                    <List className="w-5 h-5" style={{ color: PINK }} /> Step 2: Define your 50
                    mini-apps
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {miniApps.length > 0
                      ? `${miniApps.length} mini-apps ready — review and edit before generating pages`
                      : "How would you like to add your mini-apps?"}
                  </p>
                </div>
                {miniApps.length > 0 && (
                  <Badge className="text-white" style={{ background: PINK }}>
                    {miniApps.length} apps
                  </Badge>
                )}
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    id: "ai",
                    icon: Bot,
                    label: "AI Discovers",
                    desc: "AI reads your description and generates all 50",
                  },
                  {
                    id: "paste",
                    icon: FileText,
                    label: "Paste a List",
                    desc: "One app per line: Name | Description",
                  },
                  { id: "manual", icon: Plus, label: "Manual Entry", desc: "Add apps one by one" },
                ].map(({ id, icon: Icon, label, desc }) => (
                  <button
                    key={id}
                    onClick={() => setInputMode(id as any)}
                    className="p-3 rounded-xl border-2 text-left transition-all"
                    style={
                      inputMode === id
                        ? { borderColor: PINK, background: PINK + "10" }
                        : { borderColor: "#e5e7eb" }
                    }
                  >
                    <Icon
                      className="w-4 h-4 mb-1.5"
                      style={{ color: inputMode === id ? PINK : "#9ca3af" }}
                    />
                    <p className="text-xs font-semibold">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>

              {inputMode === "ai" && (
                <div className="space-y-3">
                  <div className="bg-muted/40 rounded-xl p-3 text-xs text-muted-foreground">
                    AI will analyze:{" "}
                    <strong className="text-foreground">
                      "{appDescription.slice(0, 100)}
                      {appDescription.length > 100 ? "..." : ""}"
                    </strong>{" "}
                    and generate {50} mini-app names + descriptions.
                  </div>
                  {discoverMutation.isError && (
                    <p className="text-xs text-red-500">
                      {(discoverMutation.error as Error).message}
                    </p>
                  )}
                  <PinkBtn
                    onClick={() => discoverMutation.mutate()}
                    disabled={discoverMutation.isPending}
                    size="md"
                    testId="button-ai-discover"
                  >
                    {discoverMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> AI is discovering your 50
                        mini-apps...
                      </>
                    ) : (
                      <>
                        <Bot className="w-4 h-4" /> Let AI Discover My 50 Mini-Apps
                      </>
                    )}
                  </PinkBtn>
                </div>
              )}

              {inputMode === "paste" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Paste your app list (one per line)
                    </label>
                    <textarea
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      placeholder={
                        "Beat Maker | AI drum beat generator for producers\nMelody Builder | Create melodies with AI suggestions\nChord Progression | Smart chord progressions for any key\n..."
                      }
                      rows={8}
                      className="w-full border border-border rounded-xl px-3 py-2 text-sm font-mono focus:outline-none resize-none bg-background"
                    />
                    <p className="text-xs text-muted-foreground">
                      Format:{" "}
                      <code className="bg-muted px-1 rounded">App Name | Short description</code> —
                      or just the name if no description
                    </p>
                  </div>
                  <PinkBtn
                    onClick={parsePaste}
                    disabled={!pasteText.trim()}
                    size="md"
                    testId="button-parse-paste"
                  >
                    <List className="w-4 h-4" /> Parse List (
                    {pasteText.trim().split("\n").filter(Boolean).length} apps)
                  </PinkBtn>
                </div>
              )}

              {inputMode === "manual" && (
                <PinkBtn onClick={addManual} size="md" testId="button-add-manual">
                  <Plus className="w-4 h-4" /> Add a Mini-App
                </PinkBtn>
              )}

              {miniApps.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground">
                      {miniApps.length} mini-apps — click pencil to edit any
                    </p>
                    <div className="flex gap-2">
                      <PinkBtn variant="ghost" onClick={() => setMiniApps([])} size="sm">
                        Clear all
                      </PinkBtn>
                      <PinkBtn variant="ghost" onClick={addManual} size="sm">
                        <Plus className="w-3 h-3" /> Add one
                      </PinkBtn>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
                    {miniApps.map((app, i) => (
                      <AppRow key={i} app={app} i={i} onEdit={editApp} onRemove={removeApp} />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <PinkBtn variant="outline" onClick={() => setStep(1)} size="md">
                  <ChevronLeft className="w-4 h-4" /> Back
                </PinkBtn>
                <PinkBtn
                  onClick={() => setStep(3)}
                  disabled={!canProceedStep2}
                  size="md"
                  testId="button-step2-next"
                >
                  Generate {miniApps.length} marketing pages <ChevronRight className="w-4 h-4" />
                </PinkBtn>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white dark:bg-card rounded-2xl border border-pink-100 dark:border-pink-900/20 shadow-sm overflow-hidden">
            <div
              className="p-5 border-b border-pink-50 dark:border-pink-900/10"
              style={{ background: `${PINK}08` }}
            >
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5" style={{ color: PINK }} /> Step 3: AI generates{" "}
                {miniApps.length} landing pages
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Each mini-app gets a unique SEO page with custom headline, content, and meta tags —
                published instantly at /{"{slug}"}.
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                {[
                  { label: "Apps to process", value: miniApps.length, color: PINK },
                  { label: "Pages generated", value: successCount, color: "#22c55e" },
                  {
                    label: "Errors",
                    value: generatedPages.filter((p) => !p.ok).length,
                    color: "#ef4444",
                  },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl border border-border p-3">
                    <div className="text-2xl font-bold" style={{ color }}>
                      {value}
                    </div>
                    <div className="text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>

              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Generating pages... {batchProgress}/{miniApps.length}
                    </span>
                    <span style={{ color: PINK }}>
                      {Math.round((batchProgress / miniApps.length) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(batchProgress / miniApps.length) * 100}%`,
                        background: PINK,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    AI is writing unique content for each mini-app and publishing pages. IndexNow
                    submits each batch automatically.
                  </p>
                </div>
              )}

              {generatedPages.length > 0 && !isGenerating && (
                <>
                  <div className="grid grid-cols-1 gap-2">
                    {indexnowResult && (
                      <div
                        className={`rounded-xl p-3 text-xs ${indexnowResult.submitted ? "bg-green-50 border border-green-200 text-green-700" : "bg-yellow-50 border border-yellow-200 text-yellow-700"}`}
                      >
                        {indexnowResult.submitted
                          ? `✓ ${indexnowResult.count} URLs submitted to Bing + Yandex via IndexNow — search-visible within hours`
                          : "⚠ IndexNow key not set — go to Google Search tab in Marketing HQ to configure"}
                      </div>
                    )}
                    {googleIndexingResult && googleIndexingResult.submitted > 0 && (
                      <div className="rounded-xl p-3 text-xs bg-blue-50 border border-blue-200 text-blue-700">
                        ✓ {googleIndexingResult.submitted} URLs pushed directly to Googlebot via
                        Google Indexing API — typically indexed within minutes
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {generatedPages.map((p, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${p.ok ? "bg-green-50 dark:bg-green-950/10" : "bg-red-50 dark:bg-red-950/10"}`}
                      >
                        {p.ok ? (
                          <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                        )}
                        <span className="font-medium flex-1 truncate">{p.name}</span>
                        {p.ok && (
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 font-mono flex-shrink-0 hover:underline"
                            style={{ color: PINK }}
                          >
                            /{p.slug} <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                        {!p.ok && <span className="text-red-500 truncate max-w-32">{p.error}</span>}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {!isGenerating && generatedPages.length === 0 && (
                <div
                  className="bg-pink-50 dark:bg-pink-950/20 rounded-xl p-4 text-sm space-y-2"
                  style={{ border: `1px solid ${PINK}20` }}
                >
                  <p className="font-semibold" style={{ color: PINK }}>
                    Ready to generate {miniApps.length} pages
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• AI writes unique headline, content, and meta tags for each mini-app</li>
                    <li>
                      • Pages publish instantly at /
                      <span className="font-mono">{"{mini-app-slug}"}</span>
                    </li>
                    <li>
                      • Each batch of 5 pages is submitted to Bing/Yandex IndexNow immediately
                    </li>
                    <li>• All {miniApps.length} pages added to your sitemap.xml</li>
                  </ul>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {!isGenerating && generatedPages.length === 0 && (
                  <PinkBtn variant="outline" onClick={() => setStep(2)} size="md">
                    <ChevronLeft className="w-4 h-4" /> Edit apps
                  </PinkBtn>
                )}
                {isGenerating ? (
                  <PinkBtn
                    variant="outline"
                    onClick={() => {
                      progressRef.current = false;
                      setIsGenerating(false);
                    }}
                    size="md"
                  >
                    <X className="w-4 h-4" /> Stop generation
                  </PinkBtn>
                ) : (
                  <PinkBtn
                    onClick={runGeneration}
                    disabled={!canGenerate}
                    size="md"
                    testId="button-generate-pages"
                  >
                    <Rocket className="w-4 h-4" />
                    {generatedPages.length > 0
                      ? "Re-run generation"
                      : `Generate all ${miniApps.length} pages with AI`}
                  </PinkBtn>
                )}
                {!isGenerating && successCount > 0 && (
                  <PinkBtn onClick={() => setStep(4)} size="md" testId="button-step3-next">
                    View results <ChevronRight className="w-4 h-4" />
                  </PinkBtn>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="bg-white dark:bg-card rounded-2xl border border-pink-100 dark:border-pink-900/20 shadow-sm overflow-hidden">
            <div
              className="p-5 border-b border-pink-50 dark:border-pink-900/10"
              style={{ background: `${PINK}08` }}
            >
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Rocket className="w-5 h-5" style={{ color: PINK }} /> Step 4: Your mini-apps are
                live!
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-3">
                <p className="font-bold text-green-700 text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> {existingPages?.total || successCount}{" "}
                  mini-app marketing pages live
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Unique landing page per
                    mini-app
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Each page has unique SEO
                    meta tags
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" /> All pages in sitemap.xml
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Submitted to Bing/Yandex
                    IndexNow
                  </div>
                </div>
              </div>

              {(existingPages?.pages || generatedPages.filter((p) => p.ok)).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Live pages:</p>
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {(existingPages?.pages || generatedPages.filter((p) => p.ok))
                      .slice(0, 50)
                      .map((p: any, i: number) => (
                        <a
                          key={i}
                          href={p.url || `/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors group"
                        >
                          <LayoutGrid className="w-3 h-3 flex-shrink-0" style={{ color: PINK }} />
                          <span className="font-medium flex-1 truncate">{p.title || p.name}</span>
                          <span className="font-mono text-muted-foreground group-hover:text-foreground transition-colors">
                            /{p.slug}
                          </span>
                          <ExternalLink className="w-2.5 h-2.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
                        </a>
                      ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border border-border rounded-xl hover:bg-muted/30 transition-colors group"
                >
                  <FileText className="w-4 h-4 flex-shrink-0" style={{ color: PINK }} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium">View Sitemap</p>
                    <p className="text-xs text-muted-foreground">All URLs indexed</p>
                  </div>
                </a>
                <a
                  href="https://search.google.com/search-console"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border border-border rounded-xl hover:bg-muted/30 transition-colors group"
                >
                  <Search className="w-4 h-4 flex-shrink-0 text-[#4285F4]" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium">Google Search Console</p>
                    <p className="text-xs text-muted-foreground">Monitor indexing</p>
                  </div>
                </a>
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 p-3 border border-border rounded-xl hover:bg-muted/30 transition-colors text-left"
                >
                  <RefreshCw className="w-4 h-4 flex-shrink-0" style={{ color: PINK }} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium">Add more apps</p>
                    <p className="text-xs text-muted-foreground">Run again for new tools</p>
                  </div>
                </button>
              </div>

              {/* Comparison Pages */}
              <div className="border border-border rounded-2xl overflow-hidden">
                <div
                  className="p-4 flex items-center justify-between gap-3"
                  style={{ background: `${PINK}06` }}
                >
                  <div>
                    <p className="font-semibold text-sm flex items-center gap-2">
                      <Zap className="w-4 h-4" style={{ color: PINK }} /> Generate Comparison Pages
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      AI writes "Your Tool vs Competitor" pages — comparison searches convert 3-5x
                      better and rank fast
                    </p>
                  </div>
                  {comparisons.length > 0 && (
                    <Badge className="text-white flex-shrink-0" style={{ background: PINK }}>
                      {comparisons.length} live
                    </Badge>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Competitor names (comma-separated)
                    </label>
                    <input
                      value={competitorInput}
                      onChange={(e) => setCompetitorInput(e.target.value)}
                      placeholder="e.g. GarageBand, FL Studio, Ableton, Logic Pro"
                      data-testid="input-competitors"
                      className="w-full border border-border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none bg-background"
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave blank to use defaults. AI generates one "{"{tool}"} vs {"{competitor}"}"
                      page for your top 10 mini-apps.
                    </p>
                  </div>
                  <PinkBtn
                    onClick={runComparisonGeneration}
                    disabled={isGeneratingComparisons || !miniApps.length}
                    size="md"
                    testId="button-generate-comparisons"
                  >
                    {isGeneratingComparisons ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" /> Generate {Math.min(miniApps.length, 10)}{" "}
                        comparison pages
                      </>
                    )}
                  </PinkBtn>
                  {comparisons.length > 0 && (
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {comparisons
                        .filter((c) => c.ok)
                        .map((c, i) => (
                          <a
                            key={i}
                            href={c.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg hover:bg-muted/30 group"
                          >
                            <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                            <span className="flex-1 truncate">{c.name}</span>
                            <span className="font-mono text-muted-foreground text-xs group-hover:text-foreground">
                              /{c.slug}
                            </span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-muted-foreground" />
                          </a>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div
                className="bg-pink-50 dark:bg-pink-950/20 rounded-xl p-3 text-xs space-y-1.5"
                style={{ border: `1px solid ${PINK}20` }}
              >
                <p className="font-semibold" style={{ color: PINK }}>
                  What to do next for more traffic:
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-muted-foreground">
                  <li>
                    Run <strong className="text-foreground">AI Autopilot</strong> in the Marketing
                    HQ to auto-generate blog posts that link to your mini-app pages
                  </li>
                  <li>
                    Set up the <strong className="text-foreground">Google Indexing API</strong>{" "}
                    (Google Search tab) to notify Googlebot directly
                  </li>
                  <li>
                    Use <strong className="text-foreground">AI Social Posts</strong> to promote each
                    mini-app on Twitter/LinkedIn/Reddit
                  </li>
                  <li>Run this guide again in 2 weeks to add more mini-apps as you build them</li>
                </ol>
              </div>

              <div className="flex gap-2">
                <PinkBtn
                  onClick={() => router.push("/dashboard/marketing")}
                  size="md"
                  variant="outline"
                >
                  ← Marketing HQ
                </PinkBtn>
                <PinkBtn
                  onClick={() => {
                    setStep(1);
                    setGeneratedPages([]);
                    setBatchProgress(0);
                  }}
                  size="md"
                >
                  <Plus className="w-4 h-4" /> Set up another app
                </PinkBtn>
              </div>
            </div>
          </div>
        )}

        <div className="text-center text-xs text-muted-foreground pb-4">
          Admin only ·{" "}
          <button
            onClick={() => router.push("/dashboard/marketing")}
            className="hover:underline"
            style={{ color: PINK }}
          >
            ← Back to Marketing HQ
          </button>
        </div>
      </div>
    </div>
  );
}
