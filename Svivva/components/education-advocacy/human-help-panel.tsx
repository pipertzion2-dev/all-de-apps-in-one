"use client";

import { useState } from "react";
import { Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_BOUNDARY } from "@/lib/education-advocacy/disclaimers";

type Resource = {
  resource_id: string;
  name: string;
  type: string;
  contact_channels: Array<{ kind: string; value: string; note?: string }>;
  source: string;
  verified_at: string;
  legal_service_type?: string;
  education_service_type?: string;
};

export function HumanHelpPanel() {
  const [q, setQ] = useState("legal");
  const [jurisdiction, setJurisdiction] = useState("US");
  const [busy, setBusy] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);

  const search = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/education-advocacy/resources/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q, jurisdiction }),
      });
      const data = await res.json();
      if (res.ok) setResources(data.resources || []);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
          <Users className="w-7 h-7 text-[#5B8DA8]" /> Human Assistance
        </h1>
        <p className="text-sm text-muted-foreground">
          Route toward counselors, advocates, legal aid, and trusted adults via the Resource
          Registry and referral adapters. {ROLE_BOUNDARY}
        </p>
      </div>

      <Card className="border-border/50 bg-card/40 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg">Find people and organizations</CardTitle>
          <CardDescription>
            Partners plug in through HumanResourceProvider without changing the orchestration
            engine.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input
              className="max-w-[8rem]"
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value.toUpperCase())}
            />
            <Input
              className="max-w-[14rem]"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search"
            />
            <Button onClick={() => void search()} disabled={busy} className="gap-2">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Search registry
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {["counselor", "legal aid", "advocate", "homeless", "ocr"].map((chip) => (
              <button
                key={chip}
                type="button"
                className="px-2 py-1 rounded border border-border/50 hover:bg-muted/40"
                onClick={() => setQ(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {resources.map((r) => (
          <Card key={r.resource_id} className="border-border/50 bg-card/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-base">{r.name}</CardTitle>
              <CardDescription>
                {r.type}
                {r.legal_service_type ? ` · ${r.legal_service_type}` : ""}
                {r.education_service_type ? ` · ${r.education_service_type}` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              {r.contact_channels.map((c) => (
                <p key={`${c.kind}-${c.value}`} className="text-muted-foreground">
                  {c.kind}:{" "}
                  {c.kind === "url" ? (
                    <a href={c.value} className="underline" target="_blank" rel="noreferrer">
                      {c.value}
                    </a>
                  ) : (
                    c.value
                  )}
                </p>
              ))}
              <p className="text-[11px] text-muted-foreground">
                Source {r.source} · verified {r.verified_at}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
