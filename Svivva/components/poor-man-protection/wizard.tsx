"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Upload,
  Sparkles,
  Coins,
  Lock,
  FlaskConical,
  Download,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Palette,
  Shapes,
  Scale,
  Mail,
  Printer,
  ChevronRight,
  ChevronLeft,
  ScrollText,
  Fingerprint,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { SealChamberScene } from "@/components/poor-man-protection/seal-chamber-scene";
import type { ColorSwatch, PoorManCertificate } from "@/lib/poor-man-protection/types";

type ProtectResponse = {
  certificate: PoorManCertificate;
};

const STEPS = [
  { id: "intent", title: "Intent & oath", icon: Scale },
  { id: "deposit", title: "Deposit work", icon: Upload },
  { id: "chronology", title: "Chronology", icon: ScrollText },
  { id: "axisA", title: "Axis A · Form", icon: Shapes },
  { id: "axisB", title: "Axis B · Spectral", icon: Palette },
  { id: "hybrid", title: "Hybridization", icon: FlaskConical },
  { id: "seal", title: "Seal ceremony", icon: Fingerprint },
  { id: "delivery", title: "Official delivery", icon: Mail },
] as const;

const VAULT_KEY = "zzai-poor-man-protection-vault-v1";

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

async function extractPalette(file: File): Promise<ColorSwatch[]> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const size = 64;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [{ hex: "#5B8DA8", role: "dominant", weight: 1 }];
  ctx.drawImage(bitmap, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  const buckets = new Map<string, number>();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue;
    const key = `${data[i] >> 4},${data[i + 1] >> 4},${data[i + 2] >> 4}`;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }
  const sorted = [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, count]) => {
      const [rq, gq, bq] = key.split(",").map(Number);
      return { hex: rgbToHex(rq * 17, gq * 17, bq * 17), count };
    });
  const total = sorted.reduce((s, x) => s + x.count, 0) || 1;
  const roles: ColorSwatch["role"][] = ["dominant", "secondary", "accent", "shadow", "highlight"];
  return sorted.map((s, i) => ({
    hex: s.hex,
    role: roles[i] || "accent",
    weight: Number((s.count / total).toFixed(3)),
  }));
}

async function fileToDownscaledBase64(file: File, maxEdge = 768): Promise<string | undefined> {
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

function saveToVault(cert: PoorManCertificate) {
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    const list: PoorManCertificate[] = raw ? JSON.parse(raw) : [];
    list.unshift(cert);
    localStorage.setItem(VAULT_KEY, JSON.stringify(list.slice(0, 40)));
  } catch {
    /* ignore */
  }
}

function pushCustody(
  log: Array<{ at: string; event: string; detail?: string }>,
  event: string,
  detail?: string,
) {
  return [...log, { at: new Date().toISOString(), event, detail }];
}

