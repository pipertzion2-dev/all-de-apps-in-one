"use client";

import { useState } from "react";
import { HeartPulse, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_BOUNDARY } from "@/lib/education-advocacy/disclaimers";

type Resource = {
  resource_id: string;
  name: string;
  contact_channels: Array<{ kind: string; value: string; note?: string }>;
  source: string;
  verified_at: string;
};

export function CrisisPanel() {
  const [text, setText] = useState("");
  const [jurisdiction, setJurisdiction] = useState("US");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    category: string;
    orientation: string[];
    resources: Resource[];
  } | null>(null);

  const run = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/education-advocacy/crisis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text || "I need help now", jurisdiction }),
      });
      const data = await res.json();
      if (res.ok) setResult(data);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2 text-rose-100">
          <HeartPulse className="w-7 h-7" /> I Need Help Now
        </h1>
        <p className="text-sm text-muted-foreground">
          Supportive orientation toward verified directory resources only. We do not invent phone
          numbers. {ROLE_BOUNDARY}
        </p>
      </div>

      <Card className="border-rose-500/30 bg-card/40 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg">Tell us what kind of help you need</CardTitle>
          <CardDescription>
            If you are in immediate physical danger, contact local emergency services for your
            location.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value.toUpperCase())}
            placeholder="Jurisdiction (e.g. US)"
            className="max-w-[10rem]"
          />
          <Textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Optional: briefly describe what is going on"
          />
          <Button onClick={() => void run()} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Find verified help options
          </Button>
        </CardContent>
      </Card>

      {result ? (
        <Card className="border-border/50 bg-card/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-lg">Routing: {result.category.replace(/_/g, " ")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="text-sm space-y-2 list-disc pl-5 text-muted-foreground">
              {result.orientation.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
            <div className="space-y-3">
              {result.resources.map((r) => (
                <div
                  key={r.resource_id}
                  className="rounded-md border border-border/50 p-3 text-sm space-y-1"
                >
                  <p className="font-medium">{r.name}</p>
                  {r.contact_channels.map((c) => (
                    <p key={`${c.kind}-${c.value}`} className="text-muted-foreground">
                      {c.kind}:{" "}
                      {c.kind === "url" ? (
                        <a href={c.value} className="underline" target="_blank" rel="noreferrer">
                          {c.value}
                        </a>
                      ) : (
                        <span className="text-foreground">{c.value}</span>
                      )}
                      {c.note ? ` — ${c.note}` : ""}
                    </p>
                  ))}
                  <p className="text-[11px] text-muted-foreground">
                    Source: {r.source} · verified {r.verified_at}
                  </p>
                </div>
              ))}
              {!result.resources.length ? (
                <p className="text-sm text-muted-foreground">
                  No verified directory match for this category yet. We will not invent a contact.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
