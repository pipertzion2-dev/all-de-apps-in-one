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
    title: "Any File Type",
    desc: "Documents, images, archives, executables — Pyracrypt handles all of them without limits.",
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

const faqs = [
  {
    q: "Is Pyracrypt really free?",
    a: "Yes — completely free, no sign-up, no limits. Pyracrypt is now a free feature included with Svivva.",
  },
  {
    q: "Where do my files go?",
    a: "Nowhere. Pyracrypt processes everything locally in your browser using the Web Crypto API. Files never touch a server.",
  },
  {
    q: "Can I decrypt files without Pyracrypt?",
    a: "Yes. Pyracrypt uses standard AES-256-GCM. Any tool that supports this cipher can decrypt your files if you have the key.",
  },
  {
    q: "Is this connected to Svivva's AI platform?",
    a: "Pyracrypt is a free security tool within the Svivva ecosystem. It uses cryptographic algorithms — not AI — at its core.",
  },
];

export default function PyracryptPage() {
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
            <span className="text-xs text-white/40">Free feature of Svivva</span>
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

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 pt-16 pb-8">
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full mb-5 border"
            style={{ borderColor: `${TEAL}50`, color: TEAL, background: `${TEAL}10` }}
          >
            <Shield className="w-3.5 h-3.5" /> Free plan · No sign-up · Browser-based
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            <span style={{ color: TEAL }}>Pyracrypt</span>
            <span className="text-white/90"> — Free File Protection</span>
            <br />
            <span className="text-white/50">A free feature of Svivva</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Encrypt, scan, and shield any file in your browser using AES-256. Nothing leaves your
            device. No accounts needed. Included free with your Svivva subscription.
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
                <Lock className="w-3 h-3 text-[#28C840]" />
                <span className="truncate font-medium tracking-wide">
                  Pyracrypt — Encrypted & Secure
                </span>
              </div>
            </div>

            {/* App Window */}
            <div className="relative" style={{ height: "560px" }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8 text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: `${TEAL}15`, border: `1px solid ${TEAL}30` }}
                >
                  <Shield className="w-8 h-8" style={{ color: TEAL }} />
                </div>
                <div>
                  <p className="text-lg font-bold text-white mb-2">Pyracrypt</p>
                  <p className="text-sm text-white/50 mb-6 max-w-sm">
                    Encrypted file protection, right in your browser. No uploads. No accounts. Just
                    shield.
                  </p>
                  <Link
                    href="/dashboard/billing"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm"
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
              <span className="text-[11px] text-white/25">Free feature of Svivva</span>
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

        {/* CTA below window */}
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

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-2xl font-black text-center mb-3">Why Pyracrypt?</h2>
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
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm"
              style={{ background: TEAL }}
            >
              Get Svivva <ArrowRight className="w-4 h-4" />
            </Link>
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
