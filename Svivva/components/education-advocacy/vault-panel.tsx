"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PROOF_DOES_NOT_ESTABLISH, ROLE_BOUNDARY } from "@/lib/education-advocacy/disclaimers";

type Receipt = {
  proofId: string;
  vaultId: string;
  version: number;
  createdTimestamp: string;
  cryptographicFingerprint: string;
  verificationMethod: string;
  ledgerNetwork?: string;
  ledgerTransactionRef?: string;
  verificationStatus: string;
  verificationToken: string;
  qrPayload: string;
  statement: string;
};

export function VaultPanel() {
  const [title, setTitle] = useState("User statement");
  const [plaintext, setPlaintext] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [anchor, setAnchor] = useState(false);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [pkgJson, setPkgJson] = useState("");
  const [error, setError] = useState<string | null>(null);

  const seal = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/education-advocacy/vault/seal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeline: [{ at: new Date().toISOString(), summary: title }],
          advocacy: { issue: title },
          evidence: plaintext
            ? [{ type: "statement", title, plaintext }]
            : [{ type: "statement", title, plaintext: title }],
          passphrase: passphrase.length >= 8 ? passphrase : undefined,
          anchorToLedger: anchor,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Seal failed");
      setReceipt(data.receipt);
      setPkgJson(JSON.stringify(data.package, null, 2));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
          <Archive className="w-7 h-7 text-[#5B8DA8]" /> Education Proof Vault
        </h1>
        <p className="text-sm text-muted-foreground">
          Encrypted evidence container (EPV). Cryptocurrency wallets are optional and separate from
          encryption keys and identity. {ROLE_BOUNDARY}
        </p>
      </div>

      <Card className="border-border/50 bg-card/40 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg">Seal a vault version</CardTitle>
          <CardDescription>
            Creates a cryptographic fingerprint and Education Proof Receipt. Does not prove
            allegations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          <Textarea
            rows={5}
            value={plaintext}
            onChange={(e) => setPlaintext(e.target.value)}
            placeholder="Statement or notes to protect (encrypted when passphrase provided)"
          />
          <Input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Encryption passphrase (min 8 chars, optional)"
            autoComplete="new-password"
          />
          <div className="flex items-center justify-between gap-3 text-sm">
            <span>Optionally anchor digest only (no document contents on any ledger)</span>
            <Switch checked={anchor} onCheckedChange={setAnchor} />
          </div>
          <Button onClick={() => void seal()} disabled={busy || !title.trim()} className="gap-2">
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            Seal version
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      {receipt ? (
        <Card className="border-border/50 bg-card/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg">Education Proof Receipt</CardTitle>
            <CardDescription>
              Status vocabulary: Sealed — not “legally proven” or “court certified”.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm font-mono break-all">
            <p>Proof ID: {receipt.proofId}</p>
            <p>Vault ID: {receipt.vaultId}</p>
            <p>Version: {receipt.version}</p>
            <p>Created: {receipt.createdTimestamp}</p>
            <p>Fingerprint: {receipt.cryptographicFingerprint}</p>
            <p>Method: {receipt.verificationMethod}</p>
            <p>
              Ledger: {receipt.ledgerNetwork || "none"} / {receipt.ledgerTransactionRef || "—"}
            </p>
            <p>Status: {receipt.verificationStatus}</p>
            <p>Token: {receipt.verificationToken}</p>
            <p className="font-sans text-muted-foreground break-words pt-2">{receipt.statement}</p>
            <p className="font-sans text-xs text-muted-foreground">
              Does not establish: {PROOF_DOES_NOT_ESTABLISH.join("; ")}.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/education/verify">Open verification portal</Link>
            </Button>
            <details className="pt-2">
              <summary className="cursor-pointer text-xs text-muted-foreground">
                Advanced package JSON
              </summary>
              <pre className="mt-2 text-[10px] overflow-auto max-h-64 p-2 rounded bg-black/30">
                {pkgJson}
              </pre>
            </details>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
