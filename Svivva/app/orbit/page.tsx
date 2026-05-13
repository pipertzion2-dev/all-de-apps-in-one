"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Rocket,
  Zap,
  Globe,
  Activity,
  FileText,
  ListChecks,
  CheckCircle,
  ArrowRight,
  Gift,
  Share2,
  Copy,
  Loader2,
  Shield,
  Brain,
  Search,
  BarChart3,
  Megaphone,
  Users,
  ExternalLink,
  Package,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TEAL = "#5BA8A0";
const BURG = "#6B2C4A";

const PROJECTS = [
  {
    name: "Svivva",
    href: "/",
    icon: Rocket,
    color: BURG,
    description: "AI-powered app builder — the core platform that powers everything",
    features: ["App generation", "API builder", "AI endpoints", "Deployment"],
  },
  {
    name: "Pyracrypt",
    href: "/pyracrypt",
    icon: Shield,
    color: "#e11d48",
    description: "End-to-end encryption & security tools for developers and enterprises",
    features: ["File encryption", "Password tools", "Security audit", "Key management"],
  },
  {
    name: "AI Tools Hub",
    href: "/ai-tools-hub",
    icon: Brain,
    color: "#8b5cf6",
    description: "Collection of AI-powered generators, analyzers, and utilities",
    features: ["Text generators", "Image tools", "Code assistants", "Data analyzers"],
  },
  {
    name: "Cyber Security",
    href: "/cyber-security-mini-apps",
    icon: Shield,
    color: "#059669",
    description: "Security scanners, analyzers & hardening tools for your infrastructure",
    features: ["Port scanning", "Vulnerability check", "SSL analysis", "Network audit"],
  },
  {
    name: "SEO Pack",
    href: "/seo-pack",
    icon: Search,
    color: "#0891b2",
    description: "SEO auditing, keyword research & search optimization tools",
    features: ["Keyword research", "Site audit", "Rank tracking", "Backlink analysis"],
  },
  {
    name: "Marketing Hub",
    href: "/marketing-hub",
    icon: Megaphone,
    color: "#d97706",
    description: "Campaign management, lead tracking, referrals, UTM builder & A/B tests",
    features: ["Campaigns", "Lead capture", "Referrals", "UTM tracking", "A/B tests"],
  },
];

const TRAFFIC_FUNNEL = [
  {
    icon: Globe,
    title: "SEO Pages & Blog",
    description:
      "AI-generated landing pages, comparison posts, and blog content rank on Google and drive organic traffic to all projects.",
  },
  {
    icon: Zap,
    title: "IndexNow + Google Indexing",
    description:
      "Instant submission to Bing, Yandex, Yahoo via IndexNow. Google Indexing API + Search Console for maximum coverage.",
  },
  {
    icon: Activity,
    title: "Cross-Product Funnels",
    description:
      "Every app links to every other app. Tool pages on svivva.com drive users to Pyracrypt, AI Tools Hub, and back.",
  },
  {
    icon: Users,
    title: "Referral System",
    description:
      "Multi-level referral program rewards users for bringing new traffic. Tracks clicks, signups, and conversions.",
  },
  {
    icon: BarChart3,
    title: "Marketing Hub Analytics",
    description:
      "Campaigns, leads, UTM tracking, and A/B tests measure what's working and optimize for maximum conversions.",
  },
  {
    icon: FileText,
    title: "Content Amplification",
    description:
      "AI rewrites your content for Twitter, LinkedIn, email, Instagram — one input generates posts for every channel.",
  },
];

