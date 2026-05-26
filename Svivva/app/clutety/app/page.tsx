import { ClutetyEmbeddedApp } from "@/components/clutety/clutety-embedded-app";
import Image from "next/image";
import Link from "next/link";
import { CLUTETY_LOGO_PATH, CLUTETY_TEAL } from "@/lib/clutety/config";

/** Full-screen Clutety experience — used inside Svivva and loaded by the iOS WebView. */
export default function ClutetyAppPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#080c14] text-white">
      <header
        className="shrink-0 flex items-center justify-between px-4 h-12 border-b border-white/5"
        style={{ background: "rgba(8,12,20,0.95)" }}
      >
        <Link href="/clutety" className="flex items-center gap-2">
          <Image
            src={CLUTETY_LOGO_PATH}
            alt="Clutety"
            width={100}
            height={28}
            className="h-6 w-auto object-contain"
            priority
          />
        </Link>
        <Link
          href="/"
          className="text-[11px] font-bold tracking-wide"
          style={{ color: CLUTETY_TEAL }}
        >
          Svivva
        </Link>
      </header>
      <main className="flex-1 min-h-0">
        <ClutetyEmbeddedApp />
      </main>
    </div>
  );
}
