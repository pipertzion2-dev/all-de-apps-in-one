"use client";

import { useState } from "react";
import { Loader2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_BOUNDARY } from "@/lib/education-advocacy/disclaimers";

type Structured = {
  whatIUnderstand: string[];
  whatMayMatterLegally: string[];
  informationStillMissing: string[];
  possibleNextSteps: string[];
  whoMayBeAbleToHelp: string[];
  sources: Array<{ title: string; citation?: string; url?: string }>;
  protectOrDocument: string[];
  disclaimers: string[];
};

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold tracking-wide">{title}</h3>
      <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
        {items.map((item) => (
          <li key={item.slice(0, 80)}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function AdvocacyChatPanel() {
  const [message, setMessage] = useState("My parent is forcing me to leave school.");
  const [stateProvince, setStateProvince] = useState("CA");
  const [busy, setBusy] = useState(false);
  const [structured, setStructured] = useState<Structured | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/education-advocacy/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          context: {
            identity: {
              pseudonymousUserId: "anon_ui",
              ageRange: "unknown",
              jurisdiction: { country: "US", stateProvince },
            },
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat failed");
      setStructured(data.structured);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
          <Bot className="w-7 h-7 text-[#5B8DA8]" /> AI Advocacy Guide
        </h1>
        <p className="text-sm text-muted-foreground">{ROLE_BOUNDARY}</p>
      </div>

      <Card className="border-border/50 bg-card/40 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg">Describe what is happening</CardTitle>
          <CardDescription>
            The guide asks only for context that may matter — it does not interrogate unnecessarily.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 items-center">
            <label className="text-xs text-muted-foreground w-28">State / province</label>
            <Input
              value={stateProvince}
              onChange={(e) => setStateProvince(e.target.value.toUpperCase())}
              className="max-w-[8rem]"
              maxLength={8}
            />
          </div>
          <Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />
          <Button onClick={() => void send()} disabled={busy || !message.trim()} className="gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Structure this situation
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      {structured ? (
        <Card className="border-border/50 bg-card/40 backdrop-blur-md">
          <CardContent className="pt-6 space-y-5">
            <Section title="What I understand" items={structured.whatIUnderstand} />
            <Section title="What may matter legally" items={structured.whatMayMatterLegally} />
            <Section
              title="What information is still missing"
              items={structured.informationStillMissing}
            />
            <Section title="Possible next steps" items={structured.possibleNextSteps} />
            <Section title="Who may be able to help" items={structured.whoMayBeAbleToHelp} />
            <Section title="Protect or document this event" items={structured.protectOrDocument} />
            {structured.sources?.length ? (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Sources</h3>
                <ul className="text-sm space-y-2">
                  {structured.sources.map((s) => (
                    <li key={`${s.title}-${s.citation}`} className="text-muted-foreground">
                      <span className="text-foreground">{s.title}</span>
                      {s.citation ? ` — ${s.citation}` : ""}
                      {s.url ? (
                        <>
                          {" · "}
                          <a href={s.url} className="underline" target="_blank" rel="noreferrer">
                            source
                          </a>
                        </>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground border-t border-border/40 pt-3">
              {structured.disclaimers?.join(" ")}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
