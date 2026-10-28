import { getBrandKnowledge } from "@/lib/brand-knowledge";

/** Crawlable FAQ that mirrors homepage FAQPage JSON-LD (answers always in the DOM). */
export function HomepageFaqSection() {
  /** Homepage must not surface “Klean Sneaks” branding — keep those FAQs off this page. */
  const faqs = getBrandKnowledge().faqs.filter(
    (item) => !/klean\s*sneaks|\bklean\b/i.test(`${item.q} ${item.a}`),
  );

  return (
    <section
      id="faq"
      className="relative border-t border-border/40 bg-background px-4 py-12 sm:px-6 sm:py-16"
      aria-labelledby="homepage-faq-heading"
    >
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6D91B3]">FAQ</p>
          <h2 id="homepage-faq-heading" className="text-2xl font-bold sm:text-3xl">
            Questions about Poor Man Protection
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
            Sealing, court packs, the beta apps cube, pricing, and what is still in beta.
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
