"use client";

import { useState } from "react";
import Link from "next/link";
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
  FileText,
  BarChart3,
  Search,
  Megaphone,
  Users,
  Loader2,
  ExternalLink,
  ListChecks,
  Share2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TEAL = "#5BA8A0";
const BURG = "#6B2C4A";

const FUNNEL_STEPS = [
  {
    num: "1",
    icon: Globe,
    title: "Connect Your Project",
    description:
      "Paste your live app or website URL. Orbit scans it and discovers all your pages, tools, and features automatically.",
  },
  {
    num: "2",
    icon: FileText,
    title: "AI Generates SEO Content",
    description:
      "Orbit creates optimized landing pages, comparison posts, and blog articles targeting high-traffic keywords for your project.",
  },
  {
    num: "3",
    icon: Search,
    title: "Instant Search Engine Submission",
    description:
      "All generated pages are submitted to Google, Bing, Yandex, and Yahoo via IndexNow and sitemap pings — indexing starts within hours.",
  },
  {
    num: "4",
    icon: Megaphone,
    title: "Social & Launch Pack",
    description:
      "AI generates a complete launch kit — Twitter thread, LinkedIn post, Reddit posts, Product Hunt copy, and Show HN — ready to paste.",
  },
  {
    num: "5",
    icon: BarChart3,
    title: "Track & Grow",
    description:
      "Monitor which pages rank, track referral traffic, and run A/B tests. Orbit keeps optimizing your funnel automatically.",
  },
];

