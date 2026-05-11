import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import svivvaLogo from "@/attached_assets/SVIVVA_OFFICIAL_LOGO_1769201341308.png";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact the Svivva team for platform questions, enterprise plans, or partnerships. Email hello@svivva.com.",
  alternates: { canonical: "https://svivva.com/contact" },
  openGraph: {
    title: "Contact Svivva",
    description:
      "Get in touch with the Svivva team for platform questions, enterprise plans, or partnership inquiries.",
    url: "https://svivva.com/contact",
  },
};

export default function ContactPage() {
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
              hello@svivva.com
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
