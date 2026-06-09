"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { type ArtworkFeature } from "./feature-data";

// ─── Scan-line overlay (Svivva Play) ──────────────────────────────────
function ScanLineOverlay({ scrollYProgress }: { scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"] }) {
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "200%"]);
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ y }}
    >
      {Array.from({ length: 18 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-full"
          style={{
            top: `${(i / 18) * 100}%`,
            height: 1,
            background: "rgba(124,58,237,0.12)",
          }}
        />
      ))}
    </motion.div>
  );
}

// ─── Web pulse overlay (Orbit) ────────────────────────────────────────
function WebPulseOverlay({ hovered }: { hovered: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let t = 0;
    const draw = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!hovered) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const maxR = Math.hypot(cx, cy);
      const lineCount = 12;
      for (let i = 0; i < lineCount; i++) {
        const angle = (i / lineCount) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(
          cx + Math.cos(angle) * maxR,
          cy + Math.sin(angle) * maxR,
        );
        ctx.strokeStyle = `rgba(217,119,6,${0.12 + 0.06 * Math.sin(t + i)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      // Ripple rings
      for (let ring = 0; ring < 4; ring++) {
        const r = ((t * 60 + ring * 80) % maxR);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(217,119,6,${0.15 * (1 - r / maxR)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      t += 0.03;
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [hovered]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 w-full h-full opacity-70"
    />
  );
}

// ─── Diamond refraction overlay (Hardware) ───────────────────────────
function DiamondOverlay({ scrollYProgress }: { scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"] }) {
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 45]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1.15]);
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      style={{ rotate, scale, opacity: 0.12 }}
    >
      <svg viewBox="0 0 100 100" className="w-48 h-48">
        {[0, 30, 60, 90, 120, 150].map((angle) => (
          <polygon
            key={angle}
            points="50,10 90,50 50,90 10,50"
            fill="none"
            stroke="rgba(124,58,237,0.6)"
            strokeWidth="0.5"
            transform={`rotate(${angle}, 50, 50)`}
          />
        ))}
      </svg>
    </motion.div>
  );
}

// ─── Filigree border overlay (Security) ──────────────────────────────
function FiligreeOverlay({ scrollYProgress }: { scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"] }) {
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 0.7, 0.4]);
  return (
    <motion.div
      className="pointer-events-none absolute inset-2 rounded-xl"
      style={{
        opacity,
        border: "1px solid rgba(107,44,74,0.5)",
        boxShadow: "inset 0 0 30px rgba(107,44,74,0.15), 0 0 30px rgba(107,44,74,0.1)",
      }}
    />
  );
}

// ─── Packaging panel overlay (API Builder) ───────────────────────────
function PackagingOverlay({ scrollYProgress }: { scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"] }) {
  const x1 = useTransform(scrollYProgress, [0, 1], ["-100%", "0%"]);
  const x2 = useTransform(scrollYProgress, [0, 1], ["100%", "0%"]);
  return (
    <>
      <motion.div
        className="pointer-events-none absolute left-0 top-0 bottom-0 w-1/4"
        style={{ x: x1, background: "rgba(190,24,93,0.05)", borderRight: "1px solid rgba(190,24,93,0.15)" }}
      />
      <motion.div
        className="pointer-events-none absolute right-0 top-0 bottom-0 w-1/4"
        style={{ x: x2, background: "rgba(190,24,93,0.05)", borderLeft: "1px solid rgba(190,24,93,0.15)" }}
      />
    </>
  );
}

// ─── Staff-line overlay (Seeds) ───────────────────────────────────────
function StaffLineOverlay({ scrollYProgress }: { scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"] }) {
  const scaleX = useTransform(scrollYProgress, [0, 1], [0.4, 1.2]);
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-3 px-6 opacity-20"
      style={{ scaleX }}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="w-full h-px bg-current" style={{ color: "#5BA8A0" }} />
      ))}
    </motion.div>
  );
}

// ─── Main FeatureSection component ───────────────────────────────────
export function FeatureSection({
  feature,
  index,
  reverse = false,
}: {
  feature: ArtworkFeature;
  index: number;
  reverse?: boolean;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const yParallax = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const imgScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.08, 1, 1.08]);
  const contentY = useTransform(scrollYProgress, [0, 1], [30, -30]);
  const springY = useSpring(contentY, { stiffness: 80, damping: 20 });

  const renderOverlay = () => {
    switch (feature.id) {
      case "play":    return <ScanLineOverlay scrollYProgress={scrollYProgress} />;
      case "orbit":   return <WebPulseOverlay hovered={hovered} />;
      case "hardware":return <DiamondOverlay scrollYProgress={scrollYProgress} />;
      case "security":return <FiligreeOverlay scrollYProgress={scrollYProgress} />;
      case "api":     return <PackagingOverlay scrollYProgress={scrollYProgress} />;
      case "seeds":   return <StaffLineOverlay scrollYProgress={scrollYProgress} />;
    }
  };

  const [r, g, b] = feature.accentColorRgb.split(",").map(Number);

  return (
    <motion.section
      ref={sectionRef}
      id={`feature-${feature.id}`}
      className="relative w-full overflow-hidden"
      style={{ minHeight: 520 }}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 70% 60% at ${reverse ? "70%" : "30%"} 50%, rgba(${feature.accentColorRgb},0.08) 0%, transparent 70%)`,
        }}
      />

      <div
        className={`relative z-10 max-w-6xl mx-auto px-6 py-20 flex flex-col ${
          reverse ? "md:flex-row-reverse" : "md:flex-row"
        } items-center gap-12`}
      >
        {/* Artwork column */}
        <motion.div
          className="relative flex-shrink-0 rounded-2xl overflow-hidden"
          style={{ width: 340, height: 420 }}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.4 }}
        >
          <motion.img
            src={feature.artwork}
            alt={feature.artworkAlt}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ scale: imgScale }}
          />
          {/* Artwork identity label */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.6) 100%)`,
            }}
          />
          <span
            className="absolute bottom-4 left-4 text-[9px] tracking-[0.3em] uppercase font-mono"
            style={{ color: feature.accentColor }}
          >
            {feature.artworkAlt.split("—")[0].trim()}
          </span>

          {/* Signature artwork overlay */}
          {renderOverlay()}

          {/* Active glow border */}
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            animate={{
              boxShadow: hovered
                ? `inset 0 0 0 1px rgba(${feature.accentColorRgb},0.5), 0 0 40px rgba(${feature.accentColorRgb},0.2)`
                : `inset 0 0 0 1px rgba(${feature.accentColorRgb},0.15)`,
            }}
            transition={{ duration: 0.4 }}
          />
        </motion.div>

        {/* Content column */}
        <motion.div className="flex-1 min-w-0" style={{ y: springY }}>
          <div className="mb-6">
            <span
              className="inline-block text-[10px] tracking-[0.35em] uppercase font-mono mb-3 px-3 py-1 rounded-full border"
              style={{
                color: feature.accentColor,
                borderColor: `rgba(${feature.accentColorRgb},0.3)`,
                background: `rgba(${feature.accentColorRgb},0.08)`,
              }}
            >
              Feature {String(index + 1).padStart(2, "0")}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
              {feature.title}
            </h2>
            <p
              className="text-sm tracking-widest uppercase mt-1 mb-4"
              style={{ color: feature.accentColor }}
            >
              {feature.subtitle}
            </p>
          </div>

          <p className="text-white/60 text-base leading-relaxed max-w-md mb-8">
            {feature.description}
          </p>

          {/* Signature interaction label */}
          <div
            className="mb-6 px-4 py-3 rounded-lg border text-xs font-mono text-white/40 leading-relaxed"
            style={{ borderColor: `rgba(${feature.accentColorRgb},0.2)`, background: `rgba(${feature.accentColorRgb},0.05)` }}
          >
            ✦ {feature.signature}
          </div>

          {/* Motif pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {feature.motifs.map((m) => (
              <span
                key={m}
                className="text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full font-mono"
                style={{
                  color: feature.accentColor,
                  background: `rgba(${feature.accentColorRgb},0.1)`,
                  border: `1px solid rgba(${feature.accentColorRgb},0.2)`,
                }}
              >
                {m}
              </span>
            ))}
          </div>

          <a
            href={feature.href}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:brightness-110 hover:scale-105"
            style={{
              background: `rgba(${feature.accentColorRgb},0.2)`,
              color: feature.accentColor,
              border: `1px solid rgba(${feature.accentColorRgb},0.4)`,
              boxShadow: `0 0 20px rgba(${feature.accentColorRgb},0.1)`,
            }}
          >
            {feature.cta}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </motion.div>
      </div>
    </motion.section>
  );
}
