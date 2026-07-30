import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export const metadata: Metadata = {
  title: "About",
  description:
    "From seed to symphony — ZZAI helps teams turn plain-language intent into shipped product, with validation, evaluations, versioning, and rollback.",
  alternates: { canonical: "https://zzaizzai.com/about" },
  openGraph: {
    title: "About ZZAI",
    description:
      "From seed to symphony — learn how ZZAI helps teams ship with guardrails instead of babysitting infrastructure.",
    url: "https://zzaizzai.com/about",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between">
        <BrandMark size="sm" testId="link-logo" />
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          data-testid="link-back-home"
        >
          Back to Home
        </Link>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-6" data-testid="text-about-title">
          About ZZAI
        </h1>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>
            ZZAI is an AI-powered platform that transforms natural language into production-ready
            APIs. We make it possible for anyone to build, deploy, and scale AI-driven applications
            — without writing backend code.
          </p>
          <p>
            Our platform includes automated evaluation systems, version control with instant
            rollback, team collaboration tools, and an API marketplace for publishing and monetizing
            your work.
          </p>
          <p>
            ZZAI Play, our creative instrument, brings AI to music production — generating MIDI,
            designing synth patches, and analyzing audio from simple text descriptions.
          </p>
          <p>
            We believe the future of software is prompt-driven. ZZAI is building the tools to get
            there.
          </p>
        </div>
      </main>
    </div>
  );
}
