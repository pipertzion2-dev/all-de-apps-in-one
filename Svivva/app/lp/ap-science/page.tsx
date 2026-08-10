import type { Metadata } from "next";
import Link from "next/link";
import { ApLandingTracker } from "@/components/ap-science/ap-landing-tracker";

export const metadata: Metadata = {
  title: "AP Science that clicks — ZZAI Learn",
  description:
    "Interactive AP Chemistry, Physics, and Biology. Visualize hard concepts, detect misconceptions, and practice AP-style reasoning.",
};

export default function ApScienceLandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <ApLandingTracker />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-12 space-y-6 relative">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">
            For AP Chem · Physics · Biology students
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
            Understand AP Science instead of memorizing it
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Interactive models, AP-style practice, and misconception detection — so you see{" "}
            <em>why</em> a double bond is still one electron domain, or why NH₃ is pyramidal.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/learn/onboarding"
              className="px-5 py-3 rounded-xl text-sm font-bold text-white bg-sky-600 hover:bg-sky-500"
            >
              Start free — first lesson live
            </Link>
            <Link
              href="/learn/chemistry/hybridization"
              className="px-5 py-3 rounded-xl text-sm font-bold border border-border/60"
            >
              Try Hybridization Explorer
            </Link>
          </div>
          <ul className="grid sm:grid-cols-3 gap-3 pt-4 text-xs text-muted-foreground">
            <li className="rounded-lg border border-border/40 p-3">Interactive science models</li>
            <li className="rounded-lg border border-border/40 p-3">
              AP-style questions + confidence
            </li>
            <li className="rounded-lg border border-border/40 p-3">
              Personalized weak-area next steps
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
