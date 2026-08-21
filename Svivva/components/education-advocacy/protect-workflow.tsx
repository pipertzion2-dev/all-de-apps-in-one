"use client";

import { useState } from "react";
import { Loader2, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RECORDING_LAW_WARNING, ROLE_BOUNDARY } from "@/lib/education-advocacy/disclaimers";

export function ProtectWorkflowPanel() {
  const [form, setForm] = useState({
    whatHappened: "",
    dateTime: "",
    school: "",
    peopleOrOrganizations: "",
    whatUserWanted: "",
    whatOtherRequestedOrDecided: "",
    whatSchoolCommunicated: "",
    witnesses: "",
    desiredResolution: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [caseFile, setCaseFile] = useState<{
    caseId: string;
    chronology: Array<{ at: string; entry: string; source: string }>;
    warnings: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/education-advocacy/case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          peopleOrOrganizations: form.peopleOrOrganizations
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          witnesses: form.witnesses
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          documents: [],
          audioExplicitlyPermitted: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setCaseFile(data.caseFile);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const field = (key: keyof typeof form, label: string, area = false) => (
    <div className="space-y-1.5">
      <label className="text-xs text-muted-foreground">{label}</label>
      {area ? (
        <Textarea
          rows={3}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        />
      ) : (
        <Input
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        />
      )}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
          <ScrollText className="w-7 h-7 text-[#5B8DA8]" /> Protect My Education
        </h1>
        <p className="text-sm text-muted-foreground">
          Build a chronological Education Advocacy Case File. {RECORDING_LAW_WARNING}
        </p>
        <p className="text-xs text-muted-foreground">{ROLE_BOUNDARY}</p>
      </div>

      <Card className="border-border/50 bg-card/40 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg">Document the interruption or dispute</CardTitle>
          <CardDescription>
            Capture what you know. You can seal evidence later in the EPV.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {field("whatHappened", "What happened", true)}
          {field("dateTime", "Date / time (ISO or plain)")}
          {field("school", "School (optional — only if you choose to record it)")}
          {field("peopleOrOrganizations", "People or organizations involved (comma-separated)")}
          {field("whatUserWanted", "What you wanted", true)}
          {field("whatOtherRequestedOrDecided", "What another person requested or decided", true)}
          {field("whatSchoolCommunicated", "What the school communicated", true)}
          {field("witnesses", "Witnesses (comma-separated)")}
          {field("desiredResolution", "Desired resolution", true)}
          {field("notes", "Notes", true)}
          <Button
            onClick={() => void submit()}
            disabled={busy || !form.whatHappened.trim()}
            className="gap-2"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Create case file
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      {caseFile ? (
        <Card className="border-border/50 bg-card/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg">Case file {caseFile.caseId}</CardTitle>
            <CardDescription>Chronological Education Advocacy Case File</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="space-y-3">
              {caseFile.chronology.map((c, i) => (
                <li key={`${c.at}-${i}`} className="text-sm border-l-2 border-[#5B8DA8]/40 pl-3">
                  <p className="text-xs text-muted-foreground font-mono">
                    {c.at} · {c.source}
                  </p>
                  <p>{c.entry}</p>
                </li>
              ))}
            </ol>
            {caseFile.warnings.map((w) => (
              <p key={w} className="text-xs text-amber-200/90">
                {w}
              </p>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
