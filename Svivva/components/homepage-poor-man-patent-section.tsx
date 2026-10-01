import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  POOR_MAN_COMPARISON_ROWS,
  POOR_MAN_LEGAL_FOOTNOTE,
  POOR_MAN_UNIQUE_POINTS,
  POOR_MAN_VS_PATENT_HEADLINE,
  POOR_MAN_VS_PATENT_LEDE,
} from "@/lib/product-positioning";
import { Check, Sparkles } from "lucide-react";

/** Crawlable explainer — why digital poor-man beats a physical envelope and what is unique. */
export function HomepagePoorManPatentSection() {
  return (
    <section
      id="why-poor-man-protection"
      className="relative snap-start scroll-mt-4 border-b border-border/40 bg-muted/20 px-4 py-12 sm:px-6 sm:py-16"
      aria-labelledby="poor-man-vs-patent-heading"
      data-testid="homepage-poor-man-patent-section"
    >
      <div className="mx-auto max-w-5xl space-y-10">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#5B8DA8]">
            Poor man&apos;s patent, upgraded
          </p>
          <h2 id="poor-man-vs-patent-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
            {POOR_MAN_VS_PATENT_HEADLINE}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            {POOR_MAN_VS_PATENT_LEDE}
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40">
                <th scope="col" className="px-4 py-3 font-semibold">
                  What matters
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">
                  Physical envelope
                  <span className="mt-0.5 block text-[10px] font-normal uppercase tracking-wide">
                    Classic poor man&apos;s patent
                  </span>
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">
                  USPTO utility patent
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-[#5B8DA8]">
                  ZZAI Poor Man Protection
                </th>
              </tr>
            </thead>
            <tbody>
              {POOR_MAN_COMPARISON_ROWS.map((row) => (
                <tr key={row.label} className="border-b border-border/40 last:border-0">
                  <th scope="row" className="px-4 py-3 font-medium">
                    {row.label}
                  </th>
                  <td className="px-4 py-3 text-muted-foreground">{row.physicalEnvelope}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.usptoPatent}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{row.zzaiPoorMan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-center">
            <Sparkles className="h-4 w-4 text-[#5B8DA8]" aria-hidden />
            <h3 className="text-lg font-semibold sm:text-xl">What only ZZAI adds</h3>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {POOR_MAN_UNIQUE_POINTS.map(({ title, body }) => (
              <li
                key={title}
                className="flex gap-3 rounded-xl border border-border/50 bg-background/80 p-4"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#5B8DA8]" aria-hidden />
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="mx-auto max-w-3xl text-center text-xs leading-relaxed text-muted-foreground">
          {POOR_MAN_LEGAL_FOOTNOTE}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="bg-[#5B8DA8] text-white">
            <Link href="/dashboard/poor-man-protection">Seal your work</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/protect/verify">Verify a seal</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
