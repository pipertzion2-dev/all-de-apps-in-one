"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { FeaturePageShell } from "@/components/feature-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { ColorSwatch, PoorManCertificate } from "@/lib/poor-man-protection/types";

type ProtectResponse = {
  certificate: PoorManCertificate;
  hybridization: {
    usedEngine?: boolean;
    topologicalBridge?: string;
    hybrids?: Array<{ name?: string; noveltyScore?: number; patentLandscape?: string }>;
  };
};

const VAULT_KEY = "zzai-poor-man-protection-vault-v1";

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

/** Quantize image pixels into a compact role-labeled palette (client-side). */
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
    const a = data[i + 3];
    if (a < 200) continue;
    const r = data[i] >> 4;
    const g = data[i + 1] >> 4;
    const b = data[i + 2] >> 4;
    const key = `${r},${g},${b}`;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }
  const sorted = [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, count]) => {
      const [rq, gq, bq] = key.split(",").map(Number);
      return {
        hex: rgbToHex(rq * 17, gq * 17, bq * 17),
        count,
      };
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
    const dataUrl = canvas.toDataURL("image/jpeg", 0.72);
    return dataUrl.split(",")[1];
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

export default function PoorManProtectionPage() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [formVariable, setFormVariable] = useState("");
  const [paletteVariable, setPaletteVariable] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [palette, setPalette] = useState<ColorSwatch[]>([]);
  const [contentHash, setContentHash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ProtectResponse | null>(null);

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
        if (!title.trim()) {
          setTitle(f.name.replace(/\.[^.]+$/, "").slice(0, 80));
        }
        if (!formVariable.trim()) {
          setFormVariable(
            "Primary subject composition, silhouette balance, and spatial hierarchy of the sketch",
          );
        }
        if (!paletteVariable.trim()) {
          setPaletteVariable(
            `Spectral signature from extracted palette: ${colors.map((c) => `${c.role} ${c.hex}`).join(", ")}`,
          );
        }
        toast({ title: "Sketch analyzed", description: "Palette + content hash ready." });
      } catch {
        toast({
          title: "Could not analyze file",
          description: "Try a PNG or JPEG sketch.",
          variant: "destructive",
        });
      } finally {
        setAnalyzing(false);
      }
    },
    [formVariable, paletteVariable, previewUrl, title, toast],
  );

  const canProtect = useMemo(
    () =>
      !!file &&
      !!contentHash &&
      title.trim().length > 0 &&
      description.trim().length > 0 &&
      formVariable.trim().length > 0 &&
      paletteVariable.trim().length > 0 &&
      !analyzing,
    [analyzing, contentHash, description, file, formVariable, paletteVariable, title],
  );

  const runProtect = async () => {
    if (!file || !contentHash || !canProtect) return;
    setBusy(true);
    setResult(null);
    try {
      const imageBase64 = await fileToDownscaledBase64(file);
      const res = await fetch("/api/poor-man-protection/protect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          formVariable: formVariable.trim(),
          paletteVariable: paletteVariable.trim(),
          palette,
          contentHash,
          mimeType: file.type || "image/png",
          fileName: file.name,
          imageBase64,
          hybridizationMode: "emergent",
          enableCyberSeal: true,
          mintCoin: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Protection failed");
      setResult(data);
      saveToVault(data.certificate);
      toast({
        title: "Protected",
        description: "Certificate sealed. Coin metadata minted on ZZAI ledger.",
      });
    } catch (e) {
      toast({
        title: "Protection failed",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const downloadCertificate = () => {
    if (!result?.certificate) return;
    const blob = new Blob([JSON.stringify(result.certificate, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zzai-poor-man-protection-${result.certificate.contentHash.slice(0, 12)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cert = result?.certificate;

  return (
    <FeaturePageShell
      variant="security"
      subtitle="Dual-axis scientific prior-art packaging for sketches — hybridization, crypto coin metadata, and ZZAI cyber seals."
      className="pb-10"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-8">
        <div className="rounded-2xl border border-[#5B8DA8]/25 bg-[#5B8DA8]/5 p-4 sm:p-5 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-[#5B8DA8] shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Poor Man Protection</span> builds a
            timestamped evidentiary package (Sygn-style digital asset metadata + dual-variable
            scientific claims). It is <span className="text-foreground font-medium">not</span> a
            registered government patent. Use Security Center to watch for copycat signals after
            sealing.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-border/50 bg-card/80 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Upload className="w-5 h-5 text-[#5B8DA8]" />
                Sketch / artwork input
              </CardTitle>
              <CardDescription>
                Upload a sketch. ZZAI extracts a spectral palette and content hash, then hybridizes
                form × color as two scientific variables.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="relative rounded-xl border border-dashed border-border/70 bg-muted/20 min-h-[180px] flex items-center justify-center overflow-hidden"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) void onFile(f);
                }}
              >
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Sketch preview" className="max-h-56 object-contain" />
                ) : (
                  <div className="text-center px-6 py-10 text-sm text-muted-foreground">
                    Drop PNG/JPEG here or choose a file
                  </div>
                )}
              </div>
              <Input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => void onFile(e.target.files?.[0] || null)}
              />
              {analyzing && (
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing palette…
                </p>
              )}
              {contentHash && (
                <p className="text-[11px] font-mono text-muted-foreground break-all">
                  SHA-256 {contentHash}
                </p>
              )}
              {palette.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {palette.map((c) => (
                    <div key={`${c.role}-${c.hex}`} className="flex items-center gap-2 text-xs">
                      <span
                        className="w-6 h-6 rounded-md border border-border/60"
                        style={{ background: c.hex }}
                      />
                      <span className="text-muted-foreground">
                        {c.role} {c.hex}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="pmp-title">Title</Label>
                <Input
                  id="pmp-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Work title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pmp-desc">Description</Label>
                <Textarea
                  id="pmp-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this sketch / concept?"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pmp-form" className="flex items-center gap-2">
                  <Shapes className="w-3.5 h-3.5" /> Variable A — Form / composition
                </Label>
                <Textarea
                  id="pmp-form"
                  value={formVariable}
                  onChange={(e) => setFormVariable(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pmp-palette" className="flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5" /> Variable B — Color / spectral
                </Label>
                <Textarea
                  id="pmp-palette"
                  value={paletteVariable}
                  onChange={(e) => setPaletteVariable(e.target.value)}
                  rows={2}
                />
              </div>

              <Button
                className="w-full gap-2"
                style={{ background: "linear-gradient(135deg, #5B8DA8, #6B2C4E)" }}
                disabled={!canProtect || busy}
                onClick={() => void runProtect()}
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                Seal Poor Man Protection
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {!cert && (
              <Card className="border-border/50 bg-card/70">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#5B8DA8]" />
                    What you get
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p className="flex gap-2">
                    <FlaskConical className="w-4 h-4 shrink-0 text-[#5B8DA8]" />
                    Scientific hybridization of form × palette (Hybridization Engine)
                  </p>
                  <p className="flex gap-2">
                    <Coins className="w-4 h-4 shrink-0 text-[#5B8DA8]" />
                    Mint-ready ZZAI-PMP-721 protection coin metadata
                  </p>
                  <p className="flex gap-2">
                    <Lock className="w-4 h-4 shrink-0 text-[#5B8DA8]" />
                    Cyber seal hooked to Security Center (Feed Shield / Threat / PQC)
                  </p>
                </CardContent>
              </Card>
            )}

            {cert && (
              <>
                <Card className="border-[#5B8DA8]/35 bg-card/85">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          {cert.title}
                        </CardTitle>
                        <CardDescription className="mt-1 font-mono text-[11px]">
                          {cert.attestationId}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">v{cert.protocol.split("/")[1]}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                        Coupling principle
                      </p>
                      <p>{cert.scientificAxes.couplingPrinciple}</p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="rounded-lg border border-border/50 p-3">
                        <p className="text-xs font-semibold mb-1">Axis A · Form</p>
                        <p className="text-muted-foreground text-xs">
                          {cert.scientificAxes.axisA.summary}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/50 p-3">
                        <p className="text-xs font-semibold mb-1">Axis B · Spectral</p>
                        <p className="text-muted-foreground text-xs">
                          {cert.scientificAxes.axisB.summary}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                        Hybrid claims
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                        {cert.hybridization.emergentClaims.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs">
                        Novelty score{" "}
                        <span className="font-semibold text-foreground">
                          {cert.hybridization.noveltyScore}
                        </span>
                        {cert.hybridization.usedEngine ? " · engine" : " · scientific fallback"}
                      </p>
                      {cert.hybridization.patentLandscape && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {cert.hybridization.patentLandscape}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={downloadCertificate}
                      >
                        <Download className="w-3.5 h-3.5" /> Certificate JSON
                      </Button>
                      <Link href="/dashboard/security">
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <Lock className="w-3.5 h-3.5" /> Security Center
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {cert.coin && (
                  <Card className="border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Coins className="w-4 h-4 text-[#5B8DA8]" />
                        Protection coin
                      </CardTitle>
                      <CardDescription>
                        {cert.coin.name} · {cert.coin.standard} on {cert.coin.chain}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-xs font-mono space-y-1 text-muted-foreground">
                      <p>symbol {cert.coin.symbol}</p>
                      <p className="break-all">contract {cert.coin.contractAddress}</p>
                      <p>tokenId {cert.coin.tokenId}</p>
                      <p className="break-all">{cert.coin.metadataUriHint}</p>
                    </CardContent>
                  </Card>
                )}

                {cert.cyberSeal && (
                  <Card className="border-border/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#5B8DA8]" />
                        Cyber seal
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs space-y-2 text-muted-foreground">
                      <p className="font-mono break-all">seal {cert.cyberSeal.sealHash}</p>
                      <p>sealed {cert.cyberSeal.sealedAt}</p>
                      <ul className="list-disc pl-4 space-y-1">
                        {cert.cyberSeal.watchHints.map((h) => (
                          <li key={h}>{h}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </FeaturePageShell>
  );
}
