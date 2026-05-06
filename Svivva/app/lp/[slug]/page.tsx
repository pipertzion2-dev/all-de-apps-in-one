import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
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
import svivvaLogo from "@/attached_assets/SVIVVA_OFFICIAL_LOGO_1769201341308.png";

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
    title: "AI API Builder",
    metaTitle: "AI API Builder - Create Production APIs in Minutes | Svivva",
    metaDescription:
      "Build, deploy, and scale AI-powered APIs without infrastructure headaches. Go from idea to production endpoint in under 5 minutes. Start free today.",
    heroHeadline: "Build Production AI APIs in Minutes, Not Months",
    heroSubheadline:
      "Describe what you need in plain English. Svivva generates a fully functional, scalable API endpoint — complete with authentication, rate limiting, and monitoring. No DevOps required.",
    ctaText: "Start Building Free",
    benefits: [
      {
        icon: "code",
        title: "Describe, Don't Code",
        description:
          "Tell Svivva what your API should do in natural language. Our AI architect designs the schema, validation, and business logic automatically.",
      },
      {
        icon: "shield",
        title: "Enterprise Security Built In",
        description:
          "Every API ships with OAuth2, API key management, rate limiting, and DDoS protection. SOC2-ready from day one.",
      },
      {
        icon: "layers",
        title: "Auto-Scaling Infrastructure",
        description:
          "Handle 10 requests or 10 million. Our elastic infrastructure scales seamlessly — you only pay for what you use.",
      },
    ],
    faqs: [
      {
        question: "How long does it take to create an API?",
        answer:
          "Most users have a working API endpoint in under 5 minutes. Describe your requirements, review the generated specification, and deploy with one click.",
      },
      {
        question: "Do I need backend development experience?",
        answer:
          "No. Svivva handles all the infrastructure, authentication, and deployment. If you can describe what you need, you can build an API.",
      },
      {
        question: "What happens if my API gets high traffic?",
        answer:
          "Svivva auto-scales your endpoints based on demand. Our infrastructure handles traffic spikes automatically with zero downtime.",
      },
    ],
  },
  "prompt-to-api": {
    title: "Prompt to API",
    metaTitle:
      "Prompt to API - Turn Any AI Prompt Into a Scalable Endpoint | Svivva",
    metaDescription:
      "Transform your AI prompts into production-ready API endpoints instantly. Version control, A/B testing, and analytics included. Try free.",
    heroHeadline: "Turn Any AI Prompt Into a Live API Endpoint",
    heroSubheadline:
      "Stop copy-pasting prompts between tools. Svivva wraps your best prompts in production-grade endpoints with versioning, analytics, and team collaboration — so your AI workflows scale beyond a single user.",
    ctaText: "Create Your API Now",
    benefits: [
      {
        icon: "sparkles",
        title: "Prompt Versioning & A/B Testing",
        description:
          "Track every prompt iteration. Run A/B tests across versions to find the highest-performing prompts with real usage data.",
      },
      {
        icon: "zap",
        title: "Sub-50ms Response Caching",
        description:
          "Intelligent semantic caching serves repeated queries instantly. Cut your AI costs by up to 70% while improving response times.",
      },
      {
        icon: "globe",
        title: "Multi-Model Routing",
        description:
          "Route requests to GPT-4, Claude, Gemini, or open-source models. Automatic fallback ensures your API never goes down.",
      },
    ],
    faqs: [
      {
        question: "Can I use my own OpenAI or Anthropic API keys?",
        answer:
          "Yes. Bring your own keys for any supported model provider, or use Svivva's shared pool with pay-per-use pricing. Switch between them anytime.",
      },
      {
        question: "How does prompt versioning work?",
        answer:
          "Every change creates an immutable version. You can roll back instantly, compare outputs across versions, and run traffic splits between prompt variants.",
      },
      {
        question: "Is there a limit on API calls?",
        answer:
          "The free tier includes 1,000 API calls per month. Paid plans start at $29/month with unlimited calls and priority support.",
      },
    ],
  },
  "ai-app-generator": {
    title: "AI App Generator",
    metaTitle:
      "AI App Generator - Full-Stack AI Applications From a Description | Svivva",
    metaDescription:
      "Generate complete AI-powered applications with APIs, databases, and frontends from a single description. Ship your MVP in hours, not weeks.",
    heroHeadline: "Ship Your AI-Powered App Before Lunch",
    heroSubheadline:
      "Describe your application idea. Svivva generates the complete stack — API endpoints, database schemas, authentication flows, and SDK packages — ready to integrate into any frontend or mobile app.",
    ctaText: "Build Your First AI API",
    benefits: [
      {
        icon: "bot",
        title: "Complete Application Scaffolding",
        description:
          "Get a fully structured project with API routes, data models, auth middleware, and documentation generated from your description.",
      },
      {
        icon: "rocket",
        title: "One-Click SDK Generation",
        description:
          "Automatically generate TypeScript, Python, and cURL SDKs for your API. Share a single npm install command with your team.",
      },
      {
        icon: "clock",
        title: "Built-In Observability",
        description:
          "Monitor latency, error rates, and usage patterns from a real-time dashboard. Set alerts for anomalies before your users notice.",
      },
    ],
    faqs: [
      {
        question: "What kind of apps can I generate?",
        answer:
          "Any application that needs AI-powered API endpoints — SaaS tools, chatbots, content generators, data pipelines, recommendation engines, and more.",
      },
      {
        question: "Can I customize the generated code?",
        answer:
          "Absolutely. Export the full OpenAPI specification and generated code. Modify endpoints, add custom logic, or extend the schema as needed.",
      },
      {
        question: "How do I integrate with my existing app?",
        answer:
          "Use the auto-generated SDK or call the REST endpoints directly. Svivva APIs work with any language, framework, or platform that supports HTTP.",
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
    return { title: "Not Found" };
  }
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      type: "website",
    },
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
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
            <Image
              src={svivvaLogo}
              alt="Svivva"
              width={120}
              height={36}
              priority
            />
          </Link>
          <Link
            href="/dashboard"
            data-testid="link-nav-cta"
            className="text-sm font-medium px-4 py-2 rounded-md bg-[#5BA8A0] text-white transition-opacity hover:opacity-90"
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
            className="inline-flex items-center gap-2 px-8 py-4 rounded-md bg-[#5BA8A0] text-white text-lg font-semibold transition-opacity hover:opacity-90"
          >
            {page.ctaText}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div data-testid="stat-apis-created">
            <p className="text-3xl sm:text-4xl font-bold text-[#5BA8A0]">
              10K+
            </p>
            <p className="mt-1 text-sm text-white/60">APIs Created</p>
          </div>
          <div data-testid="stat-uptime">
            <p className="text-3xl sm:text-4xl font-bold text-[#5BA8A0]">
              99.9%
            </p>
            <p className="mt-1 text-sm text-white/60">Uptime SLA</p>
          </div>
          <div data-testid="stat-latency">
            <p className="text-3xl sm:text-4xl font-bold text-[#5BA8A0]">
              50ms
            </p>
            <p className="mt-1 text-sm text-white/60">Avg Latency</p>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
          Why Teams Choose Svivva
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {page.benefits.map((benefit, i) => {
            const IconComp = iconMap[benefit.icon] || Zap;
            return (
              <div
                key={i}
                className="rounded-md border border-white/10 bg-white/5 p-6"
                data-testid={`card-benefit-${i}`}
              >
                <div className="w-10 h-10 rounded-md bg-[#5BA8A0]/20 flex items-center justify-center mb-4">
                  <IconComp className="w-5 h-5 text-[#5BA8A0]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">
          Ready to get started?
        </h2>
        <p className="text-white/60 mb-8">
          No credit card required. Build your first API in under 5 minutes.
        </p>
        <Link
          href="/dashboard"
          data-testid="link-mid-cta"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-md bg-[#5BA8A0] text-white text-lg font-semibold transition-opacity hover:opacity-90"
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
              <div className="px-6 pb-4 text-sm text-white/60 leading-relaxed">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 mt-8">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/" data-testid="link-footer-home">
            <Image src={svivvaLogo} alt="Svivva" width={90} height={28} />
          </Link>
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} Svivva. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