export default function OrbitPage() {
  const [projectUrl, setProjectUrl] = useState("");
  const [projectName, setProjectName] = useState("");
  const [step, setStep] = useState<"input" | "preview" | "launched">("input");
  const [launching, setLaunching] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleScan = () => {
    if (!projectUrl.trim()) {
      toast({ title: "Enter your project URL first", duration: 2000 });
      return;
    }
    const name =
      projectName.trim() ||
      projectUrl
        .replace(/https?:\/\//, "")
        .split(".")[0]
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    setProjectName(name);
    setStep("preview");
    toast({
      title: `Scanned: ${name}`,
      description: "Review your marketing plan below.",
      duration: 3000,
    });
  };

  const handleLaunch = async () => {
    setLaunching(true);
    // Simulate launch — in production this calls the orbit API
    await new Promise((r) => setTimeout(r, 2500));
    setLaunching(false);
    setStep("launched");
    toast({
      title: "Orbit launched!",
      description: "Your marketing funnel is being built.",
      duration: 5000,
    });
  };

  const copyReferralLink = () => {
    const link = `https://svivva.com?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast({ title: "Referral link copied!", duration: 2000 });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Admin nav — discrete */}
      <div className="fixed top-4 right-4 z-50">
        <Link href="/dashboard/launchpad">
          <Button
            variant="outline"
            className="bg-slate-800/50 backdrop-blur-sm border-slate-700 text-white hover:bg-slate-700"
            size="sm"
          >
            <Rocket className="w-4 h-4 mr-2" />
            Admin
          </Button>
        </Link>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Hero */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full mb-6 border"
            style={{ borderColor: `${TEAL}50`, color: TEAL, background: `${TEAL}10` }}
          >
            <Rocket className="w-4 h-4" /> Marketing Autopilot
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            <span style={{ color: TEAL }}>Orbit</span>
            <span className="text-white"> — Launch Your Project</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Connect any app or website. Orbit builds your entire marketing funnel — SEO pages, blog
            content, social launch pack, and search engine submission — automatically.
          </p>
        </div>

        {/* ── Connect Project ── */}
        <div className="rounded-2xl border-2 border-white/15 bg-white/5 backdrop-blur-sm p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${TEAL}20`, border: `1px solid ${TEAL}40` }}
            >
              <Globe className="w-5 h-5" style={{ color: TEAL }} />
            </div>
            <div>
              <h2 className="font-bold text-white text-lg">Connect Your Project</h2>
              <p className="text-xs text-white/50">
                Paste your live URL — Orbit handles everything else.
              </p>
            </div>
          </div>

          {step === "input" && (
            <div className="space-y-3">
              <Input
                placeholder="https://your-app.com"
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                className="text-sm bg-white/10 border-white/20 text-white placeholder:text-white/30 h-12"
              />
              <Input
                placeholder="Project name (optional — we'll detect it)"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="text-sm bg-white/10 border-white/20 text-white placeholder:text-white/30"
              />
              <Button
                onClick={handleScan}
                className="w-full font-bold h-12"
                style={{ background: `linear-gradient(135deg, ${BURG}, ${TEAL})` }}
              >
                <Search className="w-4 h-4 mr-2" />
                Scan & Build Marketing Plan
              </Button>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm font-bold text-white mb-1">{projectName}</p>
                <p className="text-xs text-white/40 font-mono">{projectUrl}</p>
              </div>

              <p className="text-xs font-bold text-white/60 uppercase tracking-wider">
                Orbit will generate:
              </p>
              <div className="grid gap-2">
                {[
                  {
                    icon: FileText,
                    label: "20+ SEO landing pages targeting high-traffic keywords",
                  },
                  { icon: Users, label: '8 competitor comparison pages ("Your App vs X")' },
                  { icon: FileText, label: "10 blog posts with conversion CTAs" },
                  {
                    icon: Megaphone,
                    label: "Social launch pack (Twitter, LinkedIn, Reddit, Product Hunt)",
                  },
                  { icon: Search, label: "Sitemap + IndexNow submission to all search engines" },
                  { icon: Share2, label: "Referral-ready links with tracking" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <item.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: TEAL }} />
                    <span className="text-xs text-white/70">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleLaunch}
                  disabled={launching}
                  className="flex-1 font-bold h-12"
                  style={{ background: `linear-gradient(135deg, ${BURG}, ${TEAL})` }}
                >
                  {launching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Building funnel…
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4 mr-2" /> Launch Orbit
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setStep("input")}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Back
                </Button>
              </div>
            </div>
          )}

          {step === "launched" && (
            <div className="text-center space-y-4 py-4">
              <div className="text-4xl">🚀</div>
              <h3 className="text-xl font-black text-white">Orbit is Live!</h3>
              <p className="text-sm text-white/50 max-w-sm mx-auto">
                Your marketing funnel for <strong className="text-white">{projectName}</strong> is
                being built. SEO pages, blog posts, and social content are generating now.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                <Link href="/marketing-hub">
                  <Button className="font-bold" style={{ background: TEAL }}>
                    <BarChart3 className="w-4 h-4 mr-2" /> View Marketing Hub
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("input");
                    setProjectUrl("");
                    setProjectName("");
                  }}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Zap className="w-4 h-4 mr-2" /> Add Another Project
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── How It Works ── */}
        <div className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/40 mb-4 px-1">
            How Orbit Works
          </h2>
          <div className="space-y-3">
            {FUNNEL_STEPS.map((s) => (
              <div
                key={s.num}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-start gap-4"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${BURG}, ${TEAL})` }}
                >
                  {s.num}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white mb-1">{s.title}</h3>
                  <p className="text-xs text-white/50 leading-relaxed">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── What You Get ── */}
        <div className="mb-10 rounded-2xl border-2 border-white/10 bg-white/[0.03] p-6">
          <h2 className="font-black text-lg mb-5 text-white text-center">
            Everything Orbit Builds for You
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: FileText,
                title: "SEO Landing Pages",
                desc: "AI-written, keyword-targeted pages that rank on Google",
              },
              {
                icon: Users,
                title: "Competitor Comparisons",
                desc: '"Your App vs X" pages targeting alternative searches',
              },
              {
                icon: FileText,
                title: "Blog Content",
                desc: "10 expert articles with CTAs driving signups",
              },
              {
                icon: Megaphone,
                title: "Social Launch Pack",
                desc: "Twitter, LinkedIn, Reddit, Product Hunt — ready to paste",
              },
              {
                icon: Search,
                title: "Search Indexing",
                desc: "Instant submission to Google, Bing, Yandex, Yahoo",
              },
              {
                icon: Gift,
                title: "Referral System",
                desc: "Shareable links with click and conversion tracking",
              },
              {
                icon: BarChart3,
                title: "Analytics Dashboard",
                desc: "Track rankings, traffic, and conversions",
              },
              {
                icon: ListChecks,
                title: "Marketing Checklist",
                desc: "Step-by-step guide to maximize your launch",
              },
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

        {/* ── Referral ── */}
        <div className="max-w-md mx-auto rounded-2xl border-2 border-[#5BA8A0]/40 bg-gradient-to-br from-[#5BA8A0]/5 to-transparent p-6 mb-10">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#5BA8A0]/15 border border-[#5BA8A0]/30 flex items-center justify-center flex-shrink-0">
              <Gift className="w-5 h-5" style={{ color: "#5BA8A0" }} />
            </div>
            <div>
              <h2 className="font-bold text-white mb-1">Referral Program</h2>
              <p className="text-xs text-white/50">
                Earn up to 10% commission. Share your link — track clicks, signups, and conversions.
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

        {/* Footer Links */}
        <div className="text-center space-y-3">
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: "Marketing Hub", href: "/marketing-hub" },
              { label: "Blog", href: "/blog" },
              { label: "Tools", href: "/tools" },
              { label: "Docs", href: "/docs" },
              { label: "Seeds", href: "/seeds" },
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
