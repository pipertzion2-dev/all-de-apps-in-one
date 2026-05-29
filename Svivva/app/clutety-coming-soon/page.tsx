import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Apple, ArrowRight, Shield } from "lucide-react";
import {
  CLUTETY_BURG,
  CLUTETY_COMING_SOON_PATH,
  CLUTETY_LOGO_PATH,
  CLUTETY_TEAL,
} from "@/lib/clutety/config";

export const metadata: Metadata = {
  title: "Clutety — Coming Soon",
  description:
    "Clutety for iOS is coming soon. Until then, explore Svivva security tools in your browser.",
  robots: { index: true, follow: true },
  alternates: { canonical: CLUTETY_COMING_SOON_PATH },
};

export default function ClutetyComingSoonPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16 text-center"
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, rgba(91,168,160,0.12) 0%, transparent 55%), #0a0a0a",
      }}
    >
      <div className="max-w-md w-full flex flex-col items-center gap-6">
        <Image
          src={CLUTETY_LOGO_PATH}
          alt="Clutety"
          width={200}
          height={54}
          priority
          unoptimized
          className="w-[min(200px,80vw)] h-auto object-contain bg-transparent drop-shadow-[0_4px_24px_rgba(91,168,160,0.35)]"
          style={{ background: "transparent" }}
        />

        <div className="space-y-2">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: CLUTETY_TEAL }}
          >
            Coming soon
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Clutety for iOS
          </h1>
          <p className="text-sm text-white/60 leading-relaxed max-w-sm mx-auto">
            Native app store launch is in progress. Security tools are already available on Svivva
            while we finish the iOS build.
          </p>
        </div>

        <div
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs text-white/70"
          style={{ borderColor: `${CLUTETY_TEAL}44` }}
        >
          <Apple className="w-4 h-4" style={{ color: CLUTETY_TEAL }} aria-hidden />
          App Store — not live yet
        </div>

        <Link
          href="/cyber-security-mini-apps"
          className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${CLUTETY_TEAL}, ${CLUTETY_BURG})` }}
        >
          <Shield className="w-4 h-4" aria-hidden />
          Try security tools on Svivva
          <ArrowRight className="w-4 h-4" aria-hidden />
        </Link>

        <Link href="/" className="text-xs text-white/40 hover:text-white/60 transition-colors">
          Back to Svivva home
        </Link>
      </div>
    </main>
  );
}
