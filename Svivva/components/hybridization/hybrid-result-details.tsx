"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Info, Leaf } from "lucide-react";
import type { HybridDesign, HybridizationResult } from "@/lib/hybridization/types";

function HybridDesignCard({ hybrid, index }: { hybrid: HybridDesign; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="font-semibold text-sm">{hybrid.name}</h4>
        <Badge variant="outline" className="text-[10px]">
          Novelty {hybrid.noveltyScore}
        </Badge>
        {hybrid.trlLevel != null && (
          <Badge variant="secondary" className="text-[10px]">
            TRL {hybrid.trlLevel}
          </Badge>
        )}
      </div>

      {hybrid.emergentProperties.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {hybrid.emergentProperties.map((ep) => (
            <span
              key={ep}
              className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-indigo-500/15 text-indigo-300"
            >
              {ep}
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? "Hide" : "Show"} full scientific basis
      </button>

      {expanded && (
        <div className="space-y-3 pt-1 border-t border-border/30 text-xs text-muted-foreground">
          {hybrid.scientificBasis && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1">
                Scientific basis
              </p>
              <p className="leading-relaxed">{hybrid.scientificBasis}</p>
            </div>
          )}
          {hybrid.topologyDescription && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1">Topology</p>
              <p>{hybrid.topologyDescription}</p>
            </div>
          )}
          {hybrid.coreComponents.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {hybrid.coreComponents.map((c) => (
                <Badge key={c} variant="secondary" className="text-[10px]">
                  {c}
                </Badge>
              ))}
            </div>
          )}
          {Object.keys(hybrid.performanceGains).length > 0 && (
            <div className="rounded-lg border border-border/30 overflow-hidden">
              {Object.entries(hybrid.performanceGains).map(([metric, value], i) => (
                <div
                  key={metric}
                  className={`flex gap-2 px-2 py-1.5 ${i % 2 === 0 ? "bg-muted/20" : ""}`}
                >
                  <span className="font-medium text-foreground min-w-[90px] capitalize">
                    {metric.replace(/_/g, " ")}
                  </span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          )}
          {hybrid.biomimeticAnalogue && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-green-500/5 border border-green-500/20">
              <Leaf className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
              <p>{hybrid.biomimeticAnalogue}</p>
            </div>
          )}
          {hybrid.manufacturingPathway && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1">
                Manufacturing pathway
              </p>
              <p>{hybrid.manufacturingPathway}</p>
            </div>
          )}
          {hybrid.challenges.length > 0 && (
            <ul className="space-y-0.5 list-none">
              {hybrid.challenges.map((c) => (
                <li key={c} className="flex gap-1.5">
                  <span className="text-amber-500">▸</span>
                  {c}
                </li>
              ))}
            </ul>
          )}
          {hybrid.patentLandscape && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <p>{hybrid.patentLandscape}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type Props = {
  result: HybridizationResult;
  usedEngine?: boolean;
};

export function HybridResultDetails({ result, usedEngine }: Props) {
  return (
    <div className="space-y-4" data-testid="hybrid-scientific-details">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[#5B8DA8]/30 bg-[#5B8DA8]/5 p-4 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#5B8DA8]">
            Topological bridge
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {result.topologicalBridge}
          </p>
        </div>
        <div className="rounded-xl border border-[#6B2C4E]/30 bg-[#6B2C4E]/5 p-4 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B2C4E]">
            Domain bridging principle
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {result.domainBridgingPrinciple}
          </p>
        </div>
      </div>

      {result.materialCompatibilityNote && (
        <div className="rounded-xl border border-border/60 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-1">
            Interface compatibility
          </p>
          <p className="text-sm text-muted-foreground">{result.materialCompatibilityNote}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
        <Badge variant="outline">Protocol v{result.scientificProtocolVersion}</Badge>
        {usedEngine != null && (
          <Badge variant="outline">{usedEngine ? "LLM engine" : "scientific fallback"}</Badge>
        )}
        <Badge variant="outline">Surface: {result.surface}</Badge>
      </div>

      {result.hybrids.map((hybrid, i) => (
        <HybridDesignCard key={`${hybrid.name}-${i}`} hybrid={hybrid} index={i} />
      ))}

      {result.requiredCharacterizationTests.length > 0 && (
        <div className="rounded-xl border border-border/60 p-4 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider">
            Falsifiable characterization tests
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
            {result.requiredCharacterizationTests.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      {(result.referenceDesigns.length > 0 || result.nextSteps.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {result.referenceDesigns.length > 0 && (
            <div className="rounded-xl border border-border/60 p-4 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider">
                Reference designs
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {result.referenceDesigns.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          {result.nextSteps.length > 0 && (
            <div className="rounded-xl border border-border/60 p-4 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider">Next steps</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                {result.nextSteps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
