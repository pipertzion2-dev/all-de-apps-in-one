import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import svivvaLogo from "@/attached_assets/SVIVVA_OFFICIAL_LOGO_1769201341308.png";

export const metadata: Metadata = {
  title: "About Svivva — The AI API Builder Platform",
  description: "Svivva transforms plain-language prompts into production-ready AI APIs with schema validation, auto-evaluations, versioning, and instant rollback. Built for lean teams who ship fast.",
  alternates: { canonical: "https://svivva.com/about" },
  openGraph: {
    title: "About Svivva — The AI API Builder Platform",
    description: "Svivva transforms plain-language prompts into production-ready AI APIs with schema validation, auto-evaluations, versioning, and instant rollback.",
    url: "https://svivva.com/about",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Link href="/" data-testid="link-logo"><Image src={svivvaLogo} alt="Svivva" width={100} height={32} className="h-7 w-auto object-contain" /></Link>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-back-home">Back to Home</Link>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-6" data-testid="text-about-title">About Svivva</h1>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>Svivva is an AI-powered platform that transforms natural language into production-ready APIs. We make it possible for anyone to build, deploy, and scale AI-driven applications — without writing backend code.</p>
          <p>Our platform includes automated evaluation systems, version control with instant rollback, team collaboration tools, and an API marketplace for publishing and monetizing your work.</p>
          <p>Svivva Play, our creative instrument, brings AI to music production — generating MIDI, designing synth patches, and analyzing audio from simple text descriptions.</p>
          <p>We believe the future of software is prompt-driven. Svivva is building the tools to get there.</p>
        </div>
      </main>
    </div>
  );
}
