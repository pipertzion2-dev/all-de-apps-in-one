"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Shield,
  Lock,
  Key,
  FileText,
  ArrowRight,
  ShieldCheck,
  Eye,
  Zap,
  Check,
  Star,
} from "lucide-react";
import {
  CLUTETY_BURG,
  CLUTETY_LOGO_PATH,
  CLUTETY_TEAL,
  getClutetyEmbedUrl,
} from "@/lib/clutety/config";

const TEAL = CLUTETY_TEAL;
const BURG = CLUTETY_BURG;
const CLUTETY_EMBED_URL = getClutetyEmbedUrl();

const features = [
  {
    icon: Shield,
    title: "Military-Grade Encryption",
    desc: "AES-256 and ChaCha20 algorithms lock your files before they ever leave your device.",
  },
  {
    icon: Eye,
    title: "Zero-Knowledge Architecture",
    desc: "Nothing is uploaded. All processing happens locally in your browser — your keys stay yours alone.",
  },
  {
    icon: Zap,
    title: "Instant, No Account Needed",
    desc: "Open the tool and start protecting files in seconds. No sign-up. No waiting.",
  },
  {
    icon: FileText,
    title: "Feed-Aware Blocking",
    desc: "Tune what appears on YouTube, TikTok, and other feeds — Clutety filters without rebuilding your apps.",
  },
  {
    icon: Key,
    title: "Brute-Force Resistant Keys",
    desc: "PBKDF2 with 600,000 iterations makes automated attack attempts computationally infeasible.",
  },
  {
    icon: ShieldCheck,
    title: "Open & Auditable",
    desc: "Client-side code you can inspect yourself. No black boxes. No tracking. No surprises.",
  },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    badge: null,
    desc: "Try it out with no commitment.",
    features: [
      "1 scan / day",
      "Basic threat report",
      "Browser-based encryption",
      "AES-256 protection",
    ],
    cta: "Start Free",
    ctaStyle: "border",
    href: CLUTETY_EMBED_URL,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/ month",
    badge: "Most Popular",
    desc: "For individuals who need full protection.",
    features: [
      "Unlimited scans",
      "All 5 protection modes",
      "Full dashboard",
      "Compliance reports",
      "Priority support",
    ],
    cta: "Get Pro",
    ctaStyle: "solid",
    href: CLUTETY_EMBED_URL,
  },
  {
    name: "Team",
    price: "$49",
    period: "/ month",
    badge: null,
    desc: "For small teams that need to move fast.",
    features: [
      "Everything in Pro",
      "5 seats included",
      "API access",
      "Slack alerts",
      "Team audit log",
    ],
    cta: "Get Team",
    ctaStyle: "solid",
    href: CLUTETY_EMBED_URL,
  },
  {
    name: "Enterprise",
    price: "$149",
    period: "/ month",
    badge: null,
    desc: "For agencies and large organisations.",
    features: [
      "Unlimited seats",
      "Dedicated AI engine",
      "White-label reports",
      "SLA guarantee",
      "Custom integrations",
    ],
    cta: "Get Enterprise",
    ctaStyle: "burg",
    href: CLUTETY_EMBED_URL,
  },
];

const faqs = [
  {
    q: "Is the free plan really free?",
    a: "Yes — completely free, no sign-up, no limits on the core tool. Paid plans unlock advanced scanning, team seats, and reporting.",
  },
  {
    q: "Does Clutety block content on social feeds?",
    a: "Yes — Clutety is built to filter unwanted items on feeds like YouTube and similar apps, using the same secure shell embedded in Svivva.",
  },
  {
    q: "Where does my data go?",
    a: "Nowhere by default. Clutety processes controls locally in your browser. Your keys and preferences stay yours.",
  },
  {
    q: "What makes the paid plans different?",
    a: "The free plan gives you one scan per day and a basic report. Pro unlocks unlimited scans and all five protection modes. Team adds multi-seat access, API hooks, and Slack alerts. Enterprise adds white-label reports and a dedicated AI engine.",
  },
  {
    q: "Is this connected to Svivva's AI platform?",
    a: "Clutety is an independent protection tool within the Svivva ecosystem. It uses cryptographic algorithms — not AI — at its core.",
  },
];

