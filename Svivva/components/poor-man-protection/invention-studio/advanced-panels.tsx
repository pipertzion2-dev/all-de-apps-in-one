"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Download,
  Fingerprint,
  GitBranch,
  Mic,
  Radar,
  RefreshCw,
  Search,
  Sparkles,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DisclosureRiskBanner } from "@/components/poor-man-protection/invention-studio/disclosure-risk-banner";
import { PRIOR_ART_DISCLAIMER } from "@/lib/poor-man-protection/invention-studio/prior-art-radar";
import { PROOFCHAIN_DISCLAIMER } from "@/lib/poor-man-protection/invention-studio/proofchain";
import {
  buildMemoryGraph,
  summarizeDevelopmentHistory,
} from "@/lib/poor-man-protection/invention-studio/memory-graph";
import { sha256Text } from "@/lib/poor-man-protection/invention-studio/hashing";
import {
  confirmVoiceDraft,
  saveMemorySnapshot,
  saveModelRevision,
  savePriorArtReport,
  saveProofChainRecord,
  saveReadinessAudit,
  saveStudioComponents,
  saveVoiceDraft,
  updateReadinessIssueResolved,
  verifyEvidenceIntegrity,
} from "@/lib/poor-man-protection/invention-studio/store";
import type {
  InventionBundle,
  PriorArtReport,
  ReadinessAudit,
  StudioComponent,
  VoiceJournalDraft,
} from "@/lib/poor-man-protection/invention-studio/types";

type PanelProps = {
  active: InventionBundle | null;
  onRefresh: () => void;
  busy: boolean;
  setBusy: (v: boolean) => void;
};

async function fileToBase64(file: File, maxEdge = 1024): Promise<string | undefined> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.drawImage(bitmap, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.72).split(",")[1];
  } catch {
    return undefined;
  }
}

