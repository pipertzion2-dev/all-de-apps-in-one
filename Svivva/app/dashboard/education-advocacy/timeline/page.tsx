"use client";

import { useState } from "react";
import Link from "next/link";
import { GitBranch, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_BOUNDARY, LEGAL_INFO_NOT_ADVICE } from "@/lib/education-advocacy/disclaimers";
import type {
  IntakeProfile,
  TimelineLaneId,
  TimelineReconstruction,
} from "@/lib/education-advocacy/advocacy/timeline-reconstruction";
import { TimelineReconstructionView } from "@/components/education-advocacy/timeline-reconstruction-view";

const DEFAULT_INTAKE: IntakeProfile = {
  country: "US",
  stateProvince: "NY",
  district: "NYC DOE (if applicable — edit if different)",
  schoolName: "",
  approximateSchoolYear: "Senior year (exact calendar year TBD)",
  studentAgeAtTime: "",
  grade: "12 / senior",
  expectedGraduationDate: "Expected spring of senior year (exact date TBD)",
  lastNormalAttendance: "Early fall / before October disruption (approx.)",
  housingLivingSituation:
    "Living situation was disrupted in connection with family/parent actions — details incomplete; nighttime residence facts still needed",
  employmentSituation: "Working two jobs until access was lost around the October window",
  majorFamilyHouseholdChanges:
    "Student reports parent used iPhone/location information, came to location, put student in a car, and interfered with work and school attendance",
  periodsUnableToAttend: "Approximately 2–3 weeks with no school attendance",
  transfersOrAlternativePrograms:
    "YABC — told participation would not appear on or affect permanent educational record; later saw program information on the record",
  graduationOrOutcome: "Pathway changed from traditional high school to YABC (outcome details TBD)",
  freeformRecollection: `I was a high-school senior in New York State. Around October of my senior year, I was close to completing high school and was also working two jobs. Because of my living situation and actions by my parent, I lost access to both jobs and ultimately stopped attending my regular school. My parent used my iPhone/location information to track where I was, came to my location, put me in a car, and interfered with my ability to continue going to work and school. I then did not attend school at all for approximately 2–3 weeks. Afterward, I was told that I should enter a YABC program and that participation would not appear on or affect my permanent educational record. I relied on that information. I later discovered information about the program on my educational record. Had I known that beforehand, I would not have agreed to leave my existing high-school path for YABC.

Approximate answers are fine. I don't remember every exact date.`,
};

export default function TimelineReconstructionPage() {
  const [intake, setIntake] = useState<IntakeProfile>(DEFAULT_INTAKE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconstruction, setReconstruction] = useState<TimelineReconstruction | null>(null);
  const [hiddenLanes, setHiddenLanes] = useState<TimelineLaneId[]>([]);
  const [docName, setDocName] = useState("");
  const [docNote, setDocNote] = useState("");

  const setField = (key: keyof IntakeProfile, value: string) =>
    setIntake((prev) => ({ ...prev, [key]: value }));

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const documents =
        docName.trim().length > 0
          ? [
              {
                name: docName.trim(),
                kind: "other",
                originalPreserved: true as const,
                aiInterpretation: docNote.trim() || undefined,
              },
            ]
          : [];
      const res = await fetch("/api/education-advocacy/timeline-reconstruction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intake,
          documents,
          hiddenLanes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reconstruction failed");
      setReconstruction(data.reconstruction as TimelineReconstruction);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const field = (key: keyof IntakeProfile, label: string, area = false, rows = 2) => (
    <div className="space-y-1.5">
      <label className="text-xs text-muted-foreground">{label}</label>
      {area ? (
        <Textarea
          rows={rows}
          value={intake[key] || ""}
          onChange={(e) => setField(key, e.target.value)}
          placeholder="Approximate answers are fine — or write I don't remember"
        />
      ) : (
        <Input
          value={intake[key] || ""}
          onChange={(e) => setField(key, e.target.value)}
          placeholder="Optional — approximate OK"
        />
      )}
    </div>
  );

  return (
    <div className="px-4 sm:px-6 py-8 pb-16 max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Advocate Bus · Education Timeline Reconstruction
        </p>
        <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
          <GitBranch className="w-7 h-7 text-[#5B8DA8]" />
          Education Timeline Reconstruction
        </h1>
        <p className="text-sm text-muted-foreground">
          Transform recollections and records into a layered chronological timeline. Exact dates are
          not required. {ROLE_BOUNDARY} {LEGAL_INFO_NOT_ADVICE}
        </p>
      </div>

      <Card className="border-border/50 bg-card/40 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg">1. Begin the reconstruction</CardTitle>
          <CardDescription>
            Share whatever you remember. “October of senior year,” “about two weeks later,” or “I
            don’t remember” are all valid. Incomplete information never blocks you from continuing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {field("stateProvince", "State")}
            {field("district", "School district / borough")}
            {field("schoolName", "School name (if known)")}
            {field("approximateSchoolYear", "Approximate school year")}
            {field("grade", "Grade")}
            {field("studentAgeAtTime", "Age at the time (if known)")}
            {field("expectedGraduationDate", "Expected graduation date")}
            {field("lastNormalAttendance", "Last period of normal attendance")}
          </div>
          {field("housingLivingSituation", "Housing / living situation", true, 3)}
          {field("employmentSituation", "Employment situation (if relevant)", true, 2)}
          {field("majorFamilyHouseholdChanges", "Major family or household changes", true, 3)}
          {field("periodsUnableToAttend", "Periods when you could not attend school", true, 2)}
          {field(
            "transfersOrAlternativePrograms",
            "School transfers or alternative-program placements (e.g. YABC)",
            true,
            3,
          )}
          {field("graduationOrOutcome", "Graduation or educational outcome", true, 2)}
          {field(
            "freeformRecollection",
            "Whatever else you remember (freeform — approximate OK)",
            true,
            10,
          )}

          <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-border/40">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                Document note (optional — originals are never altered)
              </label>
              <Input
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="e.g. Unofficial transcript scan"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                Interpretation note (separate from original)
              </label>
              <Input
                value={docNote}
                onChange={(e) => setDocNote(e.target.value)}
                placeholder="Dates you see on it, if any"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={() => void run()} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Reconstruct timeline
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/education-advocacy/coercion-review">
                Open Access & Coercion Review
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/dashboard/education-advocacy/vault">Evidence Vault</Link>
            </Button>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      {reconstruction ? (
        <Card className="border-border/50 bg-card/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg">Reconstruction</CardTitle>
            <CardDescription>
              Parallel lanes, interruptions, intervention points, and evidence gaps. Not a court
              finding and not a determination that anyone violated the law.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TimelineReconstructionView
              reconstruction={reconstruction}
              hiddenLanes={hiddenLanes}
              onToggleLane={(id) =>
                setHiddenLanes((prev) =>
                  prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
                )
              }
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
