import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { PRODUCT_ONE_LINER, PRODUCT_TAGLINE } from "@/lib/product-positioning";

export const metadata: Metadata = buildSeoMetadata({
  title: "About",
  description: `${PRODUCT_TAGLINE} — ${PRODUCT_ONE_LINER}`,
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
          <p>{PRODUCT_ONE_LINER}</p>
          <p>
            <strong>Klean Sneaks</strong> (/clean-sneaks) is the public game demo — Sneak Vision,
            zone-based shoe state, and mission saves mirror pre-ship checks and production rollback.
            Seeds, Orbit, hardware, advocacy, and the full Play studio are labeled <strong>Beta</strong>{" "}
            on the same domain.
          </p>
        </div>
      </main>
    </div>
  );
}
