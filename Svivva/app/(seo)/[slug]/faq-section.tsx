"use client";

/**
 * FAQ accordion with every answer in the DOM (details/summary) so crawlers
 * see full Q&A without relying on client expand state.
 */
export default function FaqSection({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <details
          key={i}
          className="group rounded-lg border border-white/10 bg-white/5 overflow-hidden open:bg-white/[0.07]"
          data-testid={`faq-item-${i}`}
        >
          <summary
            className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-left marker:content-none hover:bg-white/5 [&::-webkit-details-marker]:hidden"
            data-testid={`button-faq-${i}`}
          >
            <span className="font-medium text-white/90">{item.q}</span>
            <span
              className="shrink-0 text-white/40 transition-transform group-open:rotate-180"
              aria-hidden
            >
              ▾
            </span>
          </summary>
          <div
            className="border-t border-white/10 px-5 py-4 text-white/60 leading-relaxed"
            data-testid={`text-faq-answer-${i}`}
          >
            {item.a}
          </div>
        </details>
      ))}
    </div>
  );
}
