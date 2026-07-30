"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  Box,
  Calculator,
  Factory,
  FileText,
  FlaskConical,
  ArrowRight,
  Sparkles,
  Truck,
  Shield,
} from "lucide-react";

const STEPS = [
  {
    n: "1",
    title: "Find the opportunity",
    desc: "Idea Engine surfaces physical product opportunities from market signals.",
    href: "/dashboard/idea-engine",
    icon: Lightbulb,
    cta: "Open Idea Engine",
  },
  {
    n: "2",
    title: "Hypothesize & validate",
    desc: "Hypothesis Lab blends digital signals with hardware categories (including hybrid products).",
    href: "/dashboard/hypothesis-hardware",
    icon: FlaskConical,
    cta: "Open Hypothesis Lab",
  },
  {
    n: "3",
    title: "Design the product",
    desc: "Hardware Builder walks concept → sketch → materials → requirements.",
    href: "/dashboard/hardware-builder",
    icon: Box,
    cta: "Open Hardware Builder",
  },
  {
    n: "4",
    title: "Hybridize scientifically",
    desc: "Automatic calculator scores domain affinity, topology, TRL, and manufacturing readiness — then AI can synthesize designs.",
    href: "/dashboard/hybridization",
    icon: Calculator,
    cta: "Open Hybridization Calculator",
    highlight: true,
  },
  {
    n: "5",
    title: "Source manufacturers",
    desc: "AI suggests real manufacturers, material suppliers, and platforms with MOQ and lead times.",
    href: "/dashboard/hardware-builder",
    icon: Truck,
    cta: "Source in Builder",
  },
  {
    n: "6",
    title: "Blueprint & ship",
    desc: "Generate a manufacturing blueprint PDF and keep iterating with Security + Launch Studio when ready.",
    href: "/dashboard/hardware-builder",
    icon: FileText,
    cta: "Generate blueprint",
  },
];

export default function ManufactureStudioPage() {
  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8">
      <div className="space-y-3">
        <Badge className="bg-[#FF2BD6]/15 text-[#FF2BD6] border-[#FF2BD6]/30" variant="outline">
          Crest · Manufacture
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight flex items-center gap-3">
          <Factory className="w-8 h-8 text-[#FF2BD6]" />
          Manufacture Studio
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl">
          One friendly path from idea to factory — every AI manufacturing feature in Svivva, in
          order. No hunting through menus.
        </p>
      </div>

      <Card className="border-[#00E5FF]/25 bg-gradient-to-br from-[#00E5FF]/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#00E5FF]" /> New: Hybridization Calculator
          </CardTitle>
          <CardDescription>
            Cross two systems like a scientific instrument — instant scores without waiting on an
            LLM, plus optional AI design synthesis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard/hybridization">
            <Button className="gap-2 bg-[#00E5FF] text-black hover:bg-[#00C4DB]">
              Try hybridization <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <Card
              key={step.n}
              className={step.highlight ? "border-[#FF2BD6]/35 shadow-[0_0_24px_rgba(255,43,214,0.08)]" : ""}
            >
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 font-bold">
                    {step.n}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <h2 className="font-semibold">{step.title}</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
                <Link href={step.href} className="sm:shrink-0">
                  <Button variant={step.highlight ? "default" : "outline"} className="w-full sm:w-auto gap-2">
                    {step.cta} <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4" /> Also available
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href="/dashboard/security">
            <Button size="sm" variant="outline">
              Security feeds
            </Button>
          </Link>
          <Link href="/dashboard/launch-studio">
            <Button size="sm" variant="outline">
              Launch Studio
            </Button>
          </Link>
          <Link href="/dashboard/orbit">
            <Button size="sm" variant="outline">
              Orbit marketing
            </Button>
          </Link>
          <Link href="/tools/hybridization-calculator">
            <Button size="sm" variant="outline">
              Public hybrid tool
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
