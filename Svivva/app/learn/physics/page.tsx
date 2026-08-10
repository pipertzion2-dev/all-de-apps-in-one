import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AP Physics Lab · Coming online · ZZAI",
  description: "AP Physics interactive labs using the shared ZZAI science visualization engine.",
};

export default function PhysicsScaffoldPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-14 space-y-4">
        <h1 className="text-2xl font-bold">AP Physics — framework ready</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Motion / forces / energy interactives will reuse the same CONCEPT → VISUALIZE → PREDICT →
          FEEDBACK loop proven in Hybridization. Start with Chemistry to experience the reference
          standard.
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
