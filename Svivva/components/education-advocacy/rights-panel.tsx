"use client";

import { useState } from "react";
import { Loader2, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LEGAL_INFO_NOT_ADVICE, ROLE_BOUNDARY } from "@/lib/education-advocacy/disclaimers";

type RecordRow = {
  id: string;
  title: string;
  citation: string;
  sourceUrl: string;
  authorityType: string;
  plainLanguageExplanation: string;
  lastVerifiedDate: string;
  confidence: string;
  jurisdiction: { country: string; stateProvince?: string };
};

export function RightsPanel() {
  const [country, setCountry] = useState("US");
  const [stateProvince, setStateProvince] = useState("");
  const [topic, setTopic] = useState("compulsory");
  const [busy, setBusy] = useState(false);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [meta, setMeta] = useState<{ hierarchyNote?: string; uncertainty?: boolean }>({});

  const search = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/education-advocacy/legal/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country,
          stateProvince: stateProvince || undefined,
          topic,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setRecords(data.records || []);
        setMeta({ hierarchyNote: data.hierarchyNote, uncertainty: data.uncertainty });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
          <Scale className="w-7 h-7 text-[#5B8DA8]" /> Student Rights & Law
        </h1>
        <p className="text-sm text-muted-foreground">
          Jurisdiction-aware <strong>legal information</strong> with citations.{" "}
          {LEGAL_INFO_NOT_ADVICE} {ROLE_BOUNDARY}
        </p>
      </div>

      <Card className="border-border/50 bg-card/40 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg">Search verified information</CardTitle>
          <CardDescription>
            Administrators can add jurisdictions through the legal catalog without changing app
            code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input
              className="max-w-[6rem]"
              value={country}
              onChange={(e) => setCountry(e.target.value.toUpperCase())}
              placeholder="Country"
            />
            <Input
              className="max-w-[8rem]"
              value={stateProvince}
              onChange={(e) => setStateProvince(e.target.value.toUpperCase())}
              placeholder="State"
            />
            <Input
              className="max-w-[12rem]"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic"
            />
            <Button onClick={() => void search()} disabled={busy} className="gap-2">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Search
            </Button>
          </div>
          {meta.hierarchyNote ? (
            <p className="text-xs text-muted-foreground">{meta.hierarchyNote}</p>
          ) : null}
          {meta.uncertainty ? (
            <p className="text-sm text-amber-200/90">
              Uncertainty remains — route toward qualified human assistance via Human Assistance.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {records.map((r) => (
          <Card key={r.id} className="border-border/50 bg-card/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-base">{r.title}</CardTitle>
              <CardDescription>
                {r.authorityType} · {r.jurisdiction.country}
                {r.jurisdiction.stateProvince ? ` / ${r.jurisdiction.stateProvince}` : ""} ·
                confidence {r.confidence}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>{r.plainLanguageExplanation}</p>
              <p className="font-mono text-xs text-muted-foreground">{r.citation}</p>
              <a href={r.sourceUrl} target="_blank" rel="noreferrer" className="underline text-xs">
                Source URL
              </a>
              <p className="text-[11px] text-muted-foreground">
                Last verified {r.lastVerifiedDate}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
