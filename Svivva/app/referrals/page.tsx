import Link from "next/link";
import { Gift, Users, TrendingUp, Share2, Copy, ArrowRight, CheckCircle, Zap } from "lucide-react";
import { ReferralWidget } from "@/components/referral-widget";
import { Button } from "@/components/ui/button";

const TEAL = "#5BA8A0";
const BURG = "#6B2C4A";

const benefits = [
  {
    icon: Gift,
    title: "Earn Up to 10% Commission",
    description:
      "Get paid for every subscription from your referrals, with multi-level earnings up to 3 levels deep.",
  },
  {
    icon: Users,
    title: "Build Your Network",
    description:
      "Earn from your direct referrals AND their referrals, creating a passive income stream.",
  },
  {
    icon: Zap,
    title: "Instant Signup Bonuses",
    description:
      "New users get bonuses when they sign up through your referral link, and you earn too.",
  },
  {
    icon: TrendingUp,
    title: "Track Everything",
    description:
      "Real-time dashboard shows your referrals, earnings, and pending payments at a glance.",
  },
];

const tiers = [
  {
    level: 1,
    name: "Direct Referrals",
    rate: "10%",
    description: "Users who sign up directly from your link",
  },
  {
    level: 2,
    name: "Indirect Referrals",
    rate: "5%",
    description: "Users referred by your direct referrals",
  },
  {
    level: 3,
    name: "Network Referrals",
    rate: "2%",
    description: "Third-level referrals from your network",
  },
];

export default function ReferralsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border bg-card/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold" style={{ color: TEAL }}>
            ← Svivva
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-lg border"
            style={{ borderColor: TEAL, color: TEAL }}
          >
            Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full mb-6 border"
            style={{ borderColor: `${TEAL}50`, color: TEAL, background: `${TEAL}10` }}
          >
            <Gift className="w-4 h-4" /> Referral Program
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            <span style={{ color: TEAL }}>Earn Money</span>
            <span className="text-foreground"> by Sharing Svivva</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Build a passive income stream with our multi-level referral program. Earn up to 10%
            commission on subscriptions from your network.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="rounded-2xl border-2 border-border bg-card p-6">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${TEAL}15` }}
              >
                <benefit.icon className="w-6 h-6" style={{ color: TEAL }} />
              </div>
              <h3 className="font-bold text-foreground mb-2">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* Compensation Tiers */}
        <div className="mb-16">
          <h2 className="text-2xl font-black text-center mb-8">Multi-Level Compensation</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <div key={tier.level} className="rounded-2xl border-2 border-border bg-card p-6">
                <div className="text-3xl font-black mb-2" style={{ color: TEAL }}>
                  {tier.rate}
                </div>
                <h3 className="font-bold text-foreground mb-1">{tier.name}</h3>
                <p className="text-sm text-muted-foreground">{tier.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-2xl font-black text-center mb-8">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Share Your Link",
                desc: "Copy your unique referral link and share it on social media, email, or your website",
              },
              {
                step: "2",
                title: "They Sign Up",
                desc: "When someone clicks your link and signs up for Svivva, they become your referral",
              },
              {
                step: "3",
                title: "You Earn",
                desc: "Get paid commission on their subscription, plus earnings from their referrals too",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-black text-xl"
                  style={{ background: TEAL }}
                >
                  {item.step}
                </div>
                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Referral Widget */}
        <div className="max-w-md mx-auto mb-16">
          <h2 className="text-2xl font-black text-center mb-8">Start Earning Now</h2>
          <ReferralWidget variant="prominent" />
        </div>

        {/* Promotional Materials */}
        <div className="mb-16">
          <h2 className="text-2xl font-black text-center mb-8">Promotional Materials</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                title: "Social Media Posts",
                description:
                  "Pre-written posts for Twitter, LinkedIn, and Facebook to share your referral link",
                icon: Share2,
              },
              {
                title: "Email Templates",
                description: "Professional email templates to send to your network",
                icon: Copy,
              },
              {
                title: "Banner Ads",
                description: "Eye-catching banners for your website or blog",
                icon: TrendingUp,
              },
              {
                title: "Video Scripts",
                description: "Short video scripts for TikTok, Instagram Reels, and YouTube Shorts",
                icon: Zap,
              },
            ].map((material) => (
              <div
                key={material.title}
                className="rounded-2xl border-2 border-border bg-card p-6 hover:border-[#5BA8A0]/50 transition-colors cursor-pointer"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${TEAL}15` }}
                >
                  <material.icon className="w-6 h-6" style={{ color: TEAL }} />
                </div>
                <h3 className="font-bold text-foreground mb-2">{material.title}</h3>
                <p className="text-sm text-muted-foreground">{material.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Cross-Promotion */}
        <div className="rounded-2xl border border-border bg-muted/20 p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: TEAL }} />
            <div>
              <h3 className="font-bold text-foreground mb-2">Promote Across All Your Apps</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Your referral link works across all Svivva ecosystem apps:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  • <strong>Svivva</strong> — Main AI development platform
                </li>
                <li>
                  • <strong>Pyracrypt</strong> — File encryption and security
                </li>
                <li>
                  • <strong>AI Tools Hub</strong> — AI generators and tools
                </li>
                <li>
                  • <strong>Cyber Security Mini Apps</strong> — Security tools
                </li>
                <li>
                  • <strong>Svivva SEO Pack</strong> — SEO tools and resources
                </li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                Share one link across all apps and earn from signups anywhere in the ecosystem.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
