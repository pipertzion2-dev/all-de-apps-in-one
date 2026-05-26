"use client";

import { useState } from "react";
import Link from "next/link";
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

const TEAL = "#5BA8A0";
const BURG = "#6B2C4A";

const features = [
  {
    icon: Shield,
    title: "Secure by Default",
    desc: "Clutter inherits Pyracrypt-grade privacy patterns — client-side safeguards with minimal trust surface.",
  },
  {
    icon: Eye,
    title: "Embedded in Svivva",
    desc: "Not a separate app. Clutter is a Svivva experience — same platform, same identity, same growth engine.",
  },
  {
    icon: Zap,
    title: "Instant, No Friction",
    desc: "Fast onboarding flows, mobile-first interactions, and the same polished UI across devices.",
  },
  {
    icon: FileText,
    title: "Mobile Shell + Workflows",
    desc: "Use Svivva as the shell for feeds, moods, analysis, and mini-app flows — without rebuilding the platform.",
  },
  {
    icon: Key,
    title: "Privacy UX",
    desc: "Clear consent boundaries, explicit controls, and secure defaults instead of hidden data behavior.",
  },
  {
    icon: ShieldCheck,
    title: "Auditable",
    desc: "UI is fully visible and inspectable — no hidden redirects to a separate product.",
  },
];

const faqs = [
  {
    q: "Is Clutter a separate app from Svivva?",
    a: "No. Clutter is embedded into the Svivva platform — same domain, same experience.",
  },
  {
    q: "Where does Pyracrypt fit in?",
    a: "Pyracrypt is the privacy/security layer. Clutter uses the Pyracrypt UI and patterns, embedded within Svivva.",
  },
  {
    q: "Is this mobile-first?",
    a: "Yes. The Clutter experience is tuned for mobile layouts and touch interactions.",
  },
];

export default function ClutterPage() {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  return (
    <div className="min-h-screen bg-[#080c14] text-white overflow-x-hidden">
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#080c14]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-bold" style={{ color: TEAL }}>
            ← Svivva
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/40">Embedded experience</span>
            <a
              href="/dashboard/billing"
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border"
              style={{ borderColor: TEAL, color: TEAL }}
            >
              Svivva Plans
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 pt-16 pb-8">
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full mb-5 border"
            style={{ borderColor: `${TEAL}50`, color: TEAL, background: `${TEAL}10` }}
          >
            <Shield className="w-3.5 h-3.5" /> Mobile shell · Embedded · Secure by default
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            <span style={{ color: TEAL }}>Clutter</span>
            <span className="text-white/90"> — Svivva Mobile</span>
            <br />
            <span className="text-white/50">Powered by Pyracrypt UI</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            This is the Pyracrypt experience embedded into Svivva — rebranded as Clutter for the
            mobile shell and future FeedOS-style flows.
          </p>
        </div>

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
                <Lock className="w-3 h-3 text-[#28C840]" />
                <span className="truncate font-medium tracking-wide">
                  Clutter — Embedded & Secure
                </span>
              </div>
            </div>

            {/* Mobile-friendly app window shell */}
            <div
              className="relative"
              style={{
                height: "min(70vh, 560px)",
                maxHeight: "560px",
              }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-6 text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: `${TEAL}15`, border: `1px solid ${TEAL}30` }}
                >
                  <Shield className="w-8 h-8" style={{ color: TEAL }} />
                </div>
                <div className="max-w-sm">
                  <p className="text-lg font-bold text-white mb-2">Clutter</p>
                  <p className="text-sm text-white/50 mb-6">
                    Embedded Pyracrypt UI — tuned for mobile. No separate app. Same Svivva platform.
                  </p>
                  <Link
                    href="/dashboard/billing"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm w-full sm:w-auto"
                    style={{ background: TEAL }}
                  >
                    View Svivva Plans <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{
                background: "rgba(255,255,255,0.02)",
                borderTop: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <span className="text-[11px] text-white/25">
                Embedded in Svivva · powered by Pyracrypt
              </span>
              <Link
                href="/dashboard/billing"
                className="flex items-center gap-1.5 text-[11px] font-bold"
                style={{ color: TEAL }}
              >
                View Svivva plans →
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <Link
            href="/dashboard/billing"
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold"
            style={{ background: TEAL }}
          >
            Get Svivva <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-2xl font-black text-center mb-3">Why Clutter?</h2>
        <p className="text-center text-white/40 mb-12 text-sm">
          Mobile-first UX with embedded privacy.
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

      <section className="max-w-4xl mx-auto px-4 pb-24">
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border"
            style={{ borderColor: `${BURG}40`, color: "#f4c2e8", background: `${BURG}12` }}
          >
            <Star className="w-3.5 h-3.5" /> FAQ
          </div>
        </div>
        <div className="space-y-3">
          {faqs.map((f) => (
            <div
              key={f.q}
              className="rounded-2xl p-5"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p className="font-bold text-white text-sm mb-2">{f.q}</p>
              <p className="text-xs text-white/45 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Keep existing state vars so this can be swapped to an embedded iframe later without refactor */}
      <div className="hidden">
        {String(iframeLoaded)}
        {String(iframeError)}
      </div>
    </div>
  );
}
