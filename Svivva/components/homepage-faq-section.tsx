import { getBrandKnowledge } from "@/lib/brand-knowledge";

/** Crawlable FAQ that mirrors homepage FAQPage JSON-LD (answers always in the DOM). */
export function HomepageFaqSection() {
  const faqs = getBrandKnowledge().faqs;

  return (
    <section
      id="faq"
      className="relative border-t border-border/40 bg-background px-4 py-12 sm:px-6 sm:py-16"
      aria-labelledby="homepage-faq-heading"
    >
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5B8DA8]">FAQ</p>
          <h2 id="homepage-faq-heading" className="text-2xl font-bold sm:text-3xl">
            Frequently asked questions about zzai zzai
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
            What ZZAI is, how prompt-to-API shipping works, pricing, Poor Man Protection, and where
            the product lives on zzaizzai.com.
          </p>
        </div>

        <div className="space-y-3 text-left">
          {faqs.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-border/50 bg-card/80 open:bg-card"
            >
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-start justify-between gap-3">
                  {item.q}
                  <span
                    className="mt-0.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                    aria-hidden
                  >
                    ▾
                  </span>
                </span>
              </summary>
              <p className="border-t border-border/40 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
