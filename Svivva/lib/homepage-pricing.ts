export type HomepagePricingTier = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
  hasSeeds: boolean;
  href: string;
};

export const HOMEPAGE_PRICING_TIERS: readonly HomepagePricingTier[] = [
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "Suite Pass — all six cube mini apps",
    features: [
      "Suite Pass — Play, Seeds, Orbit, Protect, Digital & Hardware mini apps",
      "Play mini app — full studio + 16-channel mixing console",
      "Seeds mini app — PDF/YouTube → multi-app factory",
      "Digital mini app — unlimited APIs, evals, rollback (100k requests/mo)",
      "Hardware mini app — unlimited projects, BOM & AI sourcing",
      "Orbit mini app — SEO, indexing & launch automation",
      "Protect mini app — sketch seals & court-ready packs",
      "Priority support",
    ],
    cta: "Get Pro Suite Pass",
    popular: true,
    hasSeeds: true,
    href: "/dashboard/checkout?tier=pro",
  },
  {
    name: "Enterprise",
    price: "$299",
    period: "/month",
    description: "Suite Pass for teams at scale",
    features: [
      "Everything in Pro Suite Pass",
      "Digital mini app — unlimited API requests",
      "Hardware mini app — dedicated supplier network",
      "Seeds mini app — unlimited builds",
      "Mixing-console OS — unlimited OaaS patch routing",
      "SSO & SAML across the suite",
      "Custom integrations per mini app",
      "SLA guarantee",
    ],
    cta: "Contact Sales — Suite Pass",
    popular: false,
    hasSeeds: true,
    href: "mailto:hello@zzaizzai.com?subject=Enterprise%20Plan%20Inquiry",
  },
] as const;
