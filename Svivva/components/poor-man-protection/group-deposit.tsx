"use client";

import { Images, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { OrganizedGroupPatent } from "@/lib/poor-man-protection/types";

export type DepositedGroupImage = {
  file: File;
  previewUrl: string;
  contentHash: string;
};

export function GroupDeposit({
  images,
  organizing,
  organized,
  merkleRoot,
  onPick,
}: {
  images: DepositedGroupImage[];
  organizing: boolean;
  organized: OrganizedGroupPatent | null;
  merkleRoot: string | null;
  onPick: (files: File[]) => void;
}) {
  return (
    <div className="space-y-3">
      <div
        className="relative rounded-xl border border-dashed border-border/70 bg-muted/20 min-h-[160px] p-4"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const files = [...(e.dataTransfer.files || [])].filter((f) =>
            f.type.startsWith("image/"),
          );
          if (files.length) onPick(files);
        }}
      >
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center px-4">
            <Images className="w-8 h-8 text-[#5B8DA8]" />
            <p className="text-sm text-muted-foreground">
              Drop a bunch of sketches — ZZAI groups families, numbers figures, extracts palettes,
              and writes the disclosure.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {images.map((img) => (
              <div key={img.contentHash + img.file.name} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.previewUrl}
                  alt={img.file.name}
                  className="h-20 w-full object-cover rounded-md border"
                />
                <p className="text-[9px] truncate mt-0.5 text-muted-foreground">{img.file.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {organizing && (
        <p className="text-xs flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Hashing, clustering, numbering figures…
        </p>
      )}

      {organized && (
        <div className="rounded-xl border border-[#5B8DA8]/30 bg-[#5B8DA8]/5 p-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Group patent</Badge>
            <span className="text-sm font-semibold">{organized.title}</span>
            <span className="text-xs text-muted-foreground">
              {organized.figureCount} figures · {organized.familyCount} famil
              {organized.familyCount === 1 ? "y" : "ies"}
            </span>
          </div>
          <ol className="text-xs text-muted-foreground space-y-1 max-h-40 overflow-auto">
            {organized.sheets.map((s) => (
              <li key={s.contentHash}>
                <span className="font-mono text-foreground">{s.figure}</span> · {s.role} ·{" "}
                {s.fileName}
              </li>
            ))}
          </ol>
          {merkleRoot && (
            <p className="text-[11px] font-mono break-all text-muted-foreground">
              merkle {merkleRoot}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
