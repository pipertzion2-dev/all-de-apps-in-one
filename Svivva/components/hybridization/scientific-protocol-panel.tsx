"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { ScientificCatalog } from "@/lib/hybridization/scientific-catalog";

export function ScientificProtocolPanel() {
  const { data, isLoading, isError } = useQuery<ScientificCatalog>({
    queryKey: ["/api/hybridization/scientific"],
    queryFn: () => fetch("/api/hybridization/scientific").then((r) => r.json()),
    staleTime: 60 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading scientific protocol…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-destructive py-4">Could not load the scientific protocol.</p>
    );
  }

  return (
    <div className="space-y-4" data-testid="panel-scientific-protocol">
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">Protocol v{data.protocolVersion}</Badge>
        <Badge variant="secondary">{data.domainBridges.length} domain bridges</Badge>
        <Badge variant="secondary">{data.biomimeticLibrary.length} biomimetic motifs</Badge>
        <Badge variant="secondary">{data.referenceDesigns.length} reference designs</Badge>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-semibold">Domain bridges</h2>
          <p className="text-sm text-muted-foreground">
            Transport-law isomorphisms the engine may cite — not limited to saved blends.
          </p>
          <div className="space-y-3">
            {data.domainBridges.map((b) => (
              <div key={b.id} className="rounded-xl border border-border/60 p-4 space-y-2">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="font-mono text-xs text-[#5B8DA8]">{b.id}</span>
                  {b.domains.map((d) => (
                    <Badge key={d} variant="outline" className="text-[10px] capitalize">
                      {d}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.principle}</p>
                <p className="text-xs text-muted-foreground/80">
                  Invariants: {b.invariants.join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-semibold">Biomimetic library</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {data.biomimeticLibrary.map((b) => (
              <div key={b.name} className="rounded-lg border border-border/50 p-3">
                <p className="text-sm font-medium">{b.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{b.principle}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-semibold">Hybridization modes</h2>
          <div className="space-y-2">
            {data.hybridizationModes.map((mode) => (
              <div key={mode} className="rounded-lg border border-border/50 p-3">
                <p className="text-sm font-medium capitalize">{mode}</p>
                <p className="text-xs text-muted-foreground mt-1">{data.modeGuidance[mode]}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-semibold">Required analysis pipeline</h2>
          <ol className="space-y-2 list-decimal pl-4">
            {data.analysisSteps.map((s) => (
              <li key={s.id} className="text-sm">
                <span className="font-medium">{s.title}</span>
                <span className="text-muted-foreground"> — {s.description}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-semibold">Reference designs</h2>
          <div className="space-y-2">
            {data.referenceDesigns.map((r) => (
              <div key={r.id} className="rounded-lg border border-border/50 p-3">
                <p className="text-sm font-medium">{r.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{r.principle}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <h2 className="font-semibold">Engineering vocabulary</h2>
          <div className="flex flex-wrap gap-1.5">
            {data.engineeringDomains.map((d) => (
              <Badge key={d} variant="secondary" className="text-[10px] capitalize">
                {d}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 pt-2">
            {data.topologies.map((t) => (
              <Badge key={t} variant="outline" className="text-[10px] capitalize">
                {t}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground pt-2">
            Graph invariants: {data.graphInvariants.join(" · ")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
