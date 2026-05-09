"use client";

import { useState, useEffect } from "react";
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
  Box,
  Cpu,
  Wrench,
  Layers,
  Zap,
  Factory,
  CircuitBoard,
  Cog,
  Lightbulb,
} from "lucide-react";

type DigitalProject = {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  status: string;
};

type HardwareComponent = {
  id: string;
  name: string;
  type: "hardware_component" | "external_api" | "seeds_app";
  description: string;
  url: string;
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
  sourceName: string;
  output: Record<string, unknown>;
  timestamp: string;
  unit?: string;
};

type ValidationDetail = {
  patternsFound: string[];
  contradictions: string[];
  costImpact?: string;
  statisticalNote: string;
};

type HypothesisExperiment = {
  description: string;
  scenarios: ExperimentScenario[];
  dataSourcesUsed: string[];
};

type Hypothesis = {
  id: string;
  hypothesis: string;
  category: string;
  innovationScore?: number;
  experiment: HypothesisExperiment | string;
  execution: ExecutionEntry[];
  validation: ValidationDetail;
  result: "confirmed" | "rejected" | "unclear";
  insight: string;
  confidence: number;
  sourcesUsed: string[];
  nextSteps?: string[];
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
  sourceIds: string[];
  hardwareContext: HardwareContext;
};

type HardwareContext = {
  productType: string;
  materials: string;
  industry: string;
  constraints: string;
};

const STORAGE_KEY = "svivva_hypothesis_hardware_memory";
const COMP_KEY = "svivva_hypothesis_hardware_components";
const HW_PRODUCTS_KEY = "svivva_hardware_products";

