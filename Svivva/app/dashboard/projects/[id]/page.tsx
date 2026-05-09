"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Play,
  GitBranch,
  Sparkles,
  Code2,
  Copy,
  CheckCircle2,
  Clock,
  BarChart3,
  Loader2,
  RefreshCw,
  Download,
  Sliders,
  Zap,
  Dna,
  Search,
  AlertTriangle,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Skull,
  BrainCircuit,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ApiInstrument } from "@/components/api-instrument";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  systemPrompt: string;
  outputSchema: Record<string, unknown>;
  status: string;
  createdAt: string;
}

interface TrainingExample {
  id: string;
  input: string;
  output: Record<string, unknown>;
  sortOrder: number;
}

interface EvalSuite {
  id: string;
  name: string;
  description: string | null;
  totalCases: number;
  activeCases: number;
  categoryCounts: Record<string, number>;
  createdAt: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const projectId = params.id as string;
  const [apiOrigin, setApiOrigin] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [autopsyInput, setAutopsyInput] = useState("");
  const [autopsyError, setAutopsyError] = useState("");
  const [breedVersionA, setBreedVersionA] = useState("");
  const [breedVersionB, setBreedVersionB] = useState("");
  const [augmentStrategy, setAugmentStrategy] = useState("diversity");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setApiOrigin(window.location.origin);
    }
  }, []);

  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch project");
      return response.json();
    },
  });

  const {
    data: trainingData,
    isLoading: trainingLoading,
    isError: trainingError,
  } = useQuery<{ examples: TrainingExample[]; count: number }>({
    queryKey: ["/api/projects", projectId, "training"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/generate-training`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch training data");
      return response.json();
    },
    enabled: !!projectId,
  });

  const {
    data: evalsData,
    isLoading: evalsLoading,
    isError: evalsError,
  } = useQuery<{ suites: EvalSuite[]; totalSuites: number }>({
    queryKey: ["/api/projects", projectId, "evals"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/generate-evals`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch evals");
      return response.json();
    },
    enabled: !!projectId,
  });

  const generateTrainingMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/generate-training`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ count: 5, minApproved: 3 }),
      });
      if (!response.ok) throw new Error("Failed to generate training data");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "training"] });
      toast({
        title: "Training data generated",
        description: `${data.approved} examples approved and stored`,
      });
    },
    onError: () => {
      toast({
        title: "Failed to generate training data",
        variant: "destructive",
      });
    },
  });

  const generateEvalsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/generate-evals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ count: 50 }),
      });
      if (!response.ok) throw new Error("Failed to generate evals");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "evals"] });
      toast({
        title: "Eval cases generated",
        description: `${data.generated} cases created in suite "${data.suiteName}"`,
      });
    },
    onError: () => {
      toast({
        title: "Failed to generate eval cases",
        variant: "destructive",
      });
    },
  });

  const { data: versionsData } = useQuery<
    { id: string; version: number; systemPrompt: string; changeSummary: string | null }[]
  >({
    queryKey: ["/api/projects", projectId, "versions"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/versions`, {
        credentials: "include",
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data.versions || [];
    },
    enabled: !!projectId,
  });

  const { data: chaosData, isLoading: chaosLoading } = useQuery({
    queryKey: ["/api/projects", projectId, "chaos"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/chaos`, { credentials: "include" });
      if (!response.ok) return { runs: [] };
      return response.json();
    },
    enabled: !!projectId,
  });

  const { data: breedData, isLoading: breedLoading } = useQuery({
    queryKey: ["/api/projects", projectId, "breed"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/breed`, { credentials: "include" });
      if (!response.ok) return { breeds: [] };
      return response.json();
    },
    enabled: !!projectId,
  });

  const { data: autopsyData, isLoading: autopsyLoading } = useQuery({
    queryKey: ["/api/projects", projectId, "autopsy"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/autopsy`, {
        credentials: "include",
      });
      if (!response.ok) return { autopsies: [] };
      return response.json();
    },
    enabled: !!projectId,
  });

  const { data: neuralPromptData, isLoading: neuralPromptLoading } = useQuery({
    queryKey: ["/api/projects", projectId, "neural", "prompt-optimizer"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/neural/prompt-optimizer`, {
        credentials: "include",
      });
      if (!response.ok) return { analyses: [] };
      return response.json();
    },
    enabled: !!projectId,
  });

  const { data: neuralSchemaData, isLoading: neuralSchemaLoading } = useQuery({
    queryKey: ["/api/projects", projectId, "neural", "schema-enhancer"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/neural/schema-enhancer`, {
        credentials: "include",
      });
      if (!response.ok) return { analyses: [] };
      return response.json();
    },
    enabled: !!projectId,
  });

  const { data: neuralQualityData, isLoading: neuralQualityLoading } = useQuery({
    queryKey: ["/api/projects", projectId, "neural", "quality-gate"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/neural/quality-gate`, {
        credentials: "include",
      });
      if (!response.ok) return { scores: [], averages: {} };
      return response.json();
    },
    enabled: !!projectId,
  });

  const { data: neuralAugmentData, isLoading: neuralAugmentLoading } = useQuery({
    queryKey: ["/api/projects", projectId, "neural", "training-augment"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/neural/training-augment`, {
        credentials: "include",
      });
      if (!response.ok) return { jobs: [], strategies: [] };
      return response.json();
    },
    enabled: !!projectId,
  });

  const { data: neuralAnomalyData, isLoading: neuralAnomalyLoading } = useQuery({
    queryKey: ["/api/projects", projectId, "neural", "anomalies"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/neural/anomalies`, {
        credentials: "include",
      });
      if (!response.ok) return { anomalies: [] };
      return response.json();
    },
    enabled: !!projectId,
  });

  const chaosMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/chaos`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Chaos test failed");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "chaos"] });
      toast({
        title: `Toughness Score: ${data.resilienceScore}%`,
        description: `Your API handled ${data.passedInputs} out of ${data.totalInputs} tricky inputs`,
      });
    },
    onError: () => {
      toast({ title: "Chaos test failed", variant: "destructive" });
    },
  });

  const breedMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/breed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ versionIdA: breedVersionA, versionIdB: breedVersionB }),
      });
      if (!response.ok) throw new Error("Breeding failed");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "breed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "versions"] });
      toast({
        title: `Offspring v${data.offspringVersion} created`,
        description: `Score: ${data.offspringScore}% (Parent A: ${data.parentAScore}%, Parent B: ${data.parentBScore}%)`,
      });
    },
    onError: () => {
      toast({ title: "Breeding failed", variant: "destructive" });
    },
  });

  const autopsyMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/autopsy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ input: autopsyInput, error: autopsyError || undefined }),
      });
      if (!response.ok) throw new Error("Autopsy failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "autopsy"] });
      setAutopsyInput("");
      setAutopsyError("");
      toast({ title: "Investigation complete", description: "We found out what went wrong" });
    },
    onError: () => {
      toast({ title: "Autopsy failed", variant: "destructive" });
    },
  });

  const neuralPromptMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/neural/prompt-optimizer`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Prompt optimization failed");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/projects", projectId, "neural", "prompt-optimizer"],
      });
      toast({
        title: "Instructions improved",
        description: `${data.improvementScore}% better than before`,
      });
    },
    onError: () => {
      toast({ title: "Instruction improvement failed", variant: "destructive" });
    },
  });

  const applyPromptMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      const response = await fetch(`/api/projects/${projectId}/neural/prompt-optimizer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ analysisId }),
      });
      if (!response.ok) throw new Error("Failed to apply");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      toast({ title: "Improved instructions applied", description: "New version created" });
    },
    onError: () => {
      toast({ title: "Failed to apply improvements", variant: "destructive" });
    },
  });

  const neuralSchemaMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/neural/schema-enhancer`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Schema enhancement failed");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/projects", projectId, "neural", "schema-enhancer"],
      });
      toast({ title: "Response format improved", description: `Change risk: ${data.riskLevel}` });
    },
    onError: () => {
      toast({ title: "Format improvement failed", variant: "destructive" });
    },
  });

  const applySchemaMutation = useMutation({
    mutationFn: async (analysisId: string) => {
      const response = await fetch(`/api/projects/${projectId}/neural/schema-enhancer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ analysisId }),
      });
      if (!response.ok) throw new Error("Failed to apply");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      toast({ title: "Improved format applied", description: "New version created" });
    },
    onError: () => {
      toast({ title: "Failed to apply enhancement", variant: "destructive" });
    },
  });

  const neuralAugmentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/neural/training-augment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ strategy: augmentStrategy, count: 10 }),
      });
      if (!response.ok) throw new Error("Augmentation failed");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/projects", projectId, "neural", "training-augment"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "training"] });
      toast({
        title: "New training examples created",
        description: `${data.approved} good examples kept out of ${data.generated} generated`,
      });
    },
    onError: () => {
      toast({ title: "Training example creation failed", variant: "destructive" });
    },
  });

  const neuralAnomalyMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/neural/anomalies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error("Anomaly detection failed");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/projects", projectId, "neural", "anomalies"],
      });
      toast({
        title: "Issue scan complete",
        description: data.summary || `Found ${data.anomalies?.length || 0} recurring issues`,
      });
    },
    onError: () => {
      toast({ title: "Issue scan failed", variant: "destructive" });
    },
  });

  const copyEndpoint = () => {
    const endpoint = `${apiOrigin}/api/runtime/${projectId}/main`;
    navigator.clipboard.writeText(endpoint);
    toast({
      title: "Copied",
      description: "API endpoint copied to clipboard",
    });
  };

  const downloadOpenApiSpec = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/openapi?download=true`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to download spec");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project?.slug || projectId}-openapi.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Downloaded",
        description: "API blueprint downloaded successfully",
      });
    } catch {
      toast({
        title: "Download failed",
        description: "Could not download API blueprint",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12" data-testid="text-project-not-found">
        <h2 className="text-xl font-semibold mb-2">Project not found</h2>
        <Link href="/dashboard/projects">
          <Button variant="outline" data-testid="button-back-to-projects">
            Back to Projects
          </Button>
        </Link>
      </div>
    );
  }

  const hasTrainingData = trainingData && trainingData.count > 0;
  const hasEvals = evalsData && evalsData.totalSuites > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/dashboard/projects">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold truncate" data-testid="text-project-name">
              {project.name}
            </h1>
            <Badge
              variant={project.status === "deployed" ? "default" : "secondary"}
              data-testid="badge-project-status"
            >
              {project.status === "deployed" ? (
                <CheckCircle2 className="w-3 h-3 mr-1" />
              ) : (
                <Clock className="w-3 h-3 mr-1" />
              )}
              {project.status}
            </Badge>
          </div>
          <p className="text-muted-foreground truncate" data-testid="text-project-description">
            {project.description || "No description"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            className="gap-2"
            onClick={downloadOpenApiSpec}
            disabled={isExporting}
            data-testid="button-export-openapi"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting ? "Exporting..." : "Export API Blueprint"}
          </Button>
          <Button variant="outline" className="gap-2" data-testid="button-run-evals">
            <Play className="w-4 h-4" />
            Run Tests
          </Button>
          <Button className="bg-[#7BA3AC] hover:bg-[#6B939C] gap-2" data-testid="button-deploy">
            <CheckCircle2 className="w-4 h-4" />
            Deploy
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="w-5 h-5" />
            API Endpoint
          </CardTitle>
          <CardDescription>Use this endpoint to call your API</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <code className="flex-1 text-sm break-all" data-testid="text-api-endpoint">
              POST {apiOrigin}/api/runtime/{projectId}/main
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyEndpoint}
              data-testid="button-copy-endpoint"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="instrument" data-testid="tab-instrument">
            <Sliders className="w-4 h-4 mr-1" />
            Instrument
          </TabsTrigger>
          <TabsTrigger value="overview" data-testid="tab-overview">
            Overview
          </TabsTrigger>
          <TabsTrigger value="schema" data-testid="tab-schema">
            Schema
          </TabsTrigger>
          <TabsTrigger value="training" data-testid="tab-training">
            Training Data{" "}
            {hasTrainingData && (
              <Badge variant="secondary" className="ml-1">
                {trainingData.count}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="evals" data-testid="tab-evals">
            Evaluations{" "}
            {hasEvals && (
              <Badge variant="secondary" className="ml-1">
                {evalsData.totalSuites}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="versions" data-testid="tab-versions">
            Versions
          </TabsTrigger>
          <TabsTrigger value="chaos" data-testid="tab-chaos" className="gap-1">
            <Zap className="w-4 h-4" />
            Chaos
          </TabsTrigger>
          <TabsTrigger value="breed" data-testid="tab-breed" className="gap-1">
            <Dna className="w-4 h-4" />
            Breed
          </TabsTrigger>
          <TabsTrigger value="autopsy" data-testid="tab-autopsy" className="gap-1">
            <Skull className="w-4 h-4" />
            Autopsy
          </TabsTrigger>
          <TabsTrigger value="neural" data-testid="tab-neural" className="gap-1">
            <BrainCircuit className="w-4 h-4" />
            Neural
          </TabsTrigger>
        </TabsList>

        <TabsContent value="instrument">
          <ApiInstrument
            projectId={projectId}
            initialPrompt={project.systemPrompt}
            onComplete={(data) => {
              toast({
                title: "Brand saved!",
                description: `Your API "${data.name}" has been branded successfully.`,
              });
            }}
          />
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  API Calls (24h)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-api-calls-24h">
                  0
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Test Pass Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-eval-pass-rate">
                  —
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Current Version
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-current-version">
                  v1
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <pre
                className="p-4 bg-muted rounded-lg overflow-auto text-sm whitespace-pre-wrap"
                data-testid="text-system-prompt"
              >
                {project.systemPrompt}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schema">
          <Card>
            <CardHeader>
              <CardTitle>Output Schema</CardTitle>
              <CardDescription>
                This defines the exact format your API's responses will follow -- it ensures every
                answer comes back organized the same way
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre
                className="p-4 bg-muted rounded-lg overflow-auto text-sm"
                data-testid="text-output-schema"
              >
                {JSON.stringify(project.outputSchema, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Training Data
                  </CardTitle>
                  <CardDescription>
                    These are example conversations that teach your API how to respond -- like
                    showing someone how to do a job before they start
                  </CardDescription>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Link href={`/dashboard/projects/${projectId}/training`}>
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-[#7BA3AC] hover:bg-[#6B939C]"
                      data-testid="button-manage-training"
                    >
                      Manage Training Data
                    </Button>
                  </Link>
                  {hasTrainingData && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateTrainingMutation.mutate()}
                      disabled={generateTrainingMutation.isPending}
                      data-testid="button-regenerate-training"
                    >
                      {generateTrainingMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Auto-Generate
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {trainingLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : trainingError ? (
                <div
                  className="text-center py-8 text-destructive"
                  data-testid="text-training-error"
                >
                  Failed to load training data. Please try again.
                </div>
              ) : hasTrainingData ? (
                <div className="space-y-4" data-testid="container-training-examples">
                  {trainingData.examples.map((example) => (
                    <div
                      key={example.id}
                      className="p-4 border rounded-lg space-y-2"
                      data-testid={`card-training-example-${example.id}`}
                    >
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Input:</span>
                        <p
                          className="text-sm mt-1"
                          data-testid={`text-training-input-${example.id}`}
                        >
                          {example.input}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Output:</span>
                        <pre
                          className="text-sm mt-1 p-2 bg-muted rounded overflow-auto"
                          data-testid={`text-training-output-${example.id}`}
                        >
                          {JSON.stringify(example.output, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8" data-testid="text-training-empty">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No training data yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add some example conversations so your API knows exactly how to respond. We can
                    generate them for you automatically.
                  </p>
                  <Button
                    className="bg-[#7BA3AC] hover:bg-[#6B939C] gap-2"
                    onClick={() => generateTrainingMutation.mutate()}
                    disabled={generateTrainingMutation.isPending}
                    data-testid="button-generate-training"
                  >
                    {generateTrainingMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {generateTrainingMutation.isPending
                      ? "Generating..."
                      : "Generate Training Data"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evals">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Evaluations
                  </CardTitle>
                  <CardDescription>
                    Automatic tests that check if your API gives the right answers -- we create
                    tricky questions so you can catch problems early
                  </CardDescription>
                </div>
                {hasEvals && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateEvalsMutation.mutate()}
                    disabled={generateEvalsMutation.isPending}
                    data-testid="button-regenerate-evals"
                  >
                    {generateEvalsMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Generate More
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {evalsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : evalsError ? (
                <div className="text-center py-8 text-destructive" data-testid="text-evals-error">
                  Failed to load evaluations. Please try again.
                </div>
              ) : hasEvals ? (
                <div className="space-y-4" data-testid="container-eval-suites">
                  {evalsData.suites.map((suite) => (
                    <div
                      key={suite.id}
                      className="p-4 border rounded-lg space-y-3"
                      data-testid={`card-eval-suite-${suite.id}`}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <h4 className="font-medium" data-testid={`text-suite-name-${suite.id}`}>
                            {suite.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">{suite.description}</p>
                        </div>
                        <Badge variant="outline" data-testid={`badge-suite-cases-${suite.id}`}>
                          {suite.totalCases} cases
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(suite.categoryCounts).map(([category, count]) => (
                          <Badge
                            key={category}
                            variant="secondary"
                            className="text-xs"
                            data-testid={`badge-category-${suite.id}-${category}`}
                          >
                            {category}: {count}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8" data-testid="text-evals-empty">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No evaluations yet</h3>
                  <p className="text-muted-foreground mb-4">
                    We'll create tricky test questions to make sure your API handles unexpected
                    inputs before real people use it
                  </p>
                  <Button
                    className="bg-[#7BA3AC] hover:bg-[#6B939C] gap-2"
                    onClick={() => generateEvalsMutation.mutate()}
                    disabled={generateEvalsMutation.isPending}
                    data-testid="button-generate-evals"
                  >
                    {generateEvalsMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {generateEvalsMutation.isPending ? "Generating..." : "Generate Evaluations"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                Version History
              </CardTitle>
              <CardDescription>
                Every change you make is saved as a version -- you can always go back to an earlier
                one if something isn't working
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4" data-testid="container-versions">
                {versionsData && versionsData.length > 0 ? (
                  versionsData.map((v, i) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between gap-2 p-4 border rounded-lg flex-wrap"
                      data-testid={`card-version-${v.version}`}
                    >
                      <div className="flex items-center gap-3">
                        <Badge data-testid={`badge-version-number-${v.version}`}>
                          v{v.version}
                        </Badge>
                        <div>
                          <p className="font-medium" data-testid={`text-version-name-${v.version}`}>
                            {v.changeSummary || "Initial version"}
                          </p>
                        </div>
                      </div>
                      {i === 0 && <Badge variant="secondary">Current</Badge>}
                    </div>
                  ))
                ) : (
                  <div
                    className="flex items-center justify-between gap-2 p-4 border rounded-lg flex-wrap"
                    data-testid="card-version-1"
                  >
                    <div className="flex items-center gap-3">
                      <Badge data-testid="badge-version-number-1">v1</Badge>
                      <div>
                        <p className="font-medium" data-testid="text-version-name-1">
                          Initial version
                        </p>
                        <p
                          className="text-sm text-muted-foreground"
                          data-testid="text-version-date-1"
                        >
                          Created {new Date(project.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" data-testid="badge-version-status-1">
                      Current
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chaos">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Chaos Mode
                  </CardTitle>
                  <CardDescription>
                    Think of this as a stress test -- we throw the most confusing, unusual, and
                    tricky inputs at your API to see if it breaks, so you can fix weak spots before
                    real users find them
                  </CardDescription>
                </div>
                <Button
                  className="bg-[#7BA3AC] hover:bg-[#6B939C] gap-2"
                  onClick={() => chaosMutation.mutate()}
                  disabled={chaosMutation.isPending}
                  data-testid="button-run-chaos"
                >
                  {chaosMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  {chaosMutation.isPending ? "Testing..." : "Run Chaos Test"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {chaosMutation.isPending && (
                <div className="text-center py-8 space-y-4" data-testid="container-chaos-running">
                  <Loader2 className="w-12 h-12 mx-auto animate-spin text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Creating and running 20 tough test inputs...
                  </p>
                  <p className="text-sm text-muted-foreground">This may take a minute</p>
                </div>
              )}
              {chaosLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : chaosData?.runs?.length > 0 ? (
                <div className="space-y-6" data-testid="container-chaos-results">
                  {chaosData.runs.map(
                    (run: {
                      id: string;
                      resilienceScore: number | null;
                      totalInputs: number;
                      passedInputs: number;
                      failedInputs: number;
                      status: string;
                      categories: Record<
                        string,
                        { total: number; passed: number; failed: number }
                      > | null;
                      results:
                        | {
                            input: string;
                            category: string;
                            passed: boolean;
                            error?: string;
                            latencyMs: number;
                          }[]
                        | null;
                      createdAt: string;
                    }) => (
                      <div
                        key={run.id}
                        className="space-y-4"
                        data-testid={`card-chaos-run-${run.id}`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-3">
                            {run.resilienceScore !== null && run.resilienceScore >= 80 ? (
                              <ShieldCheck className="w-8 h-8 text-green-500" />
                            ) : run.resilienceScore !== null && run.resilienceScore >= 50 ? (
                              <Shield className="w-8 h-8 text-yellow-500" />
                            ) : (
                              <ShieldAlert className="w-8 h-8 text-red-500" />
                            )}
                            <div>
                              <p
                                className="text-2xl font-bold"
                                data-testid={`text-resilience-score-${run.id}`}
                              >
                                {run.resilienceScore ?? 0}% Toughness
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {run.passedInputs}/{run.totalInputs} tough inputs handled
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(run.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {run.categories && (
                          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                            {Object.entries(run.categories).map(([cat, stats]) => (
                              <div
                                key={cat}
                                className="flex items-center justify-between gap-2 p-3 border rounded-lg"
                              >
                                <span className="text-sm font-medium capitalize">
                                  {cat.replace(/_/g, " ")}
                                </span>
                                <Badge variant={stats.failed === 0 ? "default" : "destructive"}>
                                  {stats.passed}/{stats.total}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                        {run.results &&
                          run.results.filter((r: { passed: boolean }) => !r.passed).length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-destructive">Failed Inputs:</p>
                              {run.results
                                .filter((r: { passed: boolean }) => !r.passed)
                                .slice(0, 5)
                                .map(
                                  (
                                    r: {
                                      input: string;
                                      category: string;
                                      error?: string;
                                      latencyMs: number;
                                    },
                                    i: number,
                                  ) => (
                                    <div
                                      key={i}
                                      className="p-3 border border-destructive/20 rounded-lg space-y-1"
                                    >
                                      <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <Badge variant="secondary" className="text-xs">
                                          {r.category.replace(/_/g, " ")}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {r.latencyMs}ms
                                        </span>
                                      </div>
                                      <p className="text-sm font-mono break-all">
                                        {r.input.substring(0, 200)}
                                        {r.input.length > 200 ? "..." : ""}
                                      </p>
                                      {r.error && (
                                        <p className="text-xs text-destructive">{r.error}</p>
                                      )}
                                    </div>
                                  ),
                                )}
                            </div>
                          )}
                      </div>
                    ),
                  )}
                </div>
              ) : !chaosMutation.isPending ? (
                <div className="text-center py-8" data-testid="text-chaos-empty">
                  <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No chaos tests yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Hit the button above to throw tough, unusual inputs at your API and see how well
                    it holds up
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breed">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dna className="w-5 h-5" />
                Prompt Breeding
              </CardTitle>
              <CardDescription>
                Pick two versions of your API instructions and mix them together -- the AI keeps the
                best parts of each and creates an improved version, like combining two winning
                recipes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Parent A</label>
                  <Select value={breedVersionA} onValueChange={setBreedVersionA}>
                    <SelectTrigger data-testid="select-parent-a">
                      <SelectValue placeholder="Select version..." />
                    </SelectTrigger>
                    <SelectContent>
                      {versionsData?.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          v{v.version} - {v.changeSummary || "Initial"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Parent B</label>
                  <Select value={breedVersionB} onValueChange={setBreedVersionB}>
                    <SelectTrigger data-testid="select-parent-b">
                      <SelectValue placeholder="Select version..." />
                    </SelectTrigger>
                    <SelectContent>
                      {versionsData?.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          v{v.version} - {v.changeSummary || "Initial"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                className="bg-[#7BA3AC] hover:bg-[#6B939C] gap-2"
                onClick={() => breedMutation.mutate()}
                disabled={
                  breedMutation.isPending ||
                  !breedVersionA ||
                  !breedVersionB ||
                  breedVersionA === breedVersionB
                }
                data-testid="button-breed"
              >
                {breedMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Dna className="w-4 h-4" />
                )}
                {breedMutation.isPending ? "Breeding..." : "Breed Prompts"}
              </Button>

              {breedMutation.isPending && (
                <div className="text-center py-6 space-y-3">
                  <Loader2 className="w-10 h-10 mx-auto animate-spin text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Analyzing parent prompts, breeding offspring, running evals...
                  </p>
                </div>
              )}

              {breedLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : breedData?.breeds?.length > 0 ? (
                <div className="space-y-4" data-testid="container-breed-results">
                  {breedData.breeds.map(
                    (breed: {
                      id: string;
                      parentAScore: number | null;
                      parentBScore: number | null;
                      offspringScore: number | null;
                      reasoning: string | null;
                      offspringPrompt: string | null;
                      status: string;
                      createdAt: string;
                    }) => (
                      <div
                        key={breed.id}
                        className="p-4 border rounded-lg space-y-4"
                        data-testid={`card-breed-${breed.id}`}
                      >
                        <div className="grid gap-3 md:grid-cols-3">
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Parent A</p>
                            <p className="text-xl font-bold">{breed.parentAScore ?? 0}%</p>
                          </div>
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Parent B</p>
                            <p className="text-xl font-bold">{breed.parentBScore ?? 0}%</p>
                          </div>
                          <div
                            className="text-center p-3 rounded-lg"
                            style={{
                              backgroundColor:
                                (breed.offspringScore ?? 0) >
                                Math.max(breed.parentAScore ?? 0, breed.parentBScore ?? 0)
                                  ? "rgba(34, 197, 94, 0.1)"
                                  : "rgba(239, 68, 68, 0.1)",
                            }}
                          >
                            <p className="text-sm text-muted-foreground mb-1">Offspring</p>
                            <p className="text-xl font-bold">{breed.offspringScore ?? 0}%</p>
                          </div>
                        </div>
                        {breed.reasoning && (
                          <div>
                            <p className="text-sm font-medium mb-1">Breeding Reasoning</p>
                            <p className="text-sm text-muted-foreground">{breed.reasoning}</p>
                          </div>
                        )}
                        {breed.offspringPrompt && (
                          <details className="text-sm">
                            <summary className="cursor-pointer font-medium hover:underline">
                              View offspring prompt
                            </summary>
                            <pre className="mt-2 p-3 bg-muted rounded-lg overflow-auto whitespace-pre-wrap text-xs">
                              {breed.offspringPrompt}
                            </pre>
                          </details>
                        )}
                      </div>
                    ),
                  )}
                </div>
              ) : !breedMutation.isPending ? (
                <div className="text-center py-6" data-testid="text-breed-empty">
                  <Dna className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No breeds yet</h3>
                  <p className="text-muted-foreground">
                    {versionsData && versionsData.length >= 2
                      ? "Pick two versions above and we'll combine their strengths into something better"
                      : "You need at least 2 versions of your instructions first. Make some changes to create new versions, then come back here."}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="autopsy">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Skull className="w-5 h-5" />
                API Autopsy
              </CardTitle>
              <CardDescription>
                Something went wrong with your API? Paste what you sent and the error you got --
                we'll investigate exactly what happened and tell you how to fix it
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Failed Input</label>
                  <Textarea
                    placeholder="Paste the input that caused a failure..."
                    value={autopsyInput}
                    onChange={(e) => setAutopsyInput(e.target.value)}
                    className="min-h-[80px]"
                    data-testid="input-autopsy-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Error Message (optional)</label>
                  <Textarea
                    placeholder="Paste any error message you received..."
                    value={autopsyError}
                    onChange={(e) => setAutopsyError(e.target.value)}
                    className="min-h-[60px]"
                    data-testid="input-autopsy-error"
                  />
                </div>
                <Button
                  className="bg-[#7BA3AC] hover:bg-[#6B939C] gap-2"
                  onClick={() => autopsyMutation.mutate()}
                  disabled={autopsyMutation.isPending || !autopsyInput.trim()}
                  data-testid="button-run-autopsy"
                >
                  {autopsyMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  {autopsyMutation.isPending ? "Analyzing..." : "Run Autopsy"}
                </Button>
              </div>

              {autopsyMutation.isPending && (
                <div className="text-center py-6 space-y-3">
                  <Loader2 className="w-10 h-10 mx-auto animate-spin text-muted-foreground" />
                  <p className="text-muted-foreground">Performing forensic analysis...</p>
                </div>
              )}

              {autopsyLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : autopsyData?.autopsies?.length > 0 ? (
                <div className="space-y-4" data-testid="container-autopsy-results">
                  {autopsyData.autopsies.map(
                    (a: {
                      id: string;
                      failedInput: string;
                      rootCause: string | null;
                      causeChain: string[] | null;
                      contributingFactors: string[] | null;
                      suggestedFix: string | null;
                      fixedPrompt: string | null;
                      severity: string;
                      similarFailures: number;
                      createdAt: string;
                    }) => (
                      <div
                        key={a.id}
                        className="p-4 border rounded-lg space-y-4"
                        data-testid={`card-autopsy-${a.id}`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                a.severity === "critical"
                                  ? "destructive"
                                  : a.severity === "high"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {a.severity === "critical" && (
                                <AlertTriangle className="w-3 h-3 mr-1" />
                              )}
                              {a.severity}
                            </Badge>
                            {a.similarFailures > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {a.similarFailures} similar failures found
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(a.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div>
                          <p className="text-sm font-medium mb-1">Failed Input</p>
                          <p className="text-sm font-mono p-2 bg-muted rounded-lg break-all">
                            {a.failedInput.substring(0, 300)}
                          </p>
                        </div>

                        {a.rootCause && (
                          <div>
                            <p className="text-sm font-medium mb-1">Root Cause</p>
                            <p className="text-sm text-muted-foreground">{a.rootCause}</p>
                          </div>
                        )}

                        {a.causeChain && a.causeChain.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Cause Chain</p>
                            <div className="space-y-1">
                              {a.causeChain.map((step: string, i: number) => (
                                <div key={i} className="flex items-start gap-2">
                                  <span className="text-xs font-mono text-muted-foreground mt-0.5">
                                    {i + 1}.
                                  </span>
                                  <p className="text-sm">{step}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {a.contributingFactors && a.contributingFactors.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-1">Contributing Factors</p>
                            <div className="flex flex-wrap gap-2">
                              {a.contributingFactors.map((f: string, i: number) => (
                                <Badge key={i} variant="outline">
                                  {f}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {a.suggestedFix && (
                          <div>
                            <p className="text-sm font-medium mb-1">Suggested Fix</p>
                            <p className="text-sm text-muted-foreground">{a.suggestedFix}</p>
                          </div>
                        )}

                        {a.fixedPrompt && (
                          <details className="text-sm">
                            <summary className="cursor-pointer font-medium hover:underline">
                              View corrected prompt
                            </summary>
                            <pre className="mt-2 p-3 bg-muted rounded-lg overflow-auto whitespace-pre-wrap text-xs">
                              {a.fixedPrompt}
                            </pre>
                          </details>
                        )}
                      </div>
                    ),
                  )}
                </div>
              ) : !autopsyMutation.isPending ? (
                <div className="text-center py-6" data-testid="text-autopsy-empty">
                  <Skull className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No autopsies yet</h3>
                  <p className="text-muted-foreground">
                    Paste something that caused an error above and we'll figure out exactly what
                    went wrong
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="neural">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BrainCircuit className="w-5 h-5" />
                      Neural Prompt Optimizer
                    </CardTitle>
                    <CardDescription>
                      Our AI reads your instructions and suggests ways to make them clearer and more
                      effective -- like having an editor review your writing
                    </CardDescription>
                  </div>
                  <Button
                    className="bg-[#7BA3AC] hover:bg-[#6B939C] gap-2"
                    onClick={() => neuralPromptMutation.mutate()}
                    disabled={neuralPromptMutation.isPending}
                    data-testid="button-optimize-prompt"
                  >
                    {neuralPromptMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {neuralPromptMutation.isPending ? "Optimizing..." : "Optimize Prompt"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {neuralPromptLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : neuralPromptData?.analyses?.length > 0 ? (
                  <div className="space-y-4" data-testid="container-prompt-analyses">
                    {neuralPromptData.analyses.map(
                      (a: {
                        id: string;
                        improvementScore: number;
                        rationale: string;
                        weaknesses: string[];
                        strengths: string[];
                        optimizedPrompt: string;
                        applied: boolean;
                        createdAt: string;
                      }) => (
                        <div
                          key={a.id}
                          className="p-4 border rounded-lg space-y-3"
                          data-testid={`card-prompt-analysis-${a.id}`}
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <Badge>{a.improvementScore}% improvement</Badge>
                              {a.applied && <Badge variant="secondary">Applied</Badge>}
                            </div>
                            {!a.applied && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => applyPromptMutation.mutate(a.id)}
                                disabled={applyPromptMutation.isPending}
                                data-testid={`button-apply-prompt-${a.id}`}
                              >
                                {applyPromptMutation.isPending ? (
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                ) : (
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                )}
                                Apply to Project
                              </Button>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{a.rationale}</p>
                          {a.weaknesses.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Weaknesses Found
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {a.weaknesses.map((w: string, i: number) => (
                                  <Badge key={i} variant="destructive" className="text-xs">
                                    {w}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {a.strengths.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Strengths
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {a.strengths.map((s: string, i: number) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {s}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          <details className="text-sm">
                            <summary className="cursor-pointer font-medium hover:underline">
                              View optimized prompt
                            </summary>
                            <pre className="mt-2 p-3 bg-muted rounded-lg overflow-auto whitespace-pre-wrap text-xs">
                              {a.optimizedPrompt}
                            </pre>
                          </details>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8" data-testid="text-prompt-optimizer-empty">
                    <BrainCircuit className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No prompt optimizations yet</h3>
                    <p className="text-muted-foreground">
                      Click &quot;Optimize Prompt&quot; and our AI will review your instructions and
                      suggest ways to make them work better
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Code2 className="w-5 h-5" />
                      Neural Schema Enhancer
                    </CardTitle>
                    <CardDescription>
                      We analyze the structure of your API's responses and suggest improvements --
                      making sure the data that comes back is organized and complete
                    </CardDescription>
                  </div>
                  <Button
                    className="bg-[#7BA3AC] hover:bg-[#6B939C] gap-2"
                    onClick={() => neuralSchemaMutation.mutate()}
                    disabled={neuralSchemaMutation.isPending}
                    data-testid="button-enhance-schema"
                  >
                    {neuralSchemaMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {neuralSchemaMutation.isPending ? "Analyzing..." : "Enhance Schema"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {neuralSchemaLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : neuralSchemaData?.analyses?.length > 0 ? (
                  <div className="space-y-4" data-testid="container-schema-analyses">
                    {neuralSchemaData.analyses.map(
                      (a: {
                        id: string;
                        riskLevel: string;
                        rationale: string;
                        improvements: { field: string; change: string; reason: string }[];
                        applied: boolean;
                        suggestedSchema: Record<string, unknown>;
                        createdAt: string;
                      }) => (
                        <div
                          key={a.id}
                          className="p-4 border rounded-lg space-y-3"
                          data-testid={`card-schema-analysis-${a.id}`}
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  a.riskLevel === "low"
                                    ? "secondary"
                                    : a.riskLevel === "high"
                                      ? "destructive"
                                      : "default"
                                }
                              >
                                {a.riskLevel} risk
                              </Badge>
                              <Badge variant="secondary">
                                {a.improvements.length} improvements
                              </Badge>
                              {a.applied && <Badge variant="secondary">Applied</Badge>}
                            </div>
                            {!a.applied && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => applySchemaMutation.mutate(a.id)}
                                disabled={applySchemaMutation.isPending}
                                data-testid={`button-apply-schema-${a.id}`}
                              >
                                {applySchemaMutation.isPending ? (
                                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                ) : (
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                )}
                                Apply to Project
                              </Button>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{a.rationale}</p>
                          {a.improvements.length > 0 && (
                            <div className="space-y-2">
                              {a.improvements.map(
                                (
                                  imp: { field: string; change: string; reason: string },
                                  i: number,
                                ) => (
                                  <div key={i} className="p-2 bg-muted rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                      <code className="text-xs font-mono">{imp.field}</code>
                                      <span className="text-xs text-muted-foreground">
                                        {imp.change}
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{imp.reason}</p>
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                          <details className="text-sm">
                            <summary className="cursor-pointer font-medium hover:underline">
                              View enhanced schema
                            </summary>
                            <pre className="mt-2 p-3 bg-muted rounded-lg overflow-auto text-xs">
                              {JSON.stringify(a.suggestedSchema, null, 2)}
                            </pre>
                          </details>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8" data-testid="text-schema-enhancer-empty">
                    <Code2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No schema enhancements yet</h3>
                    <p className="text-muted-foreground">
                      Click &quot;Enhance Schema&quot; and we'll suggest ways to better organize the
                      data your API sends back
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Neural Quality Gate
                </CardTitle>
                <CardDescription>
                  Every time your API responds, we give it a quality score -- so you can see at a
                  glance whether it's performing well or starting to slip
                </CardDescription>
              </CardHeader>
              <CardContent>
                {neuralQualityLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : neuralQualityData?.averages?.totalScored > 0 ? (
                  <div className="space-y-4" data-testid="container-quality-gate">
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Confidence</p>
                        <p className="text-2xl font-bold">
                          {neuralQualityData.averages.confidence}%
                        </p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Coherence</p>
                        <p className="text-2xl font-bold">
                          {neuralQualityData.averages.coherence}%
                        </p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Completeness</p>
                        <p className="text-2xl font-bold">
                          {neuralQualityData.averages.completeness}%
                        </p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Total Scored</p>
                        <p className="text-2xl font-bold">
                          {neuralQualityData.averages.totalScored}
                        </p>
                      </div>
                    </div>
                    {neuralQualityData.scores?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Recent Scores</p>
                        {neuralQualityData.scores
                          .slice(0, 5)
                          .map(
                            (s: {
                              id: string;
                              input: string;
                              confidenceScore: number;
                              coherenceScore: number;
                              completenessScore: number;
                              flags: string[];
                              explanation: string;
                              createdAt: string;
                            }) => (
                              <div
                                key={s.id}
                                className="p-3 border rounded-lg"
                                data-testid={`card-quality-score-${s.id}`}
                              >
                                <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                                  <p className="text-sm font-mono truncate max-w-[300px]">
                                    {s.input.substring(0, 80)}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant={
                                        s.confidenceScore >= 80
                                          ? "default"
                                          : s.confidenceScore >= 50
                                            ? "secondary"
                                            : "destructive"
                                      }
                                    >
                                      {s.confidenceScore}%
                                    </Badge>
                                  </div>
                                </div>
                                {s.flags && s.flags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-1">
                                    {s.flags.map((f: string, i: number) => (
                                      <Badge key={i} variant="destructive" className="text-xs">
                                        {f.replace(/_/g, " ")}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                {s.explanation && (
                                  <p className="text-xs text-muted-foreground">{s.explanation}</p>
                                )}
                              </div>
                            ),
                          )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8" data-testid="text-quality-gate-empty">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No quality scores yet</h3>
                    <p className="text-muted-foreground">
                      Once your API starts handling requests, we'll automatically score each
                      response so you can track how well it's doing
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Neural Training Augmentation
                    </CardTitle>
                    <CardDescription>
                      Automatically create more training examples from your existing ones -- like
                      making practice worksheets with variations of the same questions
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select value={augmentStrategy} onValueChange={setAugmentStrategy}>
                      <SelectTrigger className="w-[140px]" data-testid="select-augment-strategy">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paraphrase">Paraphrase</SelectItem>
                        <SelectItem value="adversarial">Tricky Edge Cases</SelectItem>
                        <SelectItem value="interpolation">Interpolation</SelectItem>
                        <SelectItem value="diversity">Diversity</SelectItem>
                        <SelectItem value="stress">Stress Test</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      className="bg-[#7BA3AC] hover:bg-[#6B939C] gap-2"
                      onClick={() => neuralAugmentMutation.mutate()}
                      disabled={neuralAugmentMutation.isPending}
                      data-testid="button-augment-training"
                    >
                      {neuralAugmentMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {neuralAugmentMutation.isPending ? "Augmenting..." : "Augment Data"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {neuralAugmentLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : neuralAugmentData?.jobs?.length > 0 ? (
                  <div className="space-y-3" data-testid="container-augment-jobs">
                    {neuralAugmentData.jobs.map(
                      (job: {
                        id: string;
                        strategy: string;
                        requestedCount: number;
                        generatedCount: number;
                        approvedCount: number;
                        status: string;
                        createdAt: string;
                      }) => (
                        <div
                          key={job.id}
                          className="flex items-center justify-between gap-2 p-3 border rounded-lg flex-wrap"
                          data-testid={`card-augment-job-${job.id}`}
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="capitalize">
                              {job.strategy}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {job.approvedCount}/{job.generatedCount} approved
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                job.status === "completed"
                                  ? "default"
                                  : job.status === "failed"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {job.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(job.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8" data-testid="text-augment-empty">
                    <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No augmentation jobs yet</h3>
                    <p className="text-muted-foreground">
                      Pick a strategy from the dropdown and click &quot;Augment Data&quot; to
                      automatically create more training examples from the ones you already have
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Neural Anomaly Detector
                    </CardTitle>
                    <CardDescription>
                      We scan your API's history for repeating problems -- if the same type of error
                      keeps happening, we'll spot the pattern and tell you what's going on
                    </CardDescription>
                  </div>
                  <Button
                    className="bg-[#7BA3AC] hover:bg-[#6B939C] gap-2"
                    onClick={() => neuralAnomalyMutation.mutate()}
                    disabled={neuralAnomalyMutation.isPending}
                    data-testid="button-detect-anomalies"
                  >
                    {neuralAnomalyMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    {neuralAnomalyMutation.isPending ? "Scanning..." : "Scan for Anomalies"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {neuralAnomalyLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : neuralAnomalyData?.anomalies?.length > 0 ? (
                  <div className="space-y-3" data-testid="container-anomalies">
                    {neuralAnomalyData.anomalies.map(
                      (a: {
                        id: string;
                        signalType: string;
                        severity: string;
                        title: string;
                        description: string;
                        recommendations: string[];
                        resolved: boolean;
                        createdAt: string;
                      }) => (
                        <div
                          key={a.id}
                          className="p-4 border rounded-lg space-y-2"
                          data-testid={`card-anomaly-${a.id}`}
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  a.severity === "critical" || a.severity === "high"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {a.severity}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {a.signalType.replace(/_/g, " ")}
                              </Badge>
                              {a.resolved && <Badge variant="secondary">Resolved</Badge>}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(a.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{a.title}</p>
                          <p className="text-sm text-muted-foreground">{a.description}</p>
                          {a.recommendations && a.recommendations.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Recommendations
                              </p>
                              <ul className="text-xs text-muted-foreground space-y-1">
                                {a.recommendations.map((r: string, i: number) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <span className="text-muted-foreground mt-0.5">•</span>
                                    {r}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8" data-testid="text-anomalies-empty">
                    <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No anomalies detected</h3>
                    <p className="text-muted-foreground">
                      Click &quot;Scan for Anomalies&quot; and we'll look through your API's recent
                      activity for any recurring issues or warning signs
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
