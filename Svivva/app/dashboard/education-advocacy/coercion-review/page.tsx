"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_BOUNDARY, LEGAL_INFO_NOT_ADVICE } from "@/lib/education-advocacy/disclaimers";
import type { CoercionReviewBrief } from "@/lib/education-advocacy/advocacy/coercion-review";
import { CoercionReviewBriefView } from "@/components/education-advocacy/coercion-review-brief";

const DEFAULT_NARRATIVE = `I was a high-school senior in New York State. Around October of my senior year, I was close to completing high school and was also working two jobs. Because of my living situation and actions by my parent, I lost access to both jobs and ultimately stopped attending my regular school. My parent used my iPhone/location information to track where I was, came to my location, put me in a car, and interfered with my ability to continue going to work and school. I then did not attend school at all for approximately 2–3 weeks. Afterward, I was told that I should enter a YABC program and that participation would not appear on or affect my permanent educational record. I relied on that information. I later discovered information about the program on my educational record. Had I known that beforehand, I would not have agreed to leave my existing high-school path for YABC.`;

export default function CoercionReviewPage() {
  const [narrative, setNarrative] = useState(DEFAULT_NARRATIVE);
  const [busy, setBusy] = useState(false);
  const [brief, setBrief] = useState<CoercionReviewBrief | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/education-advocacy/coercion-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          narrative,
          country: "US",
          stateProvince: "NY",
          district: "NYC DOE",
          gradeContext: "high-school senior",
          yearHint: "senior year (October window)",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Review failed");
      setBrief(data.brief as CoercionReviewBrief);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 py-8 pb-16 max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Advocate Bus · Education Access & Coercion Review
        </p>
        <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
          <Scale className="w-7 h-7 text-[#5B8DA8]" />
          Student Education Access & Coercion Review
        </h1>
        <p className="text-sm text-muted-foreground">
          {ROLE_BOUNDARY} {LEGAL_INFO_NOT_ADVICE}
        </p>
      </div>

      <Card className="border-border/50 bg-card/40 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg">Your situation</CardTitle>
          <CardDescription>
            Edit the narrative if needed, then generate a cited investigation brief for New York.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea rows={12} value={narrative} onChange={(e) => setNarrative(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void run()} disabled={busy || narrative.trim().length < 20}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Generate review brief
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/education-advocacy/protect">Open Protect My Education</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/dashboard/education-advocacy/vault">Evidence Vault</Link>
            </Button>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      {brief ? (
        <Card className="border-border/50 bg-card/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg">Investigation brief</CardTitle>
            <CardDescription>
              Timeline layers, intervention points, issue-by-issue analysis, and action plan. Not a
              court finding.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CoercionReviewBriefView brief={brief} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