type SavedHardwareProduct = {
  id: string;
  name: string;
  description: string;
  category: string;
  targetUsers: string;
  useCases: string;
  requirements: string[];
  materials: string[];
  manufacturingMethod: string;
  budgetRange: number;
  createdAt: string;
};

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
function loadComponents(): HardwareComponent[] {
  try {
    return JSON.parse(localStorage.getItem(COMP_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveComponents(items: HardwareComponent[]) {
  localStorage.setItem(COMP_KEY, JSON.stringify(items));
}
function loadHardwareProducts(): SavedHardwareProduct[] {
  try {
    return JSON.parse(localStorage.getItem(HW_PRODUCTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function isDuplicate(
  question: string,
  ids: string[],
  saved: SavedDiscovery[],
): SavedDiscovery | null {
  const q = question.toLowerCase().trim();
  return (
    saved.find(
      (d) =>
        d.question.toLowerCase().trim() === q &&
        d.sourceIds?.length === ids.length &&
        d.sourceIds.every((a) => ids.includes(a)),
    ) || null
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

const categoryConfig: Record<string, { label: string; color: string; icon: typeof Cpu }> = {
  material_innovation: {
    label: "Material Innovation",
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: Layers,
  },
  process_optimization: {
    label: "Process Optimization",
    color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    icon: Cog,
  },
  iot_integration: {
    label: "IoT Integration",
    color: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    icon: CircuitBoard,
  },
  cross_domain: {
    label: "Cross-Domain",
    color: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    icon: Zap,
  },
  supply_chain: {
    label: "Supply Chain",
    color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    icon: Factory,
  },
  hybrid_product: {
    label: "Hybrid Product",
    color: "bg-pink-500/15 text-pink-400 border-pink-500/30",
    icon: Box,
  },
};

const examplePrompts = [
  "What sensor data could improve my product quality?",
  "Find hidden manufacturing efficiencies",
  "How could IoT transform my physical product?",
  "What digital services could my hardware enable?",
];

const sourceTypeLabels: Record<string, { label: string; color: string }> = {
  hardware_product: {
    label: "Your Product",
    color: "bg-orange-500/15 text-orange-400 border-orange-500/40",
  },
  digital_api: { label: "Digital API", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  external_api: { label: "External", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" },
  hardware_component: {
    label: "Component",
    color: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  },
  seeds_app: { label: "Seeds", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
};

export default function HypothesisHardwarePage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [step, setStep] = useState<"ask" | "context" | "select" | "running" | "results">("ask");
  const [activeTab, setActiveTab] = useState<"discover" | "registry" | "feed">("discover");
  const [progress, setProgress] = useState("");
  const [results, setResults] = useState<DiscoveryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedHypothesis, setExpandedHypothesis] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<SavedDiscovery | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [hwContext, setHwContext] = useState<HardwareContext>({
    productType: "",
    materials: "",
    industry: "",
    constraints: "",
  });

  const [savedDiscoveries, setSavedDiscoveries] = useState<SavedDiscovery[]>([]);
  const [components, setComponents] = useState<HardwareComponent[]>([]);
  const [hardwareProducts, setHardwareProducts] = useState<SavedHardwareProduct[]>([]);
  const [newComp, setNewComp] = useState<Partial<HardwareComponent>>({});
  const [addingType, setAddingType] = useState<"hardware_component" | "external_api" | "seeds_app">(
    "hardware_component",
  );

  useEffect(() => {
    setSavedDiscoveries(loadSaved());
    setComponents(loadComponents());
    setHardwareProducts(loadHardwareProducts());
  }, []);

  const { data: digitalData, isLoading: digitalLoading } = useQuery<{
    digitalProjects: DigitalProject[];
  }>({
    queryKey: ["/api/hypothesis-hardware"],
    queryFn: async () => {
      const r = await authFetch("/api/hypothesis-hardware");
      if (!r.ok) throw new Error("Failed to load");
      return r.json();
    },
  });

  const digitalProjects = digitalData?.digitalProjects || [];

  const allSelectable = [
    ...hardwareProducts.map((hp) => ({
      id: hp.id,
      name: hp.name,
      desc: hp.description || `${hp.category} — ${hp.materials.join(", ")}`,
      sourceType: "hardware_product" as const,
      hasSchema: true,
      hasSample: true,
      raw: null,
      hardwareProduct: hp,
    })),
    ...components.map((c) => ({
      id: c.id,
      name: c.name,
      desc: c.description || c.url || "No description",
      sourceType: c.type as string,
      hasSchema: !!c.inputSchema,
      hasSample: !!c.sampleResponse,
      raw: c,
      hardwareProduct: null as SavedHardwareProduct | null,
    })),
    ...digitalProjects.map((p) => ({
      id: `digital_${p.id}`,
      name: p.name,
      desc: p.description || `/${p.slug} endpoint`,
      sourceType: "digital_api" as const,
      hasSchema: false,
      hasSample: false,
      raw: null,
      hardwareProduct: null as SavedHardwareProduct | null,
    })),
  ];

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 6 ? [...prev, id] : prev,
    );
  }

  function startContext() {
    if (!question.trim()) return;
    setError(null);
    setDuplicateWarning(null);
    setStep("context");
  }

  function startSelect() {
    if (allSelectable.length === 0 && components.length === 0 && digitalProjects.length === 0) {
      setError(
        "Add at least one data source — a hardware component, external API, or connect your digital APIs.",
      );
      return;
    }
    setError(null);
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
      "Scanning hardware + digital sources\u2026",
      "Generating cross-ecosystem hypotheses\u2026",
      "Designing manufacturing experiments\u2026",
      "Running simulated tests\u2026",
      "Validating patterns & cost impact\u2026",
      "Synthesizing innovations\u2026",
    ];
    let i = 0;
    setProgress(stages[0]);
    const interval = setInterval(() => {
      i++;
      if (i < stages.length) setProgress(stages[i]);
    }, 2000);

    try {
      const sources = selectedIds
        .map((id) => {
          const sel = allSelectable.find((s) => s.id === id);
          if (!sel) return null;

          if (sel.sourceType === "hardware_product" && sel.hardwareProduct) {
            const hp = sel.hardwareProduct;
            return {
              id,
              name: hp.name,
              type: "hardware_component" as const,
              description: `${hp.description}. Target users: ${hp.targetUsers}. Use cases: ${hp.useCases}`,
              url: "",
              inputSchema: JSON.stringify({
                category: hp.category,
                requirements: hp.requirements,
                manufacturingMethod: hp.manufacturingMethod,
                budgetPerUnit: hp.budgetRange,
              }),
              sampleResponse: JSON.stringify({
                materials: hp.materials,
                requirements: hp.requirements,
                category: hp.category,
              }),
            };
          }

          if (sel.sourceType === "digital_api") {
            const proj = digitalProjects.find((p) => `digital_${p.id}` === id);
            return {
              id,
              name: sel.name,
              type: "digital_api" as const,
              description: proj?.description || "",
              url: "",
              inputSchema: "",
              sampleResponse: "",
            };
          }

          const comp = sel.raw as HardwareComponent;
          return {
            id,
            name: comp.name,
            type: comp.type,
            description: comp.description,
            url: comp.url,
            inputSchema: comp.inputSchema,
            sampleResponse: comp.sampleResponse,
          };
        })
        .filter(Boolean);

      const previousInsights = savedDiscoveries
        .flatMap((d) => d.hypotheses.filter((h) => h.result === "confirmed").map((h) => h.insight))
        .slice(0, 20);

      const res = await authFetch("/api/hypothesis-hardware", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          hardwareContext: hwContext,
          selectedSources: sources,
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
      id: `hwd_${Date.now()}`,
      question,
      summary: results.summary,
      hypotheses: results.hypotheses,
      savedAt: new Date().toISOString(),
      sourceIds: selectedIds,
      hardwareContext: hwContext,
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
    setSelectedIds(d.sourceIds || []);
    if (d.hardwareContext) setHwContext(d.hardwareContext);
    setStep("results");
    setActiveTab("discover");
  }

  function addComponent() {
    if (!newComp.name?.trim()) return;
    const comp: HardwareComponent = {
      id: `${addingType === "hardware_component" ? "hw" : addingType === "seeds_app" ? "seeds" : "ext"}_${Date.now()}`,
      name: newComp.name?.trim() || "",
      type: addingType,
      description: newComp.description?.trim() || "",
      url: newComp.url?.trim() || "",
      inputSchema: newComp.inputSchema?.trim() || "",
      sampleResponse: newComp.sampleResponse?.trim() || "",
    };
    const updated = [...components, comp];
    setComponents(updated);
    saveComponents(updated);
    setNewComp({});
  }

  function removeComponent(id: string) {
    const updated = components.filter((c) => c.id !== id);
    setComponents(updated);
    saveComponents(updated);
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  }

  function turnIntoHardware(h: Hypothesis) {
    const prompt = `Build a hardware product based on this insight: ${h.insight}\n\nHypothesis: ${h.hypothesis}${h.nextSteps ? `\n\nNext steps: ${h.nextSteps.join(", ")}` : ""}`;
    router.push(`/dashboard/hardware-builder?insight=${encodeURIComponent(prompt)}`);
  }

  function turnIntoDigitalApi(h: Hypothesis) {
    const prompt = `Build an API that implements this hardware insight: ${h.insight}\n\nBased on hypothesis: ${h.hypothesis}`;
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

  return (
    <div className="max-w-5xl mx-auto space-y-8" data-testid="page-hypothesis-hardware">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 border border-orange-500/20">
            <FlaskConical className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Hypothesis Lab</h1>
            <p className="text-muted-foreground text-sm">
              Hardware Innovation Engine — discover what to build next
            </p>
          </div>
        </div>
        {step !== "ask" && activeTab === "discover" && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={reset}
            data-testid="button-reset"
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
            <Wrench className="w-4 h-4" />
            Source Registry
            {components.length > 0 && (
              <Badge variant="secondary" className="text-[10px] ml-1">
                {components.length}
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
              <Card className="border-orange-500/20 bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-8 pb-8 space-y-6">
                  <div className="text-center space-y-2 mb-4">
                    <Box className="w-10 h-10 text-orange-400 mx-auto" />
                    <h2 className="text-lg font-semibold">What do you want to discover?</h2>
                    <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                      Ask a question about your hardware, manufacturing, or physical products. The
                      system connects to your digital APIs, Seeds apps, and external data to find
                      innovations you&apos;d never think of.
                    </p>
                  </div>
                  <div className="flex gap-3 max-w-xl mx-auto">
                    <Input
                      placeholder="How could IoT transform my manufacturing process?"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && startContext()}
                      className="flex-1"
                      data-testid="input-question"
                    />
                    <Button
                      onClick={startContext}
                      disabled={!question.trim()}
                      className="gap-2 shrink-0 bg-orange-600 hover:bg-orange-700"
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

              <div className="grid gap-4 sm:grid-cols-3 pt-2">
                <Card className="bg-card/30 border-border/30">
                  <CardContent className="pt-5 pb-4 px-4 text-center space-y-2">
                    <Wrench className="w-5 h-5 text-orange-400 mx-auto" />
                    <p className="text-xs font-semibold">Hardware + Digital</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      Connect physical products with your digital APIs and Seeds apps
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-card/30 border-border/30">
                  <CardContent className="pt-5 pb-4 px-4 text-center space-y-2">
                    <Lightbulb className="w-5 h-5 text-orange-400 mx-auto" />
                    <p className="text-xs font-semibold">Never-Seen Ideas</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      AI finds cross-domain innovations no one has thought of
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-card/30 border-border/30">
                  <CardContent className="pt-5 pb-4 px-4 text-center space-y-2">
                    <Factory className="w-5 h-5 text-orange-400 mx-auto" />
                    <p className="text-xs font-semibold">Manufacturing Ready</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      Get actionable insights with cost impact and next steps
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {step === "context" && (
            <div className="space-y-6">
              <Card className="border-orange-500/10 bg-card/30">
                <CardContent className="py-4 px-5 flex items-center gap-3">
                  <Search className="w-4 h-4 text-orange-400 shrink-0" />
                  <p className="text-sm font-medium truncate">&quot;{question}&quot;</p>
                </CardContent>
              </Card>

              <Card className="border-orange-500/20 bg-card/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Box className="w-4 h-4 text-orange-400" />
                    Hardware Context
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Optional — helps the AI generate more relevant innovations for your specific
                    situation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Product Type</label>
                      <Input
                        placeholder="e.g., Smart thermostat, Industrial sensor"
                        value={hwContext.productType}
                        onChange={(e) =>
                          setHwContext({ ...hwContext, productType: e.target.value })
                        }
                        data-testid="input-product-type"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Industry</label>
                      <Input
                        placeholder="e.g., Home automation, Agriculture, Automotive"
                        value={hwContext.industry}
                        onChange={(e) => setHwContext({ ...hwContext, industry: e.target.value })}
                        data-testid="input-industry"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Materials</label>
                      <Input
                        placeholder="e.g., Aluminum, PCB, ABS plastic"
                        value={hwContext.materials}
                        onChange={(e) => setHwContext({ ...hwContext, materials: e.target.value })}
                        data-testid="input-materials"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Constraints</label>
                      <Input
                        placeholder="e.g., Budget under $10/unit, waterproof"
                        value={hwContext.constraints}
                        onChange={(e) =>
                          setHwContext({ ...hwContext, constraints: e.target.value })
                        }
                        data-testid="input-constraints"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={startSelect}
                      className="gap-2 bg-orange-600 hover:bg-orange-700"
                      data-testid="button-next-select"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Select Data Sources
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {step === "select" && (
            <div className="space-y-6">
              <Card className="border-orange-500/10 bg-card/30">
                <CardContent className="py-4 px-5 flex items-center gap-3">
                  <Search className="w-4 h-4 text-orange-400 shrink-0" />
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
                          You already ran this exact combo on{" "}
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
                    <h2 className="text-base font-semibold">
                      Select data sources to cross-analyze
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Choose 1-6 sources. Mix hardware components, digital APIs, Seeds apps, and
                      external data.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {selectedIds.length}/6 selected
                  </Badge>
                </div>

                {digitalLoading ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-28 rounded-xl" />
                    ))}
                  </div>
                ) : allSelectable.length === 0 ? (
                  <Card className="bg-muted/20">
                    <CardContent className="py-8 text-center space-y-2">
                      <p className="text-sm text-muted-foreground">No sources available yet.</p>
                      <p className="text-xs text-muted-foreground/60">
                        Register hardware components, connect your digital APIs, or add external
                        data sources.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab("registry")}
                        className="gap-2 mt-2"
                        data-testid="button-goto-registry"
                      >
                        <Plus className="w-4 h-4" />
                        Add Source
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {allSelectable.map((item) => {
                      const selected = selectedIds.includes(item.id);
                      const stl =
                        sourceTypeLabels[item.sourceType] || sourceTypeLabels.hardware_component;
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleSelect(item.id)}
                          className={`text-left p-4 rounded-xl border transition-all ${selected ? "border-orange-500 bg-orange-500/5 ring-1 ring-orange-500/30" : "border-border/50 bg-card/50 hover:border-orange-500/30"}`}
                          data-testid={`button-select-${item.id}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {item.desc}
                              </p>
                            </div>
                            <div
                              className={`p-1 rounded-md shrink-0 ${selected ? "bg-orange-500 text-white" : "bg-muted/50"}`}
                            >
                              {selected ? (
                                <Minus className="w-3.5 h-3.5" />
                              ) : (
                                <Plus className="w-3.5 h-3.5" />
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className={`text-[10px] ${stl.color}`}>
                              {stl.label}
                            </Badge>
                            {item.hasSchema && (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              >
                                <FileJson className="w-2.5 h-2.5 mr-0.5" />
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
                  className="gap-2 bg-orange-600 hover:bg-orange-700"
                  data-testid="button-run-discovery"
                >
                  <Microscope className="w-4 h-4" />
                  Run Discovery
                </Button>
              </div>
            </div>
          )}

          {step === "running" && (
            <Card className="border-orange-500/20">
              <CardContent className="py-16 text-center space-y-6">
                <div className="relative mx-auto w-16 h-16">
                  <div className="absolute inset-0 rounded-full bg-orange-500/10 animate-ping" />
                  <div className="relative w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <FlaskConical className="w-8 h-8 text-orange-400 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold">{progress}</p>
                  <p className="text-xs text-muted-foreground">
                    Connecting hardware + digital + Seeds ecosystem
                  </p>
                </div>
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-orange-400" />
              </CardContent>
            </Card>
          )}

          {step === "results" && results && (
            <div className="space-y-6">
              {results.summary && (
                <Card className="border-orange-500/20 bg-gradient-to-r from-orange-500/5 via-transparent to-transparent">
                  <CardContent className="py-5 px-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="p-2 rounded-lg bg-orange-500/10 shrink-0">
                        <BrainCircuit className="w-5 h-5 text-orange-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                          Discovery Summary
                        </p>
                        <p className="text-sm font-medium" data-testid="text-summary">
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
                      data-testid="button-save"
                    >
                      <Bookmark className="w-4 h-4" />
                      {alreadySaved ? "Saved" : "Save"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-muted-foreground">
                  {results.hypotheses.length} Innovation{results.hypotheses.length === 1 ? "" : "s"}{" "}
                  Discovered
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
                const cat = categoryConfig[h.category] || {
                  label: h.category,
                  color: "bg-muted text-muted-foreground border-border",
                  icon: Zap,
                };
                const CatIcon = cat.icon;
                const isExpanded = expandedHypothesis === h.id;
                const exp = typeof h.experiment === "object" ? h.experiment : null;
                const val = h.validation;

                return (
                  <Card
                    key={h.id || i}
                    className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-orange-500/20 transition-colors"
                  >
                    <CardContent className="py-6 px-6 space-y-4">
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={`text-[10px] ${rc.color}`}>
                            <ResultIcon className="w-3 h-3 mr-1" />
                            {rc.label}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] ${cat.color}`}>
                            <CatIcon className="w-3 h-3 mr-1" />
                            {cat.label}
                          </Badge>
                          {h.innovationScore && (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                            >
                              <Lightbulb className="w-3 h-3 mr-1" />
                              Innovation: {h.innovationScore}
                            </Badge>
                          )}
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

                        {h.nextSteps && h.nextSteps.length > 0 && (
                          <div>
                            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                              Next Steps
                            </p>
                            <div className="space-y-1">
                              {h.nextSteps.map((ns, ni) => (
                                <div key={ni} className="flex items-start gap-2 text-[11px]">
                                  <span className="text-orange-400 font-bold shrink-0">
                                    {ni + 1}.
                                  </span>
                                  <span>{ns}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-4 pt-1 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 rounded-full bg-muted/50 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${h.confidence >= 70 ? "bg-emerald-500" : h.confidence >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                                style={{ width: `${h.confidence}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium tabular-nums">
                              {h.confidence}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {h.sourcesUsed?.map((s, j) => (
                              <Badge key={j} variant="secondary" className="text-[10px]">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => setExpandedHypothesis(isExpanded ? null : h.id)}
                          className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 transition-colors pt-1"
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
                                  <Beaker className="w-4 h-4 text-orange-400" />
                                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Experiment Design
                                  </p>
                                </div>
                                <p className="text-sm text-muted-foreground">{exp.description}</p>
                                {exp.scenarios && exp.scenarios.length > 0 && (
                                  <div className="space-y-2">
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                                      Test Scenarios
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
                                {exp.dataSourcesUsed && (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="text-[10px] text-muted-foreground">
                                      Sources used:
                                    </p>
                                    {exp.dataSourcesUsed.map((a, ai) => (
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
                                  <Microscope className="w-4 h-4 text-orange-400" />
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
                                        {ex.sourceName}
                                      </span>
                                      <pre className="font-mono text-[10px] bg-black/20 rounded px-1.5 py-0.5 overflow-x-auto flex-1">
                                        {JSON.stringify(ex.output)}
                                      </pre>
                                      {ex.unit && (
                                        <span className="text-[9px] text-muted-foreground/50 shrink-0">
                                          {ex.unit}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {val && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <ShieldCheck className="w-4 h-4 text-orange-400" />
                                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Validation
                                  </p>
                                </div>
                                {val.patternsFound && val.patternsFound.length > 0 && (
                                  <div>
                                    <p className="text-[10px] uppercase text-muted-foreground font-medium mb-1">
                                      Patterns
                                    </p>
                                    {val.patternsFound.map((p, pi) => (
                                      <div
                                        key={pi}
                                        className="flex items-start gap-2 text-[11px] mb-1"
                                      >
                                        <TrendingUp className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                                        <span>{p}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {val.contradictions &&
                                  val.contradictions.filter(Boolean).length > 0 && (
                                    <div>
                                      <p className="text-[10px] uppercase text-muted-foreground font-medium mb-1">
                                        Contradictions
                                      </p>
                                      {val.contradictions.filter(Boolean).map((c, ci) => (
                                        <div
                                          key={ci}
                                          className="flex items-start gap-2 text-[11px] mb-1"
                                        >
                                          <AlertCircle className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                                          <span>{c}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                {val.costImpact && (
                                  <div className="flex items-start gap-2 text-[11px] p-2 rounded bg-emerald-500/5 border border-emerald-500/20">
                                    <TrendingUp className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                                    <span className="text-emerald-300 font-medium">
                                      {val.costImpact}
                                    </span>
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
                            onClick={() => turnIntoHardware(h)}
                            data-testid={`button-build-hw-${i}`}
                          >
                            <Box className="w-3.5 h-3.5" />
                            Build Hardware
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-xs h-8"
                            onClick={() => turnIntoDigitalApi(h)}
                            data-testid={`button-build-api-${i}`}
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
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="registry" className="space-y-6 mt-6">
          <Card className="border-orange-500/20 bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange-400" />
                Source Registry
              </CardTitle>
              <CardDescription>
                Register hardware components, external APIs, and Seeds apps. Your digital Svivva
                APIs are auto-connected.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 mb-2">
                {[
                  { type: "hardware_component" as const, label: "Hardware Component", icon: Cpu },
                  { type: "external_api" as const, label: "External API", icon: Globe },
                  { type: "seeds_app" as const, label: "Seeds App", icon: Zap },
                ].map((t) => (
                  <Button
                    key={t.type}
                    variant={addingType === t.type ? "default" : "outline"}
                    size="sm"
                    className={`gap-1.5 text-xs ${addingType === t.type ? "bg-orange-600 hover:bg-orange-700" : ""}`}
                    onClick={() => setAddingType(t.type)}
                    data-testid={`button-type-${t.type}`}
                  >
                    <t.icon className="w-3.5 h-3.5" />
                    {t.label}
                  </Button>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">
                    {addingType === "hardware_component"
                      ? "Component Name *"
                      : addingType === "seeds_app"
                        ? "Seeds App Name *"
                        : "API Name *"}
                  </label>
                  <Input
                    placeholder={
                      addingType === "hardware_component"
                        ? "e.g., Temperature Sensor"
                        : addingType === "seeds_app"
                          ? "e.g., My Fitness App"
                          : "e.g., Weather API"
                    }
                    value={newComp.name || ""}
                    onChange={(e) => setNewComp({ ...newComp, name: e.target.value })}
                    data-testid="input-comp-name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">
                    {addingType === "hardware_component" ? "Data Sheet URL" : "Endpoint URL"}
                  </label>
                  <Input
                    placeholder={
                      addingType === "hardware_component"
                        ? "https://docs.example.com/sensor"
                        : "https://api.example.com/v1"
                    }
                    value={newComp.url || ""}
                    onChange={(e) => setNewComp({ ...newComp, url: e.target.value })}
                    data-testid="input-comp-url"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Description</label>
                <Input
                  placeholder={
                    addingType === "hardware_component"
                      ? "Measures ambient temperature, outputs 0-5V analog signal"
                      : "Returns data about..."
                  }
                  value={newComp.description || ""}
                  onChange={(e) => setNewComp({ ...newComp, description: e.target.value })}
                  data-testid="input-comp-desc"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">
                    {addingType === "hardware_component"
                      ? "Specs / Input Schema (JSON)"
                      : "Input Schema (JSON)"}
                  </label>
                  <Textarea
                    placeholder={
                      addingType === "hardware_component"
                        ? '{\n  "range": "-40 to 125°C",\n  "accuracy": "±0.5°C",\n  "voltage": "3.3-5V"\n}'
                        : '{\n  "location": "string"\n}'
                    }
                    value={newComp.inputSchema || ""}
                    onChange={(e) => setNewComp({ ...newComp, inputSchema: e.target.value })}
                    className="font-mono text-xs h-24 resize-none"
                    data-testid="input-comp-schema"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">
                    {addingType === "hardware_component"
                      ? "Sample Output (JSON)"
                      : "Sample Response (JSON)"}
                  </label>
                  <Textarea
                    placeholder={
                      addingType === "hardware_component"
                        ? '{\n  "temperature": 23.5,\n  "unit": "celsius",\n  "timestamp": "2025-01-15T10:00:00Z"\n}'
                        : '{\n  "temp": 72,\n  "humidity": 45\n}'
                    }
                    value={newComp.sampleResponse || ""}
                    onChange={(e) => setNewComp({ ...newComp, sampleResponse: e.target.value })}
                    className="font-mono text-xs h-24 resize-none"
                    data-testid="input-comp-sample"
                  />
                </div>
              </div>
              <Button
                onClick={addComponent}
                disabled={!newComp.name?.trim()}
                size="sm"
                className="gap-2 bg-orange-600 hover:bg-orange-700"
                data-testid="button-add-comp"
              >
                <Plus className="w-4 h-4" />
                Add{" "}
                {addingType === "hardware_component"
                  ? "Component"
                  : addingType === "seeds_app"
                    ? "Seeds App"
                    : "API"}
              </Button>
            </CardContent>
          </Card>

          {hardwareProducts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Box className="w-4 h-4 text-orange-400" />
                Your Hardware Products ({hardwareProducts.length})
              </h3>
              <p className="text-xs text-muted-foreground/60">
                Products you&apos;ve built in the Hardware Builder — auto-available for hypothesis
                testing.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {hardwareProducts.map((hp) => (
                  <Card key={hp.id} className="bg-card/30 border-orange-500/20">
                    <CardContent className="py-3 px-4 flex items-center gap-3">
                      <Box className="w-4 h-4 text-orange-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{hp.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {hp.category} — {hp.materials.join(", ") || "No materials"}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[9px] ml-auto shrink-0 bg-orange-500/15 text-orange-400 border-orange-500/40"
                      >
                        product
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {digitalProjects.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Auto-Connected Digital APIs ({digitalProjects.length})
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {digitalProjects.map((p) => (
                  <Card key={p.id} className="bg-card/30 border-border/30">
                    <CardContent className="py-3 px-4 flex items-center gap-3">
                      <Package className="w-4 h-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {p.description || `/${p.slug}`}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[9px] ml-auto shrink-0 bg-blue-500/10 text-blue-400 border-blue-500/30"
                      >
                        digital
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {components.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Registered Sources ({components.length})
              </h3>
              {components.map((c) => {
                const stl = sourceTypeLabels[c.type] || sourceTypeLabels.hardware_component;
                return (
                  <Card key={c.id} className="bg-card/50">
                    <CardContent className="py-4 px-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {c.type === "hardware_component" ? (
                              <Cpu className="w-4 h-4 text-orange-400 shrink-0" />
                            ) : c.type === "seeds_app" ? (
                              <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                            )}
                            <p className="font-medium text-sm">{c.name}</p>
                            <Badge variant="outline" className={`text-[9px] ${stl.color}`}>
                              {stl.label}
                            </Badge>
                            {c.inputSchema && (
                              <Badge
                                variant="outline"
                                className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              >
                                <FileJson className="w-2.5 h-2.5 mr-0.5" />
                                schema
                              </Badge>
                            )}
                          </div>
                          {c.url && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">{c.url}</p>
                          )}
                          {c.description && (
                            <p className="text-xs text-muted-foreground/70 mt-0.5">
                              {c.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-red-400 shrink-0"
                          onClick={() => removeComponent(c.id)}
                          data-testid={`button-remove-${c.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {components.length === 0 &&
            digitalProjects.length === 0 &&
            hardwareProducts.length === 0 && (
              <div className="text-center py-12 space-y-3">
                <Wrench className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">No sources available yet</p>
                <p className="text-xs text-muted-foreground/60">
                  Build a product in the Hardware Builder, create digital APIs, or register
                  components here to start discovering innovations
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
                  className="bg-card/50 border-border/50 hover:border-orange-500/20 transition-colors cursor-pointer"
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
                          className="text-muted-foreground hover:text-orange-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuestion(d.question);
                            setSelectedIds(d.sourceIds || []);
                            if (d.hardwareContext) setHwContext(d.hardwareContext);
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
                Run a discovery and save the results to build your innovation memory
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
