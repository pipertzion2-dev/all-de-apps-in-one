"use client";

import type { CompCardImages, ModelAgencyDraft } from "@/lib/events/model-agency/types";

type Props = {
  draft: ModelAgencyDraft;
  className?: string;
};

function Stat({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <span className="text-[10px] text-muted-foreground">
      <span className="font-medium text-foreground">{label}</span> {value}
    </span>
  );
}

function ImageCell({ src, label }: { src: string | null; label: string }) {
  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-muted/40">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center px-2 text-center text-[9px] uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
      )}
    </div>
  );
}

/** Standard comp layout: hero left, grid right, stats footer (print ratio ~5.5×8.5). */
export function ModelCompCardPreview({ draft, className = "" }: Props) {
  const uploaded = draft.source === "upload" && draft.uploadedCompUrl;

  if (uploaded) {
    return (
      <div
        className={`overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={draft.uploadedCompUrl!}
          alt="Uploaded comp card"
          className="max-h-[520px] w-full object-contain bg-muted/20"
        />
      </div>
    );
  }

  const images: CompCardImages = draft.images;
  const m = draft.measurements;
  const name = draft.contact.legalName || "Your name";

  return (
    <div
      className={`aspect-[11/17] max-w-md overflow-hidden rounded-xl border border-border/60 bg-white text-zinc-900 shadow-md dark:bg-zinc-950 dark:text-zinc-100 ${className}`}
      data-testid="model-comp-card-preview"
    >
      <div className="grid h-[78%] grid-cols-4 grid-rows-2 gap-1 p-2">
        <div className="col-span-2 row-span-2">
          <ImageCell src={images.hero} label="Hero" />
        </div>
        <ImageCell src={images.headshot} label="Headshot" />
        <ImageCell src={images.profile} label="Profile" />
        <ImageCell src={images.threeQuarter} label="3/4" />
        <ImageCell src={images.fullBody} label="Full body" />
      </div>
      <div className="border-t border-border/40 px-3 py-2">
        <p className="text-sm font-semibold tracking-wide">{name}</p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
          <Stat label="H" value={m.heightCm ? `${m.heightCm} cm` : ""} />
          <Stat label="B" value={m.bustCm ? `${m.bustCm}` : ""} />
          <Stat label="W" value={m.waistCm ? `${m.waistCm}` : ""} />
          <Stat label="Hips" value={m.hipsCm ? `${m.hipsCm}` : ""} />
          <Stat label="Shoe" value={m.shoeUs} />
          <Stat label="Hair" value={m.hairColor} />
          <Stat label="Eyes" value={m.eyeColor} />
        </div>
        {draft.contact.email ? (
          <p className="mt-1 truncate text-[10px] text-muted-foreground">{draft.contact.email}</p>
        ) : null}
      </div>
    </div>
  );
}
