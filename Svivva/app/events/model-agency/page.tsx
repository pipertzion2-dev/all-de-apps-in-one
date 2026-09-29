import Link from "next/link";
import type { Metadata } from "next";
import { BrandMark } from "@/components/brand-mark";
import { ModelAgencySigningFlow } from "@/components/events/model-agency-signing-flow";
import { JsonLd } from "@/components/seo/json-ld";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema/builders";

export const metadata: Metadata = buildSeoMetadata({
  title: "Model agency signing desk — comp card to submission pack",
  description:
    "ZZAI Show talent desk: upload or build a model comp card, enter measurements, match a board, and generate an agency-ready email submission pack.",
  path: "/events/model-agency",
});

export default function ModelAgencyEventsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd
        data={[
          webPageSchema({
            name: "Model agency signing desk",
            description:
              "Organize comp cards, measurements, and agency submissions from ZZAI Show events.",
            path: "/events/model-agency",
          }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Events", path: "/events" },
            { name: "Model agency desk", path: "/events/model-agency" },
          ]),
        ]}
      />

      <nav className="sticky top-0 z-40 border-b border-border/40 bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <BrandMark size="md" />
          <div className="flex items-center gap-3 text-sm">
            <Link href="/events" className="text-muted-foreground hover:text-foreground">
              All events
            </Link>
            <Link
              href="/dashboard/zzai-show"
              className="rounded-md bg-[#5B8DA8] px-3 py-1.5 font-medium text-white"
            >
              Show console
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <ModelAgencySigningFlow />
      </main>
    </div>
  );
}
