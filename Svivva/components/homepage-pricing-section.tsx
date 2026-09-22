"use client";

import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CamoThreeOverlay } from "@/components/camo-three-overlay";
import { HOMEPAGE_PRICING_TIERS } from "@/lib/homepage-pricing";
import { CUBE_SUITE } from "@/lib/cube/mini-app-suite";
import { CubeSuiteMiniAppsGrid } from "@/components/cube-suite-mini-apps-grid";
import seedsLogo from "@/attached_assets/Svivva_Seeds_6_1771888740460.png";

/** Pricing block on the product-cube homepage (below the nav cube). */
export function HomepagePricingSection() {
  return (
    <section id="pricing" className="relative overflow-hidden pb-16 pt-4 sm:pb-24 sm:pt-8">
      <div className="pointer-events-none absolute inset-0 opacity-50" aria-hidden>
        <CamoThreeOverlay preset="pricing" eagerMount keepMounted className="h-full w-full" />
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background to-transparent"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto mb-10 max-w-3xl space-y-4 rounded-2xl bg-background/85 p-5 text-center backdrop-blur-lg sm:mb-12 sm:p-8">
          <Badge variant="secondary" className="px-4 py-1.5">
            {CUBE_SUITE.passName}
          </Badge>
          <h2 className="text-3xl font-bold sm:text-4xl">
            One <span className="solid-accent">Suite Pass</span>. Six mini apps.
          </h2>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
            {CUBE_SUITE.subscriptionSubhead}
          </p>
        </div>

        <div className="mx-auto mb-10 max-w-3xl space-y-3 sm:mb-12">
          <p className="text-center text-xs font-mono uppercase tracking-widest text-muted-foreground">
            What&apos;s in the suite
          </p>
          <CubeSuiteMiniAppsGrid showBlurb={false} />
        </div>

        <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2 md:gap-8">
          {HOMEPAGE_PRICING_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={tier.popular ? "rounded-2xl p-[3px]" : undefined}
              style={
                tier.popular
                  ? {
                      background:
                        "linear-gradient(135deg, #3F2A2C 0%, #7A4F3A 14%, #6B3A67 28%, #425884 42%, #D782B2 56%, #F3AFC4 70%, #6B7B59 85%, #4A5A3D 100%)",
                    }
                  : undefined
              }
            >
              <Card
                className={`relative h-full rounded-2xl bg-card p-6 backdrop-blur-xl ${tier.popular ? "border-0" : "border-border/50"}`}
                data-testid={`card-pricing-${tier.name.toLowerCase()}`}
              >
                {tier.popular ? (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#5B8DA8] text-white">
                    Most Popular
                  </Badge>
                ) : null}
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[#5B8DA8]">
                      {CUBE_SUITE.passName}
                    </p>
                    <h3 className="text-xl font-semibold">{tier.name}</h3>
                    <p className="text-sm text-muted-foreground">{tier.description}</p>
                  </div>
                  {tier.hasSeeds ? (
                    <div className="flex items-center gap-2">
                      <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={seedsLogo}
                          alt="ZZAI Seeds"
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      </div>
                      <span className="seeds-holo-text text-[10px] font-bold uppercase tracking-widest">
                        Includes Seeds
                      </span>
                    </div>
                  ) : null}
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground">{tier.period}</span>
                  </div>
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 flex-shrink-0 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={tier.href} className="block">
                    <Button
                      className={`w-full ${tier.popular ? "bg-[#5B8DA8] text-white" : ""}`}
                      variant={tier.popular ? "default" : "outline"}
                      data-testid={`button-pricing-${tier.name.toLowerCase()}`}
                    >
                      {tier.cta}
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
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
