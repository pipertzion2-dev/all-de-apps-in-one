import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AP Science Lab · ZZAI",
  description:
    "Interactive AP Chemistry, Physics, and Biology — visualize, predict, get feedback, and master misconceptions.",
};

const COURSES = [
  {
    id: "ap-chemistry",
    title: "AP Chemistry",
    blurb: "Hybridization, VSEPR, σ/π bonding — start with the reference lab.",
    href: "/learn/chemistry/hybridization",
    ready: true,
  },
  {
    id: "ap-physics",
    title: "AP Physics",
    blurb: "Motion graphs, forces, and energy — framework scaffolding next.",
    href: "/learn/physics",
    ready: false,
  },
  {
    id: "ap-biology",
    title: "AP Biology",
    blurb: "Cause → mechanism → effect for membranes, enzymes, and genetics.",
    href: "/learn/biology",
    ready: false,
  },
];

export default function LearnHubPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-400">ZZAI Learn</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Understand AP Science instead of memorizing it
          </h1>
          <p className="text-muted-foreground max-w-2xl leading-relaxed">
            Concept → visualize → manipulate → predict → explain → AP-style practice → misconception
            feedback → next recommendation.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href="/learn/onboarding"
              className="px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-sky-600 hover:bg-sky-500"
            >
              Start in under 5 minutes
            </Link>
            <Link
              href="/learn/chemistry/hybridization"
              className="px-4 py-2.5 rounded-lg text-sm font-bold border border-border/60"
            >
              Open Hybridization Explorer
            </Link>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          {COURSES.map((c) => (
            <Link
              key={c.id}
              href={c.href}
              className="rounded-xl border border-border/50 bg-card/40 p-4 hover:border-sky-500/40 transition-colors"
            >
              <p className="text-sm font-bold">{c.title}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{c.blurb}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide mt-3 text-sky-400">
                {c.ready ? "Live lab" : "Scaffolded"}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
