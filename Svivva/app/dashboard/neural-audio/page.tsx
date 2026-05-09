"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Database, Cpu, Play, BookOpen, ChevronDown, ChevronRight, Trash2, Music } from "lucide-react";

interface Dataset {
  id: string;
  name: string;
  description: string;
  genre: string;
  status: string;
  totalItems: number;
  totalDurationSec: number;
  createdAt: string;
}

interface DatasetItem {
  id: string;
  datasetId: string;
  fileName: string;
  durationSec: number | null;
  bpm: number | null;
  key: string | null;
  genre: string | null;
  instrument: string | null;
  mood: string | null;
  createdAt: string;
}

interface NeuralModel {
  id: string;
  name: string;
  modelType: string;
  baseModel: string | null;
  description: string | null;
  status: string;
  createdAt: string;
}

interface TrainingJob {
  id: string;
  modelId: string;
  datasetId: string;
  status: string;
  progress: number;
  epochs: number;
  learningRate: string;
  batchSize: number;
  createdAt: string;
}

interface Guide {
  datasetRequirements: {
    minItems: number;
    recommendedItems: number;
    maxDurationPerItem: number;
    supportedFormats: string[];
    requiredMetadata: string[];
  };
  trainingTips: string[];
  modelTypes: { id: string; name: string; description: string }[];
  qualityChecklist: string[];
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "completed") {
    return <Badge className="bg-green-600 text-white no-default-hover-elevate">{status}</Badge>;
  }
  if (s === "active" || s === "running") {
    return <Badge className="bg-[#5BA8A0] text-white no-default-hover-elevate">{status}</Badge>;
  }
  if (s === "failed" || s === "error") {
    return <Badge variant="destructive">{status}</Badge>;
  }
  return <Badge variant="secondary">{status}</Badge>;
}

