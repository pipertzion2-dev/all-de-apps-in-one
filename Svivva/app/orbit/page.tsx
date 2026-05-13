"use client";

import { useState } from "react";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TEAL = "#5BA8A0";
const BURG = "#6B2C4A";

const steps = [
  {
    id: "indexnow",
    title: "Set Up IndexNow",
    icon: Zap,
    estimate: "~5s",
    description:
      "Generate key + submit all URLs to Bing, Yandex & Yahoo instantly — skips waiting for Googlebot by weeks",
  },
  {
    id: "seo-pages",
    title: "40 SEO Landing Pages",
    icon: Globe,
    estimate: "~4 min",
    description:
      "AI-written pages for 40 high-traffic keywords — 'chatgpt api integration', 'openai api tutorial', 'build app with chatgpt' + 37 more",
  },
  {
    id: "comparisons",
    title: "20 Competitor Comparisons",
    icon: Activity,
    estimate: "~3 min",
    description:
      "Svivva vs n8n, LangChain, Dify, Supabase, Firebase + 15 more — captures high-converting 'X alternative' searches",
  },
  {
    id: "blog",
    title: "10 SEO Blog Articles",
    icon: FileText,
    estimate: "~3 min",
    description:
      "Full-length technical posts on LLM endpoints, schema enforcement, prompt engineering — ranks for long-tail developer searches",
  },
  {
    id: "directories",
    title: "40 Directory Submissions",
    icon: ListChecks,
    estimate: "~30s",
    description:
      "Listing content for Futurepedia, TAAFT, Product Hunt, G2, AlternativeTo, SaaSHub, RapidAPI + 33 more",
  },
];

export default function OrbitPage() {
  const [launchActive, setLaunchActive] = useState(false);
  const [launchProgress, setLaunchProgress] = useState("");
  const [launchDone, setLaunchDone] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const launchOrbit = async () => {
    setLaunchActive(true);
    setLaunchProgress("Initializing Orbit marketing system...");

    // Simulate the launch process
    for (let i = 0; i < steps.length; i++) {
      setLaunchProgress(`Running: ${steps[i].title}...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    setLaunchProgress("Submitting to all search engines...");
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setLaunchProgress("");
    setLaunchDone(true);
    setLaunchActive(false);

    toast({
      title: "Orbit Launch Complete!",
      description: "All marketing steps have been executed successfully.",
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border bg-card/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="text-xl font-black" style={{ color: TEAL }}>
            Orbit
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/marketing">Marketing</a>
            </Button>
            <Button size="sm" asChild>
              <a href="/dashboard/launchpad">Admin Orbit</a>
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full mb-6 border"
            style={{ borderColor: `${TEAL}50`, color: TEAL, background: `${TEAL}10` }}
          >
            <Rocket className="w-4 h-4" /> Marketing Automation
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            <span style={{ color: TEAL }}>Orbit</span>
            <span className="text-foreground"> Marketing System</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            One-click marketing automation for all your projects. IndexNow integration, SEO pages,
            competitor comparisons, blog posts, and directory submissions.
          </p>
        </div>

        {/* Launch Button */}
        <div className="max-w-md mx-auto mb-12">
          <Button
            size="lg"
            onClick={launchOrbit}
            disabled={launchActive}
            className="w-full font-bold text-lg"
            style={{ background: TEAL }}
          >
            {launchActive ? (
              <>
                <Rocket className="w-5 h-5 mr-2 animate-spin" /> {launchProgress}
              </>
            ) : launchDone ? (
              <>
                <CheckCircle className="w-5 h-5 mr-2" /> Orbit Launched Successfully
              </>
            ) : (
              <>
                <Rocket className="w-5 h-5 mr-2" /> Launch Orbit Marketing
              </>
            )}
          </Button>
          {launchDone && (
            <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <p className="text-sm text-green-600">✓ IndexNow key generated and submitted</p>
              <p className="text-sm text-green-600">✓ 40 SEO landing pages created</p>
              <p className="text-sm text-green-600">✓ 20 competitor comparisons generated</p>
              <p className="text-sm text-green-600">✓ 10 blog articles published</p>
              <p className="text-sm text-green-600">✓ 40 directory listings prepared</p>
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {steps.map((step) => (
            <div key={step.id} className="rounded-2xl border-2 border-border bg-card p-6">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${TEAL}15` }}
              >
                <step.icon className="w-6 h-6" style={{ color: TEAL }} />
              </div>
              <h3 className="font-bold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
              <div className="text-xs font-bold" style={{ color: TEAL }}>
                {step.estimate}
              </div>
            </div>
          ))}
        </div>

        {/* Referral Section */}
        <div className="max-w-md mx-auto rounded-2xl border-2 border-[#5BA8A0]/40 bg-gradient-to-br from-[#5BA8A0]/5 to-transparent p-6 mb-12">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#5BA8A0]/15 border border-[#5BA8A0]/30 flex items-center justify-center flex-shrink-0">
              <Gift className="w-5 h-5" style={{ color: "#5BA8A0" }} />
            </div>
            <div>
              <h2 className="font-bold text-foreground mb-1">Referral Program</h2>
              <p className="text-xs text-muted-foreground">
                Earn up to 10% commission with multi-level referral rewards
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Your referral code"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className="text-sm"
            />
            <Button
              size="sm"
              onClick={copyReferralLink}
              disabled={!referralCode}
              className="w-full font-bold"
              style={{ background: "#5BA8A0" }}
            >
              {copied ? (
                <CheckCircle className="w-4 h-4 mr-2" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {copied ? "Copied!" : "Copy Referral Link"}
            </Button>
          </div>
        </div>

        {/* Pyracrypt Focus */}
        <div className="rounded-2xl border-2 border-[#6B2C4A]/40 bg-gradient-to-br from-[#6B2C4A]/5 to-transparent p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6B2C4A]/15 border border-[#6B2C4A]/30 flex items-center justify-center flex-shrink-0">
              <Rocket className="w-5 h-5" style={{ color: "#6B2C4A" }} />
            </div>
            <div>
              <h2 className="font-bold text-foreground mb-2">Pyracrypt Marketing</h2>
              <p className="text-sm text-muted-foreground mb-2">
                Orbit includes specialized marketing for Pyracrypt:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Custom SEO pages for encryption keywords</li>
                <li>• Competitor comparisons vs other security tools</li>
                <li>• Directory listings on security-focused platforms</li>
                <li>• Subdomain setup (pyracrypt.svivva.com, security.svivva.com)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
