"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import Link from "next/link";
import seedsLogo from "@/attached_assets/Svivva_Seeds_6_1771888740460.png";
import svivvaLogo from "@/attached_assets/SVIVVA_OFFICIAL_LOGO_1769201341308.png";
import type { SeedAppSpec, SeedEngineeringDocs, SeedMarketingContent } from "@/lib/schema";
import { ThemeToggle } from "@/components/theme-toggle";
import { Textarea } from "@/components/ui/textarea";
import { OrbitTrafficFunnelDiagram } from "@/components/orbit-traffic-funnel-diagram";
import { SeedsFunnelSetup } from "@/components/seeds-funnel-setup";
import SeedsInvariantCompiler from "@/components/seeds-invariant-compiler";
import { ConnectionsHub } from "@/components/connections-hub";
import { SeedDeployDialog } from "@/components/seed-deploy-dialog";
import { ReferralWidget } from "@/components/referral-widget";
import {
  Upload,
  FileText,
  Sprout,
  Rocket,
  Download,
  ChevronDown,
  ChevronUp,
  Code2,
  BookOpen,
  Megaphone,
  CheckCircle,
  AlertCircle,
  Loader2,
  Layers,
  Clock,
  Zap,
  Wand2,
  CheckSquare,
  Square,
  X,
  Send,
  Globe,
  ExternalLink,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import dynamic from "next/dynamic";

const FeatureThreeBg = dynamic(
  () =>
    import("@/components/feature-three-background").then((m) => ({
      default: m.FeatureThreeBackground,
    })),
  { ssr: false },
);

interface SeedSession {
  id: string;
  fileName: string;
  status: string;
  seedCount: number;
  createdAt: string;
}

interface SeedRecord {
  id: string;
  sessionId: string;
  appName: string;
  spec: SeedAppSpec;
  status: string;
  buildProgress: number;
  engineeringDocs: SeedEngineeringDocs | null;
  marketingContent: SeedMarketingContent | null;
  generatedCode: Record<string, string> | null;
  error: string | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
  parsed: {
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: FileText,
    label: "Parsed",
  },
  queued: {
    color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    icon: Clock,
    label: "Queued",
  },
  building: {
    color: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    icon: Loader2,
    label: "Building",
  },
  complete: {
    color: "bg-green-500/10 text-green-500 border-green-500/20",
    icon: CheckCircle,
    label: "Complete",
  },
  partial: {
    color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    icon: AlertCircle,
    label: "Partial",
  },
  error: {
    color: "bg-red-500/10 text-red-500 border-red-500/20",
    icon: AlertCircle,
    label: "Error",
  },
};

function SeedCard({
  seed,
  onBuild,
  selected,
  onToggleSelect,
  selectionMode,
  marketingPages,
}: {
  seed: SeedRecord;
  onBuild: (id: string) => void;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  selectionMode: boolean;
  marketingPages: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"spec" | "docs" | "marketing" | "code">("spec");
  const [deployOpen, setDeployOpen] = useState(false);
  const statusInfo = STATUS_CONFIG[seed.status] || STATUS_CONFIG.parsed;
  const StatusIcon = statusInfo.icon;

  return (
    <Card
      className={`transition-all duration-300 ${selected ? "ring-2 ring-[#5BA8A0] bg-[#5BA8A0]/5" : ""}`}
      data-testid={`card-seed-${seed.id}`}
    >
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {selectionMode && (
              <button
                onClick={() => onToggleSelect(seed.id)}
                className="flex-shrink-0 p-0.5 rounded hover:bg-muted/50 transition-colors"
                data-testid={`button-select-seed-${seed.id}`}
              >
                {selected ? (
                  <CheckSquare className="w-5 h-5 text-[#5BA8A0]" />
                ) : (
                  <Square className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            )}
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#6B2C4A]/15 flex-shrink-0">
              <Sprout className="w-5 h-5 text-[#6B2C4A]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{seed.appName}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {seed.spec.problemStatement?.slice(0, 80)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className={statusInfo.color}>
              <StatusIcon
                className={`w-3 h-3 mr-1 ${seed.status === "building" ? "animate-spin" : ""}`}
              />
              {statusInfo.label}
            </Badge>
          </div>
        </div>

        {seed.status === "building" && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Building...</span>
              <span>{seed.buildProgress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-[#5BA8A0] transition-all duration-500"
                style={{ width: `${seed.buildProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            {seed.spec.features?.length || 0} features
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {seed.spec.apiEndpoints?.length || 0} endpoints
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {seed.spec.uiComponents?.length || 0} components
          </Badge>
          {marketingPages.length > 0 && (
            <Badge
              variant="outline"
              className="text-xs bg-green-500/10 text-green-600 border-green-500/20 gap-1"
            >
              <Globe className="w-2.5 h-2.5" />
              {marketingPages.length} pages live
            </Badge>
          )}
        </div>

        {marketingPages.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {marketingPages.map((slug) => (
              <a
                key={slug}
                href={`/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#5BA8A0] hover:underline"
                data-testid={`link-marketing-page-${slug}`}
              >
                <ExternalLink className="w-2.5 h-2.5" />/{slug}
              </a>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {(seed.status === "parsed" || seed.status === "error") && (
            <Button
              size="sm"
              className="gap-1 bg-[#5BA8A0]"
              onClick={() => onBuild(seed.id)}
              data-testid={`button-build-seed-${seed.id}`}
            >
              <Rocket className="w-3.5 h-3.5" />
              Build
            </Button>
          )}
          {(seed.status === "complete" || seed.status === "partial") && (
            <>
              <Button
                size="sm"
                className="gap-1"
                style={{ background: "linear-gradient(135deg, #5BA8A0, #4A9890)" }}
                onClick={() => setDeployOpen(true)}
                data-testid={`button-deploy-seed-${seed.id}`}
              >
                <Rocket className="w-3.5 h-3.5" />
                Deploy
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => {
                  const blob = new Blob(
                    [
                      JSON.stringify(
                        {
                          spec: seed.spec,
                          engineeringDocs: seed.engineeringDocs,
                          marketingContent: seed.marketingContent,
                          generatedCode: seed.generatedCode,
                        },
                        null,
                        2,
                      ),
                    ],
                    { type: "application/json" },
                  );
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${seed.appName.replace(/\s+/g, "_")}_seed_output.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                data-testid={`button-download-seed-${seed.id}`}
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="gap-1 ml-auto"
            onClick={() => setExpanded(!expanded)}
            data-testid={`button-expand-seed-${seed.id}`}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {expanded ? "Less" : "Details"}
          </Button>
        </div>

        {expanded && (
          <div className="border-t border-border pt-4 space-y-4">
            <div className="flex gap-1 flex-wrap">
              {(["spec", "docs", "marketing", "code"] as const).map((tab) => {
                const tabConfig = {
                  spec: { icon: FileText, label: "Spec", available: true },
                  docs: { icon: BookOpen, label: "Docs", available: !!seed.engineeringDocs },
                  marketing: {
                    icon: Megaphone,
                    label: "Marketing",
                    available: !!seed.marketingContent,
                  },
                  code: { icon: Code2, label: "Code", available: !!seed.generatedCode },
                };
                const config = tabConfig[tab];
                return (
                  <Button
                    key={tab}
                    size="sm"
                    variant={activeTab === tab ? "default" : "ghost"}
                    className={`gap-1 text-xs ${!config.available && tab !== "spec" ? "opacity-40" : ""}`}
                    onClick={() => config.available && setActiveTab(tab)}
                    disabled={!config.available && tab !== "spec"}
                    data-testid={`button-tab-${tab}-${seed.id}`}
                  >
                    <config.icon className="w-3 h-3" />
                    {config.label}
                  </Button>
                );
              })}
            </div>

            <div className="bg-muted/30 rounded-lg p-4 text-sm space-y-3 max-h-96 overflow-y-auto">
              {activeTab === "spec" && (
                <>
                  <div>
                    <span className="font-medium text-foreground">Target Users:</span>{" "}
                    <span className="text-muted-foreground">{seed.spec.targetUsers}</span>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Business Model:</span>{" "}
                    <span className="text-muted-foreground">{seed.spec.businessModel}</span>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Features:</span>
                    <ul className="list-disc pl-5 mt-1 text-muted-foreground space-y-0.5">
                      {seed.spec.features?.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">API Endpoints:</span>
                    <ul className="list-disc pl-5 mt-1 text-muted-foreground space-y-0.5">
                      {seed.spec.apiEndpoints?.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Database:</span>
                    <pre className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">
                      {seed.spec.databaseSchema}
                    </pre>
                  </div>
                </>
              )}
              {activeTab === "docs" && seed.engineeringDocs && (
                <>
                  <div>
                    <span className="font-medium text-foreground">System Architecture:</span>
                    <pre className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">
                      {seed.engineeringDocs.systemArchitecture}
                    </pre>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">API Documentation:</span>
                    <pre className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">
                      {seed.engineeringDocs.apiDocumentation}
                    </pre>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Database Diagram:</span>
                    <pre className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">
                      {seed.engineeringDocs.databaseDiagram}
                    </pre>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Deployment Guide:</span>
                    <pre className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">
                      {seed.engineeringDocs.deploymentGuide}
                    </pre>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Testing Strategy:</span>
                    <pre className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">
                      {seed.engineeringDocs.testingStrategy}
                    </pre>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">CI/CD Pipeline:</span>
                    <pre className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">
                      {seed.engineeringDocs.cicdPipeline}
                    </pre>
                  </div>
                </>
              )}
              {activeTab === "marketing" && seed.marketingContent && (
                <>
                  <div>
                    <span className="font-medium text-foreground">Value Proposition:</span>
                    <pre className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">
                      {seed.marketingContent.valueProposition}
                    </pre>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Landing Page Copy:</span>
                    <pre className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">
                      {seed.marketingContent.landingPageCopy}
                    </pre>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">
                      Competitive Differentiation:
                    </span>
                    <pre className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">
                      {seed.marketingContent.competitiveDifferentiation}
                    </pre>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Investor Pitch:</span>
                    <pre className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">
                      {seed.marketingContent.investorPitchSummary}
                    </pre>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">App Store Description:</span>
                    <pre className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">
                      {seed.marketingContent.appStoreDescription}
                    </pre>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Launch Email Sequence:</span>
                    <pre className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">
                      {seed.marketingContent.launchEmailSequence}
                    </pre>
                  </div>
                </>
              )}
              {activeTab === "code" && seed.generatedCode && (
                <>
                  {Object.entries(seed.generatedCode).map(([filePath, content]) => (
                    <div key={filePath}>
                      <span className="font-medium text-foreground font-mono text-xs">
                        {filePath}
                      </span>
                      <pre className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap bg-background/50 rounded p-2 border border-border/50">
                        {content}
                      </pre>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {seed.error && (
          <div className="text-xs text-red-500 bg-red-500/5 rounded-lg p-2">{seed.error}</div>
        )}

        <SeedDeployDialog
          open={deployOpen}
          onOpenChange={setDeployOpen}
          seedId={seed.id}
          appName={seed.appName}
          hasCode={!!seed.generatedCode && Object.keys(seed.generatedCode).length > 0}
        />
      </CardContent>
    </Card>
  );
}

export default function SeedsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedSeeds, setSelectedSeeds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [multiPrompt, setMultiPrompt] = useState("");
  const [promptBarOpen, setPromptBarOpen] = useState(false);

  // WebGL backgrounds can leak an opaque black compositor layer over this page.
  useEffect(() => {
    document
      .querySelectorAll(
        "body > canvas, body > div.fixed.inset-0, body > [data-svivva-feature-bg]",
      )
      .forEach((el) => el.remove());
  }, []);

  const toggleSeedSelect = (id: string) => {
    setSelectedSeeds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllInSession = (sessionSeeds: SeedRecord[]) => {
    setSelectedSeeds((prev) => {
      const next = new Set(prev);
      const allSelected = sessionSeeds.every((s) => next.has(s.id));
      if (allSelected) {
        sessionSeeds.forEach((s) => next.delete(s.id));
      } else {
        sessionSeeds.forEach((s) => next.add(s.id));
      }
      return next;
    });
  };

  const { data, isLoading } = useQuery<{
    sessions: SeedSession[];
    seeds: SeedRecord[];
    marketingPagesBySeed: Record<string, string[]>;
  }>({
    queryKey: ["/api/seeds"],
    queryFn: () => authFetch("/api/seeds").then((r) => r.json()),
    refetchInterval: 5000,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploading(true);
      const formData = new FormData();
      formData.append("pdf", file);
      const res = await authFetch("/api/seeds", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seeds"] });
      setUploading(false);
    },
    onError: () => {
      setUploading(false);
    },
  });

  const buildMutation = useMutation({
    mutationFn: async (seedId: string) => {
      const res = await authFetch("/api/seeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "build", seedId }),
      });
      if (!res.ok) throw new Error("Build failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seeds"] });
    },
  });

  const buildAllMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await authFetch("/api/seeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "build-all", sessionId }),
      });
      if (!res.ok) throw new Error("Build all failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seeds"] });
    },
  });

  const multiPromptMutation = useMutation({
    mutationFn: async ({ seedIds, prompt }: { seedIds: string[]; prompt: string }) => {
      const res = await authFetch("/api/seeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "prompt-multi", seedIds, prompt }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Multi-prompt failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seeds"] });
      setMultiPrompt("");
      setPromptBarOpen(false);
      setSelectedSeeds(new Set());
      setSelectionMode(false);
    },
  });

  const generatePagesMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await authFetch("/api/seeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-pages", sessionId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Marketing generation failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seeds"] });
    },
  });

  const sessions = data?.sessions || [];
  const allSeeds = data?.seeds || [];
  const marketingPagesBySeed = data?.marketingPagesBySeed || {};

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <FeatureThreeBg variant="seeds" />
      <nav className="relative z-20 h-12 border-b border-border/50 bg-background/70 backdrop-blur-md flex-shrink-0">
        <div className="h-full max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2" data-testid="link-seeds-home">
              <Image
                src={svivvaLogo}
                alt="Svivva"
                width={100}
                height={32}
                className="h-5 sm:h-6 w-auto object-contain"
              />
            </Link>
            <div className="flex items-center gap-2">
              <div className="relative w-6 h-6 rounded overflow-hidden">
                <Image src={seedsLogo} alt="Seeds" fill sizes="24px" className="object-cover" />
              </div>
              <span className="seeds-holo-text text-sm font-bold tracking-wide">Seeds</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/orbit">
              <Button
                size="sm"
                className="text-xs font-bold text-white gap-1.5 shadow-sm"
                style={{ background: "linear-gradient(135deg, #6B2C4A, #5BA8A0)" }}
                data-testid="button-seeds-orbit-admin"
              >
                <Rocket className="w-3.5 h-3.5" />
                Orbit Admin
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                data-testid="button-seeds-back-dashboard"
              >
                Dashboard
              </Button>
            </Link>
            <Link href="/play">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs seeds-holo-text"
                data-testid="button-seeds-to-play"
              >
                &#9835; Play
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="relative z-20 flex-1 overflow-y-auto bg-transparent">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 relative [&_.border]:bg-card/92 [&_.border]:backdrop-blur-md">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                <Image
                  src={seedsLogo}
                  alt="Svivva Seeds"
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
              <div>
                <h1
                  className="text-2xl font-bold flex items-center gap-2"
                  data-testid="text-seeds-title"
                >
                  Svivva Seeds
                </h1>
                <p className="text-muted-foreground mt-1">
                  Upload a structured PDF blueprint and generate multiple production-ready
                  applications simultaneously.
                </p>
              </div>
            </div>
            {allSeeds.length > 1 && (
              <Button
                variant={selectionMode ? "default" : "outline"}
                size="sm"
                className={`gap-1.5 flex-shrink-0 ${selectionMode ? "bg-[#5BA8A0]" : ""}`}
                onClick={() => {
                  if (selectionMode) {
                    setSelectionMode(false);
                    setSelectedSeeds(new Set());
                    setPromptBarOpen(false);
                    setMultiPrompt("");
                  } else {
                    setSelectionMode(true);
                  }
                }}
                data-testid="button-toggle-selection-mode"
              >
                <Wand2 className="w-3.5 h-3.5" />
                {selectionMode ? "Cancel" : "Multi-Edit"}
              </Button>
            )}
          </div>

          <SeedsInvariantCompiler />

          {/* Marketing funnel shortcut banner */}
          <a
            href="#seeds-marketing"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("seeds-marketing")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex items-center gap-4 px-5 py-4 rounded-2xl border-2 border-[#6B2C4A]/40 hover:border-[#6B2C4A] transition-all cursor-pointer group"
            style={{ background: "linear-gradient(135deg, #6B2C4A08 0%, #5BA8A008 100%)" }}
            data-testid="link-seeds-marketing-banner"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ background: "linear-gradient(135deg, #6B2C4A, #5BA8A0)" }}
            >
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base text-foreground">Seeds Marketing Funnel</p>
              <p className="text-sm text-muted-foreground">
                Link your apps · Set up your domain · Get AI-powered traffic → scroll down ↓
              </p>
            </div>
            <div
              className="px-4 py-2 rounded-xl text-sm font-bold text-white flex-shrink-0 group-hover:opacity-90 transition-opacity shadow"
              style={{ background: "linear-gradient(135deg, #6B2C4A, #5BA8A0)" }}
            >
              Open Marketing
            </div>
          </a>

          <Card className="border-dashed border-2 border-border/70 hover:border-[#5BA8A0]/50 transition-colors">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#5BA8A0]/10 flex items-center justify-center mx-auto">
                <Upload className="w-8 h-8 text-[#5BA8A0]" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Upload PDF Blueprint</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload a structured multi-application PDF. Each app spec will be parsed into a
                  separate Seed.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadMutation.mutate(file);
                  e.target.value = "";
                }}
                data-testid="input-pdf-upload"
              />
              <Button
                className="gap-2 bg-[#5BA8A0]"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || uploadMutation.isPending}
                data-testid="button-upload-pdf"
              >
                {uploading || uploadMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {uploading || uploadMutation.isPending ? "Parsing PDF..." : "Select PDF"}
              </Button>
              {uploadMutation.isError && (
                <p className="text-sm text-red-500" data-testid="text-upload-error">
                  {(uploadMutation.error as Error).message}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-[#5BA8A0]">{sessions.length}</div>
                <div className="text-xs text-muted-foreground mt-1">Uploads</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-[#6B2C4A]">{allSeeds.length}</div>
                <div className="text-xs text-muted-foreground mt-1">Seeds</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-500">
                  {allSeeds.filter((s) => s.status === "complete").length}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Built</div>
              </CardContent>
            </Card>
          </div>

          {/* Seeds Marketing Funnel — clearly labeled section */}
          <div id="seeds-marketing" className="space-y-3 scroll-mt-8">
            <div className="flex items-center gap-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #6B2C4A, #5BA8A0)" }}
              >
                <Rocket className="w-3.5 h-3.5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Seeds Marketing Funnel</h2>
              <div className="h-px flex-1 bg-border" />
            </div>

            <OrbitTrafficFunnelDiagram />

            {/* Orbit CTA banner */}
            <Link href="/dashboard/orbit">
              <div
                className="rounded-2xl border-2 p-4 cursor-pointer hover:opacity-90 active:scale-[0.99] transition-all"
                style={{
                  background: "linear-gradient(135deg, #6B2C4A18, #5BA8A018)",
                  borderColor: "#5BA8A040",
                }}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #6B2C4A, #5BA8A0)" }}
                    >
                      <Rocket className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-black text-foreground">
                          Orbit — Full Marketing Strategy
                        </p>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full text-white font-semibold"
                          style={{ background: "#5BA8A0" }}
                        >
                          10 steps
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        IndexNow · 20 SEO pages · 8 comparisons · 10 blog posts · social packs ·
                        mini app import — all one-click
                      </p>
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-1.5 text-sm font-bold flex-shrink-0"
                    style={{ color: "#5BA8A0" }}
                  >
                    Open Orbit <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Connections Hub */}
            <div className="rounded-2xl border-2 border-border bg-card p-4" id="seeds-connections">
              <ConnectionsHub />
            </div>

            {/* Referral Widget */}
            <ReferralWidget />

            <SeedsFunnelSetup />
          </div>

          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          )}

          {!isLoading && sessions.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center space-y-4">
                <Sprout className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                <div>
                  <h3 className="font-semibold text-lg">No Seeds Yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload a structured PDF blueprint to start generating applications.
                  </p>
                </div>
                <div className="max-w-md mx-auto text-left space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Your PDF should include for each app:
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                    {[
                      "App Name",
                      "Problem Statement",
                      "Target Users",
                      "Feature List",
                      "User Flows",
                      "Database Schema",
                      "API Endpoints",
                      "UI Components",
                      "Business Model",
                      "Deployment Prefs",
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-[#5BA8A0] flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {sessions.map((session) => {
            const sessionSeeds = allSeeds.filter((s) => s.sessionId === session.id);
            const allParsed = sessionSeeds.every((s) => s.status === "parsed");
            const anyBuilding = sessionSeeds.some(
              (s) => s.status === "building" || s.status === "queued",
            );

            return (
              <div key={session.id} className="space-y-4" data-testid={`session-${session.id}`}>
                <div className="flex items-center justify-between gap-3 pb-2 border-b border-border">
                  <div className="flex items-center gap-3 min-w-0">
                    <Layers className="w-5 h-5 text-[#5BA8A0] flex-shrink-0" />
                    <div className="min-w-0">
                      <h2 className="font-semibold truncate">{session.fileName}</h2>
                      <p className="text-xs text-muted-foreground">
                        {session.seedCount} seed{session.seedCount !== 1 ? "s" : ""} detected
                        {" · "}
                        {new Date(session.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {selectionMode && sessionSeeds.length > 1 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs"
                        onClick={() => selectAllInSession(sessionSeeds)}
                        data-testid={`button-select-all-${session.id}`}
                      >
                        {sessionSeeds.every((s) => selectedSeeds.has(s.id)) ? (
                          <CheckSquare className="w-3.5 h-3.5 text-[#5BA8A0]" />
                        ) : (
                          <Square className="w-3.5 h-3.5" />
                        )}
                        {sessionSeeds.every((s) => selectedSeeds.has(s.id))
                          ? "Deselect All"
                          : "Select All"}
                      </Button>
                    )}
                    {!selectionMode && (
                      <>
                        {allParsed && sessionSeeds.length > 1 && (
                          <Button
                            size="sm"
                            className="gap-1 bg-[#5BA8A0]"
                            onClick={() => buildAllMutation.mutate(session.id)}
                            disabled={buildAllMutation.isPending || anyBuilding}
                            data-testid={`button-build-all-${session.id}`}
                          >
                            {buildAllMutation.isPending || anyBuilding ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Zap className="w-3.5 h-3.5" />
                            )}
                            Build All
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs border-green-500/30 text-green-600 hover:bg-green-500/10"
                          onClick={() => generatePagesMutation.mutate(session.id)}
                          disabled={generatePagesMutation.isPending}
                          data-testid={`button-launch-marketing-${session.id}`}
                        >
                          {generatePagesMutation.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <TrendingUp className="w-3.5 h-3.5" />
                          )}
                          {generatePagesMutation.isPending ? "Generating..." : "Launch Marketing"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid gap-4">
                  {sessionSeeds.map((seed) => (
                    <SeedCard
                      key={seed.id}
                      seed={seed}
                      onBuild={(id) => buildMutation.mutate(id)}
                      selected={selectedSeeds.has(seed.id)}
                      onToggleSelect={toggleSeedSelect}
                      selectionMode={selectionMode}
                      marketingPages={marketingPagesBySeed[seed.id] || []}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <SeedsAdminFooter />
      </main>

      {selectionMode && selectedSeeds.size > 0 && (
        <div className="sticky bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl shadow-lg">
          <div className="max-w-5xl mx-auto px-4 py-3">
            {!promptBarOpen ? (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Badge
                    variant="secondary"
                    className="bg-[#5BA8A0]/10 text-[#5BA8A0] border-[#5BA8A0]/20"
                  >
                    {selectedSeeds.size} app{selectedSeeds.size !== 1 ? "s" : ""} selected
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    {allSeeds
                      .filter((s) => selectedSeeds.has(s.id))
                      .map((s) => s.appName)
                      .join(", ")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1 text-xs"
                    onClick={() => {
                      setSelectedSeeds(new Set());
                    }}
                    data-testid="button-clear-selection"
                  >
                    <X className="w-3.5 h-3.5" />
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5 bg-[#5BA8A0]"
                    onClick={() => setPromptBarOpen(true)}
                    data-testid="button-open-prompt-bar"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    Edit with Prompt
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Wand2 className="w-4 h-4 text-[#5BA8A0]" />
                    <span className="font-medium">
                      Editing {selectedSeeds.size} app{selectedSeeds.size !== 1 ? "s" : ""}{" "}
                      simultaneously
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => setPromptBarOpen(false)}
                    data-testid="button-close-prompt-bar"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Textarea
                    value={multiPrompt}
                    onChange={(e) => setMultiPrompt(e.target.value)}
                    placeholder="Describe the changes to apply to all selected apps... e.g. 'Add a user authentication system with OAuth2 and role-based access control'"
                    className="min-h-[60px] max-h-[120px] resize-none text-sm"
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        (e.metaKey || e.ctrlKey) &&
                        multiPrompt.trim() &&
                        !multiPromptMutation.isPending
                      ) {
                        multiPromptMutation.mutate({
                          seedIds: Array.from(selectedSeeds),
                          prompt: multiPrompt.trim(),
                        });
                      }
                    }}
                    data-testid="input-multi-prompt"
                  />
                  <Button
                    className="gap-1.5 bg-[#5BA8A0] self-end px-4"
                    disabled={!multiPrompt.trim() || multiPromptMutation.isPending}
                    onClick={() => {
                      multiPromptMutation.mutate({
                        seedIds: Array.from(selectedSeeds),
                        prompt: multiPrompt.trim(),
                      });
                    }}
                    data-testid="button-submit-multi-prompt"
                  >
                    {multiPromptMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {multiPromptMutation.isPending ? "Applying..." : "Apply"}
                  </Button>
                </div>
                {multiPromptMutation.isError && (
                  <p className="text-xs text-red-500" data-testid="text-multi-prompt-error">
                    {(multiPromptMutation.error as Error).message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Press Ctrl+Enter to submit. The prompt will be applied to each selected app in
                  parallel.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SeedsAdminFooter() {
  const { data } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const r = await authFetch("/api/auth/me");
      return r.json();
    },
    staleTime: 60_000,
  });

  if (!data?.isAdmin) return null;

  return (
    <div className="mt-12 mb-8 px-4">
      <div className="max-w-5xl mx-auto border-t border-border/50 pt-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-semibold">
          Admin tools
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/dashboard/seo-health"
            className="group flex items-center justify-between gap-4 p-4 rounded-lg border border-[#5BA8A0]/20 bg-[#5BA8A0]/5 hover:bg-[#5BA8A0]/10 transition-colors"
            data-testid="link-seo-health"
          >
            <div>
              <div className="font-semibold text-sm">Search Engine Health</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Sitemap, IndexNow, meta tags, indexing signals.
              </div>
            </div>
            <span className="text-[#5BA8A0] text-lg group-hover:translate-x-0.5 transition-transform">
              →
            </span>
          </Link>
          <Link
            href="/dashboard/gsc-connect"
            className="group flex items-center justify-between gap-4 p-4 rounded-lg border border-[#5BA8A0]/20 bg-[#5BA8A0]/5 hover:bg-[#5BA8A0]/10 transition-colors"
            data-testid="link-gsc-connect"
          >
            <div>
              <div className="font-semibold text-sm">Google Search Console</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Diagnose and fix your GSC connection.
              </div>
            </div>
            <span className="text-[#5BA8A0] text-lg group-hover:translate-x-0.5 transition-transform">
              →
            </span>
          </Link>
        </div>

        {/* GSC Setup Steps */}
        <div className="mt-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-semibold">
            GSC setup — to reach 100% connection health
          </p>
          <div className="space-y-2">
            {[
              {
                n: "1",
                title: "Create a service account in Google Cloud",
                detail:
                  "IAM & Admin → Service Accounts → create account → Keys → Add Key → JSON → download",
                href: "https://console.cloud.google.com/iam-admin/serviceaccounts",
                cta: "Open Google Cloud Console →",
              },
              {
                n: "2",
                title: "Add the service account to Search Console",
                detail: "Settings → Users and permissions → Add user → paste email → set Owner",
                href: "https://search.google.com/search-console/users",
                cta: "Open Search Console Users →",
              },
              {
                n: "3",
                title: "Paste the JSON key in the GSC Connect page",
                detail:
                  "Open GSC Connect below, expand Step 3, paste the downloaded JSON → Save & verify",
                href: "/dashboard/gsc-connect",
                cta: "Open GSC Connect →",
              },
            ].map((step) => (
              <a
                key={step.n}
                href={step.href}
                target={step.href.startsWith("http") ? "_blank" : undefined}
                rel={step.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="flex items-start gap-3 p-3 rounded-lg border border-border/40 hover:bg-muted/20 transition-colors group"
                data-testid={`link-gsc-step-${step.n}`}
              >
                <span className="shrink-0 w-5 h-5 rounded-full bg-[#5BA8A0] text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                  {step.n}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold">{step.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    {step.detail}
                  </div>
                  <div className="text-[11px] text-[#5BA8A0] mt-1 group-hover:underline">
                    {step.cta}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