const TABS = [
  { id: "datasets", label: "Datasets", icon: Database },
  { id: "models", label: "Models", icon: Cpu },
  { id: "jobs", label: "Training Jobs", icon: Play },
  { id: "guide", label: "Guide", icon: BookOpen },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function NeuralAudioPage() {
  const [activeTab, setActiveTab] = useState<TabId>("datasets");
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [models, setModels] = useState<NeuralModel[]>([]);
  const [jobs, setJobs] = useState<TrainingJob[]>([]);
  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [expandedDataset, setExpandedDataset] = useState<string | null>(null);
  const [datasetItems, setDatasetItems] = useState<Record<string, DatasetItem[]>>({});
  const [showCreateDataset, setShowCreateDataset] = useState(false);
  const [showCreateModel, setShowCreateModel] = useState(false);
  const [showStartTraining, setShowStartTraining] = useState(false);
  const [showAddItem, setShowAddItem] = useState<string | null>(null);

  const [datasetForm, setDatasetForm] = useState({ name: "", description: "", genre: "" });
  const [modelForm, setModelForm] = useState({ name: "", modelType: "diffusion", baseModel: "", description: "" });
  const [jobForm, setJobForm] = useState({ modelId: "", datasetId: "", epochs: "100", learningRate: "0.0001", batchSize: "8" });
  const [itemForm, setItemForm] = useState({ fileName: "", durationSec: "", bpm: "", key: "", genre: "", instrument: "", mood: "" });

  const setLoadingKey = (key: string, val: boolean) => setLoading((prev) => ({ ...prev, [key]: val }));

  const fetchDatasets = useCallback(async () => {
    setLoadingKey("datasets", true);
    try {
      const res = await fetch("/api/neural-audio/datasets");
      if (res.ok) setDatasets(await res.json());
    } catch { /* ignore */ }
    setLoadingKey("datasets", false);
  }, []);

  const fetchModels = useCallback(async () => {
    setLoadingKey("models", true);
    try {
      const res = await fetch("/api/neural-audio/models");
      if (res.ok) setModels(await res.json());
    } catch { /* ignore */ }
    setLoadingKey("models", false);
  }, []);

  const fetchJobs = useCallback(async () => {
    setLoadingKey("jobs", true);
    try {
      const res = await fetch("/api/neural-audio/jobs");
      if (res.ok) setJobs(await res.json());
    } catch { /* ignore */ }
    setLoadingKey("jobs", false);
  }, []);

  const fetchGuide = useCallback(async () => {
    setLoadingKey("guide", true);
    try {
      const res = await fetch("/api/neural-audio/guide");
      if (res.ok) setGuide(await res.json());
    } catch { /* ignore */ }
    setLoadingKey("guide", false);
  }, []);

  const fetchItems = async (datasetId: string) => {
    setLoadingKey(`items-${datasetId}`, true);
    try {
      const res = await fetch(`/api/neural-audio/datasets/${datasetId}/items`);
      if (res.ok) {
        const items = await res.json();
        setDatasetItems((prev) => ({ ...prev, [datasetId]: items }));
      }
    } catch { /* ignore */ }
    setLoadingKey(`items-${datasetId}`, false);
  };

  useEffect(() => {
    void fetchDatasets();
    void fetchModels();
    void fetchJobs();
  }, [fetchDatasets, fetchModels, fetchJobs]);

  useEffect(() => {
    if (activeTab === "guide" && !guide) void fetchGuide();
  }, [activeTab, guide, fetchGuide]);

  const handleCreateDataset = async () => {
    if (!datasetForm.name || !datasetForm.description || !datasetForm.genre) return;
    setLoadingKey("createDataset", true);
    try {
      const res = await fetch("/api/neural-audio/datasets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datasetForm),
      });
      if (res.ok) {
        setDatasetForm({ name: "", description: "", genre: "" });
        setShowCreateDataset(false);
        await fetchDatasets();
      }
    } catch { /* ignore */ }
    setLoadingKey("createDataset", false);
  };

  const handleCreateModel = async () => {
    if (!modelForm.name || !modelForm.modelType) return;
    setLoadingKey("createModel", true);
    try {
      const res = await fetch("/api/neural-audio/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modelForm),
      });
      if (res.ok) {
        setModelForm({ name: "", modelType: "diffusion", baseModel: "", description: "" });
        setShowCreateModel(false);
        await fetchModels();
      }
    } catch { /* ignore */ }
    setLoadingKey("createModel", false);
  };

  const handleStartTraining = async () => {
    if (!jobForm.modelId || !jobForm.datasetId) return;
    setLoadingKey("startTraining", true);
    try {
      const res = await fetch("/api/neural-audio/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: jobForm.modelId,
          datasetId: jobForm.datasetId,
          ownerId: "anonymous",
          epochs: parseInt(jobForm.epochs) || 100,
          learningRate: jobForm.learningRate,
          batchSize: parseInt(jobForm.batchSize) || 8,
        }),
      });
      if (res.ok) {
        setJobForm({ modelId: "", datasetId: "", epochs: "100", learningRate: "0.0001", batchSize: "8" });
        setShowStartTraining(false);
        await fetchJobs();
      }
    } catch { /* ignore */ }
    setLoadingKey("startTraining", false);
  };

  const handleAddItem = async (datasetId: string) => {
    if (!itemForm.fileName) return;
    setLoadingKey("addItem", true);
    try {
      const res = await fetch(`/api/neural-audio/datasets/${datasetId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: itemForm.fileName,
          durationSec: itemForm.durationSec ? parseFloat(itemForm.durationSec) : null,
          bpm: itemForm.bpm ? parseInt(itemForm.bpm) : null,
          key: itemForm.key || null,
          genre: itemForm.genre || null,
          instrument: itemForm.instrument || null,
          mood: itemForm.mood || null,
        }),
      });
      if (res.ok) {
        setItemForm({ fileName: "", durationSec: "", bpm: "", key: "", genre: "", instrument: "", mood: "" });
        setShowAddItem(null);
        await fetchItems(datasetId);
        await fetchDatasets();
      }
    } catch { /* ignore */ }
    setLoadingKey("addItem", false);
  };

  const toggleExpandDataset = (id: string) => {
    if (expandedDataset === id) {
      setExpandedDataset(null);
    } else {
      setExpandedDataset(id);
      if (!datasetItems[id]) fetchItems(id);
    }
  };

  const getModelName = (modelId: string) => models.find((m) => m.id === modelId)?.name || modelId.slice(0, 8);
  const getDatasetName = (datasetId: string) => datasets.find((d) => d.id === datasetId)?.name || datasetId.slice(0, 8);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-neural-audio-title">Neural Audio</h1>
        <p className="text-muted-foreground mt-1">Train and manage neural audio models with your own datasets</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              onClick={() => setActiveTab(tab.id)}
              className={`gap-2 ${activeTab === tab.id ? "bg-[#5BA8A0] text-white" : ""}`}
              data-testid={`tab-${tab.id}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {activeTab === "datasets" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-semibold">Training Data Management</h2>
              <p className="text-sm text-muted-foreground">Organize and manage your audio datasets for model training</p>
            </div>
            <Button
              onClick={() => setShowCreateDataset(!showCreateDataset)}
              className="gap-2 bg-[#5BA8A0] text-white"
              data-testid="button-create-dataset"
            >
              <Plus className="w-4 h-4" />
              Create Dataset
            </Button>
          </div>

          {showCreateDataset && (
            <Card>
              <CardHeader>
                <CardTitle>New Dataset</CardTitle>
                <CardDescription>Provide details for your new training dataset</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Name</label>
                    <input
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                      placeholder="My Dataset"
                      value={datasetForm.name}
                      onChange={(e) => setDatasetForm({ ...datasetForm, name: e.target.value })}
                      data-testid="input-dataset-name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Genre</label>
                    <input
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                      placeholder="Electronic"
                      value={datasetForm.genre}
                      onChange={(e) => setDatasetForm({ ...datasetForm, genre: e.target.value })}
                      data-testid="input-dataset-genre"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Description</label>
                    <input
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                      placeholder="A collection of..."
                      value={datasetForm.description}
                      onChange={(e) => setDatasetForm({ ...datasetForm, description: e.target.value })}
                      data-testid="input-dataset-description"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateDataset}
                    disabled={loading.createDataset || !datasetForm.name || !datasetForm.description || !datasetForm.genre}
                    className="bg-[#5BA8A0] text-white"
                    data-testid="button-submit-dataset"
                  >
                    {loading.createDataset && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Create
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateDataset(false)} data-testid="button-cancel-dataset">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {loading.datasets ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : datasets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Music className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No datasets yet</h3>
                <p className="text-muted-foreground mb-4">Create your first dataset to start building your neural audio training pipeline.</p>
                <Button onClick={() => setShowCreateDataset(true)} className="gap-2 bg-[#5BA8A0] text-white" data-testid="button-create-first-dataset">
                  <Plus className="w-4 h-4" />
                  Create Your First Dataset
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {datasets.map((ds) => (
                <Card key={ds.id} data-testid={`card-dataset-${ds.id}`}>
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() => toggleExpandDataset(ds.id)}
                    data-testid={`button-expand-dataset-${ds.id}`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        {expandedDataset === ds.id ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        <div>
                          <CardTitle className="text-base">{ds.name}</CardTitle>
                          <CardDescription className="mt-1">{ds.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant="outline">{ds.genre}</Badge>
                        <StatusBadge status={ds.status} />
                        <span className="text-sm text-muted-foreground">{ds.totalItems} items</span>
                        <span className="text-sm text-muted-foreground">{formatDuration(ds.totalDurationSec)}</span>
                        <span className="text-xs text-muted-foreground">{new Date(ds.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardHeader>

                  {expandedDataset === ds.id && (
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="text-sm font-medium">Dataset Items</h4>
                        <Button
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); setShowAddItem(showAddItem === ds.id ? null : ds.id); }}
                          className="gap-1 bg-[#5BA8A0] text-white"
                          data-testid={`button-add-item-${ds.id}`}
                        >
                          <Plus className="w-3 h-3" />
                          Add Item
                        </Button>
                      </div>

                      {showAddItem === ds.id && (
                        <div className="border rounded-md p-4 space-y-3 bg-muted/30">
                          <p className="text-sm font-medium">Add New Item</p>
                          <div className="grid gap-3 sm:grid-cols-4">
                            <input
                              className="border rounded-md px-3 py-2 text-sm bg-background"
                              placeholder="File name"
                              value={itemForm.fileName}
                              onChange={(e) => setItemForm({ ...itemForm, fileName: e.target.value })}
                              data-testid="input-item-filename"
                            />
                            <input
                              className="border rounded-md px-3 py-2 text-sm bg-background"
                              placeholder="Duration (sec)"
                              type="number"
                              value={itemForm.durationSec}
                              onChange={(e) => setItemForm({ ...itemForm, durationSec: e.target.value })}
                              data-testid="input-item-duration"
                            />
                            <input
                              className="border rounded-md px-3 py-2 text-sm bg-background"
                              placeholder="BPM"
                              type="number"
                              value={itemForm.bpm}
                              onChange={(e) => setItemForm({ ...itemForm, bpm: e.target.value })}
                              data-testid="input-item-bpm"
                            />
                            <input
                              className="border rounded-md px-3 py-2 text-sm bg-background"
                              placeholder="Key (e.g. C minor)"
                              value={itemForm.key}
                              onChange={(e) => setItemForm({ ...itemForm, key: e.target.value })}
                              data-testid="input-item-key"
                            />
                          </div>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <input
                              className="border rounded-md px-3 py-2 text-sm bg-background"
                              placeholder="Genre"
                              value={itemForm.genre}
                              onChange={(e) => setItemForm({ ...itemForm, genre: e.target.value })}
                              data-testid="input-item-genre"
                            />
                            <input
                              className="border rounded-md px-3 py-2 text-sm bg-background"
                              placeholder="Instrument"
                              value={itemForm.instrument}
                              onChange={(e) => setItemForm({ ...itemForm, instrument: e.target.value })}
                              data-testid="input-item-instrument"
                            />
                            <input
                              className="border rounded-md px-3 py-2 text-sm bg-background"
                              placeholder="Mood"
                              value={itemForm.mood}
                              onChange={(e) => setItemForm({ ...itemForm, mood: e.target.value })}
                              data-testid="input-item-mood"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAddItem(ds.id)}
                              disabled={loading.addItem || !itemForm.fileName}
                              className="bg-[#5BA8A0] text-white"
                              data-testid="button-submit-item"
                            >
                              {loading.addItem && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                              Add
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setShowAddItem(null)} data-testid="button-cancel-item">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {loading[`items-${ds.id}`] ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : (datasetItems[ds.id] || []).length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                          No items in this dataset yet. Add your first audio item above.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm" data-testid={`table-items-${ds.id}`}>
                            <thead>
                              <tr className="border-b text-left">
                                <th className="py-2 pr-4 font-medium text-muted-foreground">File Name</th>
                                <th className="py-2 pr-4 font-medium text-muted-foreground">Duration</th>
                                <th className="py-2 pr-4 font-medium text-muted-foreground">BPM</th>
                                <th className="py-2 pr-4 font-medium text-muted-foreground">Key</th>
                                <th className="py-2 pr-4 font-medium text-muted-foreground">Genre</th>
                                <th className="py-2 pr-4 font-medium text-muted-foreground">Instrument</th>
                                <th className="py-2 font-medium text-muted-foreground">Mood</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(datasetItems[ds.id] || []).map((item) => (
                                <tr key={item.id} className="border-b last:border-0" data-testid={`row-item-${item.id}`}>
                                  <td className="py-2 pr-4 font-mono">{item.fileName}</td>
                                  <td className="py-2 pr-4">{item.durationSec != null ? formatDuration(item.durationSec) : "-"}</td>
                                  <td className="py-2 pr-4">{item.bpm ?? "-"}</td>
                                  <td className="py-2 pr-4">{item.key ?? "-"}</td>
                                  <td className="py-2 pr-4">{item.genre ?? "-"}</td>
                                  <td className="py-2 pr-4">{item.instrument ?? "-"}</td>
                                  <td className="py-2">{item.mood ?? "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "models" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-semibold">Neural Models</h2>
              <p className="text-sm text-muted-foreground">Create and manage your audio generation models</p>
            </div>
            <Button
              onClick={() => setShowCreateModel(!showCreateModel)}
              className="gap-2 bg-[#5BA8A0] text-white"
              data-testid="button-create-model"
            >
              <Plus className="w-4 h-4" />
              Create Model
            </Button>
          </div>

          {showCreateModel && (
            <Card>
              <CardHeader>
                <CardTitle>New Model</CardTitle>
                <CardDescription>Configure your neural audio model</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Name</label>
                    <input
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                      placeholder="My Model"
                      value={modelForm.name}
                      onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })}
                      data-testid="input-model-name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Model Type</label>
                    <select
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                      value={modelForm.modelType}
                      onChange={(e) => setModelForm({ ...modelForm, modelType: e.target.value })}
                      data-testid="select-model-type"
                    >
                      <option value="diffusion">Diffusion</option>
                      <option value="gan">GAN</option>
                      <option value="vae">VAE</option>
                      <option value="transformer">Transformer</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Base Model (optional)</label>
                    <input
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                      placeholder="e.g. stable-audio-v1"
                      value={modelForm.baseModel}
                      onChange={(e) => setModelForm({ ...modelForm, baseModel: e.target.value })}
                      data-testid="input-model-base"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Description (optional)</label>
                    <input
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                      placeholder="A brief description..."
                      value={modelForm.description}
                      onChange={(e) => setModelForm({ ...modelForm, description: e.target.value })}
                      data-testid="input-model-description"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateModel}
                    disabled={loading.createModel || !modelForm.name}
                    className="bg-[#5BA8A0] text-white"
                    data-testid="button-submit-model"
                  >
                    {loading.createModel && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Create
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateModel(false)} data-testid="button-cancel-model">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {loading.models ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : models.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Cpu className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No models yet</h3>
                <p className="text-muted-foreground mb-4">Create your first neural model to start generating audio.</p>
                <Button onClick={() => setShowCreateModel(true)} className="gap-2 bg-[#5BA8A0] text-white" data-testid="button-create-first-model">
                  <Plus className="w-4 h-4" />
                  Create Your First Model
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {models.map((model) => (
                <Card key={model.id} data-testid={`card-model-${model.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <CardTitle className="text-base">{model.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="uppercase text-xs">{model.modelType}</Badge>
                        <StatusBadge status={model.status} />
                      </div>
                    </div>
                    {model.description && (
                      <CardDescription className="mt-1">{model.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      {model.baseModel && <span>Base: {model.baseModel}</span>}
                      <span>Created {new Date(model.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "jobs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-semibold">Training Jobs</h2>
              <p className="text-sm text-muted-foreground">Monitor and launch model training sessions</p>
            </div>
            <Button
              onClick={() => setShowStartTraining(!showStartTraining)}
              className="gap-2 bg-[#5BA8A0] text-white"
              data-testid="button-start-training"
            >
              <Play className="w-4 h-4" />
              Start Training
            </Button>
          </div>

          {showStartTraining && (
            <Card>
              <CardHeader>
                <CardTitle>Start Training Job</CardTitle>
                <CardDescription>Configure and launch a new training session</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Model</label>
                    <select
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                      value={jobForm.modelId}
                      onChange={(e) => setJobForm({ ...jobForm, modelId: e.target.value })}
                      data-testid="select-job-model"
                    >
                      <option value="">Select a model...</option>
                      {models.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Dataset</label>
                    <select
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                      value={jobForm.datasetId}
                      onChange={(e) => setJobForm({ ...jobForm, datasetId: e.target.value })}
                      data-testid="select-job-dataset"
                    >
                      <option value="">Select a dataset...</option>
                      {datasets.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Epochs</label>
                    <input
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                      type="number"
                      value={jobForm.epochs}
                      onChange={(e) => setJobForm({ ...jobForm, epochs: e.target.value })}
                      data-testid="input-job-epochs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Learning Rate</label>
                    <input
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                      value={jobForm.learningRate}
                      onChange={(e) => setJobForm({ ...jobForm, learningRate: e.target.value })}
                      data-testid="input-job-learning-rate"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Batch Size</label>
                    <input
                      className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                      type="number"
                      value={jobForm.batchSize}
                      onChange={(e) => setJobForm({ ...jobForm, batchSize: e.target.value })}
                      data-testid="input-job-batch-size"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleStartTraining}
                    disabled={loading.startTraining || !jobForm.modelId || !jobForm.datasetId}
                    className="bg-[#5BA8A0] text-white"
                    data-testid="button-submit-training"
                  >
                    {loading.startTraining && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Start Training
                  </Button>
                  <Button variant="outline" onClick={() => setShowStartTraining(false)} data-testid="button-cancel-training">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {loading.jobs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Play className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No training jobs yet</h3>
                <p className="text-muted-foreground mb-4">Start a training job to begin fine-tuning your neural audio model.</p>
                <Button onClick={() => setShowStartTraining(true)} className="gap-2 bg-[#5BA8A0] text-white" data-testid="button-start-first-training">
                  <Play className="w-4 h-4" />
                  Start Your First Training
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <Card key={job.id} data-testid={`card-job-${job.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <CardTitle className="text-base">{getModelName(job.modelId)}</CardTitle>
                        <CardDescription className="mt-1">Dataset: {getDatasetName(job.datasetId)}</CardDescription>
                      </div>
                      <StatusBadge status={job.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-[#5BA8A0] transition-all"
                        style={{ width: `${Math.min(job.progress, 100)}%` }}
                        data-testid={`progress-job-${job.id}`}
                      />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span>Progress: {job.progress}%</span>
                      <span>Epochs: {job.epochs}</span>
                      <span>LR: {job.learningRate}</span>
                      <span>Batch: {job.batchSize}</span>
                      <span>Started {new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "guide" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Training Guide</h2>
            <p className="text-sm text-muted-foreground">Best practices and requirements for neural audio training</p>
          </div>

          {loading.guide ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : guide ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Card data-testid="card-guide-requirements">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" style={{ color: "#5BA8A0" }} />
                    Dataset Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Minimum items</span>
                    <span className="font-medium">{guide.datasetRequirements.minItems}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Recommended items</span>
                    <span className="font-medium">{guide.datasetRequirements.recommendedItems}+</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Max duration per item</span>
                    <span className="font-medium">{guide.datasetRequirements.maxDurationPerItem}s</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Supported formats</span>
                    <div className="flex gap-1 flex-wrap">
                      {guide.datasetRequirements.supportedFormats.map((f) => (
                        <Badge key={f} variant="secondary" className="uppercase text-xs">{f}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Required metadata</span>
                    <div className="flex gap-1 flex-wrap">
                      {guide.datasetRequirements.requiredMetadata.map((m) => (
                        <Badge key={m} variant="outline" className="text-xs">{m}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="card-guide-tips">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" style={{ color: "#5BA8A0" }} />
                    Training Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {guide.trainingTips.map((tip, i) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-muted-foreground mt-0.5 shrink-0">{i + 1}.</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card data-testid="card-guide-model-types">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="w-5 h-5" style={{ color: "#6B2C4A" }} />
                    Model Types
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {guide.modelTypes.map((mt) => (
                    <div key={mt.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{mt.name}</span>
                        <Badge variant="outline" className="uppercase text-xs">{mt.id}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{mt.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card data-testid="card-guide-checklist">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="w-5 h-5" style={{ color: "#6B2C4A" }} />
                    Quality Checklist
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {guide.qualityChecklist.map((item, i) => (
                      <li key={i} className="text-sm flex gap-2 items-start">
                        <span className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-xs text-muted-foreground">{i + 1}</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Failed to load guide. Please try again.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}