"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Box,
  CheckCircle2,
  Download,
  FileText,
  Fingerprint,
  FlaskConical,
  GitBranch,
  Layers,
  Lightbulb,
  Plus,
  Radar,
  Scale,
  Search,
  Shield,
  Sparkles,
  History,
  Upload,
  Vault,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { PROTECT_BRAND } from "@/lib/poor-man-protection/invention-studio/brand";
import {
  IMPLEMENTED_VERIFICATION_METHODS,
  NOT_IMPLEMENTED_VERIFICATION_METHODS,
  buildEvidenceCertificate,
} from "@/lib/poor-man-protection/invention-studio/certificate";
import {
  PROVISIONAL_CHECKLIST,
  USPTO_RESOURCES,
  buildInventionDisclosure,
  disclosureToMarkdown,
} from "@/lib/poor-man-protection/invention-studio/disclosure";
import type { AiAssistKind } from "@/lib/poor-man-protection/invention-studio/ai";
import {
  addAiSuggestion,
  addEvidence,
  addNotebookEntry,
  createInvention,
  getDashboardStats,
  getEvidenceBlob,
  listInventionBundles,
  saveStudioComponents,
  setInventionStatus,
  updateInventionFields,
  verifyEvidenceIntegrity,
} from "@/lib/poor-man-protection/invention-studio/store";
import {
  INVENTION_CATEGORIES,
  PROTOTYPE_STATUSES,
  type CreateInventionInput,
  type InventionBundle,
  type StudioComponent,
} from "@/lib/poor-man-protection/invention-studio/types";
import {
  MemoryGraphPanel,
  PriorArtRadarPanel,
  ProofChainPanel,
  ReadinessAuditorPanel,
  SketchTo3DCopilotPanel,
} from "@/components/poor-man-protection/invention-studio/advanced-panels";
import { DisclosureRiskBanner } from "@/components/poor-man-protection/invention-studio/disclosure-risk-banner";

const Invention3DStudio = dynamic(
  () =>
    import("@/components/poor-man-protection/invention-studio/invention-3d-studio").then(
      (m) => m.Invention3DStudio,
    ),
  { ssr: false, loading: () => <div className="h-[420px] animate-pulse rounded-xl bg-[#5B8DA8]/10" /> },
);

type SectionId =
  | "dashboard"
  | "inventions"
  | "create"
  | "vault"
  | "timeline"
  | "studio3d"
  | "ai"
  | "patent"
  | "priorart"
  | "verify"
  | "notebook"
  | "radar"
  | "readiness"
  | "copilot3d"
  | "proofchain"
  | "memory";

const NAV: Array<{ id: SectionId; label: string; icon: typeof Shield; desc?: string }> = [
  { id: "dashboard", label: "Dashboard", icon: Layers },
  { id: "inventions", label: "My Inventions", icon: Lightbulb },
  { id: "create", label: "Create New Invention", icon: Plus },
  { id: "notebook", label: "Inventor Notebook", icon: BookOpen },
  { id: "vault", label: "Evidence Vault", icon: Vault },
  { id: "timeline", label: "Development Timeline", icon: History },
  { id: "radar", label: "Prior-Art Radar", icon: Radar },
  { id: "readiness", label: "Patent-Readiness Auditor", icon: ClipboardCheck },
  { id: "copilot3d", label: "3D Copilot", icon: Sparkles },
  { id: "studio3d", label: "3D Invention Studio", icon: Box },
  { id: "proofchain", label: "ProofChain Verification", icon: Fingerprint },
  { id: "memory", label: "Inventor Memory Graph", icon: GitBranch },
  { id: "ai", label: "AI Invention Assistant", icon: Sparkles },
  { id: "patent", label: "Patent Preparation", icon: FileText },
  { id: "priorart", label: "Prior Art Research", icon: Search },
  { id: "verify", label: "Verification Center", icon: Fingerprint },
];

function downloadText(filename: string, text: string, type = "text/plain") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = filename;
  a.click();
}