export default function OrbitPage() {
  const router = useRouter();
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyReferralLink = () => {
    const link = `https://svivva.com?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast({ title: "Referral link copied!", duration: 2000 });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Admin Access */}
      <div className="fixed top-4 right-4 z-50">
        <Link href="/dashboard/launchpad">
          <Button
            variant="outline"
            className="bg-slate-800/50 backdrop-blur-sm border-slate-700 text-white hover:bg-slate-700"
            size="sm"
          >
            <Rocket className="w-4 h-4 mr-2" />
            Admin Orbit
          </Button>
        </Link>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Hero */}
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full mb-6 border"
            style={{ borderColor: `${TEAL}50`, color: TEAL, background: `${TEAL}10` }}
          >
            <Rocket className="w-4 h-4" /> Your Projects · One Orbit
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            <span style={{ color: TEAL }}>Orbit</span>
            <span className="text-white"> Project Hub</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            All your apps, tools, and marketing systems connected in one ecosystem. Every project
            drives traffic to every other project — automatically indexed and funneled for maximum
            reach.
          </p>
        </div>

        {/* All Projects Grid */}
        <div className="mb-16">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/40 mb-4 px-1">
            Your Projects
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PROJECTS.map((project) => (
              <Link
                key={project.name}
                href={project.href}
                className="group rounded-2xl border-2 border-white/10 bg-white/5 backdrop-blur-sm p-5 hover:border-white/25 hover:bg-white/8 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `${project.color}20`,
                      border: `1px solid ${project.color}40`,
                    }}
                  >
                    <project.icon className="w-5 h-5" style={{ color: project.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white group-hover:text-white/90 truncate">
                      {project.name}
                    </h3>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" />
                </div>
                <p className="text-xs text-white/50 mb-3 leading-relaxed">{project.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {project.features.map((f) => (
                    <span
                      key={f}
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: `${project.color}15`,
                        color: `${project.color}cc`,
                        border: `1px solid ${project.color}25`,
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Traffic Funnel System */}
        <div className="mb-16">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/40 mb-4 px-1">
            How Traffic Flows
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TRAFFIC_FUNNEL.map((item, i) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                    style={{ background: TEAL }}
                  >
                    {i + 1}
                  </div>
                  <h3 className="font-bold text-sm text-white">{item.title}</h3>
                </div>
                <p className="text-xs text-white/50 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Funnel Visualization */}
        <div className="mb-16 rounded-2xl border-2 border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <h2 className="text-center font-black text-lg mb-6 text-white">The Orbit Traffic Loop</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-2 text-center flex-wrap">
            {[
              { label: "Google / Bing", sub: "SEO pages rank", color: "#4285f4" },
              { label: "svivva.com", sub: "Core platform", color: BURG },
              { label: "Mini Apps", sub: "50+ tools", color: TEAL },
              { label: "Pyracrypt", sub: "Security suite", color: "#e11d48" },
              { label: "Marketing Hub", sub: "Campaigns & leads", color: "#d97706" },
              { label: "Referrals", sub: "Users bring users", color: "#8b5cf6" },
            ].map((node, i, arr) => (
              <div key={node.label} className="flex items-center gap-2 sm:gap-2">
                <div className="flex flex-col items-center">
                  <div
                    className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center border-2"
                    style={{ borderColor: `${node.color}50`, background: `${node.color}15` }}
                  >
                    <span className="text-[11px] font-black" style={{ color: node.color }}>
                      {node.label}
                    </span>
                    <span className="text-[9px] text-white/40 mt-0.5">{node.sub}</span>
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-white/20 flex-shrink-0 hidden sm:block" />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-[11px] text-white/30 mt-4">
            Every node drives traffic to every other node — a self-reinforcing growth loop
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="max-w-lg mx-auto mb-12 grid sm:grid-cols-2 gap-3">
          <Button
            size="lg"
            onClick={() => router.push("/dashboard/launchpad")}
            className="w-full font-bold text-sm"
            style={{ background: `linear-gradient(135deg, ${BURG}, ${TEAL})` }}
          >
            <Rocket className="w-4 h-4 mr-2" />
            Open Admin Orbit
          </Button>
          <Button
            size="lg"
            onClick={() => router.push("/marketing-hub")}
            className="w-full font-bold text-sm"
            style={{ background: "#d97706" }}
          >
            <Megaphone className="w-4 h-4 mr-2" />
            Marketing Hub
          </Button>
        </div>

        {/* Referral Section */}
        <div className="max-w-md mx-auto rounded-2xl border-2 border-[#5BA8A0]/40 bg-gradient-to-br from-[#5BA8A0]/5 to-transparent p-6 mb-12">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#5BA8A0]/15 border border-[#5BA8A0]/30 flex items-center justify-center flex-shrink-0">
              <Gift className="w-5 h-5" style={{ color: "#5BA8A0" }} />
            </div>
            <div>
              <h2 className="font-bold text-white mb-1">Referral Program</h2>
              <p className="text-xs text-white/50">
                Earn up to 10% commission with multi-level referral rewards. Share your link — track
                clicks, signups, and conversions in the Marketing Hub.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Your referral code"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className="text-sm bg-white/10 border-white/20 text-white placeholder:text-white/30"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={copyReferralLink}
                disabled={!referralCode}
                className="flex-1 font-bold"
                style={{ background: "#5BA8A0" }}
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 mr-2" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                {copied ? "Copied!" : "Copy Referral Link"}
              </Button>
              <Link href="/marketing-hub/referrals">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Manage
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Links Footer */}
        <div className="text-center space-y-3">
          <p className="text-[11px] uppercase tracking-wider text-white/25 font-bold">
            Quick Links
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: "Blog", href: "/blog" },
              { label: "Tools", href: "/tools" },
              { label: "Docs", href: "/docs" },
              { label: "Seeds", href: "/seeds" },
              { label: "Sitemap", href: "/sitemap.xml" },
            ].map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-xs text-white/40 hover:text-white/70 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
