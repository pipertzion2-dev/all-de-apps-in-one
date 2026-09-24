import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { buildSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildSeoMetadata({
  title: "Privacy Policy",
  description:
    "ZZAI privacy policy — how we collect, use, and protect your information, including cookies and advertising (Google AdSense).",
  path: "/privacy",
});

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold mb-6" data-testid="text-privacy-title">
          Privacy Policy
        </h1>
        <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
          <p className="text-xs text-muted-foreground">Last updated: September 2026</p>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Information We Collect</h2>
            <p>
              We collect information you provide when creating an account, using our services, or
              contacting support. This includes your name, email address, usage data, and API
              configurations. We also collect technical data such as IP address, browser type,
              device information, and pages visited.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">How We Use Your Information</h2>
            <p>
              Your information is used to provide and improve our services, process transactions,
              send service communications, measure site performance, show relevant advertising, and
              ensure platform security. We do not sell your personal data to third parties.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              Cookies and Similar Technologies
            </h2>
            <p>
              We use cookies and similar technologies (local storage, pixels, and scripts) to keep
              you signed in, remember preferences, understand how the site is used, and deliver
              advertising. You can control cookies through your browser settings. Blocking some
              cookies may limit features.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Advertising (Google AdSense)</h2>
            <p>
              We use Google AdSense to show ads on zzaizzai.com and in products such as Klean
              Sneaks. Google and its partners may use cookies or device identifiers to serve ads
              based on your prior visits to this or other websites, measure ad performance, and
              limit how often you see an ad. For more information, see{" "}
              <a
                href="https://policies.google.com/technologies/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline"
              >
                Google’s Advertising policies
              </a>{" "}
              and{" "}
              <a
                href="https://adssettings.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline"
              >
                Ad Settings
              </a>
              .
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              Consent and visitors in the EEA, UK, and Switzerland
            </h2>
            <p>
              Where required by law (including GDPR and UK GDPR), we use Google Consent Mode and a
              consent message so you can Consent, Do not consent, or Manage options before ads and
              analytics storage are enabled. You can change your choice later through the consent
              controls Google shows on this site when that message is published for your region.
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
              time by contacting us at hello@zzaizzai.com. Depending on where you live, you may also
              have rights to object to processing, restrict processing, or lodge a complaint with a
              supervisory authority.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
