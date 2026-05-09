"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authFetch } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  FlaskConical,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Bookmark,
  Plus,
  Minus,
  Microscope,
  BrainCircuit,
  AlertTriangle,
  Globe,
  Trash2,
  ExternalLink,
  Zap,
  Clock,
  Package,
  ChevronDown,
  ChevronUp,
  FileJson,
  Beaker,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Pencil,
} from "lucide-react";

type ProjectCard = {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  status: string;
};

type ExternalApi = {
  id: string;
  name: string;
  url: string;
  description: string;
  inputSchema: string;
  sampleResponse: string;
};

type ExperimentScenario = {
  label: string;
  inputs: Record<string, unknown>;
  expectedBehavior: string;
};

type ExecutionEntry = {
  scenario: string;
  apiName: string;
  output: Record<string, unknown>;
  timestamp: string;
};

type ValidationDetail = {
  patternsFound: string[];
  contradictions: string[];
  statisticalNote: string;
};

type HypothesisExperiment = {
  description: string;
  scenarios: ExperimentScenario[];
  apisCalledInOrder: string[];
};

type Hypothesis = {
  id: string;
  hypothesis: string;
  category: string;
  experiment: HypothesisExperiment | string;
  execution: ExecutionEntry[];
  validation: ValidationDetail;
  result: "confirmed" | "rejected" | "unclear";
  insight: string;
  confidence: number;
  apisUsed: string[];
};

type DiscoveryResult = {
  summary: string;
  hypotheses: Hypothesis[];
};

type SavedDiscovery = {
  id: string;
  question: string;
  summary: string;
  hypotheses: Hypothesis[];
  savedAt: string;
  apisUsed: string[];
};

const STORAGE_KEY = "svivva_hypothesis_memory";
const EXT_API_KEY = "svivva_hypothesis_external_apis";

