import Link from "next/link";
import Image from "next/image";
import svivvaLogo from "@/attached_assets/SVIVVA_OFFICIAL_LOGO_1769201341308.png";

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold mb-6" data-testid="text-privacy-title">
          Privacy Policy
        </h1>
        <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
          <p className="text-xs text-muted-foreground">Last updated: February 2026</p>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Information We Collect</h2>
            <p>
              We collect information you provide when creating an account, using our services, or
              contacting support. This includes your name, email address, usage data, and API
              configurations.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">How We Use Your Information</h2>
            <p>
              Your information is used to provide and improve our services, process transactions,
              send service communications, and ensure platform security. We do not sell your
              personal data to third parties.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data, including
              encryption in transit and at rest, secure API key management, and regular security
              audits.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Your Rights</h2>
            <p>
              You may request access to, correction of, or deletion of your personal data at any
              time by contacting us at hello@svivva.com.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
