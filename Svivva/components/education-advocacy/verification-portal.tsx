"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Shield, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_BOUNDARY } from "@/lib/education-advocacy/disclaimers";

export function VerificationPortal() {
  const [receiptRaw, setReceiptRaw] = useState("");
  const [packageRaw, setPackageRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    statusLabel?: string;
    hashMatches?: boolean | null;
    timestamp?: string;
    version?: number;
    ledgerAnchorStatus?: string;
    notes?: string[];
    revealsOtherVaultContents?: boolean;
    error?: string;
  } | null>(null);

  const verify = async () => {
    setBusy(true);
    setResult(null);
    try {
      const receipt = JSON.parse(receiptRaw);
      const body: Record<string, unknown> = { receipt };
      if (packageRaw.trim()) body.package = JSON.parse(packageRaw);
      const res = await fetch("/api/education-advocacy/vault/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) setResult({ error: data.error || "Verify failed" });
      else setResult(data);
    } catch {
      setResult({ error: "Paste valid Education Proof Receipt JSON (and optional package JSON)." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <p className="text-xs tracking-[0.25em] uppercase text-[#5B8DA8]">Education Proof</p>
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Shield className="w-7 h-7 text-[#5B8DA8]" /> Verification portal
          </h1>
          <p className="text-white/60 text-sm">
            Confirm whether a sealed version matches its receipt. Verification does not reveal other
            vault contents. {ROLE_BOUNDARY}
          </p>
        </div>

        <Card className="bg-white/5 border-white/10 text-white">
          <CardHeader>
            <CardTitle className="text-lg">Education Proof Receipt JSON</CardTitle>
            <CardDescription className="text-white/50">
              Optional: paste the sealed package to recompute the manifest digest.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              rows={10}
              value={receiptRaw}
              onChange={(e) => setReceiptRaw(e.target.value)}
              placeholder='{ "kind": "Education Proof Receipt", ... }'
              className="font-mono text-xs bg-black/30 border-white/15"
            />
            <Textarea
              rows={6}
              value={packageRaw}
              onChange={(e) => setPackageRaw(e.target.value)}
              placeholder="Optional EPV package JSON"
              className="font-mono text-xs bg-black/30 border-white/15"
            />
            <Button
              onClick={() => void verify()}
              disabled={busy || !receiptRaw.trim()}
              className="gap-2"
              style={{ background: "linear-gradient(135deg, #5B8DA8, #2d4a3e)" }}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Verify
            </Button>
          </CardContent>
        </Card>

        {result ? (
          <Card className="bg-white/5 border-white/10 text-white">
            <CardContent className="pt-6 space-y-2 text-sm">
              {result.error ? (
                <p className="text-rose-300 flex items-center gap-2">
                  <XCircle className="w-4 h-4" /> {result.error}
                </p>
              ) : (
                <>
                  <p className="flex items-center gap-2 text-lg">
                    {result.statusLabel === "Verified" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-amber-400" />
                    )}
                    {result.statusLabel}
                  </p>
                  <p>Hash matches: {String(result.hashMatches)}</p>
                  <p>Timestamp: {result.timestamp || "—"}</p>
                  <p>Version: {result.version ?? "—"}</p>
                  <p>Ledger anchor: {result.ledgerAnchorStatus || "—"}</p>
                  <p>Reveals other vault contents: {String(result.revealsOtherVaultContents)}</p>
                  {result.notes?.map((n) => (
                    <p key={n} className="text-white/60 text-xs">
                      {n}
                    </p>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
