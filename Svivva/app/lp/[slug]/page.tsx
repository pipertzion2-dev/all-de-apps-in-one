import Link from "next/link";
import type { Metadata } from "next";
import { buildSeoMetadata } from "@/lib/seo/metadata";
import {
  Zap,
  Shield,
  Clock,
  Code,
  Layers,
  Sparkles,
  Bot,
  Rocket,
  Globe,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

interface LandingPageData {
  title: string;
  metaTitle: string;
  metaDescription: string;
  heroHeadline: string;
  heroSubheadline: string;
  ctaText: string;
  benefits: { icon: string; title: string; description: string }[];
  faqs: { question: string; answer: string }[];
}

const pages: Record<string, LandingPageData> = {
  "ai-api-builder": {
    title: "Ship production backends",
    metaTitle: "Ship production backends from plain English | ZZAI",
    metaDescription:
      "From seed to symphony — describe what you need, deploy a guarded endpoint with schema validation and rollback. Start free.",
    heroHeadline: "From seed to symphony — ship what you describe",
    heroSubheadline:
      "Plain English in, a guarded endpoint out — schema validation, monitoring, and rollback. No ops theater.",
    ctaText: "Start free",
    benefits: [
      {
        icon: "code",
        title: "Describe the API",
        description:
          "Say what the endpoint should return. ZZAI drafts the schema, validation, and handlers.",
      },
      {
        icon: "shield",
        title: "Guards included",
        description:
          "API keys, rate limits, and schema checks on every response — not bolted on later.",
      },
      {
        icon: "layers",
        title: "Scales with traffic",
        description:
          "Pay for what you use. The endpoint grows with demand without a redeploy ritual.",
      },
    ],
    faqs: [
      {
        question: "How long does it take to create an API?",
        answer: "Most people have a working endpoint in a few minutes: describe, review, deploy.",
      },
      {
        question: "Do I need backend experience?",
        answer: "No. If you can describe the contract, ZZAI handles the rest.",
      },
      {
        question: "What happens under high traffic?",
        answer: "Endpoints auto-scale with demand. You pay for usage, not idle capacity.",
      },
    ],
  },
  "prompt-to-api": {
    title: "Prompt to API",
    metaTitle: "Prompt to API | ZZAI",
    metaDescription:
      "Wrap a prompt in a versioned endpoint with evals, rollback, and usage metrics. Try free.",
    heroHeadline: "Turn a prompt into a live endpoint",
    heroSubheadline:
      "Stop copy-pasting the same prompt. Version it, eval it, and call it like any other API.",
    ctaText: "Create an API",
    benefits: [
      {
        icon: "sparkles",
        title: "Versions & A/B tests",
        description: "Every edit is a version. Split traffic and keep what wins.",
      },
      {
        icon: "zap",
        title: "Response caching",
        description: "Repeated queries hit cache when safe — lower cost, faster replies.",
      },
      {
        icon: "globe",
        title: "Multi-model routing",
        description: "Route across providers with fallbacks so one outage doesn’t take you down.",
      },
    ],
    faqs: [
      {
        question: "Can I use my own API keys?",
        answer: "Yes — bring your own keys, or use ZZAI’s pool. Switch anytime.",
      },
      {
        question: "How does prompt versioning work?",
        answer:
          "Each change is immutable. Roll back, compare outputs, or split traffic between variants.",
      },
      {
        question: "Is there a call limit?",
        answer: "Free tier includes a monthly allotment. Paid plans raise the cap.",
      },
    ],
  },
  "ai-app-generator": {
    title: "AI App Generator",
    metaTitle: "AI App Generator | ZZAI",
    metaDescription:
      "Scaffold APIs, schemas, and SDKs from a description. Ship a working backend without the ceremony.",
    heroHeadline: "Scaffold the backend from a description",
    heroSubheadline:
      "Endpoints, schemas, auth, and SDKs — generated from what you describe, ready to wire into your UI.",
    ctaText: "Start building",
    benefits: [
      {
        icon: "bot",
        title: "Full scaffold",
        description: "Routes, models, auth middleware, and docs from one description.",
      },
      {
        icon: "rocket",
        title: "SDK generation",
        description: "TypeScript and Python clients so your team can call the API immediately.",
      },
      {
        icon: "clock",
        title: "Built-in metrics",
        description: "Latency, errors, and usage on a dashboard — no separate ops stack required.",
      },
    ],
    faqs: [
      {
        question: "What can I generate?",
        answer: "Anything that needs AI-backed endpoints — tools, bots, pipelines, recommenders.",
      },
      {
        question: "Can I edit the output?",
        answer: "Yes. Export the OpenAPI spec and code, then extend it.",
      },
      {
        question: "How do I integrate?",
        answer: "Use the generated SDK or hit the REST endpoints from any HTTP client.",
      },
    ],
  },
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  code: Code,
  shield: Shield,
  layers: Layers,
  sparkles: Sparkles,
  zap: Zap,
  globe: Globe,
  bot: Bot,
  rocket: Rocket,
  clock: Clock,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) {
    return buildSeoMetadata({
      title: "Not Found",
      description: "Landing page not found.",
      path: `/lp/${slug}`,
      noindex: true,
    });
  }
  return buildSeoMetadata({
    title: page.metaTitle,
    description: page.metaDescription,
    path: `/lp/${slug}`,
  });
}

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = pages[slug];

  if (!page) {
    return (
      <div className="min-h-screen bg-[#0a0f14] flex items-center justify-center">
        <p className="text-white text-lg">Page not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f14] text-white">
      <nav className="w-full border-b border-white/10 bg-[#0a0f14]/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 px-6 py-4">
          <Link href="/" data-testid="link-home-logo">
            <BrandMark size="md" href={false} priority />
          </Link>
          <Link
            href="/dashboard"
            data-testid="link-nav-cta"
            className="text-sm font-medium px-4 py-2 rounded-md bg-[#5B8DA8] text-white transition-opacity hover:opacity-90"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight"
          data-testid="text-hero-headline"
        >
          {page.heroHeadline}
        </h1>
        <p
          className="mt-6 text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed"
          data-testid="text-hero-subheadline"
        >
          {page.heroSubheadline}
        </p>
        <div className="mt-10">
          <Link
            href="/dashboard"
            data-testid="link-hero-cta"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-md bg-[#5B8DA8] text-white text-lg font-semibold transition-opacity hover:opacity-90"
          >
            {page.ctaText}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div data-testid="stat-apis-created">
            <p className="text-3xl sm:text-4xl font-bold text-[#5B8DA8]">10K+</p>
            <p className="mt-1 text-sm text-white/60">APIs Created</p>
          </div>
          <div data-testid="stat-uptime">
            <p className="text-3xl sm:text-4xl font-bold text-[#5B8DA8]">99.9%</p>
            <p className="mt-1 text-sm text-white/60">Uptime SLA</p>
          </div>
          <div data-testid="stat-latency">
            <p className="text-3xl sm:text-4xl font-bold text-[#5B8DA8]">50ms</p>
            <p className="mt-1 text-sm text-white/60">Avg Latency</p>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Why Teams Choose ZZAI</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {page.benefits.map((benefit, i) => {
            const IconComp = iconMap[benefit.icon] || Zap;
            return (
              <div
                key={i}
                className="rounded-md border border-white/10 bg-white/5 p-6"
                data-testid={`card-benefit-${i}`}
              >
                <div className="w-10 h-10 rounded-md bg-[#5B8DA8]/20 flex items-center justify-center mb-4">
                  <IconComp className="w-5 h-5 text-[#5B8DA8]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to get started?</h2>
        <p className="text-white/60 mb-8">
          No credit card required. Build your first API in under 5 minutes.
        </p>
        <Link
          href="/dashboard"
          data-testid="link-mid-cta"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-md bg-[#5B8DA8] text-white text-lg font-semibold transition-opacity hover:opacity-90"
        >
          {page.ctaText}
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {page.faqs.map((faq, i) => (
            <details
              key={i}
              className="group rounded-md border border-white/10 bg-white/5"
              data-testid={`faq-item-${i}`}
            >
              <summary className="flex items-center justify-between gap-4 cursor-pointer px-6 py-4 text-left font-medium list-none">
                {faq.question}
                <ChevronDown className="w-4 h-4 text-white/40 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-6 pb-4 text-sm text-white/60 leading-relaxed">{faq.answer}</div>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 mt-8">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/" data-testid="link-footer-home">
            <BrandMark size="sm" href={false} />
          </Link>
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} ZZAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