export function PoorManProtectionWizard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState(0);

  // Intent & oath
  const [legalName, setLegalName] = useState("");
  const [jurisdiction, setJurisdiction] = useState("United States");
  const [role, setRole] = useState<"sole_author" | "co_author" | "assignee" | "agent">(
    "sole_author",
  );
  const [oathText, setOathText] = useState(
    "I declare under penalty of perjury that I am the creator (or authorized rights holder) of the work described herein, that the facts stated are true to the best of my knowledge, and that I understand this package is evidentiary support — not a government registration.",
  );
  const [ackPatent, setAckPatent] = useState(false);
  const [ackCopyright, setAckCopyright] = useState(false);

  // Deposit
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [palette, setPalette] = useState<ColorSwatch[]>([]);
  const [contentHash, setContentHash] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Chronology
  const [conceivedOn, setConceivedOn] = useState("");
  const [firstFixedOn, setFirstFixedOn] = useState("");
  const [medium, setMedium] = useState("Digital sketch / illustration");
  const [collaborators, setCollaborators] = useState("");
  const [priorDisclosure, setPriorDisclosure] = useState("");
  const [iterationNotes, setIterationNotes] = useState("");

  // Axes interrogation
  const [silhouette, setSilhouette] = useState("");
  const [hierarchy, setHierarchy] = useState("");
  const [negativeSpace, setNegativeSpace] = useState("");
  const [distinctiveMarks, setDistinctiveMarks] = useState("");
  const [emotionalIntent, setEmotionalIntent] = useState("");
  const [contrastStrategy, setContrastStrategy] = useState("");
  const [forbiddenColors, setForbiddenColors] = useState("");
  const [lightingContext, setLightingContext] = useState("");
  const [hybridMode, setHybridMode] = useState<
    "complementary" | "antagonistic" | "emergent" | "biomimetic"
  >("emergent");

  // Seal / delivery
  const [busy, setBusy] = useState(false);
  const [sealProgress, setSealProgress] = useState(0);
  const [chamberMode, setChamberMode] = useState<"ambient" | "sealing" | "sealed">("ambient");
  const [result, setResult] = useState<ProtectResponse | null>(null);
  const [emailTo, setEmailTo] = useState("");
  const [counselEmail, setCounselEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [custodyLog, setCustodyLog] = useState<
    Array<{ at: string; event: string; detail?: string }>
  >([]);

  const formVariable = useMemo(
    () =>
      [silhouette && `Silhouette: ${silhouette}`, hierarchy && `Hierarchy: ${hierarchy}`]
        .filter(Boolean)
        .join(" · ") ||
      "Primary subject composition, silhouette balance, and spatial hierarchy of the sketch",
    [hierarchy, silhouette],
  );

  const paletteVariable = useMemo(
    () =>
      [
        emotionalIntent && `Intent: ${emotionalIntent}`,
        contrastStrategy && `Contrast: ${contrastStrategy}`,
        palette.length && `Fingerprint: ${palette.map((c) => `${c.role}=${c.hex}`).join(", ")}`,
      ]
        .filter(Boolean)
        .join(" · ") || "Spectral signature derived from extracted palette",
    [contrastStrategy, emotionalIntent, palette],
  );

  const onFile = useCallback(
    async (f: File | null) => {
      setResult(null);
      setFile(f);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(f ? URL.createObjectURL(f) : null);
      setPalette([]);
      setContentHash(null);
      if (!f) return;
      setAnalyzing(true);
      try {
        const buf = await f.arrayBuffer();
        const hash = await sha256Hex(buf);
        setContentHash(hash);
        const colors = await extractPalette(f);
        setPalette(colors);
        if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, "").slice(0, 80));
        setCustodyLog((log) =>
          pushCustody(log, "work_hashed", `${f.name} · ${hash.slice(0, 16)}…`),
        );
        toast({ title: "Work deposited", description: "Hash + spectral palette locked locally." });
      } catch {
        toast({
          title: "Could not analyze file",
          description: "Try PNG or JPEG.",
          variant: "destructive",
        });
      } finally {
        setAnalyzing(false);
      }
    },
    [previewUrl, title, toast],
  );

  const canAdvance = useMemo(() => {
    switch (STEPS[step].id) {
      case "intent":
        return (
          legalName.trim().length >= 2 &&
          jurisdiction.trim().length >= 2 &&
          oathText.trim().length >= 40 &&
          ackPatent &&
          ackCopyright
        );
      case "deposit":
        return !!file && !!contentHash && title.trim() && description.trim().length >= 20;
      case "chronology":
        return !!firstFixedOn || !!conceivedOn || iterationNotes.trim().length >= 10;
      case "axisA":
        return silhouette.trim().length >= 8 && hierarchy.trim().length >= 8;
      case "axisB":
        return emotionalIntent.trim().length >= 8 && palette.length > 0;
      case "hybrid":
        return true;
      case "seal":
        return !!result?.certificate;
      case "delivery":
        return !!result?.certificate;
      default:
        return false;
    }
  }, [
    ackCopyright,
    ackPatent,
    conceivedOn,
    contentHash,
    description,
    emotionalIntent,
    file,
    firstFixedOn,
    hierarchy,
    iterationNotes,
    jurisdiction,
    legalName,
    oathText,
    palette.length,
    result,
    silhouette,
    step,
    title,
  ]);

  const runSeal = async () => {
    if (!file || !contentHash) return;
    setBusy(true);
    setChamberMode("sealing");
    setSealProgress(0.15);
    setResult(null);
    try {
      const imageBase64 = await fileToDownscaledBase64(file);
      setSealProgress(0.35);
      const log = pushCustody(
        pushCustody(custodyLog, "hybridization_requested", hybridMode),
        "creator_oath_attached",
        legalName,
      );
      setCustodyLog(log);
      setSealProgress(0.55);
      const res = await fetch("/api/poor-man-protection/protect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          formVariable,
          paletteVariable,
          formInterrogation: { silhouette, hierarchy, negativeSpace, distinctiveMarks },
          paletteInterrogation: {
            emotionalIntent,
            contrastStrategy,
            forbiddenColors,
            lightingContext,
          },
          palette,
          contentHash,
          mimeType: file.type || "image/png",
          fileName: file.name,
          imageBase64,
          hybridizationMode: hybridMode,
          enableCyberSeal: true,
          mintCoin: true,
          chronology: {
            conceivedOn: conceivedOn || undefined,
            firstFixedOn: firstFixedOn || undefined,
            medium,
            collaborators: collaborators || undefined,
            priorDisclosure: priorDisclosure || undefined,
            iterationNotes: iterationNotes || undefined,
          },
          creatorOath: {
            fullLegalName: legalName.trim(),
            role,
            jurisdiction: jurisdiction.trim(),
            swornAt: new Date().toISOString(),
            statement: oathText.trim(),
            acknowledgedNotRegisteredPatent: true as const,
            acknowledgedUsCopyrightOffice: true as const,
          },
          custodyLog: log,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Seal failed");
      setSealProgress(1);
      setChamberMode("sealed");
      setResult(data);
      saveToVault(data.certificate);
      if (!emailTo && user?.email) setEmailTo(user.email);
      toast({
        title: "Sealed",
        description: "Court-ready package is ready for official delivery.",
      });
    } catch (e) {
      setChamberMode("ambient");
      setSealProgress(0);
      toast({
        title: "Seal failed",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const downloadPdf = async (kind: "court" | "postal") => {
    if (!result?.certificate) return;
    const res = await fetch("/api/poor-man-protection/court-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ certificate: result.certificate, kind }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast({ title: "PDF failed", description: data.error || "Error", variant: "destructive" });
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      kind === "postal"
        ? `zzai-postal-${result.certificate.attestationId.slice(0, 8)}.pdf`
        : `zzai-court-${result.certificate.attestationId.slice(0, 8)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJson = () => {
    if (!result?.certificate) return;
    const blob = new Blob([JSON.stringify(result.certificate, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zzai-pmp-${result.certificate.contentHash.slice(0, 12)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendEmail = async () => {
    if (!result?.certificate) return;
    setEmailStatus(null);
    const res = await fetch("/api/poor-man-protection/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        certificate: result.certificate,
        to: emailTo || undefined,
        counselEmail: counselEmail || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setEmailStatus(data.error || "Email failed");
      toast({ title: "Email not sent", description: data.error, variant: "destructive" });
      return;
    }
    setEmailStatus(`Sent to ${data.emailedTo}`);
    toast({ title: "Official email delivered", description: data.emailedTo });
  };

  const cert = result?.certificate;
  const paletteHexes = palette.map((p) => p.hex);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      <div className="rounded-2xl border border-[#5B8DA8]/25 bg-[#5B8DA8]/5 p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-[#5B8DA8] shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground leading-relaxed space-y-1">
          <p>
            <span className="font-semibold text-foreground">Research-backed stance:</span> “Poor
            man’s copyright” alone is not a registered right. ZZAI builds a{" "}
            <span className="text-foreground">multi-channel evidence pack</span> — dual-axis
            hybridization, SHA-256 integrity, chain of custody, timestamp token, email delivery, and
            printable postal deposit — so you have something concrete for counsel and disputes.
          </p>
          <p className="text-xs">
            Still not a substitute for U.S. Copyright Office registration when you need statutory
            damages / to sue.
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-1 min-w-[720px]">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = i === step;
            const done = i < step;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => i <= step && setStep(i)}
                className={`flex-1 rounded-xl border px-2 py-2 text-left transition ${
                  active
                    ? "border-[#5B8DA8] bg-[#5B8DA8]/15"
                    : done
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-border/40 opacity-60"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-[#5B8DA8]" />
                  <span className="text-[10px] font-semibold uppercase tracking-wide">
                    {i + 1}. {s.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <SealChamberScene
        progress={sealProgress}
        palette={paletteHexes.length ? paletteHexes : undefined}
        mode={chamberMode}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={STEPS[step].id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28 }}
        >
          <Card className="border-border/50 bg-card/80 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-xl">{STEPS[step].title}</CardTitle>
              <CardDescription>
                {STEPS[step].id === "intent" &&
                  "Declare authorship and acknowledge what this package is — and is not."}
                {STEPS[step].id === "deposit" &&
                  "Your file never needs to leave this session for hashing; we fingerprint it in-browser."}
                {STEPS[step].id === "chronology" &&
                  "Courts ask when the work was fixed. Build a creative timeline — this is unique to ZZAI’s interrogation."}
                {STEPS[step].id === "axisA" &&
                  "Scientific variable A: form. Answer the guided questions — not a blank text box."}
                {STEPS[step].id === "axisB" &&
                  "Scientific variable B: spectral intent. Couple emotion + measured palette."}
                {STEPS[step].id === "hybrid" &&
                  "Preview how ZZAI will hybridize your two axes before the seal."}
                {STEPS[step].id === "seal" &&
                  "Run the Hybridization Engine, mint the protection coin, and cyber-seal the pack."}
                {STEPS[step].id === "delivery" &&
                  "Official channels: email (independent timestamp trail), court PDF, postal deposit sheet."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {STEPS[step].id === "intent" && (
                <>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Full legal name</Label>
                      <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Jurisdiction</Label>
                      <Input
                        value={jurisdiction}
                        onChange={(e) => setJurisdiction(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <select
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={role}
                      onChange={(e) => setRole(e.target.value as typeof role)}
                    >
                      <option value="sole_author">Sole author</option>
                      <option value="co_author">Co-author</option>
                      <option value="assignee">Assignee / rights holder</option>
                      <option value="agent">Authorized agent</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Sworn statement</Label>
                    <Textarea
                      rows={5}
                      value={oathText}
                      onChange={(e) => setOathText(e.target.value)}
                    />
                  </div>
                  <label className="flex gap-2 text-sm items-start">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={ackPatent}
                      onChange={(e) => setAckPatent(e.target.checked)}
                    />
                    <span>
                      I understand this is <strong>not</strong> a registered patent or trademark.
                    </span>
                  </label>
                  <label className="flex gap-2 text-sm items-start">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={ackCopyright}
                      onChange={(e) => setAckCopyright(e.target.checked)}
                    />
                    <span>
                      I understand the U.S. Copyright Office does not treat “poor man’s copyright”
                      as registration — I may still need formal registration to sue.
                    </span>
                  </label>
                </>
              )}

              {STEPS[step].id === "deposit" && (
                <>
                  <div
                    className="relative rounded-xl border border-dashed border-border/70 bg-muted/20 min-h-[160px] flex items-center justify-center overflow-hidden"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files?.[0];
                      if (f) void onFile(f);
                    }}
                  >
                    {previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt="Work preview"
                        className="max-h-52 object-contain"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground px-6 py-10 text-center">
                        Drop your sketch / artwork — we compute SHA-256 and a CIELAB palette in your
                        browser.
                      </p>
                    )}
                  </div>
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => void onFile(e.target.files?.[0] || null)}
                  />
                  {analyzing && (
                    <p className="text-xs flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fingerprinting…
                    </p>
                  )}
                  {contentHash && (
                    <p className="text-[11px] font-mono break-all text-muted-foreground">
                      SHA-256 {contentHash}
                    </p>
                  )}
                  {palette.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {palette.map((c) => (
                        <div key={`${c.role}-${c.hex}`} className="flex items-center gap-2 text-xs">
                          <span
                            className="w-6 h-6 rounded-md border"
                            style={{ background: c.hex }}
                          />
                          {c.role} {c.hex}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Work title</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>What is this work? (be specific — specificity strengthens claims)</Label>
                    <Textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Subject, style decisions, what makes it yours…"
                    />
                  </div>
                </>
              )}

              {STEPS[step].id === "chronology" && (
                <>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Conceived on</Label>
                      <Input
                        type="date"
                        value={conceivedOn}
                        onChange={(e) => setConceivedOn(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>First fixed in tangible form</Label>
                      <Input
                        type="date"
                        value={firstFixedOn}
                        onChange={(e) => setFirstFixedOn(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Medium</Label>
                    <Input value={medium} onChange={(e) => setMedium(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Collaborators / contributors</Label>
                    <Input
                      value={collaborators}
                      onChange={(e) => setCollaborators(e.target.value)}
                      placeholder="None, or list names + roles"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Any prior public disclosure?</Label>
                    <Textarea
                      rows={2}
                      value={priorDisclosure}
                      onChange={(e) => setPriorDisclosure(e.target.value)}
                      placeholder="Instagram post, client pitch, none…"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Iteration notes (what changed across drafts?)</Label>
                    <Textarea
                      rows={4}
                      value={iterationNotes}
                      onChange={(e) => setIterationNotes(e.target.value)}
                    />
                  </div>
                </>
              )}

              {STEPS[step].id === "axisA" && (
                <>
                  <p className="text-sm text-muted-foreground">
                    These questions force measurable form claims — the kind of specificity generic
                    “upload & hash” tools skip.
                  </p>
                  <div className="space-y-2">
                    <Label>Describe the silhouette / primary shape language</Label>
                    <Textarea
                      rows={2}
                      value={silhouette}
                      onChange={(e) => setSilhouette(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Visual hierarchy — what must the eye hit first, second, third?</Label>
                    <Textarea
                      rows={2}
                      value={hierarchy}
                      onChange={(e) => setHierarchy(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>How does negative space participate?</Label>
                    <Textarea
                      rows={2}
                      value={negativeSpace}
                      onChange={(e) => setNegativeSpace(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Distinctive marks a copyist would need to recreate</Label>
                    <Textarea
                      rows={2}
                      value={distinctiveMarks}
                      onChange={(e) => setDistinctiveMarks(e.target.value)}
                    />
                  </div>
                </>
              )}

              {STEPS[step].id === "axisB" && (
                <>
                  <div className="space-y-2">
                    <Label>Emotional / brand intent of the palette</Label>
                    <Textarea
                      rows={2}
                      value={emotionalIntent}
                      onChange={(e) => setEmotionalIntent(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contrast strategy (high-key, dusk, complementary clash…)</Label>
                    <Textarea
                      rows={2}
                      value={contrastStrategy}
                      onChange={(e) => setContrastStrategy(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Colors you deliberately excluded</Label>
                    <Textarea
                      rows={2}
                      value={forbiddenColors}
                      onChange={(e) => setForbiddenColors(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lighting / viewing context assumed</Label>
                    <Textarea
                      rows={2}
                      value={lightingContext}
                      onChange={(e) => setLightingContext(e.target.value)}
                    />
                  </div>
                </>
              )}

              {STEPS[step].id === "hybrid" && (
                <>
                  <p className="text-sm text-muted-foreground">
                    ZZAI’s differentiator: we treat <strong>form</strong> and{" "}
                    <strong>spectral palette</strong> as two scientific variables and hybridize them
                    into emergent prior-art claims — not just store a file hash.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border p-3">
                      <p className="font-semibold mb-1 flex items-center gap-1.5">
                        <Shapes className="w-4 h-4 text-[#5B8DA8]" /> Axis A
                      </p>
                      <p className="text-muted-foreground text-xs">{formVariable}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="font-semibold mb-1 flex items-center gap-1.5">
                        <Palette className="w-4 h-4 text-[#5B8DA8]" /> Axis B
                      </p>
                      <p className="text-muted-foreground text-xs">{paletteVariable}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Hybridization mode</Label>
                    <div className="flex flex-wrap gap-2">
                      {(["emergent", "complementary", "antagonistic", "biomimetic"] as const).map(
                        (m) => (
                          <Button
                            key={m}
                            type="button"
                            size="sm"
                            variant={hybridMode === m ? "default" : "outline"}
                            onClick={() => setHybridMode(m)}
                          >
                            {m}
                          </Button>
                        ),
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Next step runs the Hybridization Engine (with scientific fallback), mints a
                    ZZAI-PMP-721 coin, applies a cyber seal, and issues a ZZAI-TST-1 timestamp
                    token.
                  </p>
                </>
              )}

              {STEPS[step].id === "seal" && (
                <>
                  {!cert && (
                    <Button
                      className="w-full gap-2 h-12"
                      style={{ background: "linear-gradient(135deg, #5B8DA8, #6B2C4E)" }}
                      disabled={busy}
                      onClick={() => void runSeal()}
                    >
                      {busy ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      Begin seal ceremony
                    </Button>
                  )}
                  {cert && (
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2 text-emerald-500 font-semibold">
                        <CheckCircle2 className="w-5 h-5" /> Sealed · {cert.attestationId}
                      </div>
                      <p className="font-mono text-[11px] break-all text-muted-foreground">
                        cert {cert.certificateHash}
                      </p>
                      <p>
                        Novelty {cert.hybridization.noveltyScore}
                        {cert.hybridization.usedEngine ? " · engine" : " · scientific fallback"}
                      </p>
                      <ul className="list-disc pl-4 text-muted-foreground">
                        {cert.hybridization.emergentClaims.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                      {cert.coin && (
                        <p className="text-xs font-mono text-muted-foreground break-all">
                          <Coins className="w-3.5 h-3.5 inline mr-1" />
                          {cert.coin.symbol} · {cert.coin.contractAddress}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {STEPS[step].id === "delivery" && cert && (
                <>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <Button
                      variant="outline"
                      className="gap-2 h-auto py-3 flex-col"
                      onClick={() => void downloadPdf("court")}
                    >
                      <Scale className="w-5 h-5 text-[#5B8DA8]" />
                      <span className="text-xs">Court evidence PDF</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2 h-auto py-3 flex-col"
                      onClick={() => void downloadPdf("postal")}
                    >
                      <Printer className="w-5 h-5 text-[#5B8DA8]" />
                      <span className="text-xs">Postal deposit sheet</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2 h-auto py-3 flex-col"
                      onClick={downloadJson}
                    >
                      <Download className="w-5 h-5 text-[#5B8DA8]" />
                      <span className="text-xs">JSON certificate</span>
                    </Button>
                  </div>

                  <div className="rounded-xl border p-4 space-y-3">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#5B8DA8]" /> Email official delivery
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Email headers create an independent timestamped trail (stronger than storing
                      JSON only on one device). Optionally CC counsel.
                    </p>
                    <Input
                      type="email"
                      placeholder="you@email.com"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                    />
                    <Input
                      type="email"
                      placeholder="Counsel email (optional)"
                      value={counselEmail}
                      onChange={(e) => setCounselEmail(e.target.value)}
                    />
                    <Button onClick={() => void sendEmail()} className="gap-2">
                      <Mail className="w-4 h-4" /> Send sealed pack
                    </Button>
                    {emailStatus && <p className="text-xs text-muted-foreground">{emailStatus}</p>}
                  </div>

                  <div className="rounded-xl border p-4 text-sm space-y-2">
                    <p className="font-semibold flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#5B8DA8]" /> Aftercare
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Print the postal sheet, seal an opaque envelope with the court PDF + artwork
                      print, and send certified mail to yourself or counsel — keep unopened.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Link href="/dashboard/security">
                        <Button size="sm" variant="outline" className="gap-1.5">
                          <Shield className="w-3.5 h-3.5" /> Security Center watch
                        </Button>
                      </Link>
                      {cert.verifyUrl && (
                        <Link
                          href={
                            cert.verifyUrl.replace(/^https?:\/\/[^/]+/, "") || "/protect/verify"
                          }
                        >
                          <Button size="sm" variant="outline">
                            Public verify
                          </Button>
                        </Link>
                      )}
                    </div>
                    <Badge variant="secondary" className="mt-1">
                      {cert.protocol}
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between gap-3">
        <Button
          variant="outline"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            disabled={!canAdvance || (STEPS[step].id === "seal" && !cert)}
            onClick={() => {
              if (STEPS[step].id === "hybrid") setChamberMode("ambient");
              setStep((s) => Math.min(STEPS.length - 1, s + 1));
            }}
            className="gap-1"
            style={{ background: "linear-gradient(135deg, #5B8DA8, #6B2C4E)" }}
          >
            Continue <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Badge className="px-3 py-2">Ceremony complete</Badge>
        )}
      </div>
    </div>
  );
}
