import Link from "next/link";
import {
  Rocket,
  Zap,
  Globe,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Shield,
  Search,
  Gift,
} from "lucide-react";
import { getAllWorkspaceProjects } from "@/lib/workspace-external-apps";
import { ReferralWidget } from "@/components/referral-widget";

const TEAL = "#5BA8A0";
const BURG = "#6B2C4A";

const features = [
  {
    icon: Zap,
    title: "IndexNow Integration",
    description:
      "Auto-submit all your pages to Bing, Yandex, Yahoo & DuckDuckGo instantly. No account needed.",
  },
  {
    icon: Globe,
    title: "SEO Landing Pages",
    description:
      "Generate 20+ high-converting SEO pages that drive organic traffic to your tools and apps.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Track visitors, conversions, and traffic sources with built-in analytics integration.",
  },
  {
    icon: Rocket,
    title: "Social Media Automation",
    description:
      "Generate and schedule social media content across multiple platforms automatically.",
  },
];

const allProjects = getAllWorkspaceProjects();

const steps = [
  {
    number: "1",
    title: "Connect Services",
    desc: "Link Google Search Console, GoDaddy, and analytics tools",
  },
  { number: "2", title: "Run Autopilot", desc: "One-click health check and page generation" },
  {
    number: "3",
    title: "Launch Campaigns",
    desc: "Submit sitemaps, create social content, and track results",
  },
];

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold" style={{ color: TEAL }}>
            ← Svivva
          </Link>
          <Link
            href="/seeds"
            className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg border"
            style={{ borderColor: TEAL, color: TEAL }}
          >
            Back to Seeds <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full mb-6 border"
            style={{ borderColor: `${TEAL}50`, color: TEAL, background: `${TEAL}10` }}
          >
            <Rocket className="w-4 h-4" /> Orbit Marketing Funnel
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            <span style={{ color: TEAL }}>Drive Traffic</span>
            <span className="text-foreground"> to Your Apps</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            One-click marketing automation that generates SEO pages, submits to search engines, and
            creates social media content — all from a single dashboard.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-2xl border-2 border-border bg-card p-6">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${TEAL}15` }}
              >
                <feature.icon className="w-6 h-6" style={{ color: TEAL }} />
              </div>
              <h3 className="font-bold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-black text-center mb-8">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold"
                    style={{ background: TEAL }}
                  >
                    {step.number}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-3xl border-2 p-8 text-center"
          style={{ borderColor: `${TEAL}30`, background: `${TEAL}05` }}
        >
          <Rocket className="w-12 h-12 mx-auto mb-4" style={{ color: TEAL }} />
          <h2 className="text-2xl font-black mb-3">Access Orbit Marketing System</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Full marketing automation with IndexNow integration, SEO page generation, and social
            media tools for all your projects.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/orbit"
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold"
              style={{ background: TEAL }}
            >
              Open Orbit Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/referrals"
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold border border-border"
            >
              Referral Program
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Requires authentication to access full marketing features
          </p>
        </div>

        <div
          className="rounded-3xl border-2 p-8 text-center"
          style={{ borderColor: `${TEAL}30`, background: `${TEAL}05` }}
        >
          <Gift className="w-12 h-12 mx-auto mb-4" style={{ color: TEAL }} />
          <h2 className="text-2xl font-black mb-3">Earn Money Referring Users</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Join our multi-level referral program and earn up to 10% commission on subscriptions
            from your network.
          </p>
          <ReferralWidget variant="prominent" />
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-black text-center mb-8">All Your Projects</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allProjects.map((project) => {
              const Icon =
                project.category === "security"
                  ? Shield
                  : project.category === "ai-tools"
                    ? Zap
                    : project.category === "security-tools"
                      ? Globe
                      : project.category === "seo-tools"
                        ? Search
                        : Rocket;
              return (
                <a
                  key={project.name}
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border-2 border-border bg-card p-6 hover:border-[#5BA8A0]/50 transition-colors"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${TEAL}15` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: TEAL }} />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{project.name}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{project.category}</p>
                </a>
              );
            })}
          </div>
        </div>

        <div className="mt-12 rounded-2xl border-2 border-[#6B2C4A]/40 bg-gradient-to-br from-[#6B2C4A]/5 to-transparent p-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#6B2C4A" }} />
            <div>
              <h3 className="font-bold text-foreground mb-2">Pyracrypt Security Suite</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Your flagship encryption and security product. Orbit marketing includes:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  • <strong>Custom SEO pages</strong> for encryption keywords
                </li>
                <li>
                  • <strong>Competitor comparisons</strong> vs other security tools
                </li>
                <li>
                  • <strong>Directory listings</strong> on security-focused platforms
                </li>
                <li>
                  • <strong>Subdomain setup</strong> (pyracrypt.svivva.com, security.svivva.com)
                </li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                Access Orbit Dashboard to run Pyracrypt-specific marketing campaigns.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-muted/20 p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: TEAL }} />
            <div>
              <h3 className="font-bold text-foreground mb-2">Unified Marketing Funnel</h3>
              <p className="text-sm text-muted-foreground">
                Orbit autopilot checks all projects and generates marketing content for everything
                in your monorepo:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                {allProjects.map((project) => (
                  <li key={project.name}>
                    • <strong>{project.name}</strong> — {project.category}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                All projects are indexed together in the sitemap and promoted through unified
                marketing campaigns.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
