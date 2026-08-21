"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_BOUNDARY, LEGAL_INFO_NOT_ADVICE } from "@/lib/education-advocacy/disclaimers";
import type { CoercionReviewBrief } from "@/lib/education-advocacy/advocacy/coercion-review";
import { CoercionReviewBriefView } from "@/components/education-advocacy/coercion-review-brief";
import {
  ADMIN_EDUCATION_ADVOCACY_SEED,
  AUDIENCE_MODE_COPY,
  type AdvocacyAudienceMode,
} from "@/lib/education-advocacy/admin-seed-case";
import {
  AudienceModePicker,
  AdminSeedButton,
  ExploreToolsStrip,
} from "@/components/education-advocacy/audience-mode-picker";

export default function CoercionReviewPage() {
  const [mode, setMode] = useState<AdvocacyAudienceMode>("my_situation");
  const [narrative, setNarrative] = useState("");
  const [country, setCountry] = useState("US");
  const [stateProvince, setStateProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [gradeContext, setGradeContext] = useState("");
  const [yearHint, setYearHint] = useState("");
  const [busy, setBusy] = useState(false);
  const [brief, setBrief] = useState<CoercionReviewBrief | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  const loadAdminSeed = () => {
    setNarrative(ADMIN_EDUCATION_ADVOCACY_SEED.coercionNarrative);
    setCountry(ADMIN_EDUCATION_ADVOCACY_SEED.coercionMeta.country);
    setStateProvince(ADMIN_EDUCATION_ADVOCACY_SEED.coercionMeta.stateProvince);
    setDistrict(ADMIN_EDUCATION_ADVOCACY_SEED.coercionMeta.district);
    setGradeContext(ADMIN_EDUCATION_ADVOCACY_SEED.coercionMeta.gradeContext);
    setYearHint(ADMIN_EDUCATION_ADVOCACY_SEED.coercionMeta.yearHint);
    setMode("my_situation");
    setAdminSeedLoaded(true);
    setBrief(null);
  };

  const clearForm = () => {
    setNarrative("");
    setCountry("US");
    setStateProvince("");
    setDistrict("");
    setGradeContext("");
    setYearHint("");
    setAdminSeedLoaded(false);
    setBrief(null);
  };

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const helpingPrefix =
        mode === "helping_someone"
          ? "[Helping someone else — information as reported to the helper.]\n\n"
          : "";
      const res = await fetch("/api/education-advocacy/coercion-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          narrative: `${helpingPrefix}${narrative}`.trim(),
          country: country || "US",
          stateProvince: stateProvince || "NY",
          district: district || undefined,
          gradeContext: gradeContext || "student",
          yearHint: yearHint || undefined,
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

  const copy = AUDIENCE_MODE_COPY[mode];

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
          Investigate whether education access may have been disrupted — for a new situation of your
          own, or while supporting someone else. {ROLE_BOUNDARY} {LEGAL_INFO_NOT_ADVICE}
        </p>
      </div>

      <AudienceModePicker value={mode} onChange={setMode} />

      {mode === "explore_tools" ? <ExploreToolsStrip /> : null}

      <Card className="border-border/50 bg-card/40 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg">{copy.title}</CardTitle>
          <CardDescription>{copy.blurb} Start blank. Add only what you know.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {mode !== "explore_tools" ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Country</label>
                  <Input value={country} onChange={(e) => setCountry(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">State / province</label>
                  <Input
                    value={stateProvince}
                    onChange={(e) => setStateProvince(e.target.value)}
                    placeholder="e.g. NY, CA, TX"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">District (optional)</label>
                  <Input
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. local district name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Grade / level</label>
                  <Input
                    value={gradeContext}
                    onChange={(e) => setGradeContext(e.target.value)}
                    placeholder="e.g. 10th grade, senior, college"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs text-muted-foreground">When (approximate)</label>
                  <Input
                    value={yearHint}
                    onChange={(e) => setYearHint(e.target.value)}
                    placeholder="e.g. fall 2022, sophomore year, last spring"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Situation narrative</label>
                <Textarea
                  rows={10}
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  placeholder={copy.promptHint}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void run()} disabled={busy || narrative.trim().length < 20}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Generate review brief
                </Button>
                <Button type="button" variant="outline" onClick={clearForm}>
                  Clear form
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/dashboard/education-advocacy/timeline">Timeline Reconstruction</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/dashboard/education-advocacy/chat">AI Advocacy Guide</Link>
                </Button>
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Explore tools first, then return here when you have a situation to review.
            </p>
          )}

          <AdminSeedButton isAdmin={isAdmin} onLoad={loadAdminSeed} loaded={adminSeedLoaded} />
        </CardContent>
      </Card>

      {brief ? (
        <Card className="border-border/50 bg-card/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg">Investigation brief</CardTitle>
            <CardDescription>
              Timeline layers, intervention points, issue analysis, and action plan. Not a court
              finding.
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
