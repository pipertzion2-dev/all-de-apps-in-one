import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold mb-6" data-testid="text-terms-title">
          Terms of Service
        </h1>
        <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
          <p className="text-xs text-muted-foreground">Last updated: February 2026</p>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Acceptance of Terms</h2>
            <p>
              By accessing or using ZZAI, you agree to be bound by these Terms of Service. If you do
              not agree, please do not use our platform.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Use of Services</h2>
            <p>
              You may use ZZAI to create, deploy, and manage AI-powered APIs in accordance with
              applicable laws. You are responsible for all activity under your account and for
              ensuring your APIs comply with our acceptable use policies.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Intellectual Property</h2>
            <p>
              You retain ownership of the APIs and content you create on ZZAI. We retain ownership
              of the platform, tools, and underlying technology. By publishing APIs on the
              marketplace, you grant ZZAI a license to distribute them per your chosen terms.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Limitation of Liability</h2>
            <p>
              ZZAI is provided "as is" without warranty. We are not liable for any indirect,
              incidental, or consequential damages arising from your use of the platform.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Contact</h2>
            <p>For questions about these terms, contact us at hello@zzaizzai.com.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
