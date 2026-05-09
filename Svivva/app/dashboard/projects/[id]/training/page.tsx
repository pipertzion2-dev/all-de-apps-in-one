"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Plus,
  Upload,
  FileText,
  Sparkles,
  Trash2,
  Edit,
  Download,
  BookOpen,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TrainingExample {
  id: string;
  input: string;
  output: Record<string, unknown>;
  sortOrder: number;
  createdAt: string;
}

interface TrainingData {
  projectId: string;
  projectName: string;
  versionId: string;
  version: number;
  examples: TrainingExample[];
  count: number;
  outputSchema: Record<string, unknown>;
}

export default function TrainingDataPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const projectId = params.id as string;

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [guideDialogOpen, setGuideDialogOpen] = useState(false);
  const [newInput, setNewInput] = useState("");
  const [newOutput, setNewOutput] = useState("{}");
  const [importData, setImportData] = useState("");
  const [importFormat, setImportFormat] = useState<"json" | "csv">("json");
  const [aiAssist, setAiAssist] = useState(false);
  const [guide, setGuide] = useState<string | null>(null);

  const { data: trainingData, isLoading } = useQuery<TrainingData>({
    queryKey: ["/api/projects", projectId, "training-data"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/training-data`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch training data");
      return response.json();
    },
  });

  const addExampleMutation = useMutation({
    mutationFn: async (data: { input: string; output: Record<string, unknown> }) => {
      const response = await fetch(`/api/projects/${projectId}/training-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to add example");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "training-data"] });
      toast({ title: "Training example added" });
      setAddDialogOpen(false);
      setNewInput("");
      setNewOutput("{}");
    },
    onError: () => {
      toast({ title: "Failed to add example", variant: "destructive" });
    },
  });

  const deleteExampleMutation = useMutation({
    mutationFn: async (exampleId: string) => {
      const response = await fetch(`/api/projects/${projectId}/training-data/${exampleId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete example");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "training-data"] });
      toast({ title: "Training example deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete example", variant: "destructive" });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (data: { format: string; data: string; aiAssist: boolean }) => {
      const response = await fetch(`/api/projects/${projectId}/training-data/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to import data");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "training-data"] });
      toast({
        title: "Import successful",
        description: `${data.imported} examples imported${data.aiEnhanced ? `, ${data.aiEnhanced} AI-enhanced` : ""}`,
      });
      setImportDialogOpen(false);
      setImportData("");
    },
    onError: () => {
      toast({ title: "Failed to import data", variant: "destructive" });
    },
  });

  const generateGuideMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/training-guide`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to generate guide");
      return response.json();
    },
    onSuccess: (data) => {
      setGuide(data.guide);
      setGuideDialogOpen(true);
    },
    onError: () => {
      toast({ title: "Failed to generate guide", variant: "destructive" });
    },
  });

  const handleAddExample = () => {
    try {
      const output = JSON.parse(newOutput);
      addExampleMutation.mutate({ input: newInput, output });
    } catch {
      toast({ title: "Invalid JSON in output field", variant: "destructive" });
    }
  };

  const handleImport = () => {
    importMutation.mutate({ format: importFormat, data: importData, aiAssist });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/projects/${projectId}`}>
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{trainingData?.projectName} - Training Data</h1>
            <p className="text-muted-foreground">
              Version {trainingData?.version} - {trainingData?.count || 0} examples
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => generateGuideMutation.mutate()}
            disabled={generateGuideMutation.isPending}
            data-testid="button-generate-guide"
          >
            {generateGuideMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <BookOpen className="h-4 w-4 mr-2" />
            )}
            Training Guide
          </Button>
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-import">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Import Training Data</DialogTitle>
                <DialogDescription>
                  Import training examples from JSON or CSV format
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant={importFormat === "json" ? "default" : "outline"}
                    onClick={() => setImportFormat("json")}
                    size="sm"
                    data-testid="button-format-json"
                  >
                    JSON
                  </Button>
                  <Button
                    variant={importFormat === "csv" ? "default" : "outline"}
                    onClick={() => setImportFormat("csv")}
                    size="sm"
                    data-testid="button-format-csv"
                  >
                    CSV
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Textarea
                    placeholder={
                      importFormat === "json"
                        ? '[{"input": "example input", "output": {"field": "value"}}]'
                        : 'input,output\n"example input","{""field"": ""value""}"'
                    }
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                    data-testid="textarea-import-data"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="aiAssist"
                    checked={aiAssist}
                    onChange={(e) => setAiAssist(e.target.checked)}
                    className="rounded"
                    data-testid="checkbox-ai-assist"
                  />
                  <Label htmlFor="aiAssist" className="flex items-center gap-1">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI-assisted formatting (formats output to match schema)
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importMutation.isPending || !importData.trim()}
                  data-testid="button-confirm-import"
                >
                  {importMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Import
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-example">
                <Plus className="h-4 w-4 mr-2" />
                Add Example
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Training Example</DialogTitle>
                <DialogDescription>Add a new input/output pair for training</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Input</Label>
                  <Textarea
                    placeholder="Enter the input prompt..."
                    value={newInput}
                    onChange={(e) => setNewInput(e.target.value)}
                    data-testid="textarea-new-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Output (JSON)</Label>
                  <Textarea
                    placeholder='{"field": "value"}'
                    value={newOutput}
                    onChange={(e) => setNewOutput(e.target.value)}
                    className="font-mono text-sm"
                    data-testid="textarea-new-output"
                  />
                  {trainingData?.outputSchema && (
                    <p className="text-xs text-muted-foreground">
                      Expected schema:{" "}
                      {JSON.stringify(
                        Object.keys(
                          trainingData.outputSchema.properties || trainingData.outputSchema,
                        ),
                      )}
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddExample}
                  disabled={addExampleMutation.isPending || !newInput.trim()}
                  data-testid="button-confirm-add"
                >
                  {addExampleMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Add Example
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {trainingData?.count === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No training examples yet</h3>
            <p className="text-muted-foreground mb-4">
              Add training examples to improve your API&apos;s accuracy
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setAddDialogOpen(true)} data-testid="button-add-first">
                <Plus className="h-4 w-4 mr-2" />
                Add First Example
              </Button>
              <Button
                variant="outline"
                onClick={() => setImportDialogOpen(true)}
                data-testid="button-import-first"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Data
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {trainingData?.examples.map((example, index) => (
            <Card key={example.id} data-testid={`card-example-${example.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                <div className="flex-1 min-w-0">
                  <Badge variant="secondary" className="mb-2">
                    Example {index + 1}
                  </Badge>
                  <p className="font-medium break-words">{example.input}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify({ input: example.input, output: example.output }, null, 2),
                      )
                    }
                    data-testid={`button-copy-${example.id}`}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteExampleMutation.mutate(example.id)}
                    disabled={deleteExampleMutation.isPending}
                    data-testid={`button-delete-${example.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-3 font-mono text-sm overflow-auto">
                  <pre>{JSON.stringify(example.output, null, 2)}</pre>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={guideDialogOpen} onOpenChange={setGuideDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Training Data Guide</DialogTitle>
            <DialogDescription>
              Step-by-step instructions for adding training data to your API
            </DialogDescription>
          </DialogHeader>
          {guide && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div
                dangerouslySetInnerHTML={{
                  __html: guide
                    .replace(/\n/g, "<br />")
                    .replace(/#{1,6}\s+(.+)/g, "<h3>$1</h3>")
                    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                    .replace(/`(.+?)`/g, "<code>$1</code>"),
                }}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => copyToClipboard(guide || "")}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Guide
            </Button>
            <Button onClick={() => setGuideDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
