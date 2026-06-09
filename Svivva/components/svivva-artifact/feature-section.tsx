"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { FeatureDef } from "./feature-defs";
import { FeatureArtworkLayer } from "./feature-artwork-layer";

type Props = {
  feature: FeatureDef;
  index: number;
  reverse?: boolean;
};

export function FeatureSection({ feature, index, reverse }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "none";
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-20 px-4 overflow-hidden"
      style={{
        opacity: 0,
        transform: "translateY(32px)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
      }}
    >
      {/* Ambient background glow from artwork accent */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 50% at ${reverse ? "70%" : "30%"} 50%, ${feature.accentColor}18 0%, transparent 70%)`,
        }}
      />

      <div className="max-w-6xl mx-auto">
        <div
          className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${reverse ? "lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1" : ""}`}
        >
          {/* Artwork side */}
          <div className="relative w-full max-w-md mx-auto lg:mx-0">
            <FeatureArtworkLayer feature={feature} visible />
          </div>

          {/* Content side */}
          <div ref={contentRef} className="flex flex-col gap-6">
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.3em] mb-3 font-light"
                style={{ color: feature.accentColor }}
              >
                {feature.artworkTitle} — Feature {String(index + 1).padStart(2, "0")}
              </p>
              <h2 className="text-3xl md:text-4xl font-light text-white/90 leading-tight tracking-tight">
                {feature.name}
              </h2>
              <p className="mt-2 text-white/30 italic text-sm">{feature.tagline}</p>
            </div>

            <p className="text-white/55 leading-relaxed">{feature.description}</p>

            {/* Motif badge */}
            <div className="flex items-center gap-3">
              <div
                className="w-px h-8"
                style={{
                  background: `linear-gradient(to bottom, ${feature.accentColor}, transparent)`,
                }}
              />
              <span
                className="text-xs uppercase tracking-[0.2em]"
                style={{ color: `${feature.accentColor}80` }}
              >
                {feature.signatureMotion}
              </span>
            </div>

            <Link
              href={feature.cta.href}
              className="self-start inline-flex items-center gap-2 text-sm font-light px-7 py-3 rounded-full border transition-all duration-300 hover:scale-105 active:scale-95 group"
              style={{
                color: feature.accentColor,
                borderColor: `${feature.accentColor}50`,
                background: `${feature.accentColor}0c`,
              }}
            >
              {feature.cta.label}
              <span
                className="transition-transform duration-300 group-hover:translate-x-1"
                style={{ opacity: 0.6, fontSize: "0.8rem" }}
              >
                →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