function loadSaved(): SavedDiscovery[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveToDisk(items: SavedDiscovery[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function loadExternalApis(): ExternalApi[] {
  try {
    return JSON.parse(localStorage.getItem(EXT_API_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveExternalApis(items: ExternalApi[]) {
  localStorage.setItem(EXT_API_KEY, JSON.stringify(items));
}

function isDuplicate(
  question: string,
  apiIds: string[],
  saved: SavedDiscovery[],
): SavedDiscovery | null {
  const normalQ = question.toLowerCase().trim();
  return (
    saved.find((d) => {
      const sameQ = d.question.toLowerCase().trim() === normalQ;
      const sameApis =
        d.apisUsed?.length === apiIds.length && d.apisUsed.every((a) => apiIds.includes(a));
      return sameQ && sameApis;
    }) || null
  );
}

const resultConfig: Record<string, { label: string; color: string; Icon: typeof CheckCircle2 }> = {
  confirmed: {
    label: "Confirmed",
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    Icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-500/15 text-red-400 border-red-500/30",
    Icon: XCircle,
  },
  unclear: {
    label: "Unclear",
    color: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    Icon: HelpCircle,
  },
};

const categoryColors: Record<string, string> = {
  correlation: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  inverse: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  anomaly: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  conditional: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  dependency: "bg-pink-500/15 text-pink-400 border-pink-500/30",
};

const examplePrompts = [
  "What affects X?",
  "Find hidden patterns in Y",
  "What correlations exist across my APIs?",
  "How do my data sources relate?",
];

export default function HypothesisPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [step, setStep] = useState<"ask" | "select" | "running" | "results">("ask");
  const [activeTab, setActiveTab] = useState<"discover" | "registry" | "feed">("discover");
  const [progress, setProgress] = useState("");
  const [results, setResults] = useState<DiscoveryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedHypothesis, setExpandedHypothesis] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<SavedDiscovery | null>(null);

  const [savedDiscoveries, setSavedDiscoveries] = useState<SavedDiscovery[]>([]);
  const [externalApis, setExternalApis] = useState<ExternalApi[]>([]);
  const [newApiName, setNewApiName] = useState("");
  const [newApiUrl, setNewApiUrl] = useState("");
  const [newApiDesc, setNewApiDesc] = useState("");
  const [newApiInputSchema, setNewApiInputSchema] = useState("");
  const [newApiSampleResponse, setNewApiSampleResponse] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setSavedDiscoveries(loadSaved());
    setExternalApis(loadExternalApis());
  }, []);

  const { data: projectsData, isLoading: projectsLoading } = useQuery<{ projects: ProjectCard[] }>({
    queryKey: ["/api/hypothesis"],
    queryFn: async () => {
      const r = await authFetch("/api/hypothesis");
      if (!r.ok) throw new Error("Failed to load projects");
      return r.json();
    },
  });

  const apiProjects = projectsData?.projects || [];

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev,
    );
  }

  function startSelect() {
    if (!question.trim()) return;
    if (apiProjects.length === 0 && externalApis.length === 0) {
      setError(
        "You need at least one API to run discovery. Create a project or register an external API.",
      );
      return;
    }
    setError(null);
    setDuplicateWarning(null);
    setStep("select");
  }

  async function runDiscovery(force = false) {
    if (selectedIds.length === 0) return;

    if (!force) {
      const dup = isDuplicate(question, selectedIds, savedDiscoveries);
      if (dup) {
        setDuplicateWarning(dup);
        return;
      }
    }

    setDuplicateWarning(null);
    setStep("running");
    setError(null);
    setResults(null);

    const stages = [
      "Generating hypotheses\u2026",
      "Designing experiments\u2026",
      "Running simulated tests\u2026",
      "Validating patterns\u2026",
      "Synthesizing insights\u2026",
    ];
    let i = 0;
    setProgress(stages[0]);
    const interval = setInterval(() => {
      i++;
      if (i < stages.length) setProgress(stages[i]);
    }, 2200);

    try {
      const svivvaIds = selectedIds.filter((id) => !id.startsWith("ext_"));
      const extIds = selectedIds.filter((id) => id.startsWith("ext_"));
      const extApis = externalApis.filter((a) => extIds.includes(a.id));

      const previousInsights = savedDiscoveries
        .flatMap((d) => d.hypotheses.filter((h) => h.result === "confirmed").map((h) => h.insight))
        .slice(0, 20);

      const res = await authFetch("/api/hypothesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          projectIds: svivvaIds.length > 0 ? svivvaIds : ["__none__"],
          externalApis: extApis.map((a) => ({
            name: a.name,
            url: a.url,
            description: a.description,
            inputSchema: a.inputSchema,
            sampleResponse: a.sampleResponse,
          })),
          previousInsights,
        }),
      });

      clearInterval(interval);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || "Discovery failed. Try again.");
        setStep("select");
        return;
      }

      const data = await res.json();
      setResults({
        summary: data.summary || "",
        hypotheses: Array.isArray(data.hypotheses) ? data.hypotheses : [],
      });
      setStep("results");
    } catch {
      clearInterval(interval);
      setError("Something went wrong. Please try again.");
      setStep("select");
    }
  }

  function saveDiscovery() {
    if (!results) return;
    const entry: SavedDiscovery = {
      id: `d_${Date.now()}`,
      question,
      summary: results.summary,
      hypotheses: results.hypotheses,
      savedAt: new Date().toISOString(),
      apisUsed: selectedIds,
    };
    const updated = [entry, ...savedDiscoveries].slice(0, 50);
    setSavedDiscoveries(updated);
    saveToDisk(updated);
  }

  function deleteDiscovery(id: string) {
    const updated = savedDiscoveries.filter((d) => d.id !== id);
    setSavedDiscoveries(updated);
    saveToDisk(updated);
  }

  function loadDiscovery(d: SavedDiscovery) {
    setQuestion(d.question);
    setResults({ summary: d.summary, hypotheses: d.hypotheses });
    setSelectedIds(d.apisUsed || []);
    setStep("results");
    setActiveTab("discover");
  }

  function addExternalApi() {
    if (!newApiName.trim() || !newApiUrl.trim()) return;
    const api: ExternalApi = {
      id: `ext_${Date.now()}`,
      name: newApiName.trim(),
      url: newApiUrl.trim(),
      description: newApiDesc.trim(),
      inputSchema: newApiInputSchema.trim(),
      sampleResponse: newApiSampleResponse.trim(),
    };
    const updated = [...externalApis, api];
    setExternalApis(updated);
    saveExternalApis(updated);
    setNewApiName("");
    setNewApiUrl("");
    setNewApiDesc("");
    setNewApiInputSchema("");
    setNewApiSampleResponse("");
  }

  function removeExternalApi(id: string) {
    const updated = externalApis.filter((a) => a.id !== id);
    setExternalApis(updated);
    saveExternalApis(updated);
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  }

  function turnIntoApi(h: Hypothesis) {
    const prompt = `Build an API that implements this insight: ${h.insight}\n\nBased on hypothesis: ${h.hypothesis}`;
    router.push(`/dashboard/api-builder?prefill=${encodeURIComponent(prompt)}`);
  }

  function reset() {
    setStep("ask");
    setQuestion("");
    setSelectedIds([]);
    setResults(null);
    setError(null);
    setProgress("");
    setDuplicateWarning(null);
    setExpandedHypothesis(null);
    setIsEditing(false);
  }

  function remix() {
    setStep("select");
    setResults(null);
    setDuplicateWarning(null);
    setIsEditing(true);
  }

  const alreadySaved = results
    ? savedDiscoveries.some((d) => d.question === question && d.summary === results.summary)
    : false;

  const allSelectable = [
    ...apiProjects.map((p) => ({
      id: p.id,
      name: p.name,
      desc: p.description || `/${p.slug} endpoint`,
      status: p.status,
      type: "svivva" as const,
    })),
    ...externalApis.map((a) => ({
      id: a.id,
      name: a.name,
      desc: a.description || a.url,
      status: "external",
      type: "external" as const,
      hasSchema: !!a.inputSchema,
      hasSample: !!a.sampleResponse,
    })),
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8" data-testid="page-hypothesis">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <FlaskConical className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Hypothesis Lab</h1>
            <p className="text-muted-foreground text-sm">
              Discover hidden relationships across your APIs
            </p>
          </div>
        </div>
        {step !== "ask" && activeTab === "discover" && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={reset}
            data-testid="button-reset-hypothesis"
          >
            <RotateCcw className="w-4 h-4" />
            Start Over
          </Button>
        )}
      </div>

      {error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="discover" className="gap-2" data-testid="tab-discover">
            <BrainCircuit className="w-4 h-4" />
            Discover
          </TabsTrigger>
          <TabsTrigger value="registry" className="gap-2" data-testid="tab-registry">
            <Globe className="w-4 h-4" />
            API Registry
            {externalApis.length > 0 && (
              <Badge variant="secondary" className="text-[10px] ml-1">
                {externalApis.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="feed" className="gap-2" data-testid="tab-feed">
            <Bookmark className="w-4 h-4" />
            Insight Feed
            {savedDiscoveries.length > 0 && (
              <Badge variant="secondary" className="text-[10px] ml-1">
                {savedDiscoveries.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-6 mt-6">
          {step === "ask" && (
            <div className="space-y-6">
              <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-8 pb-8 space-y-6">
                  <div className="text-center space-y-2 mb-4">
                    <BrainCircuit className="w-10 h-10 text-primary mx-auto" />
                    <h2 className="text-lg font-semibold">What do you want to discover?</h2>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Ask a question and the system will generate hypotheses, run experiments, and
                      find patterns across your APIs.
                    </p>
                  </div>
                  <div className="flex gap-3 max-w-xl mx-auto">
                    <Input
                      placeholder="What hidden patterns exist across my APIs?"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && startSelect()}
                      className="flex-1"
                      data-testid="input-hypothesis-question"
                    />
                    <Button
                      onClick={startSelect}
                      disabled={!question.trim()}
                      className="gap-2 shrink-0"
                      data-testid="button-discover"
                    >
                      <Search className="w-4 h-4" />
                      Discover
                    </Button>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    {examplePrompts.map((p) => (
                      <button
                        key={p}
                        onClick={() => setQuestion(p)}
                        className="text-xs px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        data-testid={`button-example-${p.slice(0, 12).replace(/\s+/g, "-").toLowerCase()}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-5 pt-2">
                {[
                  {
                    icon: FlaskConical,
                    title: "Generate",
                    desc: "Create hypotheses about API relationships",
                  },
                  {
                    icon: Beaker,
                    title: "Experiment",
                    desc: "Design input scenarios to test each theory",
                  },
                  {
                    icon: Microscope,
                    title: "Execute",
                    desc: "Simulate API calls with varied inputs",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Validate",
                    desc: "Detect patterns, contradictions, and anomalies",
                  },
                  {
                    icon: BrainCircuit,
                    title: "Synthesize",
                    desc: "Produce actionable insights with confidence",
                  },
                ].map((s) => (
                  <Card key={s.title} className="bg-card/30 border-border/30">
                    <CardContent className="pt-5 pb-4 px-4 text-center space-y-2">
                      <s.icon className="w-5 h-5 text-primary mx-auto" />
                      <p className="text-xs font-semibold">{s.title}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight">{s.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === "select" && (
            <div className="space-y-6">
              <Card className="border-primary/10 bg-card/30">
                <CardContent className="py-4 px-5 flex items-center gap-3">
                  <Search className="w-4 h-4 text-primary shrink-0" />
                  {isEditing ? (
                    <Input
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      className="flex-1 h-8 text-sm"
                      data-testid="input-edit-question"
                    />
                  ) : (
                    <p className="text-sm font-medium truncate flex-1">&quot;{question}&quot;</p>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 h-7 w-7 p-0"
                    onClick={() => setIsEditing(!isEditing)}
                    data-testid="button-toggle-edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </CardContent>
              </Card>

              {duplicateWarning && (
                <Card className="border-amber-500/30 bg-amber-500/5">
                  <CardContent className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Duplicate detected</p>
                        <p className="text-xs text-muted-foreground">
                          You already ran this exact question with these APIs on{" "}
                          {new Date(duplicateWarning.savedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => loadDiscovery(duplicateWarning)}
                        data-testid="button-view-existing"
                      >
                        View Existing
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => runDiscovery(true)}
                        data-testid="button-run-anyway"
                      >
                        Run Anyway
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-semibold">Select APIs to analyze</h2>
                    <p className="text-xs text-muted-foreground">
                      Choose 1-4 APIs. The system will find relationships between them.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {selectedIds.length}/4 selected
                  </Badge>
                </div>

                {projectsLoading ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-28 rounded-xl" />
                    ))}
                  </div>
                ) : allSelectable.length === 0 ? (
                  <Card className="bg-muted/20">
                    <CardContent className="py-8 text-center space-y-2">
                      <p className="text-sm text-muted-foreground">
                        No APIs available. Create a project or register an external API first.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab("registry")}
                        className="gap-2 mt-2"
                        data-testid="button-goto-registry"
                      >
                        <Globe className="w-4 h-4" />
                        Add External API
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {allSelectable.map((item) => {
                      const selected = selectedIds.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleSelect(item.id)}
                          className={`text-left p-4 rounded-xl border transition-all ${
                            selected
                              ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                              : "border-border/50 bg-card/50 hover:border-primary/30"
                          }`}
                          data-testid={`button-select-api-${item.id}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {item.desc}
                              </p>
                            </div>
                            <div
                              className={`p-1 rounded-md shrink-0 ${selected ? "bg-primary text-primary-foreground" : "bg-muted/50"}`}
                            >
                              {selected ? (
                                <Minus className="w-3.5 h-3.5" />
                              ) : (
                                <Plus className="w-3.5 h-3.5" />
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-[10px]">
                              {item.status}
                            </Badge>
                            {item.type === "external" && (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/30"
                              >
                                <Globe className="w-2.5 h-2.5 mr-1" />
                                external
                              </Badge>
                            )}
                            {"hasSchema" in item && item.hasSchema && (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              >
                                <FileJson className="w-2.5 h-2.5 mr-1" />
                                schema
                              </Badge>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => runDiscovery()}
                  disabled={selectedIds.length === 0}
                  className="gap-2"
                  data-testid="button-run-discovery"
                >
                  <Microscope className="w-4 h-4" />
                  Run Discovery
                </Button>
              </div>
            </div>
          )}

          {step === "running" && (
            <Card className="border-primary/20">
              <CardContent className="py-16 text-center space-y-6">
                <div className="relative mx-auto w-16 h-16">
                  <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
                  <div className="relative w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <FlaskConical className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold">{progress}</p>
                  <p className="text-xs text-muted-foreground">
                    Running all 5 stages: Generate → Experiment → Execute → Validate → Synthesize
                  </p>
                </div>
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
              </CardContent>
            </Card>
          )}

          {step === "results" && results && (
            <div className="space-y-6">
              {results.summary && (
                <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
                  <CardContent className="py-5 px-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <BrainCircuit className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                          Discovery Summary
                        </p>
                        <p className="text-sm font-medium" data-testid="text-discovery-summary">
                          {results.summary}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 shrink-0"
                      onClick={saveDiscovery}
                      disabled={alreadySaved}
                      data-testid="button-save-discovery"
                    >
                      <Bookmark className="w-4 h-4" />
                      {alreadySaved ? "Saved" : "Save"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-muted-foreground">
                  {results.hypotheses.length} Hypothes
                  {results.hypotheses.length === 1 ? "is" : "es"} Tested
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={remix}
                  className="gap-2"
                  data-testid="button-remix"
                >
                  <RotateCcw className="w-4 h-4" />
                  Remix
                </Button>
              </div>

              {results.hypotheses.map((h, i) => {
                const rc = resultConfig[h.result] || resultConfig.unclear;
                const ResultIcon = rc.Icon;
                const catColor =
                  categoryColors[h.category] || "bg-muted text-muted-foreground border-border";
                const isExpanded = expandedHypothesis === h.id;
                const exp = typeof h.experiment === "object" ? h.experiment : null;
                const val = h.validation;

                return (
                  <Card
                    key={h.id || i}
                    className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/20 transition-colors"
                  >
                    <CardContent className="py-6 px-6 space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={`text-[10px] ${rc.color}`}>
                              <ResultIcon className="w-3 h-3 mr-1" />
                              {rc.label}
                            </Badge>
                            <Badge variant="outline" className={`text-[10px] ${catColor}`}>
                              {h.category}
                            </Badge>
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                              Hypothesis
                            </p>
                            <p className="text-sm font-semibold">{h.hypothesis}</p>
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                              Insight
                            </p>
                            <p className="text-sm leading-relaxed">{h.insight}</p>
                          </div>

                          <div className="flex items-center gap-4 pt-1 flex-wrap">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-24 rounded-full bg-muted/50 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    h.confidence >= 70
                                      ? "bg-emerald-500"
                                      : h.confidence >= 40
                                        ? "bg-amber-500"
                                        : "bg-red-500"
                                  }`}
                                  style={{ width: `${h.confidence}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium tabular-nums">
                                {h.confidence}%
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {h.apisUsed?.map((api, j) => (
                                <Badge key={j} variant="secondary" className="text-[10px]">
                                  {api}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={() => setExpandedHypothesis(isExpanded ? null : h.id)}
                            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors pt-1"
                            data-testid={`button-expand-${i}`}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                            {isExpanded ? "Hide" : "Show"} experiment details
                          </button>

                          {isExpanded && (
                            <div className="space-y-4 pt-2 border-t border-border/30">
                              {exp && (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <Beaker className="w-4 h-4 text-primary" />
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                      Experiment Design
                                    </p>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{exp.description}</p>

                                  {exp.scenarios && exp.scenarios.length > 0 && (
                                    <div className="space-y-2">
                                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                                        Input Scenarios
                                      </p>
                                      <div className="grid gap-2">
                                        {exp.scenarios.map((sc, si) => (
                                          <div
                                            key={si}
                                            className="p-3 rounded-lg bg-muted/20 border border-border/30"
                                          >
                                            <p className="text-xs font-medium mb-1">{sc.label}</p>
                                            <div className="flex flex-col sm:flex-row gap-2">
                                              <div className="flex-1">
                                                <p className="text-[10px] text-muted-foreground mb-0.5">
                                                  Inputs
                                                </p>
                                                <pre className="text-[10px] font-mono bg-black/20 rounded p-1.5 overflow-x-auto">
                                                  {JSON.stringify(sc.inputs, null, 1)}
                                                </pre>
                                              </div>
                                              <div className="flex-1">
                                                <p className="text-[10px] text-muted-foreground mb-0.5">
                                                  Expected
                                                </p>
                                                <p className="text-[11px]">{sc.expectedBehavior}</p>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {exp.apisCalledInOrder && (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <p className="text-[10px] text-muted-foreground">
                                        Call order:
                                      </p>
                                      {exp.apisCalledInOrder.map((a, ai) => (
                                        <span key={ai} className="flex items-center gap-1">
                                          {ai > 0 && (
                                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                          )}
                                          <Badge variant="outline" className="text-[10px]">
                                            {a}
                                          </Badge>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {h.execution && h.execution.length > 0 && (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <Microscope className="w-4 h-4 text-primary" />
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                      Simulated Execution
                                    </p>
                                  </div>
                                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                    {h.execution.map((ex, ei) => (
                                      <div
                                        key={ei}
                                        className="flex items-start gap-3 text-[11px] p-2 rounded bg-muted/10 border border-border/20"
                                      >
                                        <Badge variant="outline" className="text-[9px] shrink-0">
                                          {ex.scenario}
                                        </Badge>
                                        <span className="text-muted-foreground shrink-0">
                                          {ex.apiName}
                                        </span>
                                        <pre className="font-mono text-[10px] bg-black/20 rounded px-1.5 py-0.5 overflow-x-auto flex-1">
                                          {JSON.stringify(ex.output)}
                                        </pre>
                                        <span className="text-[9px] text-muted-foreground/50 shrink-0 tabular-nums">
                                          {new Date(ex.timestamp).toLocaleTimeString()}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {val && (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-primary" />
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                      Validation
                                    </p>
                                  </div>

                                  {val.patternsFound && val.patternsFound.length > 0 && (
                                    <div>
                                      <p className="text-[10px] uppercase text-muted-foreground font-medium mb-1">
                                        Patterns Found
                                      </p>
                                      <div className="space-y-1">
                                        {val.patternsFound.map((p, pi) => (
                                          <div
                                            key={pi}
                                            className="flex items-start gap-2 text-[11px]"
                                          >
                                            <TrendingUp className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                                            <span>{p}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {val.contradictions &&
                                    val.contradictions.length > 0 &&
                                    val.contradictions[0] !== "" && (
                                      <div>
                                        <p className="text-[10px] uppercase text-muted-foreground font-medium mb-1">
                                          Contradictions
                                        </p>
                                        <div className="space-y-1">
                                          {val.contradictions.filter(Boolean).map((c, ci) => (
                                            <div
                                              key={ci}
                                              className="flex items-start gap-2 text-[11px]"
                                            >
                                              <AlertCircle className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                                              <span>{c}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                  {val.statisticalNote && (
                                    <div className="flex items-start gap-2 text-[11px] p-2 rounded bg-blue-500/5 border border-blue-500/20">
                                      <TrendingUp className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />
                                      <span className="text-blue-300">{val.statisticalNote}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 text-xs h-8"
                              onClick={() => turnIntoApi(h)}
                              data-testid={`button-turn-api-${i}`}
                            >
                              <Package className="w-3.5 h-3.5" />
                              Turn into API
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 text-xs h-8"
                              onClick={remix}
                              data-testid={`button-remix-${i}`}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Remix
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="registry" className="space-y-6 mt-6">
          <Card className="border-primary/20 bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                External API Registry
              </CardTitle>
              <CardDescription>
                Register third-party APIs with their schemas and sample responses for richer
                hypothesis testing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">API Name *</label>
                  <Input
                    placeholder="Weather API"
                    value={newApiName}
                    onChange={(e) => setNewApiName(e.target.value)}
                    data-testid="input-ext-api-name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Endpoint URL *</label>
                  <Input
                    placeholder="https://api.example.com/v1/data"
                    value={newApiUrl}
                    onChange={(e) => setNewApiUrl(e.target.value)}
                    data-testid="input-ext-api-url"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Description</label>
                <Input
                  placeholder="Returns weather data for a given location"
                  value={newApiDesc}
                  onChange={(e) => setNewApiDesc(e.target.value)}
                  data-testid="input-ext-api-desc"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Input Schema (JSON)</label>
                  <Textarea
                    placeholder={'{\n  "location": "string",\n  "units": "metric | imperial"\n}'}
                    value={newApiInputSchema}
                    onChange={(e) => setNewApiInputSchema(e.target.value)}
                    className="font-mono text-xs h-24 resize-none"
                    data-testid="input-ext-api-schema"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Sample Response (JSON)</label>
                  <Textarea
                    placeholder={'{\n  "temp": 72,\n  "humidity": 45,\n  "condition": "sunny"\n}'}
                    value={newApiSampleResponse}
                    onChange={(e) => setNewApiSampleResponse(e.target.value)}
                    className="font-mono text-xs h-24 resize-none"
                    data-testid="input-ext-api-sample"
                  />
                </div>
              </div>
              <Button
                onClick={addExternalApi}
                disabled={!newApiName.trim() || !newApiUrl.trim()}
                size="sm"
                className="gap-2"
                data-testid="button-add-ext-api"
              >
                <Plus className="w-4 h-4" />
                Add API
              </Button>
            </CardContent>
          </Card>

          {externalApis.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Registered APIs ({externalApis.length})
              </h3>
              {externalApis.map((api) => (
                <Card key={api.id} className="bg-card/50">
                  <CardContent className="py-4 px-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                          <p className="font-medium text-sm">{api.name}</p>
                          {api.inputSchema && (
                            <Badge
                              variant="outline"
                              className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            >
                              <FileJson className="w-2.5 h-2.5 mr-0.5" />
                              schema
                            </Badge>
                          )}
                          {api.sampleResponse && (
                            <Badge
                              variant="outline"
                              className="text-[9px] bg-blue-500/10 text-blue-400 border-blue-500/30"
                            >
                              sample
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{api.url}</p>
                        {api.description && (
                          <p className="text-xs text-muted-foreground/70 mt-0.5">
                            {api.description}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-red-400 shrink-0"
                        onClick={() => removeExternalApi(api.id)}
                        data-testid={`button-remove-ext-${api.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {externalApis.length === 0 && (
            <div className="text-center py-12 space-y-3">
              <Globe className="w-10 h-10 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground">No external APIs registered yet</p>
              <p className="text-xs text-muted-foreground/60">
                Add external API endpoints to discover relationships with your Svivva projects
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="feed" className="space-y-6 mt-6">
          {savedDiscoveries.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Saved Discoveries ({savedDiscoveries.length})
              </h3>
              {savedDiscoveries.map((d) => (
                <Card
                  key={d.id}
                  className="bg-card/50 border-border/50 hover:border-primary/20 transition-colors cursor-pointer"
                  onClick={() => loadDiscovery(d)}
                  data-testid={`card-discovery-${d.id}`}
                >
                  <CardContent className="py-4 px-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{d.question}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {d.summary}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
                            <Clock className="w-3 h-3" />
                            {new Date(d.savedAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            {d.hypotheses.slice(0, 3).map((h, i) => {
                              const rc = resultConfig[h.result] || resultConfig.unclear;
                              return (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className={`text-[9px] ${rc.color}`}
                                >
                                  {rc.label}
                                </Badge>
                              );
                            })}
                            {d.hypotheses.length > 3 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{d.hypotheses.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            loadDiscovery(d);
                          }}
                          data-testid={`button-load-${d.id}`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuestion(d.question);
                            setSelectedIds(d.apisUsed || []);
                            setIsEditing(true);
                            setStep("select");
                            setActiveTab("discover");
                          }}
                          data-testid={`button-remix-feed-${d.id}`}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-red-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteDiscovery(d.id);
                          }}
                          data-testid={`button-delete-${d.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-3">
              <Bookmark className="w-10 h-10 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground">No saved discoveries yet</p>
              <p className="text-xs text-muted-foreground/60">
                Run a discovery and save the results to build your insight memory
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
