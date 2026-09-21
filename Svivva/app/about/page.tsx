import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildSeoMetadata({
  title: "About",
  description:
    "From seed to symphony — ZZAI helps teams turn plain-language intent into shipped product, with validation, evaluations, versioning, and rollback.",
  path: "/about",
});

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
          About zzai zzai
        </h1>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>
            From seed to symphony. Describe what you need; ZZAI ships a guarded endpoint with schema
            validation, evaluations, versioning, and rollback.
          </p>
          <p>
            ZZAI Play is the creative side — MIDI, synth patches, and audio analysis from text —
            plus games like Klean Sneaks.
          </p>
        </div>
      </main>
    </div>
  );
}
