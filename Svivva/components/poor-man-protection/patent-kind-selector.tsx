"use client";

import { Cpu, PenTool, Layers } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type PatentCategory = "physical" | "digital" | "group";

type Props = {
  value: PatentCategory;
  onChange: (value: PatentCategory) => void;
};

const OPTIONS: Array<{
  id: PatentCategory;
  title: string;
  description: string;
  icon: typeof PenTool;
  badge: string;
}> = [
  {
    id: "physical",
    title: "Physical invention",
    description:
      "Sketches, product designs, hardware drawings, artwork — hash the image and extract a spectral palette.",
    icon: PenTool,
    badge: "Image deposit",
  },
  {
    id: "digital",
    title: "Digital invention",
    description:
      "Software, algorithms, SaaS flows, APIs — hash disclosure text plus optional source files. Logic × interface axes.",
    icon: Cpu,
    badge: "Code + disclosure",
  },
  {
    id: "group",
    title: "Group patent (physical)",
    description:
      "Drop many figure sheets — ZZAI clusters families, numbers figures, and builds a merkle group disclosure.",
    icon: Layers,
    badge: "Multi-figure",
  },
];

export function PatentKindSelector({ value, onChange }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`rounded-xl border p-4 text-left transition ${
              active
                ? "border-[#5B8DA8] bg-[#5B8DA8]/15 ring-1 ring-[#5B8DA8]/40"
                : "border-border/60 bg-card/50 hover:border-[#5B8DA8]/30"
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <Icon className="w-5 h-5 text-[#5B8DA8] shrink-0" />
              <Badge variant={active ? "default" : "secondary"} className="text-[10px]">
                {opt.badge}
              </Badge>
            </div>
            <p className="font-semibold text-sm">{opt.title}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{opt.description}</p>
          </button>
        );
      })}
    </div>
  );
}

export function PatentKindIntro({ category }: { category: PatentCategory }) {
  const copy =
    category === "digital"
      ? "Digital poor man's patent: timestamp your invention disclosure, attach hashed artifacts, and seal a court-oriented evidence pack — not USPTO registration."
      : category === "group"
        ? "Physical group patent: organize multiple figure sheets into one numbered disclosure with a merkle root."
        : "Physical poor man's patent: seal sketches and designs with dual-axis form × spectral fingerprinting.";

  return (
    <Card className="border-[#5B8DA8]/20 bg-[#5B8DA8]/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">What you are sealing</CardTitle>
        <CardDescription>{copy}</CardDescription>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground pb-4">
        Evidentiary support only — consult IP counsel before filing or public launch.
      </CardContent>
    </Card>
  );
}