async function downloadExport(format: "pdf" | "docx" | "zip", bundle: InventionBundle) {
  const res = await fetch("/api/poor-man-protection/invention-studio/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ format, bundle }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Export failed");
  }
  const blob = await res.blob();
  const disp = res.headers.get("Content-Disposition") || "";
  const match = /filename="([^"]+)"/.exec(disp);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = match?.[1] || `invention.${format}`;
  a.click();
}

export function InventionProtectionStudioShell() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [section, setSection] = useState<SectionId>("dashboard");
  const [bundles, setBundles] = useState<InventionBundle[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [aiKind, setAiKind] = useState<AiAssistKind>("summary");
  const [aiOut, setAiOut] = useState<string>("");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [evidenceQuery, setEvidenceQuery] = useState("");

  const [form, setForm] = useState<CreateInventionInput>({
    title: "",
    description: "",
    category: "mechanical",
    inventorName: "",
    inventorEmail: "",
    conceptionDate: "",
    problemSolved: "",
    howItWorks: "",
    uniqueFeatures: "",
    technicalSpecs: "",
    materials: "",
    componentsText: "",
    alternativeImplementations: "",
    prototypeStatus: "concept",
    developmentHistory: "",
  });

  const refresh = useCallback(() => {
    const list = listInventionBundles();
    setBundles(list);
    if (activeId && !list.find((b) => b.invention.id === activeId)) {
      setActiveId(list[0]?.invention.id || null);
    } else if (!activeId && list[0]) {
      setActiveId(list[0].invention.id);
    }
  }, [activeId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const active = useMemo(
    () => bundles.find((b) => b.invention.id === activeId) || null,
    [activeId, bundles],
  );
  const stats = useMemo(() => getDashboardStats(), [bundles]);

  const syncServer = async (bundle: InventionBundle) => {
    if (!user) return;
    try {
      await fetch("/api/poor-man-protection/invention-studio/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundle }),
      });
    } catch {
      /* optional */
    }
  };

  const onCreate = async () => {
    if (form.title.trim().length < 2 || form.description.trim().length < 10) {
      toast({
        title: "Need title + description",
        description: "Add a clear title and at least a short description.",
        variant: "destructive",
      });
      return;
    }
    if (form.inventorName.trim().length < 2) {
      toast({ title: "Inventor name required", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const bundle = await createInvention(form, user?.id || "local");
      await syncServer(bundle);
      refresh();
      setActiveId(bundle.invention.id);
      setSection("inventions");
      toast({ title: "Invention created", description: "Private by default in your vault." });
    } finally {
      setBusy(false);
    }
  };

  const onSaveFields = async (sealVersion = false) => {
    if (!active) return;
    setBusy(true);
    try {
      const next = await updateInventionFields(active.invention.id, active.invention.fields, {
        sealVersion,
        label: sealVersion ? "Timestamped disclosure version" : undefined,
      });
      if (sealVersion && next) {
        const latest = next.versions[0];
        const stamp = await fetch("/api/poor-man-protection/invention-studio/timestamp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentHash: latest.contentHash,
            inventionId: next.invention.id,
            label: latest.label,
          }),
        }).then((r) => r.json());
        if (stamp.serverTimestamp) {
          toast({
            title: `Version ${next.invention.currentVersion} sealed`,
            description: `Server timestamp ${stamp.serverTimestamp}`,
          });
        }
      }
      if (next) await syncServer(next);
      refresh();
      if (!sealVersion) toast({ title: "Saved" });
    } finally {
      setBusy(false);
    }
  };

  const patchActiveField = (key: string, value: string) => {
    if (!active) return;
    const fields = { ...active.invention.fields, [key]: value };
    setBundles((prev) =>
      prev.map((b) =>
        b.invention.id === active.invention.id
          ? { ...b, invention: { ...b.invention, fields } }
          : b,
      ),
    );
  };

  const onUploadEvidence = async (files: FileList | null) => {
    if (!active || !files?.length) return;
    setBusy(true);
    try {
      let last = active;
      for (const file of Array.from(files)) {
        const res = await addEvidence(active.invention.id, file);
        if (res) last = res.bundle;
      }
      await syncServer(last);
      refresh();
      toast({ title: "Evidence stored", description: "SHA-256 hashed in your private vault." });
    } finally {
      setBusy(false);
    }
  };

  const runAi = async () => {
    if (!active) return;
    setBusy(true);
    setAiOut("");
    try {
      const res = await fetch("/api/poor-man-protection/invention-studio/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: aiKind, fields: active.invention.fields }),
      });
      const data = await res.json();
      setAiOut(data.content || data.error || "No response");
      await addAiSuggestion(active.invention.id, {
        kind: aiKind,
        prompt: aiKind,
        content: data.content || "",
      });
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const filteredEvidence = useMemo(() => {
    if (!active) return [];
    const q = evidenceQuery.trim().toLowerCase();
    if (!q) return active.evidence;
    return active.evidence.filter(
      (e) =>
        e.originalFilename.toLowerCase().includes(q) ||
        e.fileType.toLowerCase().includes(q) ||
        e.sha256.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q),
    );
  }, [active, evidenceQuery]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      <div
        className="rounded-2xl border p-5 sm:p-6"
        style={{
          borderColor: PROTECT_BRAND.softBorder,
          background: `linear-gradient(135deg, rgba(91,141,168,0.14), rgba(107,44,78,0.12))`,
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#5B8DA8]">
              <Shield className="w-3.5 h-3.5" />
              Poor Man Protection · Cube Protect
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Invention Protection
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Document your ideas. Preserve your evidence. Prepare your inventions.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="border-[#5B8DA8]/40">
            <Link href="/poor-man-protection">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to seal ceremony
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-4">
        <nav className="space-y-1 lg:sticky lg:top-4 self-start">
          {NAV.map((item) => {
            const Icon = item.icon;
            const activeNav = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`w-full flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition ${
                  activeNav
                    ? "border-[#5B8DA8] bg-[#5B8DA8]/15 text-foreground"
                    : "border-transparent hover:border-[#5B8DA8]/25 hover:bg-[#5B8DA8]/5 text-muted-foreground"
                }`}
              >
                <Icon className="w-4 h-4 text-[#5B8DA8] shrink-0" />
                <span className="leading-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              {section === "dashboard" && (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { label: "Total inventions", value: stats.totalInventions },
                      { label: "Active projects", value: stats.activeProjects },
                      { label: "Saved evidence", value: stats.savedEvidence },
                      { label: "Documentation progress", value: `${stats.avgDocumentationProgress}%` },
                    ].map((s) => (
                      <Card key={s.label} className="border-[#5B8DA8]/25 bg-card/80 backdrop-blur-md">
                        <CardHeader className="pb-2">
                          <CardDescription>{s.label}</CardDescription>
                          <CardTitle className="text-3xl text-[#5B8DA8]">{s.value}</CardTitle>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                  <Card className="border-border/50 bg-card/80 backdrop-blur-md">
                    <CardHeader>
                      <CardTitle>Recent activity</CardTitle>
                      <CardDescription>Local private vault · append-only timeline</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {stats.recentActivity.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No activity yet. Create an invention to begin.
                        </p>
                      )}
                      {stats.recentActivity.map((ev) => (
                        <div
                          key={ev.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/40 px-3 py-2 text-sm"
                        >
                          <div>
                            <div className="font-medium">{ev.title}</div>
                            <div className="text-xs text-muted-foreground">{ev.detail}</div>
                          </div>
                          <Badge variant="outline" className="border-[#5B8DA8]/40 text-[#5B8DA8]">
                            {new Date(ev.at).toLocaleString()}
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}

              {section === "inventions" && (
                <Card className="border-border/50 bg-card/80 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle>My Inventions</CardTitle>
                    <CardDescription>Private by default. Status, version, last updated.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {bundles.length === 0 && (
                      <div className="text-sm text-muted-foreground">
                        No inventions yet.{" "}
                        <button
                          type="button"
                          className="text-[#5B8DA8] underline"
                          onClick={() => setSection("create")}
                        >
                          Create one
                        </button>
                        .
                      </div>
                    )}
                    {bundles.map((b) => (
                      <button
                        key={b.invention.id}
                        type="button"
                        onClick={() => {
                          setActiveId(b.invention.id);
                          setSection("notebook");
                        }}
                        className={`w-full text-left rounded-xl border px-4 py-3 transition ${
                          activeId === b.invention.id
                            ? "border-[#5B8DA8] bg-[#5B8DA8]/10"
                            : "border-border/40 hover:border-[#5B8DA8]/40"
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="font-semibold">{b.invention.fields.title}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2">
                              {b.invention.fields.description}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <Badge variant="outline">{b.invention.status}</Badge>
                            <Badge variant="outline">v{b.invention.currentVersion}</Badge>
                            <Badge variant="outline">{b.invention.documentationProgress}%</Badge>
                          </div>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-2">
                          Updated {new Date(b.invention.updatedAt).toLocaleString()}
                        </div>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              )}

              {section === "create" && (
                <Card className="border-border/50 bg-card/80 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle>Create New Invention</CardTitle>
                    <CardDescription>
                      Guided disclosure fields. You can expand details later in the notebook.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <DisclosureRiskBanner
                      text={`${form.description} ${form.problemSolved || ""} ${form.howItWorks || ""} ${form.developmentHistory || ""}`}
                    />
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Invention title</Label>
                        <Input
                          value={form.title}
                          onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Description</Label>
                        <Textarea
                          rows={4}
                          value={form.description}
                          onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <select
                          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                          value={form.category}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              category: e.target.value as CreateInventionInput["category"],
                            })
                          }
                        >
                          {INVENTION_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Prototype status</Label>
                        <select
                          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                          value={form.prototypeStatus}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              prototypeStatus: e.target
                                .value as CreateInventionInput["prototypeStatus"],
                            })
                          }
                        >
                          {PROTOTYPE_STATUSES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Inventor name</Label>
                        <Input
                          value={form.inventorName}
                          onChange={(e) => setForm({ ...form, inventorName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Inventor email (optional)</Label>
                        <Input
                          value={form.inventorEmail || ""}
                          onChange={(e) => setForm({ ...form, inventorEmail: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>User-entered conception date</Label>
                        <Input
                          type="date"
                          value={form.conceptionDate || ""}
                          onChange={(e) => setForm({ ...form, conceptionDate: e.target.value })}
                        />
                      </div>
                      {(
                        [
                          ["problemSolved", "Problem being solved"],
                          ["howItWorks", "How it works"],
                          ["uniqueFeatures", "Unique features"],
                          ["technicalSpecs", "Technical specifications"],
                          ["materials", "Materials"],
                          ["componentsText", "Components"],
                          ["alternativeImplementations", "Alternative implementations"],
                          ["developmentHistory", "Development history"],
                        ] as const
                      ).map(([key, label]) => (
                        <div key={key} className="space-y-2 sm:col-span-2">
                          <Label>{label}</Label>
                          <Textarea
                            rows={3}
                            value={(form[key] as string) || ""}
                            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                          />
                        </div>
                      ))}
                    </div>
                    <Button
                      disabled={busy}
                      onClick={() => void onCreate()}
                      className="bg-[#5B8DA8] hover:bg-[#4a7a92]"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Create private invention
                    </Button>
                  </CardContent>
                </Card>
              )}

              {section === "notebook" && (
                <Card className="border-border/50 bg-card/80 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle>Digital Inventor Notebook</CardTitle>
                    <CardDescription>
                      Chronological notes with hashes. Versions are never overwritten.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!active ? (
                      <p className="text-sm text-muted-foreground">Select or create an invention.</p>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-2 items-center">
                          <Badge className="bg-[#5B8DA8]">{active.invention.fields.title}</Badge>
                          <Badge variant="outline">v{active.invention.currentVersion}</Badge>
                          <Badge variant="outline">{active.invention.status}</Badge>
                          <Button size="sm" variant="outline" disabled={busy} onClick={() => void onSaveFields(false)}>
                            Save fields
                          </Button>
                          <Button
                            size="sm"
                            className="bg-[#6B2C4E] hover:bg-[#5a2442]"
                            disabled={busy}
                            onClick={() => void onSaveFields(true)}
                          >
                            Seal timestamped version
                          </Button>
                        </div>
                        {(
                          [
                            ["description", "Description"],
                            ["problemSolved", "Problem"],
                            ["howItWorks", "How it works"],
                            ["uniqueFeatures", "Unique features"],
                            ["technicalSpecs", "Specs"],
                            ["developmentHistory", "Development history"],
                          ] as const
                        ).map(([key, label]) => (
                          <div key={key} className="space-y-1">
                            <Label>{label}</Label>
                            <Textarea
                              rows={3}
                              value={active.invention.fields[key]}
                              onChange={(e) => patchActiveField(key, e.target.value)}
                            />
                          </div>
                        ))}
                        <NotebookComposer
                          onAdd={async (title, body, kind) => {
                            await addNotebookEntry(active.invention.id, { title, body, kind });
                            refresh();
                          }}
                        />
                        <div className="space-y-2">
                          {active.notebook.map((n) => (
                            <div key={n.id} className="rounded-lg border border-border/40 p-3 text-sm">
                              <div className="flex flex-wrap justify-between gap-2">
                                <span className="font-medium">{n.title}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(n.createdAt).toLocaleString()} · {n.kind}
                                </span>
                              </div>
                              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{n.body}</p>
                              <p className="text-[10px] mt-2 font-mono text-[#5B8DA8]">
                                SHA-256 {n.contentHash.slice(0, 24)}…
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">Version history</h4>
                          {active.versions.map((v) => (
                            <div
                              key={v.id}
                              className="rounded-lg border border-[#5B8DA8]/25 px-3 py-2 text-xs flex flex-wrap justify-between gap-2"
                            >
                              <span>
                                v{v.version} · {v.label}
                              </span>
                              <span className="font-mono text-[#5B8DA8]">{v.contentHash.slice(0, 16)}…</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {section === "vault" && (
                <Card className="border-border/50 bg-card/80 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle>Evidence Vault</CardTitle>
                    <CardDescription>
                      Sketches, photos, videos, drawings, PDFs, CAD, and 3D models — hashed and private.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!active ? (
                      <p className="text-sm text-muted-foreground">Select an invention first.</p>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-2">
                          <label className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-[#5B8DA8] text-white text-sm cursor-pointer">
                            <Upload className="w-4 h-4" />
                            Upload evidence
                            <input
                              type="file"
                              multiple
                              className="hidden"
                              accept="image/*,video/*,.pdf,.dwg,.dxf,.stl,.obj,.glb,.gltf,.step,.stp,.iges,.igs,.zip"
                              onChange={(e) => void onUploadEvidence(e.target.files)}
                            />
                          </label>
                          <Input
                            className="max-w-xs"
                            placeholder="Search / filter evidence"
                            value={evidenceQuery}
                            onChange={(e) => setEvidenceQuery(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          {filteredEvidence.map((e) => (
                            <div
                              key={e.id}
                              className="rounded-xl border border-border/40 p-3 text-sm space-y-1"
                            >
                              <div className="flex flex-wrap justify-between gap-2">
                                <div className="font-medium">{e.originalFilename}</div>
                                <Badge variant="outline">{e.verificationStatus}</Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ID {e.id} · Invention {e.inventionId} · type {e.fileType || "unknown"} ·
                                v{e.version} · {new Date(e.uploadDate).toLocaleString()}
                              </div>
                              <div className="font-mono text-[11px] text-[#5B8DA8]">SHA-256 {e.sha256}</div>
                              <div className="flex flex-wrap gap-2 pt-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    if (!e.blobKey) return;
                                    const blob = await getEvidenceBlob(e.blobKey);
                                    if (!blob) return;
                                    const a = document.createElement("a");
                                    a.href = URL.createObjectURL(blob);
                                    a.download = e.originalFilename;
                                    a.click();
                                  }}
                                >
                                  Download
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    const res = await verifyEvidenceIntegrity(active.invention.id, e.id);
                                    toast({
                                      title: res.ok ? "Verified" : "Failed",
                                      description: res.message,
                                      variant: res.ok ? "default" : "destructive",
                                    });
                                    refresh();
                                  }}
                                >
                                  Integrity check
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const cert = buildEvidenceCertificate(active, e);
                                    downloadText(
                                      `evidence-cert-${e.id}.json`,
                                      JSON.stringify(cert, null, 2),
                                      "application/json",
                                    );
                                  }}
                                >
                                  Certificate + QR payload
                                </Button>
                              </div>
                              {e.previewDataUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={e.previewDataUrl}
                                  alt=""
                                  className="mt-2 max-h-40 rounded-lg border border-border/40"
                                />
                              ) : null}
                            </div>
                          ))}
                          {!filteredEvidence.length && (
                            <p className="text-sm text-muted-foreground">No evidence yet.</p>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {section === "timeline" && (
                <Card className="border-border/50 bg-card/80 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle>Development Timeline</CardTitle>
                    <CardDescription>Milestones, evidence, versions, and studio events.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {!active ? (
                      <p className="text-sm text-muted-foreground">Select an invention.</p>
                    ) : (
                      active.timeline.map((ev, i) => (
                        <div key={ev.id} className="relative pl-6">
                          <div
                            className="absolute left-1 top-1.5 w-2.5 h-2.5 rounded-full"
                            style={{ background: i === 0 ? PROTECT_BRAND.steel : PROTECT_BRAND.burgundy }}
                          />
                          <div className="text-sm font-medium">{ev.title}</div>
                          <div className="text-xs text-muted-foreground">{ev.detail}</div>
                          <div className="text-[11px] text-[#5B8DA8]">
                            {new Date(ev.at).toLocaleString()}
                            {ev.hash ? ` · ${ev.hash.slice(0, 12)}…` : ""}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              )}

              {section === "studio3d" && (
                <Card className="border-border/50 bg-card/80 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle>3D Invention Studio</CardTitle>
                    <CardDescription>
                      Interactive Three.js workspace using Protect steel / burgundy lighting.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!active ? (
                      <p className="text-sm text-muted-foreground">Select an invention to attach a model.</p>
                    ) : (
                      <Invention3DStudio
                        inventionId={active.invention.id}
                        components={active.components}
                        onChange={(components: StudioComponent[]) => {
                          const next = saveStudioComponents(active.invention.id, components);
                          if (next) {
                            setBundles((prev) =>
                              prev.map((b) => (b.invention.id === next.invention.id ? next : b)),
                            );
                          }
                        }}
                      />
                    )}
                  </CardContent>
                </Card>
              )}

              {section === "ai" && (
                <Card className="border-border/50 bg-card/80 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle>AI Invention Assistant</CardTitle>
                    <CardDescription>
                      Suggestions are labeled AI-generated and never treated as evidence. No fabricated
                      dates, specs, or test results.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {!active ? (
                      <p className="text-sm text-muted-foreground">Select an invention.</p>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-2">
                          <select
                            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                            value={aiKind}
                            onChange={(e) => setAiKind(e.target.value as AiAssistKind)}
                          >
                            <option value="improve_description">Improve description</option>
                            <option value="clarifying_questions">Clarifying questions</option>
                            <option value="missing_details">Identify missing details</option>
                            <option value="summary">Generate summary</option>
                            <option value="abstract">Technical abstract</option>
                            <option value="detailed_description">Detailed description</option>
                            <option value="embodiments">Alternative embodiments</option>
                            <option value="components">Organize components</option>
                            <option value="claim_concepts">Preliminary claim concepts</option>
                            <option value="disclosure">Invention disclosure draft</option>
                          </select>
                          <Button
                            disabled={busy}
                            onClick={() => void runAi()}
                            className="bg-[#5B8DA8] hover:bg-[#4a7a92]"
                          >
                            <Sparkles className="w-4 h-4 mr-1" />
                            Run assistant
                          </Button>
                        </div>
                        {aiOut ? (
                          <pre className="whitespace-pre-wrap text-sm rounded-xl border border-[#6B2C4E]/30 bg-[#6B2C4E]/10 p-4 max-h-[480px] overflow-auto">
                            {aiOut}
                          </pre>
                        ) : null}
                        {active.aiSuggestions.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Prior AI suggestions (not evidence)</h4>
                            {active.aiSuggestions.slice(0, 5).map((s) => (
                              <div key={s.id} className="text-xs rounded-lg border border-border/40 p-2">
                                <Badge variant="outline" className="mb-1">
                                  {s.label} · {s.kind}
                                </Badge>
                                <div className="line-clamp-4 whitespace-pre-wrap">{s.content}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {section === "patent" && (
                <Card className="border-border/50 bg-card/80 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle>Patent Preparation</CardTitle>
                    <CardDescription>
                      Documentation preparation only — not actual patent filing. Export PDF, DOCX, or ZIP.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-xl border border-[#5B8DA8]/25 bg-[#5B8DA8]/5 p-3 text-sm flex gap-2">
                      <Scale className="w-4 h-4 text-[#5B8DA8] shrink-0 mt-0.5" />
                      <p>
                        Studio organizes disclosures for you and your counsel. It does{" "}
                        <strong>not</strong> file at the USPTO or create a registered patent.
                      </p>
                    </div>
                    {!active ? (
                      <p className="text-sm text-muted-foreground">Select an invention.</p>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const md = disclosureToMarkdown(buildInventionDisclosure(active));
                              downloadText(`disclosure-${active.invention.id.slice(0, 8)}.md`, md);
                            }}
                          >
                            Preview markdown
                          </Button>
                          <Button
                            size="sm"
                            className="bg-[#5B8DA8] hover:bg-[#4a7a92]"
                            disabled={busy}
                            onClick={async () => {
                              setBusy(true);
                              try {
                                await downloadExport("pdf", active);
                              } catch (e) {
                                toast({
                                  title: "PDF export failed",
                                  description: e instanceof Error ? e.message : "Error",
                                  variant: "destructive",
                                });
                              } finally {
                                setBusy(false);
                              }
                            }}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            PDF
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={async () => {
                              setBusy(true);
                              try {
                                await downloadExport("docx", active);
                              } finally {
                                setBusy(false);
                              }
                            }}
                          >
                            DOCX
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={async () => {
                              setBusy(true);
                              try {
                                await downloadExport("zip", active);
                                await setInventionStatus(active.invention.id, "sealed");
                                refresh();
                              } finally {
                                setBusy(false);
                              }
                            }}
                          >
                            ZIP protection pack
                          </Button>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold mb-2">
                            Provisional application preparation checklist
                          </h4>
                          <div className="space-y-2">
                            {PROVISIONAL_CHECKLIST.map((item) => (
                              <label key={item.id} className="flex gap-2 text-sm items-start">
                                <input
                                  type="checkbox"
                                  checked={!!checklist[item.id]}
                                  onChange={(e) =>
                                    setChecklist((c) => ({ ...c, [item.id]: e.target.checked }))
                                  }
                                />
                                <span>{item.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Official USPTO resources</h4>
                          <ul className="space-y-2 text-sm">
                            {USPTO_RESOURCES.map((r) => (
                              <li key={r.href}>
                                <a
                                  href={r.href}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#5B8DA8] underline"
                                >
                                  {r.title}
                                </a>
                                <span className="text-muted-foreground"> — {r.note}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {section === "priorart" && (
                <Card className="border-border/50 bg-card/80 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle>Prior Art Research</CardTitle>
                    <CardDescription>
                      Jump to official search tools. Studio does not scrape or invent prior-art hits.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p className="text-muted-foreground">
                      Use your invention keywords below, then open USPTO Patent Public Search. Record
                      what <em>you</em> find in the notebook — do not paste fabricated citations.
                    </p>
                    <Input
                      placeholder="Keywords from your invention…"
                      defaultValue={active?.invention.fields.title || ""}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button asChild className="bg-[#5B8DA8] hover:bg-[#4a7a92]">
                        <a
                          href="https://ppubs.uspto.gov/pubwebapp/"
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Search className="w-4 h-4 mr-1" />
                          Open Patent Public Search
                        </a>
                      </Button>
                      <Button asChild variant="outline">
                        <a href="https://patents.google.com/" target="_blank" rel="noreferrer">
                          Google Patents
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {section === "verify" && (
                <Card className="border-border/50 bg-card/80 backdrop-blur-md">
                  <CardHeader>
                    <CardTitle>Verification Center</CardTitle>
                    <CardDescription>
                      Only methods actually implemented are listed as available.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {IMPLEMENTED_VERIFICATION_METHODS.map((m) => (
                        <div
                          key={m.id}
                          className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm"
                        >
                          <div className="flex items-center gap-2 font-medium">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            {m.label}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{m.description}</p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg border border-border/40 p-3 text-sm">
                      <div className="font-medium mb-1">Not implemented (not offered here)</div>
                      <ul className="list-disc pl-5 text-muted-foreground text-xs space-y-1">
                        {NOT_IMPLEMENTED_VERIFICATION_METHODS.map((m) => (
                          <li key={m}>{m}</li>
                        ))}
                      </ul>
                    </div>
                    {active ? (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Tamper-evident audit log</h4>
                        {active.audit
                          .slice()
                          .reverse()
                          .map((a) => (
                            <div key={a.id} className="text-xs font-mono border border-border/30 rounded p-2">
                              {a.at} · {a.event}
                              {a.detail ? ` · ${a.detail}` : ""}
                              <div className="text-[#5B8DA8]">hash {a.eventHash.slice(0, 24)}…</div>
                            </div>
                          ))}
                      </div>
                    ) : null}
                    <Button asChild variant="outline">
                      <Link href="/protect/verify">
                        <FlaskConical className="w-4 h-4 mr-1" />
                        Open Protect verify desk
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/protect/proofchain">Open ProofChain public desk</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}

              {section === "radar" && (
                <PriorArtRadarPanel
                  active={active}
                  onRefresh={refresh}
                  busy={busy}
                  setBusy={setBusy}
                />
              )}
              {section === "readiness" && (
                <ReadinessAuditorPanel
                  active={active}
                  onRefresh={refresh}
                  busy={busy}
                  setBusy={setBusy}
                />
              )}
              {section === "copilot3d" && (
                <SketchTo3DCopilotPanel
                  active={active}
                  onRefresh={refresh}
                  busy={busy}
                  setBusy={setBusy}
                  onOpenStudio={() => setSection("studio3d")}
                />
              )}
              {section === "proofchain" && (
                <ProofChainPanel
                  active={active}
                  onRefresh={refresh}
                  busy={busy}
                  setBusy={setBusy}
                />
              )}
              {section === "memory" && (
                <MemoryGraphPanel
                  active={active}
                  onRefresh={refresh}
                  busy={busy}
                  setBusy={setBusy}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function NotebookComposer({
  onAdd,
}: {
  onAdd: (
    title: string,
    body: string,
    kind: "note" | "milestone" | "prototype" | "technical",
  ) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<"note" | "milestone" | "prototype" | "technical">("note");
  return (
    <div className="rounded-xl border border-[#5B8DA8]/25 p-3 space-y-2">
      <div className="grid sm:grid-cols-[1fr_140px] gap-2">
        <Input placeholder="Entry title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={kind}
          onChange={(e) => setKind(e.target.value as typeof kind)}
        >
          <option value="note">Written entry</option>
          <option value="technical">Technical note</option>
          <option value="milestone">Milestone</option>
          <option value="prototype">Prototype update</option>
        </select>
      </div>
      <Textarea
        rows={3}
        placeholder="Notebook body…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <Button
        size="sm"
        className="bg-[#5B8DA8] hover:bg-[#4a7a92]"
        onClick={async () => {
          if (!title.trim() || !body.trim()) return;
          await onAdd(title.trim(), body.trim(), kind);
          setTitle("");
          setBody("");
        }}
      >
        Add notebook entry
      </Button>
    </div>
  );
}