export default function ClutetyLandingPage() {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  return (
    <div className="min-h-screen bg-[#080c14] text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#080c14]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold" style={{ color: TEAL }}>
            ← Svivva
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/40">Integrates with the Svivva platform</span>
            <a
              href="#pricing"
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border"
              style={{ borderColor: TEAL, color: TEAL }}
            >
              See Plans
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 pt-16 pb-8">
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full mb-5 border"
            style={{ borderColor: `${TEAL}50`, color: TEAL, background: `${TEAL}10` }}
          >
            <Shield className="w-3.5 h-3.5" /> Free plan · No sign-up · Browser-based
          </div>
          <div className="flex justify-center mb-5">
            <Image
              src={CLUTETY_LOGO_PATH}
              alt="Clutety"
              width={320}
              height={80}
              className="h-14 sm:h-16 w-auto object-contain"
              priority
            />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            <span className="text-white/90">Protect Your Feeds</span>
            <br />
            <span className="text-white/50">Block what you don&apos;t want on YouTube & more</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Clutety is embedded in Svivva with the same interface you know from Pyracrypt — scan,
            shield, and filter unwanted content across social feeds. Nothing leaves your device
            without your say.
          </p>
        </div>

        {/* Live App Window */}
        <div className="relative mx-auto max-w-4xl">
          <div
            className="absolute -inset-8 rounded-3xl opacity-30 blur-3xl pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, ${TEAL}40 0%, ${BURG}20 60%, transparent 100%)`,
            }}
          />
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: `0 0 0 1px rgba(91,168,160,0.2), 0 32px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)`,
            }}
          >
            {/* Title bar */}
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{
                background: "rgba(255,255,255,0.04)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
                <div className="w-3 h-3 rounded-full bg-[#28C840]" />
              </div>
              <div
                className="flex-1 mx-3 flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-white/40"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Image
                  src={CLUTETY_LOGO_PATH}
                  alt=""
                  width={72}
                  height={18}
                  className="h-4 w-auto object-contain"
                />
                <span className="truncate font-medium tracking-wide">Clutety — Feed & Shield</span>
              </div>
            </div>

            {/* iframe */}
            <div className="relative" style={{ height: "560px" }}>
              {!iframeError ? (
                <>
                  {!iframeLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ background: `${TEAL}20`, border: `1px solid ${TEAL}40` }}
                      >
                        <Lock className="w-6 h-6" style={{ color: TEAL }} />
                      </div>
                      <p className="text-sm text-white/40">Loading Clutety…</p>
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full animate-bounce"
                            style={{ background: TEAL, animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <iframe
                    src={CLUTETY_EMBED_URL}
                    title="Clutety — File Protection Tool"
                    className="w-full h-full border-0"
                    style={{ opacity: iframeLoaded ? 1 : 0, transition: "opacity 0.4s ease" }}
                    onLoad={() => setIframeLoaded(true)}
                    onError={() => setIframeError(true)}
                    sandbox="allow-scripts allow-forms allow-same-origin allow-downloads"
                  />
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8 text-center">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: `${TEAL}15`, border: `1px solid ${TEAL}30` }}
                  >
                    <Shield className="w-8 h-8" style={{ color: TEAL }} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white mb-2">Clutety</p>
                    <p className="text-sm text-white/50 mb-6 max-w-sm">
                      Encrypted file protection, right in your browser. No uploads. No accounts.
                      Just shield.
                    </p>
                    <a
                      href={CLUTETY_EMBED_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm"
                      style={{ background: TEAL }}
                    >
                      Open Clutety <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{
                background: "rgba(255,255,255,0.02)",
                borderTop: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <span className="text-[11px] text-white/25">Works with the Svivva platform</span>
              <a
                href="#pricing"
                className="flex items-center gap-1.5 text-[11px] font-bold"
                style={{ color: TEAL }}
              >
                View plans & pricing →
              </a>
            </div>
          </div>
        </div>

        {/* CTA below window */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <a
            href={CLUTETY_EMBED_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold"
            style={{ background: TEAL }}
          >
            Try Clutety Free <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#pricing"
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white/60 border border-white/10 hover:bg-white/5 transition-colors"
          >
            See Pro & Team plans
          </a>
        </div>
      </div>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-2xl font-black text-center mb-3">Why Clutety?</h2>
        <p className="text-center text-white/40 mb-12 text-sm">
          No cloud. No backdoors. No compromises.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl p-5"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${TEAL}15`, border: `1px solid ${TEAL}25` }}
              >
                <f.icon className="w-4.5 h-4.5" style={{ color: TEAL }} />
              </div>
              <p className="font-bold text-white text-sm mb-1.5">{f.title}</p>
              <p className="text-xs text-white/45 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black mb-3">Simple, Honest Pricing</h2>
          <p className="text-white/40 text-sm max-w-xl mx-auto">
            Start free. Upgrade when your team — or your threat surface — grows.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const isPopular = plan.badge === "Most Popular";
            return (
              <div
                key={plan.name}
                className="relative rounded-2xl p-6 flex flex-col"
                style={{
                  background: isPopular
                    ? `linear-gradient(135deg, ${TEAL}18, ${TEAL}08)`
                    : "rgba(255,255,255,0.03)",
                  border: isPopular ? `1.5px solid ${TEAL}60` : "1px solid rgba(255,255,255,0.07)",
                  boxShadow: isPopular ? `0 0 32px ${TEAL}18` : "none",
                }}
              >
                {plan.badge && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full"
                    style={{ background: TEAL, color: "#fff" }}
                  >
                    <Star className="w-3 h-3" /> {plan.badge}
                  </div>
                )}
                <p className="text-sm font-black text-white/70 mb-1">{plan.name}</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-3xl font-black text-white">{plan.price}</span>
                  <span className="text-xs text-white/40 mb-1">{plan.period}</span>
                </div>
                <p className="text-xs text-white/40 mb-5 leading-relaxed">{plan.desc}</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-xs text-white/70">
                      <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: TEAL }} />
                      {feat}
                    </li>
                  ))}
                </ul>
                <a
                  href={plan.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
                  style={
                    plan.ctaStyle === "solid"
                      ? { background: TEAL, color: "#fff" }
                      : plan.ctaStyle === "burg"
                        ? { background: BURG, color: "#fff" }
                        : {
                            border: `1px solid rgba(255,255,255,0.15)`,
                            color: "rgba(255,255,255,0.6)",
                          }
                  }
                >
                  {plan.cta} {plan.ctaStyle !== "border" && <ArrowRight className="w-3.5 h-3.5" />}
                </a>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-black text-center mb-10">Common Questions</h2>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <div
              key={faq.q}
              className="rounded-2xl p-5"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <p className="font-bold text-white text-sm mb-2">{faq.q}</p>
              <p className="text-sm text-white/50 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-white/5 py-16 text-center px-4">
        <div
          className="inline-block rounded-3xl px-10 py-10 max-w-lg"
          style={{
            background: `linear-gradient(135deg, ${TEAL}10, ${BURG}10)`,
            border: `1px solid ${TEAL}20`,
          }}
        >
          <Lock className="w-10 h-10 mx-auto mb-4" style={{ color: TEAL }} />
          <h3 className="text-xl font-black mb-3">Your files deserve a shield</h3>
          <p className="text-sm text-white/50 mb-6">
            Start free. Upgrade when your team needs more firepower.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href={CLUTETY_EMBED_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm"
              style={{ background: TEAL }}
            >
              Try Free <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border border-white/10 text-white/60 hover:bg-white/5 transition-colors"
            >
              See Paid Plans
            </a>
          </div>
        </div>
        <div className="mt-8">
          <Link href="/" className="text-sm text-white/30 hover:text-white/60 transition-colors">
            ← Back to Svivva
          </Link>
        </div>
      </section>
    </div>
  );
}
