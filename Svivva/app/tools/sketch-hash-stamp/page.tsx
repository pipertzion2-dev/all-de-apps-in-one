"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { MiniAppShell } from "@/components/tools/mini-app-shell";
import { getFeatureMiniApp } from "@/lib/tools/feature-mini-apps";

const APP = getFeatureMiniApp("sketch-hash-stamp")!;

async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function SketchHashStampPage() {
  const [name, setName] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <MiniAppShell app={APP} nextLabel="Poor Man Protection">
      <label className="block rounded-2xl border border-dashed border-border p-6 text-center cursor-pointer hover:border-[#5B8DA8]/50">
        <ShieldCheck className="w-8 h-8 mx-auto text-[#5B8DA8] mb-2" />
        <p className="text-sm font-medium">Drop a sketch or click to hash</p>
        <p className="text-xs text-muted-foreground mt-1">
          SHA-256 in your browser. Nothing is uploaded.
        </p>
        <input
          type="file"
          className="hidden"
          data-testid="input-sketch-file"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setError(null);
            try {
              setName(file.name);
              setHash(await sha256Hex(file));
            } catch {
              setError("Could not hash that file in this browser.");
            }
          }}
        />
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {hash && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
          <p className="text-sm font-medium">{name}</p>
          <p className="font-mono text-xs break-all text-muted-foreground">{hash}</p>
          <p className="text-xs text-muted-foreground">
            A hash is not a seal. Open Poor Man Protection to hybridize, timestamp, and pack court
            evidence.
          </p>
        </div>
      )}
    </MiniAppShell>
  );
}
