"use client";

import Link from "next/link";
import { Cpu, Layers, PenTool, ShieldCheck } from "lucide-react";
import { MiniAppShell } from "@/components/tools/mini-app-shell";
import { getFeatureMiniApp } from "@/lib/tools/feature-mini-apps";

const APP = getFeatureMiniApp("poor-mans-patent")!;

const OPTIONS = [
  {
    id: "physical",
    title: "Physical invention",
    description:
      "Sketches, product designs, hardware drawings — hash images, extract a spectral palette, and seal dual-axis evidence.",
    icon: PenTool,
    href: "/dashboard/poor-man-protection?mode=physical",
    badge: "Image deposit",
  },
  {
    id: "digital",
    title: "Digital invention",
    description:
      "Software, algorithms, SaaS flows, APIs — structured disclosure plus optional hashed source artifacts.",
    icon: Cpu,
    href: "/dashboard/poor-man-protection?mode=digital",
    badge: "Code + disclosure",
  },
  {
    id: "group",
    title: "Group patent (physical)",
    description:
      "Many figure sheets in one merkle-backed group disclosure — ideal for multi-view product or mechanical drawings.",
    icon: Layers,
    href: "/dashboard/poor-man-protection?mode=group",
    badge: "Multi-figure",
  },
] as const;

export default function PoorMansPatentPage() {
  return (
    <MiniAppShell app={APP} nextLabel="Poor Man Protection">
      <div className="rounded-2xl border border-[#5B8DA8]/25 bg-[#5B8DA8]/5 p-4 flex gap-3">
        <ShieldCheck className="w-6 h-6 text-[#5B8DA8] shrink-0" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          Choose what you are sealing. ZZAI timestamps your deposit, hybridizes two scientific axes,
          mints protection-coin metadata, and packages court-oriented PDF + email delivery. This is
          evidentiary support — not USPTO or Copyright Office registration.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <Link
              key={opt.id}
              href={opt.href}
              className="rounded-2xl border border-border bg-card p-5 hover:border-[#5B8DA8]/40 transition group"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <Icon className="w-6 h-6 text-[#5B8DA8]" />
                <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
                  {opt.badge}
                </span>
              </div>
              <p className="font-semibold group-hover:text-[#5B8DA8] transition-colors">
                {opt.title}
              </p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{opt.description}</p>
            </Link>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Need only a quick hash? Try{" "}
        <Link href="/tools/sketch-hash-stamp" className="text-[#5B8DA8] hover:underline">
          Sketch Hash Stamp
        </Link>{" "}
        first, then upgrade to the full seal ceremony.
      </p>
    </MiniAppShell>
  );
}