export function PriorArtRadarPanel({ active, onRefresh, busy, setBusy }: PanelProps) {
  const { toast } = useToast();
  const [question, setQuestion] = useState("");
  const [report, setReport] = useState<PriorArtReport | null>(null);
  const [imageName, setImageName] = useState<string>("");

  const run = async (file?: File | null) => {
    if (!active) return;
    setBusy(true);
    try {
      const imageBase64 = file ? await fileToBase64(file) : undefined;
      const res = await fetch("/api/poor-man-protection/invention-studio/prior-art", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventionId: active.invention.id,
          fields: active.invention.fields,
          extraQuestion: question,
          imageBase64,
          imageMimeType: file?.type,
          imageFileName: file?.name || imageName || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Prior-art search failed");
      setReport(data.report);
      savePriorArtReport(active.invention.id, data.report);
      onRefresh();
      toast({
        title: "Prior-Art Radar complete",
        description: data.notice,
      });
    } catch (e) {
      toast({
        title: "Radar failed",
        description: e instanceof Error ? e.message : "Error",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radar className="w-5 h-5 text-[#5B8DA8]" />
          Prior-Art Radar
        </CardTitle>
        <CardDescription>
          AI-assisted queries + PatentsView when configured. Never fabricates patent numbers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!active ? (
          <p className="text-sm text-muted-foreground">Select an invention first.</p>
        ) : (
          <>
            <DisclosureRiskBanner text={`${active.invention.fields.description} ${question}`} />
            <Textarea
              rows={3}
              placeholder="Natural-language question or extra keywords…"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-[#5B8DA8]/40 text-sm cursor-pointer">
                <Upload className="w-4 h-4" />
                Sketch / photo / drawing
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setImageName(f.name);
                      void run(f);
                    }
                  }}
                />
              </label>
              <Button
                disabled={busy}
                className="bg-[#5B8DA8] hover:bg-[#4a7a92]"
                onClick={() => void run()}
              >
                <Search className="w-4 h-4 mr-1" />
                Run radar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{PRIOR_ART_DISCLAIMER}</p>
            {(report || active.priorArtReports?.[0]) && (
              <div className="space-y-2">
                {(report || active.priorArtReports![0]).hits.map((h) => (
                  <div
                    key={h.id}
                    className="rounded-lg border border-border/40 p-3 text-sm space-y-1"
                  >
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="font-medium">{h.title}</span>
                      {h.publicationNumber ? (
                        <Badge variant="outline">{h.publicationNumber}</Badge>
                      ) : null}
                      <Badge variant="outline">{h.fromLiveApi ? "live API" : "search link"}</Badge>
                    </div>
                    {h.publicationDate ? (
                      <div className="text-xs text-muted-foreground">
                        Publication date: {h.publicationDate}
                      </div>
                    ) : null}
                    <p className="text-xs text-muted-foreground">{h.similarityNotes}</p>
                    <a
                      href={h.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#5B8DA8] underline"
                    >
                      Open source
                    </a>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const md = (report || active.priorArtReports![0]).reportMarkdown;
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
                    a.download = "prior-art-radar-report.md";
                    a.click();
                  }}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download research report
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function ReadinessAuditorPanel({ active, onRefresh, busy, setBusy }: PanelProps) {
  const { toast } = useToast();
  const [audit, setAudit] = useState<ReadinessAudit | null>(null);
  const latest = audit || active?.readinessAudits?.[0] || null;

  const run = async () => {
    if (!active) return;
    setBusy(true);
    try {
      const res = await fetch("/api/poor-man-protection/invention-studio/readiness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundle: active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Audit failed");
      setAudit(data.audit);
      saveReadinessAudit(active.invention.id, data.audit);
      onRefresh();
      toast({ title: "Readiness audit complete" });
    } catch (e) {
      toast({
        title: "Audit failed",
        description: e instanceof Error ? e.message : "Error",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-md">
      <CardHeader>
        <CardTitle>Patent-Readiness Auditor</CardTitle>
        <CardDescription>
          Completeness analysis for documentation prep — not a patentability opinion.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!active ? (
          <p className="text-sm text-muted-foreground">Select an invention.</p>
        ) : (
          <>
            <DisclosureRiskBanner
              text={Object.values(active.invention.fields)
                .filter((v) => typeof v === "string")
                .join(" ")}
            />
            <Button
              disabled={busy}
              className="bg-[#5B8DA8] hover:bg-[#4a7a92]"
              onClick={() => void run()}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              {latest ? "Rerun analysis" : "Run analysis"}
            </Button>
            {latest ? (
              <>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-[#5B8DA8]/30 p-4">
                    <div className="text-xs text-muted-foreground">Completeness</div>
                    <div className="text-3xl text-[#5B8DA8] font-semibold">
                      {latest.completenessScore}%
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/40 p-4">
                    <div className="text-xs text-muted-foreground">Open issues</div>
                    <div className="text-3xl font-semibold">
                      {latest.issues.filter((i) => !i.resolved).length}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/40 p-4">
                    <div className="text-xs text-muted-foreground">Resolved</div>
                    <div className="text-3xl font-semibold">
                      {latest.issues.filter((i) => i.resolved).length}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{latest.disclaimer}</p>
                <div className="space-y-2">
                  {latest.issues.map((issue) => (
                    <div
                      key={issue.id}
                      className={`rounded-lg border p-3 text-sm ${
                        issue.resolved
                          ? "border-emerald-500/30 bg-emerald-500/5 opacity-70"
                          : "border-border/40"
                      }`}
                    >
                      <div className="flex flex-wrap gap-2 items-center justify-between">
                        <div className="font-medium">{issue.title}</div>
                        <Badge variant="outline">{issue.severity}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{issue.detail}</p>
                      {issue.followUpQuestion ? (
                        <p className="text-xs mt-1 text-[#5B8DA8]">Q: {issue.followUpQuestion}</p>
                      ) : null}
                      <p className="text-xs mt-1">Next: {issue.suggestedAction}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => {
                          updateReadinessIssueResolved(
                            active.invention.id,
                            latest.id,
                            issue.id,
                            !issue.resolved,
                          );
                          setAudit(null);
                          onRefresh();
                        }}
                      >
                        {issue.resolved ? "Reopen" : "Mark resolved"}
                      </Button>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Improvement checklist</h4>
                  <ul className="space-y-1 text-sm">
                    {latest.checklist.map((c) => (
                      <li key={c.id} className="flex gap-2 items-center">
                        <CheckCircle2
                          className={`w-4 h-4 ${c.done ? "text-emerald-500" : "text-muted-foreground"}`}
                        />
                        {c.label}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function SketchTo3DCopilotPanel({
  active,
  onRefresh,
  busy,
  setBusy,
  onOpenStudio,
}: PanelProps & { onOpenStudio: () => void }) {
  const { toast } = useToast();
  const [notes, setNotes] = useState("");

  const generate = async (file?: File | null) => {
    if (!active) return;
    setBusy(true);
    try {
      const imageBase64 = file ? await fileToBase64(file) : undefined;
      const res = await fetch("/api/poor-man-protection/invention-studio/sketch-3d", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventionId: active.invention.id,
          description:
            notes || active.invention.fields.howItWorks || active.invention.fields.description,
          imageBase64,
          imageMimeType: file?.type,
          imageFileName: file?.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Copilot failed");

      const comps: StudioComponent[] = (data.suggestedComponents || []).map(
        (
          c: {
            name: string;
            shape: StudioComponent["shape"];
            material: StudioComponent["material"];
          },
          i: number,
        ) => ({
          id: `cmp_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`,
          inventionId: active.invention.id,
          name: c.name,
          shape: c.shape,
          dimensions: { x: 0.7, y: 0.4, z: 0.5 },
          position: { x: (i - 1) * 0.7, y: 0.2, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          material: c.material || "aluminum",
          calloutNumber: i + 1,
          visible: true,
        }),
      );
      saveStudioComponents(active.invention.id, [...active.components, ...comps]);
      const contentHash = await sha256Text(JSON.stringify(comps));
      await saveModelRevision(active.invention.id, {
        id: `mr_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`,
        inventionId: active.invention.id,
        createdAt: new Date().toISOString(),
        label: `Preliminary AI concept (${comps.length} parts)`,
        componentCount: comps.length,
        preliminaryAiVisualization: true,
        validatedByUser: false,
        contentHash,
      });
      onRefresh();
      toast({
        title: "Preliminary 3D concept ready",
        description: data.notice,
      });
      onOpenStudio();
    } catch (e) {
      toast({
        title: "Copilot failed",
        description: e instanceof Error ? e.message : "Error",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#5B8DA8]" />
          AI Sketch-to-3D Copilot
        </CardTitle>
        <CardDescription>
          Upload a sketch/photo or describe the invention. AI concepts are marked preliminary until
          you validate dimensions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!active ? (
          <p className="text-sm text-muted-foreground">Select an invention.</p>
        ) : (
          <>
            <Textarea
              rows={3}
              placeholder="Describe components / mechanism for the copilot…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-[#5B8DA8] text-white text-sm cursor-pointer">
                <Upload className="w-4 h-4" />
                Upload sketch / photo
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => void generate(e.target.files?.[0])}
                />
              </label>
              <Button disabled={busy} variant="outline" onClick={() => void generate()}>
                Generate from text
              </Button>
              <Button variant="outline" onClick={onOpenStudio}>
                Open 3D workspace
              </Button>
            </div>
            {(active.modelRevisions || []).length > 0 && (
              <div className="space-y-1 text-xs">
                <div className="font-semibold text-sm">Model revisions</div>
                {(active.modelRevisions || []).slice(0, 6).map((m) => (
                  <div
                    key={m.id}
                    className="rounded border border-border/40 px-2 py-1.5 flex justify-between gap-2"
                  >
                    <span>{m.label}</span>
                    <Badge variant="outline">
                      {m.preliminaryAiVisualization ? "preliminary AI" : "validated"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function ProofChainPanel({ active, onRefresh, busy, setBusy }: PanelProps) {
  const { toast } = useToast();
  const [authorizeTitle, setAuthorizeTitle] = useState(false);
  const [attemptTsa, setAttemptTsa] = useState(false);
  const [attemptChain, setAttemptChain] = useState(false);
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");

  const sealEvidence = async (evidenceId: string) => {
    if (!active) return;
    const evidence = active.evidence.find((e) => e.id === evidenceId);
    if (!evidence) return;
    setBusy(true);
    try {
      await verifyEvidenceIntegrity(active.invention.id, evidenceId);
      const res = await fetch("/api/poor-man-protection/invention-studio/proofchain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventionId: active.invention.id,
          inventionTitle: active.invention.fields.title,
          evidence,
          authorizePublicTitle: authorizeTitle,
          attemptTrustedTimestamp: attemptTsa,
          attemptBlockchain: attemptChain,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ProofChain failed");
      await saveProofChainRecord(active.invention.id, data.record, data.publicCert);
      onRefresh();
      toast({
        title: "ProofChain recorded",
        description: (data.integrationNotes || []).join(" · "),
      });
    } catch (e) {
      toast({
        title: "ProofChain failed",
        description: e instanceof Error ? e.message : "Error",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const compareNote = useMemo(() => {
    if (!active || !compareA || !compareB) return null;
    const a = active.evidence.find((e) => e.id === compareA);
    const b = active.evidence.find((e) => e.id === compareB);
    if (!a || !b) return null;
    return a.sha256 === b.sha256
      ? "SHA-256 digests match — byte-identical."
      : "SHA-256 digests differ.";
  }, [active, compareA, compareB]);

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="w-5 h-5 text-[#5B8DA8]" />
          ProofChain Verification
        </CardTitle>
        <CardDescription>
          Versioned hashes, manifests, optional TSA/blockchain only when really configured.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!active ? (
          <p className="text-sm text-muted-foreground">Select an invention.</p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">{PROOFCHAIN_DISCLAIMER}</p>
            <label className="flex gap-2 text-sm items-center">
              <input
                type="checkbox"
                checked={authorizeTitle}
                onChange={(e) => setAuthorizeTitle(e.target.checked)}
              />
              Authorize invention title on public certificate (still no private description)
            </label>
            <label className="flex gap-2 text-sm items-center">
              <input
                type="checkbox"
                checked={attemptTsa}
                onChange={(e) => setAttemptTsa(e.target.checked)}
              />
              Attempt trusted timestamp (requires TSA_ENDPOINT)
            </label>
            <label className="flex gap-2 text-sm items-center">
              <input
                type="checkbox"
                checked={attemptChain}
                onChange={(e) => setAttemptChain(e.target.checked)}
              />
              Attempt blockchain anchor (requires PROOFCHAIN_ANCHOR_URL)
            </label>
            <div className="space-y-2">
              {active.evidence.map((e) => (
                <div
                  key={e.id}
                  className="rounded-lg border border-border/40 p-3 text-sm space-y-1"
                >
                  <div className="font-medium">{e.originalFilename}</div>
                  <div className="text-xs font-mono text-[#5B8DA8]">
                    {e.id} · v{e.version} · {e.sha256.slice(0, 20)}…
                  </div>
                  <Button
                    size="sm"
                    disabled={busy}
                    className="bg-[#6B2C4E] hover:bg-[#5a2442]"
                    onClick={() => void sealEvidence(e.id)}
                  >
                    Seal into ProofChain
                  </Button>
                </div>
              ))}
              {!active.evidence.length && (
                <p className="text-sm text-muted-foreground">Upload evidence in the vault first.</p>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              <div>
                <Label>Compare evidence A</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={compareA}
                  onChange={(e) => setCompareA(e.target.value)}
                >
                  <option value="">Select…</option>
                  {active.evidence.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.originalFilename}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Compare evidence B</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={compareB}
                  onChange={(e) => setCompareB(e.target.value)}
                >
                  <option value="">Select…</option>
                  {active.evidence.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.originalFilename}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {compareNote ? <p className="text-sm text-[#5B8DA8]">{compareNote}</p> : null}
            {(active.proofChain || []).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">ProofChain dashboard</h4>
                {(active.proofChain || []).map((r) => (
                  <div
                    key={r.id}
                    className="text-xs rounded border border-[#5B8DA8]/25 p-2 font-mono space-y-0.5"
                  >
                    <div>evidence {r.evidenceId}</div>
                    <div>invention {r.inventionId}</div>
                    <div>
                      v{r.version} · {r.sha256.slice(0, 24)}…
                    </div>
                    <div>
                      method {r.verificationMethod} · integrity {r.integrityStatus}
                    </div>
                    <div>server {r.serverTimestamp || "—"}</div>
                    <div>
                      TSA {r.trustedTimestampStatus} · chain {r.blockchainStatus}
                    </div>
                    {r.blockchainTxId ? <div>tx {r.blockchainTxId}</div> : null}
                    {r.publicCertId ? (
                      <div>
                        public cert{" "}
                        <Link className="underline text-[#5B8DA8]" href="/protect/proofchain">
                          {r.publicCertId}
                        </Link>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
            {(active.publicCerts || [])[0] ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const cert = active.publicCerts![0];
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(
                    new Blob([JSON.stringify(cert, null, 2)], { type: "application/json" }),
                  );
                  a.download = `proofchain-${cert.publicCertId}.json`;
                  a.click();
                }}
              >
                Download latest verification certificate + QR payload
              </Button>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function MemoryGraphPanel({ active, onRefresh, busy, setBusy }: PanelProps) {
  const { toast } = useToast();
  const [transcript, setTranscript] = useState("");
  const [draft, setDraft] = useState<VoiceJournalDraft | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [listening, setListening] = useState(false);

  const snapshot = useMemo(() => (active ? buildMemoryGraph(active) : null), [active]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const saveGraph = () => {
    if (!active || !snapshot) return;
    saveMemorySnapshot(active.invention.id, snapshot);
    onRefresh();
    toast({ title: "Memory graph snapshot saved" });
  };

  const startVoice = () => {
    const SR =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined;
    if (!SR) {
      toast({
        title: "Web Speech unavailable",
        description: "Type your journal entry instead.",
        variant: "destructive",
      });
      return;
    }
    const rec = new SR();
    recognitionRef.current = rec;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (event: SpeechRecognitionEvent) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript + " ";
      }
      setTranscript(text.trim());
    };
    rec.onend = () => setListening(false);
    rec.start();
    setListening(true);
  };

  const structureVoice = async () => {
    if (!active || !transcript.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/poor-man-protection/invention-studio/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventionId: active.invention.id,
          transcript,
          source: listening ? "web_speech" : "typed_fallback",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Voice structure failed");
      setDraft(data.draft);
      saveVoiceDraft(active.invention.id, data.draft);
      onRefresh();
    } finally {
      setBusy(false);
    }
  };

  const confirmDraft = async () => {
    if (!active || !draft) return;
    await confirmVoiceDraft(active.invention.id, draft.id);
    setDraft(null);
    setTranscript("");
    onRefresh();
    toast({ title: "Voice journal confirmed and saved" });
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-[#5B8DA8]" />
          Inventor Memory Graph
        </CardTitle>
        <CardDescription>
          Connected development history. Historical records are never silently altered.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!active || !snapshot ? (
          <p className="text-sm text-muted-foreground">Select an invention.</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{summarizeDevelopmentHistory(active)}</p>
            <div className="relative h-[320px] rounded-xl border border-[#5B8DA8]/30 bg-[#0c1216] overflow-hidden">
              <svg viewBox="0 0 800 320" className="w-full h-full">
                {snapshot.edges.map((e, i) => {
                  const from = snapshot.nodes.find((n) => n.id === e.from);
                  const to = snapshot.nodes.find((n) => n.id === e.to);
                  if (!from || !to) return null;
                  const fi = snapshot.nodes.indexOf(from);
                  const ti = snapshot.nodes.indexOf(to);
                  const fx = 80 + (fi % 6) * 120;
                  const fy = 40 + Math.floor(fi / 6) * 90;
                  const tx = 80 + (ti % 6) * 120;
                  const ty = 40 + Math.floor(ti / 6) * 90;
                  return (
                    <line
                      key={e.id + i}
                      x1={fx}
                      y1={fy}
                      x2={tx}
                      y2={ty}
                      stroke="#5B8DA8"
                      strokeOpacity="0.45"
                      strokeWidth="1.5"
                    />
                  );
                })}
                {snapshot.nodes.map((n, i) => {
                  const x = 80 + (i % 6) * 120;
                  const y = 40 + Math.floor(i / 6) * 90;
                  return (
                    <g key={n.id}>
                      <circle
                        cx={x}
                        cy={y}
                        r="18"
                        fill="#6B2C4E"
                        stroke="#5B8DA8"
                        strokeWidth="2"
                      />
                      <text x={x} y={y + 32} textAnchor="middle" fill="#c8d4dc" fontSize="9">
                        {n.label.slice(0, 18)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <Button size="sm" className="bg-[#5B8DA8] hover:bg-[#4a7a92]" onClick={saveGraph}>
              Save graph snapshot to invention
            </Button>
            <div className="rounded-xl border border-[#5B8DA8]/25 p-3 space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Mic className="w-4 h-4 text-[#5B8DA8]" />
                Voice-to-Invention Journal
              </h4>
              <Textarea
                rows={3}
                placeholder="Dictate or type a development update…"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={startVoice}>
                  {listening ? "Listening…" : "Start voice dictation"}
                </Button>
                {listening ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      recognitionRef.current?.stop();
                      setListening(false);
                    }}
                  >
                    Stop
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  disabled={busy}
                  className="bg-[#5B8DA8] hover:bg-[#4a7a92]"
                  onClick={() => void structureVoice()}
                >
                  Structure with AI
                </Button>
              </div>
              {draft ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm space-y-2">
                  <Badge variant="outline">{draft.label}</Badge>
                  <div className="font-medium">{draft.structuredTitle}</div>
                  <p className="text-xs whitespace-pre-wrap">{draft.structuredBody}</p>
                  {draft.suggestedMilestone ? (
                    <p className="text-xs">Suggested milestone: {draft.suggestedMilestone}</p>
                  ) : null}
                  <Button size="sm" onClick={() => void confirmDraft()}>
                    Confirm & save (required)
                  </Button>
                </div>
              ) : null}
            </div>
            <div className="text-xs space-y-1 max-h-40 overflow-auto">
              {snapshot.nodes.map((n) => (
                <div
                  key={n.id}
                  className="flex justify-between gap-2 border-b border-border/20 py-1"
                >
                  <span>
                    <Badge variant="outline" className="mr-1">
                      {n.kind}
                    </Badge>
                    {n.label}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(n.at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
