"use client";

import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CamoThreeOverlay } from "@/components/camo-three-overlay";
import { HOMEPAGE_PRICING_TIERS } from "@/lib/homepage-pricing";
import seedsLogo from "@/attached_assets/Svivva_Seeds_6_1771888740460.png";

/** Pricing block on the product-cube homepage (below the nav cube). */
export function HomepagePricingSection() {
  return (
    <section id="pricing" className="relative overflow-hidden pb-16 pt-6 sm:pb-24 sm:pt-10">
      <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden>
        <CamoThreeOverlay preset="pricing" eagerMount keepMounted className="h-full w-full" />
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background to-transparent"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto mb-12 max-w-2xl space-y-3 text-center sm:mb-14">
          <Badge variant="secondary" className="px-4 py-1.5">
            Pricing
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, transparent <span className="solid-accent">pricing</span>
          </h2>
          <p className="mx-auto max-w-xl text-base text-muted-foreground sm:text-lg">
            Start free, scale as you grow. No hidden fees.
          </p>
        </div>

        <div className="mx-auto grid max-w-3xl gap-8 md:grid-cols-2">
          {HOMEPAGE_PRICING_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`flex h-full flex-col border-t-2 bg-background/80 px-1 pb-2 pt-6 backdrop-blur-md ${
                tier.popular ? "border-[#5B8DA8]" : "border-border/60"
              }`}
              data-testid={`card-pricing-${tier.name.toLowerCase()}`}
            >
              <div className="mb-1 flex items-center gap-2">
                <h3 className="text-xl font-semibold tracking-tight">{tier.name}</h3>
                {tier.popular ? (
                  <Badge className="bg-[#5B8DA8] text-white">Most Popular</Badge>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">{tier.description}</p>

              {tier.hasSeeds ? (
                <div className="mt-4 flex items-center gap-2">
                  <div className="relative h-7 w-7 flex-shrink-0 overflow-hidden rounded-md">
                    <Image
                      src={seedsLogo}
                      alt="ZZAI Seeds"
                      fill
                      sizes="28px"
                      className="object-cover"
                    />
                  </div>
                  <span className="seeds-holo-text text-[10px] font-bold uppercase tracking-widest">
                    Includes Seeds
                  </span>
                </div>
              ) : null}

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">{tier.price}</span>
                <span className="text-muted-foreground">{tier.period}</span>
              </div>

              <ul className="mt-6 flex-1 space-y-2.5">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm leading-snug">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#5B8DA8]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={tier.href} className="mt-8 block">
                <Button
                  className={`w-full ${tier.popular ? "bg-[#5B8DA8] text-white" : ""}`}
                  variant={tier.popular ? "default" : "outline"}
                  data-testid={`button-pricing-${tier.name.toLowerCase()}`}
                >
                  {tier.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Want to explore first?{" "}
          <Link href="/signup" className="underline transition-colors hover:text-foreground">
            Start free
          </Link>{" "}
          — no credit card required.
        </p>
      </div>
    </section>
  );
}
