"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModelCompCardPreview } from "@/components/events/model-comp-card-preview";
import { AGENCY_DIRECTORY } from "@/lib/events/model-agency/agency-directory";
import {
  emptyModelAgencyDraft,
  loadModelAgencyDraft,
  saveModelAgencyDraft,
} from "@/lib/events/model-agency/default-draft";
import {
  buildSubmissionPack,
  compCardReady,
  draftCompletionPercent,
} from "@/lib/events/model-agency/submission-pack";
import {
  COMP_CARD_SLOTS,
  MODEL_BOARD_LANES,
  type CompCardSlot,
  type ModelAgencyDraft,
  type ModelBoardLane,
} from "@/lib/events/model-agency/types";
import { Check, ChevronLeft, ChevronRight, Copy, ShieldAlert } from "lucide-react";

const STEPS = [
  { id: "intro", title: "Overview" },
  { id: "comp", title: "Comp card" },
  { id: "stats", title: "Stats & contact" },
  { id: "boards", title: "Board fit" },
  { id: "agencies", title: "Agencies" },
  { id: "pack", title: "Submission pack" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function ModelAgencySigningFlow() {
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<ModelAgencyDraft>(() => emptyModelAgencyDraft());
  const [copied, setCopied] = useState<"subject" | "body" | null>(null);

  useEffect(() => {
    setDraft(loadModelAgencyDraft());
  }, []);

  const persist = useCallback((next: ModelAgencyDraft) => {
    setDraft(next);
    saveModelAgencyDraft(next);
  }, []);

  const step = STEPS[stepIndex]?.id ?? "intro";
  const pack = useMemo(() => buildSubmissionPack(draft), [draft]);
  const completion = draftCompletionPercent(draft);

  const go = (delta: number) => {
    setStepIndex((i) => Math.min(STEPS.length - 1, Math.max(0, i + delta)));
  };

  const toggleLane = (lane: ModelBoardLane) => {
    const lanes = draft.lanes.includes(lane)
      ? draft.lanes.filter((l) => l !== lane)
      : [...draft.lanes, lane];
    persist({ ...draft, lanes });
  };

  const toggleAgency = (id: string) => {
    const selected = draft.selectedAgencyIds.includes(id)
      ? draft.selectedAgencyIds.filter((x) => x !== id)
      : [...draft.selectedAgencyIds, id];
    persist({ ...draft, selectedAgencyIds: selected });
  };

  const setImage = async (slot: CompCardSlot, file: File | null) => {
    if (!file) {
      persist({ ...draft, images: { ...draft.images, [slot]: null } });
      return;
    }
    const url = await readFileAsDataUrl(file);
    persist({ ...draft, source: "built", images: { ...draft.images, [slot]: url } });
  };

  const onUploadComp = async (file: File | null) => {
    if (!file) {
      persist({ ...draft, uploadedCompUrl: null, uploadedCompName: null });
      return;
    }
    const url = await readFileAsDataUrl(file);
    persist({
      ...draft,
      source: "upload",
      uploadedCompUrl: url,
      uploadedCompName: file.name,
    });
  };

  const copyText = async (text: string, kind: "subject" | "body") => {
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#5B8DA8]">
            ZZAI Show · Talent desk
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Model agency signing — start with your comp card
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Industry scouts decide in under a minute: clean comp, honest measurements, board fit,
            then a structured email. This desk organizes your pack — you still submit on each
            agency&apos;s own site or inbox.
          </p>
        </div>
        <div className="rounded-lg border border-border/50 bg-card/60 px-4 py-3 text-sm">
          <p className="font-medium">Pack readiness</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-[#5B8DA8] transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{completion}% — saved on this device</p>
        </div>
      </div>

      <ol className="flex flex-wrap gap-2" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => setStepIndex(i)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                i === stepIndex
                  ? "bg-[#5B8DA8] text-white"
                  : i < stepIndex
                    ? "bg-muted text-foreground"
                    : "border border-border text-muted-foreground"
              }`}
            >
              {i + 1}. {s.title}
            </button>
          </li>
        ))}
      </ol>

      {step === "intro" ? (
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-xl border border-border/50 bg-card/60 p-6">
            <h2 className="text-lg font-semibold">How legit agencies review you</h2>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">Comp card + digitals</strong> — hero plus
                headshot, profile, 3/4, and full body; natural light, no filters.
              </li>
              <li>
                <strong className="text-foreground">Exact stats</strong> — height, bust/chest,
                waist, hips, shoe, hair, eyes (cm + inches in email).
              </li>
              <li>
                <strong className="text-foreground">Board match</strong> — study each agency roster;
                submit to lanes that already book your look.
              </li>
              <li>
                <strong className="text-foreground">One clear email</strong> — subject{" "}
                <code className="text-xs">Name | City | Height | Board</code>, small attachments,
                one portfolio link.
              </li>
            </ol>
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
              <p>
                Real agencies earn commission — they do not charge upfront representation fees. Walk
                away from pay-to-play photo packages.
              </p>
            </div>
          </div>
          <ModelCompCardPreview draft={draft} className="mx-auto w-full" />
        </section>
      ) : null}

      {step === "comp" ? (
        <section className="grid gap-8 lg:grid-cols-[1fr,minmax(240px,320px)]">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={draft.source === "upload" ? "default" : "outline"}
                size="sm"
                onClick={() => persist({ ...draft, source: "upload" })}
              >
                I have a comp card file
              </Button>
              <Button
                type="button"
                variant={draft.source === "built" ? "default" : "outline"}
                size="sm"
                onClick={() => persist({ ...draft, source: "built" })}
              >
                Build from digitals
              </Button>
            </div>

            {draft.source === "upload" ? (
              <div className="space-y-3">
                <Label htmlFor="comp-upload">Upload comp card (PDF or JPG, keep under ~5 MB)</Label>
                <Input
                  id="comp-upload"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => void onUploadComp(e.target.files?.[0] ?? null)}
                />
                {draft.uploadedCompName ? (
                  <p className="text-xs text-muted-foreground">Loaded: {draft.uploadedCompName}</p>
                ) : null}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {COMP_CARD_SLOTS.map((slot) => (
                  <div key={slot.id} className="space-y-2 rounded-lg border border-border/40 p-3">
                    <Label htmlFor={`img-${slot.id}`}>{slot.label}</Label>
                    <p className="text-xs text-muted-foreground">{slot.hint}</p>
                    <Input
                      id={`img-${slot.id}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => void setImage(slot.id, e.target.files?.[0] ?? null)}
                    />
                  </div>
                ))}
              </div>
            )}

            {!compCardReady(draft) ? (
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Add an uploaded comp or at least hero, headshot, and full-body digitals to continue.
              </p>
            ) : (
              <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                <Check className="h-4 w-4" aria-hidden /> Comp card ready for preview
              </p>
            )}
          </div>
          <ModelCompCardPreview draft={draft} />
        </section>
      ) : null}

      {step === "stats" ? (
        <section className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="legalName">Legal name (as on comp card)</Label>
                <Input
                  id="legalName"
                  value={draft.contact.legalName}
                  onChange={(e) =>
                    persist({ ...draft, contact: { ...draft.contact, legalName: e.target.value } })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={draft.contact.city}
                  onChange={(e) =>
                    persist({ ...draft, contact: { ...draft.contact, city: e.target.value } })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">State / region</Label>
                <Input
                  id="region"
                  value={draft.contact.region}
                  onChange={(e) =>
                    persist({ ...draft, contact: { ...draft.contact, region: e.target.value } })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={draft.contact.email}
                  onChange={(e) =>
                    persist({ ...draft, contact: { ...draft.contact, email: e.target.value } })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={draft.contact.phone}
                  onChange={(e) =>
                    persist({ ...draft, contact: { ...draft.contact, phone: e.target.value } })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min={16}
                  max={99}
                  value={draft.contact.age ?? ""}
                  onChange={(e) =>
                    persist({
                      ...draft,
                      contact: {
                        ...draft.contact,
                        age: e.target.value ? Number(e.target.value) : null,
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  placeholder="@handle"
                  value={draft.contact.instagram}
                  onChange={(e) =>
                    persist({
                      ...draft,
                      contact: { ...draft.contact, instagram: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="portfolio">Portfolio link</Label>
                <Input
                  id="portfolio"
                  type="url"
                  placeholder="https://"
                  value={draft.contact.portfolioUrl}
                  onChange={(e) =>
                    persist({
                      ...draft,
                      contact: { ...draft.contact, portfolioUrl: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            <h3 className="font-semibold">Measurements (centimeters)</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["heightCm", "Height"],
                  ["bustCm", "Bust / chest"],
                  ["waistCm", "Waist"],
                  ["hipsCm", "Hips"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key}>{label}</Label>
                  <Input
                    id={key}
                    type="number"
                    value={draft.measurements[key] ?? ""}
                    onChange={(e) =>
                      persist({
                        ...draft,
                        measurements: {
                          ...draft.measurements,
                          [key]: e.target.value ? Number(e.target.value) : null,
                        },
                      })
                    }
                  />
                </div>
              ))}
              <div className="space-y-2">
                <Label htmlFor="shoeUs">Shoe (US)</Label>
                <Input
                  id="shoeUs"
                  value={draft.measurements.shoeUs}
                  onChange={(e) =>
                    persist({
                      ...draft,
                      measurements: { ...draft.measurements, shoeUs: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dressSize">Dress size</Label>
                <Input
                  id="dressSize"
                  value={draft.measurements.dressSize}
                  onChange={(e) =>
                    persist({
                      ...draft,
                      measurements: { ...draft.measurements, dressSize: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hairColor">Hair</Label>
                <Input
                  id="hairColor"
                  value={draft.measurements.hairColor}
                  onChange={(e) =>
                    persist({
                      ...draft,
                      measurements: { ...draft.measurements, hairColor: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eyeColor">Eyes</Label>
                <Input
                  id="eyeColor"
                  value={draft.measurements.eyeColor}
                  onChange={(e) =>
                    persist({
                      ...draft,
                      measurements: { ...draft.measurements, eyeColor: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>
          <ModelCompCardPreview draft={draft} />
        </section>
      ) : null}

      {step === "boards" ? (
        <section className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Pick one or two lanes that match your book and the agencies you researched —
            spray-and-pray submissions get ignored.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {MODEL_BOARD_LANES.map((lane) => {
              const on = draft.lanes.includes(lane.id);
              return (
                <li key={lane.id}>
                  <button
                    type="button"
                    onClick={() => toggleLane(lane.id)}
                    className={`h-full w-full rounded-xl border p-4 text-left transition-colors ${
                      on ? "border-[#5B8DA8] bg-[#5B8DA8]/10" : "border-border/50 bg-card/60"
                    }`}
                  >
                    <p className="font-semibold">{lane.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{lane.blurb}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {step === "agencies" ? (
        <section className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Example boards for workflow practice — replace with real agencies you have vetted.
            Select who gets this submission pack.
          </p>
          <ul className="space-y-3">
            {AGENCY_DIRECTORY.map((agency) => {
              const on = draft.selectedAgencyIds.includes(agency.id);
              const laneMatch = agency.lanes.some((l) => draft.lanes.includes(l));
              return (
                <li
                  key={agency.id}
                  className={`rounded-xl border p-4 ${on ? "border-[#5B8DA8]" : "border-border/50"}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <button
                        type="button"
                        className="text-left font-semibold hover:underline"
                        onClick={() => toggleAgency(agency.id)}
                      >
                        {on ? "✓ " : ""}
                        {agency.name} · {agency.city}
                      </button>
                      {!laneMatch && draft.lanes.length ? (
                        <p className="text-xs text-amber-700">Outside your selected lanes</p>
                      ) : null}
                      <p className="mt-1 text-xs text-muted-foreground">{agency.scamSafeNote}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Reply ~{agency.leadTimeWeeks} wks
                    </span>
                  </div>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {agency.checklist.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {step === "pack" ? (
        <section className="grid gap-8 lg:grid-cols-[1fr,minmax(240px,320px)]">
          <div className="space-y-6">
            <div className="rounded-xl border border-border/50 bg-card/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">Email subject</h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void copyText(pack.subject, "subject")}
                >
                  <Copy className="h-3 w-3" aria-hidden />
                  {copied === "subject" ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="mt-2 font-mono text-sm">{pack.subject}</p>
            </div>

            <div className="rounded-xl border border-border/50 bg-card/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">Email body</h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void copyText(pack.body, "body")}
                >
                  <Copy className="h-3 w-3" aria-hidden />
                  {copied === "body" ? "Copied" : "Copy"}
                </Button>
              </div>
              <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                {pack.body}
              </pre>
            </div>

            <div className="rounded-xl border border-border/50 bg-card/60 p-4">
              <h3 className="font-semibold">Before you send</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {pack.checklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
              <h3 className="font-semibold">Safety</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {pack.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>

            <p className="text-sm text-muted-foreground">
              Optional:{" "}
              <Link
                href="/dashboard/poor-man-protection"
                className="text-[#5B8DA8] underline-offset-2 hover:underline"
              >
                Poor Man Protection
              </Link>{" "}
              can timestamp portfolio or comp exports if you need a dated record of your look.
            </p>

            {pack.agencies.length ? (
              <div className="space-y-2">
                <h3 className="font-semibold">Your shortlist</h3>
                {pack.agencies.map((a) => (
                  <div key={a.id} className="rounded-lg border border-border/40 px-3 py-2 text-sm">
                    <p className="font-medium">{a.name}</p>
                    {a.submissionEmail ? (
                      <p className="text-muted-foreground">{a.submissionEmail}</p>
                    ) : null}
                    <a
                      href={a.submissionUrl}
                      className="text-[#5B8DA8] hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Submission page
                    </a>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <ModelCompCardPreview draft={draft} />
        </section>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-6">
        <Button type="button" variant="outline" disabled={stepIndex === 0} onClick={() => go(-1)}>
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Back
        </Button>
        <Button
          type="button"
          disabled={stepIndex === STEPS.length - 1}
          onClick={() => go(1)}
          className="bg-[#5B8DA8] text-white hover:bg-[#5B8DA8]/90"
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
