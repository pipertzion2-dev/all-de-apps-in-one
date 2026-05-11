import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import svivvaLogo from "@/attached_assets/SVIVVA_OFFICIAL_LOGO_1769201341308.png";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Guides and reference for Svivva — from first project to production: prompts, schemas, evaluations, versioning, rollback, and Svivva Play.",
  alternates: { canonical: "https://svivva.com/docs" },
  openGraph: {
    title: "Svivva documentation",
    description:
      "Guides and reference for shipping with Svivva — prompts, schemas, evaluations, versioning, rollback, and more.",
    url: "https://svivva.com/docs",
  },
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Link href="/" data-testid="link-logo">
          <Image
            src={svivvaLogo}
            alt="Svivva"
            width={100}
            height={32}
            className="h-7 w-auto object-contain"
          />
        </Link>
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          data-testid="link-back-home"
        >
          Back to Home
        </Link>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-6" data-testid="text-docs-title">
          Documentation
        </h1>
        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">Getting Started</h2>
            <p>
              Create your first AI API in minutes. Sign in, describe what your API should do in
              plain language, define your output schema, and deploy. Svivva handles the rest — from
              validation to versioning.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">API Reference</h2>
            <p>
              Every endpoint you create comes with auto-generated OpenAPI 3.0 specifications. Use
              them to integrate with any client, or let Svivva generate SDKs for Python and Node.js
              automatically.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">Evaluations</h2>
            <p>
              Svivva automatically generates 50-200 evaluation cases per endpoint, including edge
              cases. Set pass-rate thresholds and enable auto-rollback if quality drops below your
              standards.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">Svivva Play</h2>
            <p>
              Our AI music instrument supports 6 modes: Composition, Interpolation, Chord Player,
              Solo Prompt, Patch Creator, and Ensemble. Import audio, describe what you want, and
              export professional MIDI.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
