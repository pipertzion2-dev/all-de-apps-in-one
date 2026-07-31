import Link from "next/link";
import { TrackedCta } from "@/components/tracked-cta";

type ConversionFunnelProps = {
  headline?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  variant?: "top" | "mid" | "bottom";
};

export function ConversionFunnel({
  headline = "Build and ship AI apps faster",
  primaryHref = "/signup",
  primaryLabel = "Start free",
  secondaryHref = "/tools",
  secondaryLabel = "Explore tools",
  variant = "bottom",
}: ConversionFunnelProps) {
  const bg =
    variant === "top"
      ? "from-[#5B8DA8]/10 to-transparent"
      : variant === "mid"
        ? "from-violet-500/10 to-transparent"
        : "from-[#5B8DA8]/15 to-violet-500/10";

  return (
    <section
      className={`mt-12 rounded-2xl border border-white/10 bg-gradient-to-br ${bg} p-8 text-center`}
      data-seo-funnel={variant}
    >
      <p className="text-xs uppercase tracking-widest text-[#5B8DA8] mb-2">ZZAI</p>
      <h2 className="text-2xl font-semibold text-white mb-3">{headline}</h2>
      <p className="text-white/60 text-sm max-w-lg mx-auto mb-6">
        {variant === "top"
          ? "Trusted by builders shipping APIs, tools, and mini-apps."
          : variant === "mid"
            ? "Compare features, run tools in-browser, and save your progress."
            : "Create your workspace — no credit card required to explore."}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <TrackedCta
          href={primaryHref}
          className="inline-flex items-center rounded-lg bg-[#5B8DA8] px-6 py-3 text-sm font-medium text-[#0a0f14] hover:bg-[#6bc4bc] transition-colors"
          label={`funnel_${variant}_primary`}
        >
          {primaryLabel}
        </TrackedCta>
        {secondaryHref ? (
          <Link
            href={secondaryHref}
            className="inline-flex items-center rounded-lg border border-white/20 px-6 py-3 text-sm text-white/90 hover:bg-white/5 transition-colors"
          >
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
