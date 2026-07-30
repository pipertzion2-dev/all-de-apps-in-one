import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact the ZZAI team for platform questions, enterprise plans, or partnerships. Email hello@zzaizzai.com.",
  alternates: { canonical: "https://zzaizzai.com/contact" },
  openGraph: {
    title: "Contact ZZAI",
    description:
      "Get in touch with the ZZAI team for platform questions, enterprise plans, or partnership inquiries.",
    url: "https://zzaizzai.com/contact",
  },
};

export default function ContactPage() {
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
        <h1 className="text-3xl font-bold mb-6" data-testid="text-contact-title">
          Contact Us
        </h1>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>
            We'd love to hear from you. Whether you have questions about the platform, need
            enterprise support, or want to explore partnership opportunities — reach out anytime.
          </p>
          <div className="border border-border rounded-lg p-6 space-y-3 mt-6">
            <div data-testid="text-contact-email">
              <span className="font-medium text-foreground">For any inquiries:</span>{" "}
              hello@zzaizzai.com
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
