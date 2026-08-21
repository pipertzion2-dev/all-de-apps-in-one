"use client";

import { useEffect, useState } from "react";
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
import {
  ADMIN_EDUCATION_ADVOCACY_SEED,
  EMPTY_TIMELINE_INTAKE,
  AUDIENCE_MODE_COPY,
  type AdvocacyAudienceMode,
} from "@/lib/education-advocacy/admin-seed-case";
import { TimelineReconstructionView } from "@/components/education-advocacy/timeline-reconstruction-view";
import {
  AudienceModePicker,
  AdminSeedButton,
  ExploreToolsStrip,
} from "@/components/education-advocacy/audience-mode-picker";

export default function TimelineReconstructionPage() {
  const [mode, setMode] = useState<AdvocacyAudienceMode>("my_situation");
  const [intake, setIntake] = useState<IntakeProfile>({ ...EMPTY_TIMELINE_INTAKE });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconstruction, setReconstruction] = useState<TimelineReconstruction | null>(null);
  const [hiddenLanes, setHiddenLanes] = useState<TimelineLaneId[]>([]);
  const [docName, setDocName] = useState("");
  const [docNote, setDocNote] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminSeedLoaded, setAdminSeedLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (alive) setIsAdmin(!!d?.isAdmin);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const setField = (key: keyof IntakeProfile, value: string) =>
    setIntake((prev) => ({ ...prev, [key]: value }));

  const loadAdminSeed = () => {
    setIntake({ ...ADMIN_EDUCATION_ADVOCACY_SEED.timelineIntake });
    setMode("my_situation");
    setAdminSeedLoaded(true);
    setReconstruction(null);
  };

  const clearForm = () => {
    setIntake({ ...EMPTY_TIMELINE_INTAKE });
    setAdminSeedLoaded(false);
    setDocName("");
    setDocNote("");
    setReconstruction(null);
  };

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
      const helpingNote =
        mode === "helping_someone"
          ? "\n\n[Mode: helping someone else — distinguish first-hand knowledge from what you were told.]"
          : "";
      const res = await fetch("/api/education-advocacy/timeline-reconstruction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intake: {
            ...intake,
            freeformRecollection: `${intake.freeformRecollection || ""}${helpingNote}`.trim(),
          },
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
          placeholder="Optional — approximate answers or “I don’t remember” are fine"
        />
      ) : (
        <Input
          value={intake[key] || ""}
          onChange={(e) => setField(key, e.target.value)}
          placeholder="Optional"
        />
      )}
    </div>
  );

  const copy = AUDIENCE_MODE_COPY[mode];

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
          Build a clear chronology from a new situation — yours or someone you’re supporting. Exact
          dates are not required. {ROLE_BOUNDARY} {LEGAL_INFO_NOT_ADVICE}
        </p>
      </div>

      <AudienceModePicker value={mode} onChange={setMode} />

      {mode === "explore_tools" ? <ExploreToolsStrip /> : null}

      <Card className="border-border/50 bg-card/40 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg">{copy.title}</CardTitle>
          <CardDescription>{copy.blurb}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {mode !== "explore_tools" ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {field("stateProvince", "State / province")}
                {field("district", "School district / borough")}
                {field("schoolName", "School name (if known)")}
                {field("approximateSchoolYear", "Approximate school year")}
                {field("grade", "Grade")}
                {field("studentAgeAtTime", "Age at the time (if known)")}
                {field("expectedGraduationDate", "Expected graduation date")}
                {field("lastNormalAttendance", "Last period of normal attendance")}
              </div>
              {field("housingLivingSituation", "Housing / living situation", true, 3)}
              {field("employmentSituation", "Employment (if relevant)", true, 2)}
              {field("majorFamilyHouseholdChanges", "Major family or household changes", true, 3)}
              {field("periodsUnableToAttend", "Periods when school could not be attended", true, 2)}
              {field(
                "transfersOrAlternativePrograms",
                "Transfers or alternative programs",
                true,
                3,
              )}
              {field("graduationOrOutcome", "Graduation or educational outcome", true, 2)}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">What you remember</label>
                <Textarea
                  rows={8}
                  value={intake.freeformRecollection || ""}
                  onChange={(e) => setField("freeformRecollection", e.target.value)}
                  placeholder={copy.promptHint}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-border/40">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    Document note (optional — originals never altered)
                  </label>
                  <Input
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder="e.g. Attendance printout"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Interpretation note</label>
                  <Input
                    value={docNote}
                    onChange={(e) => setDocNote(e.target.value)}
                    placeholder="Dates or facts you see on it"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button onClick={() => void run()} disabled={busy}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Reconstruct timeline
                </Button>
                <Button type="button" variant="outline" onClick={clearForm}>
                  Clear form
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/dashboard/education-advocacy/chat">Ask AI guide</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/dashboard/education-advocacy/vault">Evidence Vault</Link>
                </Button>
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Pick a tool above, or switch to “This is my situation” / “I’m helping someone” when
              you’re ready to reconstruct a timeline.
            </p>
          )}

          <AdminSeedButton isAdmin={isAdmin} onLoad={loadAdminSeed} loaded={adminSeedLoaded} />
        </CardContent>
      </Card>

      {reconstruction ? (
        <Card className="border-border/50 bg-card/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg">Reconstruction</CardTitle>
            <CardDescription>
              Parallel lanes, interruptions, intervention points, and evidence gaps. Not a court
              finding.
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
