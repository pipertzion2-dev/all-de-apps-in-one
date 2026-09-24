import { HOMEPAGE_HOWTO_STEPS } from "@/lib/seo/schema/builders";

/** Crawlable HowTo steps that match homepage HowTo JSON-LD. */
export function HomepageHowToSection() {
  return (
    <section
      id="how-it-works"
      className="relative border-t border-border/40 bg-background px-4 py-12 sm:px-6 sm:py-16"
      aria-labelledby="homepage-howto-heading"
    >
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5B8DA8]">
            How it works
          </p>
          <h2 id="homepage-howto-heading" className="text-2xl font-bold sm:text-3xl">
            How to ship with ZZAI
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
            Build a production-ready AI API from a plain-language prompt — schema validation,
            evaluations, and rollback included.
          </p>
        </div>

        <ol className="space-y-4 text-left">
          {HOMEPAGE_HOWTO_STEPS.map((step, index) => (
            <li
              key={step.name}
              className="rounded-xl border border-border/50 bg-card/80 p-4 sm:p-5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5B8DA8]">
                Step {index + 1}
              </p>
              <h3 className="mt-1 text-base font-semibold">{step.name}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
