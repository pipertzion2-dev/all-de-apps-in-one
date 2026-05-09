"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function FaqSection({ items }: { items: { q: string; a: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-lg border border-white/10 bg-white/5 overflow-hidden"
          data-testid={`faq-item-${i}`}
        >
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white/5 transition-colors"
            data-testid={`button-faq-${i}`}
          >
            <span className="font-medium text-white/90">{item.q}</span>
            {openIndex === i ? (
              <ChevronUp className="w-4 h-4 text-white/40 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />
            )}
          </button>
          {openIndex === i && (
            <div
              className="px-5 pb-4 text-white/60 leading-relaxed"
              data-testid={`text-faq-answer-${i}`}
            >
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
