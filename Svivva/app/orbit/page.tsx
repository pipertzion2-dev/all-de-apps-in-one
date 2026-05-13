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
  CheckCircle,
  ArrowRight,
  Gift,
  Copy,
  Shield,
  Brain,
  Search,
  Megaphone,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TEAL = "#5BA8A0";
const BURG = "#6B2C4A";

const PRODUCTS = [
  {
    name: "Svivva",
    href: "/",
    icon: Rocket,
    color: BURG,
    description: "AI-powered app builder — turn prompts into production APIs",
    features: ["App generation", "API builder", "AI endpoints"],
  },
  {
    name: "Pyracrypt",
    href: "/pyracrypt",
    icon: Shield,
    color: "#e11d48",
    description: "End-to-end encryption & security tools for developers",
    features: ["File encryption", "Password tools", "Security audit"],
  },
  {
    name: "AI Tools Hub",
    href: "/ai-tools-hub",
    icon: Brain,
    color: "#8b5cf6",
    description: "50+ free AI-powered generators, analyzers, and utilities",
    features: ["Text generators", "Code assistants", "Data analyzers"],
  },
  {
    name: "Cyber Security Tools",
    href: "/cyber-security-mini-apps",
    icon: Shield,
    color: "#059669",
    description: "Free security scanners, analyzers & hardening tools",
    features: ["Port scanning", "Vulnerability check", "SSL analysis"],
  },
  {
    name: "SEO Pack",
    href: "/seo-pack",
    icon: Search,
    color: "#0891b2",
    description: "SEO auditing, keyword research & optimization tools",
    features: ["Keyword research", "Site audit", "Rank tracking"],
  },
  {
    name: "Marketing Hub",
    href: "/marketing-hub",
    icon: Megaphone,
    color: "#d97706",
    description: "Campaign management, lead tracking & referrals",
    features: ["Campaigns", "Lead capture", "Referrals"],
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
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Hero */}
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full mb-6 border"
            style={{ borderColor: `${TEAL}50`, color: TEAL, background: `${TEAL}10` }}
          >
            <Rocket className="w-4 h-4" /> Svivva Ecosystem
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            <span style={{ color: TEAL }}>Orbit</span>
            <span className="text-white"> — All Products</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Everything built on Svivva — AI tools, security, SEO, and marketing — all free to use.
          </p>
        </div>

        {/* Products Grid */}
        <div className="mb-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRODUCTS.map((product) => (
              <Link
                key={product.name}
                href={product.href}
                className="group rounded-2xl border-2 border-white/10 bg-white/5 backdrop-blur-sm p-5 hover:border-white/25 hover:bg-white/8 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: `${product.color}20`,
                      border: `1px solid ${product.color}40`,
                    }}
                  >
                    <product.icon className="w-5 h-5" style={{ color: product.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white group-hover:text-white/90 truncate">
                      {product.name}
                    </h3>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" />
                </div>
                <p className="text-xs text-white/50 mb-3 leading-relaxed">{product.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {product.features.map((f) => (
                    <span
                      key={f}
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: `${product.color}15`,
                        color: `${product.color}cc`,
                        border: `1px solid ${product.color}25`,
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

        {/* What you get */}
        <div className="mb-16 rounded-2xl border-2 border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <h2 className="font-black text-lg mb-6 text-white text-center">What You Get — Free</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Globe, title: "50+ AI Tools", desc: "Security, SEO, text, code — all free, no signup" },
              { icon: Zap, title: "AI API Builder", desc: "Turn prompts into production APIs instantly" },
              { icon: Shield, title: "Security Suite", desc: "Encryption, scanning, and audit tools" },
              { icon: Search, title: "SEO Tools", desc: "Keyword research, audits, rank tracking" },
              { icon: Megaphone, title: "Marketing Tools", desc: "Campaigns, UTM, A/B tests, leads" },
              { icon: Gift, title: "Referral Rewards", desc: "Earn commission sharing Svivva" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${TEAL}20` }}
                >
                  <item.icon className="w-4 h-4" style={{ color: TEAL }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{item.title}</p>
                  <p className="text-xs text-white/50">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
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
                Earn up to 10% commission by sharing Svivva. Track clicks, signups, and conversions.
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

        {/* Get Started */}
        <div className="max-w-lg mx-auto mb-12 text-center">
          <Button
            size="lg"
            onClick={() => router.push("/")}
            className="w-full font-bold text-sm"
            style={{ background: `linear-gradient(135deg, ${BURG}, ${TEAL})` }}
          >
            <Rocket className="w-4 h-4 mr-2" />
            Get Started with Svivva
          </Button>
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
