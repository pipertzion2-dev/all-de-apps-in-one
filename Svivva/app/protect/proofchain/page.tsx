"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PROOFCHAIN_DISCLAIMER } from "@/lib/poor-man-protection/invention-studio/proofchain";

/**
 * Public ProofChain desk — verifies authorized certificate payloads only.
 * Does not reveal confidential invention descriptions.
 */
export default function ProofChainPublicPage() {
  const [payload, setPayload] = useState("");
  const [lookupId, setLookupId] = useState("");
  const [remote, setRemote] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);

  const parsed = useMemo(() => {
    try {
      return JSON.parse(payload) as Record<string, unknown>;
    } catch {
      return null;
    }
  }, [payload]);

  const lookup = async () => {
    const id = lookupId.trim() || String(parsed?.publicCertId || "");
    if (!id) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/poor-man-protection/invention-studio/public-cert/${id}`);
      const data = await res.json();
      setRemote(data);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
      <Card className="border-[#5B8DA8]/30 bg-card/80">
        <CardHeader>
          <CardTitle className="text-[#5B8DA8]">ProofChain public verification</CardTitle>
          <CardDescription>
            Paste a QR certificate payload or look up an authorized public certificate id. Private
            invention descriptions are never shown here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            rows={6}
            placeholder='{ "protocol": "ZZAI-Invention-Protection-Studio/1.0", "publicCertId": "...", "sha256": "..." }'
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
          />
          {parsed ? (
            <div className="text-xs space-y-1 rounded-lg border border-[#5B8DA8]/25 p-3 font-mono">
              <div>publicCertId: {String(parsed.publicCertId || "—")}</div>
              <div>evidenceId: {String(parsed.evidenceId || "—")}</div>
              <div>sha256: {String(parsed.sha256 || "—")}</div>
              <div>version: {String(parsed.version || "—")}</div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Waiting for valid JSON payload…</p>
          )}
          <div className="flex flex-wrap gap-2">
            <input
              className="h-10 rounded-md border border-input bg-background px-3 text-sm flex-1 min-w-[180px]"
              placeholder="publicCertId"
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
            />
            <Button
              disabled={busy}
              onClick={() => void lookup()}
              className="bg-[#5B8DA8] hover:bg-[#4a7a92]"
            >
              Lookup authorized cert
            </Button>
          </div>
          {remote ? (
            <pre className="text-xs whitespace-pre-wrap rounded-lg border border-border/40 p-3 max-h-64 overflow-auto">
              {JSON.stringify(remote, null, 2)}
            </pre>
          ) : null}
          <p className="text-xs text-muted-foreground">{PROOFCHAIN_DISCLAIMER}</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/poor-man-protection/invention-studio">Back to Invention Protection</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
