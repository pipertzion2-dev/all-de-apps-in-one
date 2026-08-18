"use client";

import { FileCode2, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DIGITAL_FILE_ACCEPT,
  INVENTION_TYPE_LABELS,
} from "@/lib/poor-man-protection/digital-patent";
import type { DigitalArtifact, DigitalDisclosure } from "@/lib/poor-man-protection/types";

export type DigitalDepositState = {
  inventionType: DigitalDisclosure["inventionType"];
  problemStatement: string;
  novelSteps: string;
  technicalEffect: string;
  dataStructures: string;
  apiSurface: string;
  userFlow: string;
  sourceExcerpt: string;
  artifacts: DigitalArtifact[];
  contentHash: string | null;
};

type Props = {
  state: DigitalDepositState;
  onChange: (patch: Partial<DigitalDepositState>) => void;
};

async function sha256Hex(buffer: BufferSource): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Text(text: string): Promise<string> {
  return sha256Hex(new TextEncoder().encode(text));
}

export function buildDigitalDisclosureFromState(
  state: DigitalDepositState,
  title: string,
  description: string,
): DigitalDisclosure {
  return {
    kind: "digital_patent",
    inventionType: state.inventionType,
    problemStatement: state.problemStatement.trim(),
    novelSteps: state.novelSteps.trim(),
    technicalEffect: state.technicalEffect.trim(),
    dataStructures: state.dataStructures.trim(),
    apiSurface: state.apiSurface.trim(),
    userFlow: state.userFlow.trim(),
    artifacts: state.artifacts.length ? state.artifacts : undefined,
    sourceExcerpt: state.sourceExcerpt.trim() || undefined,
  };
}

export function DigitalDepositPanel({ state, onChange }: Props) {
  const onArtifacts = async (files: FileList | File[]) => {
    const list = [...files].slice(0, 12);
    const artifacts: DigitalArtifact[] = [];
    for (const f of list) {
      const buf = await f.arrayBuffer();
      artifacts.push({
        fileName: f.name,
        contentHash: await sha256Hex(buf),
        mimeType: f.type || undefined,
        byteLength: f.size,
      });
    }
    onChange({ artifacts });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-dashed border-[#5B8DA8]/30 bg-muted/20 p-4 flex gap-3">
        <FileCode2 className="w-8 h-8 text-[#5B8DA8] shrink-0" />
        <div className="text-sm text-muted-foreground">
          <p>
            Describe your digital invention in structured fields. Optional files are hashed in your
            browser — source never has to leave this session for fingerprinting.
          </p>
          <p className="text-xs mt-1">Accepts {DIGITAL_FILE_ACCEPT.replace(/\./g, " ").trim()}.</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Invention type</Label>
        <select
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={state.inventionType}
          onChange={(e) =>
            onChange({
              inventionType: e.target.value as DigitalDisclosure["inventionType"],
            })
          }
        >
          {Object.entries(INVENTION_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Problem your invention solves</Label>
        <Textarea
          rows={3}
          value={state.problemStatement}
          onChange={(e) => onChange({ problemStatement: e.target.value })}
          placeholder="What pain point or technical gap does this address?"
        />
      </div>

      <div className="space-y-2">
        <Label>Novel steps / method (be specific)</Label>
        <Textarea
          rows={4}
          value={state.novelSteps}
          onChange={(e) => onChange({ novelSteps: e.target.value })}
          placeholder="Step 1… Step 2… What is non-obvious compared to prior art?"
        />
      </div>

      <div className="space-y-2">
        <Label>Technical effect / advantage</Label>
        <Textarea
          rows={2}
          value={state.technicalEffect}
          onChange={(e) => onChange({ technicalEffect: e.target.value })}
          placeholder="Faster, safer, cheaper, more accurate…"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Data structures & state</Label>
          <Textarea
            rows={3}
            value={state.dataStructures}
            onChange={(e) => onChange({ dataStructures: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>API / system surface</Label>
          <Textarea
            rows={3}
            value={state.apiSurface}
            onChange={(e) => onChange({ apiSurface: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>User / operator flow</Label>
        <Textarea
          rows={2}
          value={state.userFlow}
          onChange={(e) => onChange({ userFlow: e.target.value })}
          placeholder="How a user or device interacts with the invention end-to-end"
        />
      </div>

      <div className="space-y-2">
        <Label>Optional source excerpt (paste key code / pseudocode)</Label>
        <Textarea
          rows={4}
          className="font-mono text-xs"
          value={state.sourceExcerpt}
          onChange={(e) => onChange({ sourceExcerpt: e.target.value })}
          placeholder="// Core algorithm or interface excerpt…"
        />
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Upload className="w-4 h-4" /> Artifact files (hashed locally)
        </Label>
        <Input
          type="file"
          multiple
          accept={DIGITAL_FILE_ACCEPT}
          onChange={(e) => void onArtifacts(e.target.files || [])}
        />
        {state.artifacts.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {state.artifacts.map((a) => (
              <Badge key={a.fileName} variant="outline" className="font-mono text-[10px]">
                {a.fileName} · {a.contentHash.slice(0, 10)}…
              </Badge>
            ))}
          </div>
        ) : null}
      </div>

      {state.contentHash && (
        <p className="text-[11px] font-mono break-all text-muted-foreground">
          SHA-256 {state.contentHash}
        </p>
      )}
    </div>
  );
}

export async function fingerprintDigitalDeposit(
  state: DigitalDepositState,
  title: string,
  description: string,
): Promise<string> {
  const disclosure = buildDigitalDisclosureFromState(state, title, description);
  const canonical = JSON.stringify({ title, description, disclosure });
  return sha256Text(canonical);
}
