import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AP Biology Lab · Coming online · ZZAI",
  description: "AP Biology cause → mechanism → effect labs on the ZZAI science engine.",
};

export default function BiologyScaffoldPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-14 space-y-4">
        <h1 className="text-2xl font-bold">AP Biology — framework ready</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Membrane transport, enzymes, and gene expression will plug into the shared concept,
          mastery, and misconception engine. Hybridization is the live reference implementation.
        </p>
        <Link
          href="/learn/chemistry/hybridization"
          className="inline-flex px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-sky-600"
        >
          Open Hybridization Explorer
        </Link>
      </div>
    </main>
  );
}
