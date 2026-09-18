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
    description: "Full platform access",
    features: [
      "Signal + Crest unlimited",
      "Unlimited API endpoints",
      "Unlimited hardware projects",
      "100,000 API requests/month",
      "AI material sourcing",
      "Hardware layout preview & optional AI sketches",
      "ZZAI Play — full access",
      "Mixing-console OS — 16 channels + Master bus",
      "ZZAI Seeds — multi-app factory",
      "Auto-rollback & versioning",
      "Priority support",
    ],
    cta: "Subscribe to Pro",
    popular: true,
    hasSeeds: true,
    href: "/dashboard/checkout?tier=pro",
  },
  {
    name: "Enterprise",
    price: "$299",
    period: "/month",
    description: "For teams at scale",
    features: [
      "Everything in Pro",
      "Unlimited API requests",
      "Dedicated supplier network",
      "ZZAI Play — full access",
      "OaaS patch bay — unlimited channel routing",
      "ZZAI Seeds — unlimited builds",
      "SSO & SAML",
      "Custom integrations",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    popular: false,
    hasSeeds: true,
    href: "mailto:hello@zzaizzai.com?subject=Enterprise%20Plan%20Inquiry",
  },
] as const;
