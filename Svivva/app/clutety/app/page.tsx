import { LockScanner } from "@/components/clutety/lock-scanner";

/** Full-screen Pyracrypt Lock UI — iOS WebView and direct app entry. */
export default function ClutetyAppPage() {
  return (
    <div className="min-h-[100dvh] w-full overflow-x-hidden overflow-y-auto overscroll-contain bg-[#EEF2F8]">
      <LockScanner />
    </div>
  );
}
