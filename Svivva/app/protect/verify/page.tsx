"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProtectVerifyPage() {
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    valid?: boolean;
    title?: string;
    attestationId?: string;
    contentHash?: string;
    protocol?: string;
    error?: string;
  } | null>(null);

  const verify = async () => {
    setBusy(true);
    setResult(null);
    try {
      const certificate = JSON.parse(raw);
      const res = await fetch("/api/poor-man-protection/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificate }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ valid: false, error: data.error || "Verify failed" });
      } else {
        setResult(data);
      }
    } catch {
      setResult({ valid: false, error: "Paste a valid ZZAI certificate JSON." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <p className="text-xs tracking-[0.25em] uppercase text-[#5B8DA8]">zzai zzai</p>
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Shield className="w-7 h-7 text-[#5B8DA8]" /> Verify protection
          </h1>
          <p className="text-white/60 text-sm">
            Paste a Poor Man Protection certificate JSON to check integrity of the certificate hash.
          </p>
        </div>

        <Card className="bg-white/5 border-white/10 text-white">
          <CardHeader>
            <CardTitle className="text-lg">Certificate JSON</CardTitle>
            <CardDescription className="text-white/50">
              Does not prove authorship alone — proves the sealed package has not been tampered
              with.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              rows={12}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder='{ "protocol": "ZZAI-Poor-Man-Protection/1.1", ... }'
              className="font-mono text-xs bg-black/30 border-white/15"
            />
            <Button
              onClick={() => void verify()}
              disabled={busy || !raw.trim()}
              className="gap-2"
              style={{ background: "linear-gradient(135deg, #5B8DA8, #6B2C4E)" }}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Verify integrity
            </Button>
            {result && (
              <div
                className={`rounded-lg border p-3 text-sm ${
                  result.valid
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : "border-red-500/40 bg-red-500/10"
                }`}
              >
                <p className="font-semibold flex items-center gap-2">
                  {result.valid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  {result.valid ? "Certificate hash valid" : "Invalid or tampered"}
                </p>
                {result.error && <p className="text-xs mt-1 opacity-80">{result.error}</p>}
                {result.title && <p className="text-xs mt-2">Title: {result.title}</p>}
                {result.attestationId && (
                  <p className="text-xs font-mono break-all">ID: {result.attestationId}</p>
                )}
                {result.contentHash && (
                  <p className="text-xs font-mono break-all">Content: {result.contentHash}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-white/50">
          <Link href="/dashboard/poor-man-protection" className="text-[#5B8DA8] underline">
            Open Poor Man Protection
          </Link>
        </p>
      </div>
    </div>
  );
}
