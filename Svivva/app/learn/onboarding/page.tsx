"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trackApLearnEvent } from "@/lib/ap-science/client-store";

type Course = "ap-chemistry" | "ap-physics" | "ap-biology";

export default function LearnOnboardingPage() {
  const router = useRouter();
  const [course, setCourse] = useState<Course>("ap-chemistry");
  const [examWindow, setExamWindow] = useState("this-year");
  const [confidence, setConfidence] = useState<"low" | "medium" | "high">("medium");
  const [step, setStep] = useState(0);

  function finish() {
    try {
      localStorage.setItem(
        "zzai:ap-science:onboarding",
        JSON.stringify({ course, examWindow, confidence, at: new Date().toISOString() }),
      );
    } catch {
      /* ignore */
    }
    trackApLearnEvent("onboarding_completed", { course, examWindow, confidence });
    trackApLearnEvent("subject_selected", { course });
    if (course === "ap-chemistry") {
      router.push("/learn/chemistry/hybridization");
    } else if (course === "ap-physics") {
      router.push("/learn/physics");
    } else {
      router.push("/learn/biology");
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-lg mx-auto px-4 py-12 space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-400">Quick start</p>
          <h1 className="text-2xl font-bold mt-1">Get to a win in minutes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Three questions. No long survey. Progressive profiling later.
          </p>
        </div>

        {step === 0 && (
          <section className="space-y-3">
            <p className="text-sm font-semibold">Which AP course?</p>
            {(
              [
                ["ap-chemistry", "AP Chemistry"],
                ["ap-physics", "AP Physics"],
                ["ap-biology", "AP Biology"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setCourse(id)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-bold ${
                  course === id ? "border-sky-500/50 bg-sky-500/10" : "border-border/50 bg-card/30"
                }`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setStep(1);
                trackApLearnEvent("onboarding_started", { course });
              }}
              className="w-full py-3 rounded-xl text-sm font-bold text-white bg-sky-600"
            >
              Continue
            </button>
          </section>
        )}

        {step === 1 && (
          <section className="space-y-3">
            <p className="text-sm font-semibold">Exam timing</p>
            {(
              [
                ["this-year", "Exam this school year"],
                ["next-year", "Building foundations for next year"],
                ["unsure", "Not sure yet"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setExamWindow(id)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm ${
                  examWindow === id
                    ? "border-sky-500/50 bg-sky-500/10 font-bold"
                    : "border-border/50"
                }`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setStep(2);
                trackApLearnEvent("exam_date_selected", { examWindow });
              }}
              className="w-full py-3 rounded-xl text-sm font-bold text-white bg-sky-600"
            >
              Continue
            </button>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-3">
            <p className="text-sm font-semibold">Current confidence</p>
            {(
              [
                ["low", "Still shaky on the basics"],
                ["medium", "Some topics click, others don’t"],
                ["high", "Mostly reviewing for the exam"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setConfidence(id)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm ${
                  confidence === id
                    ? "border-sky-500/50 bg-sky-500/10 font-bold"
                    : "border-border/50"
                }`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={finish}
              className="w-full py-3 rounded-xl text-sm font-bold text-white bg-sky-600"
            >
              Launch first interactive lesson
            </button>
            <Link href="/learn" className="block text-center text-xs text-muted-foreground">
              Skip for now
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
