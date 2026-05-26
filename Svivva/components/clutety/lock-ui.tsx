// @ts-nocheck — ported from Pyracrypt cybersec-app LockUI.jsx
"use client";

import { useState } from "react";

// Scan modes mapped to arches
export const SCAN_MODES = [
  {
    id: "surface",
    label: "Surface",
    sublabel: "Attack Surface Discovery",
    color: "#DCE5CA",
    deep: "#5a9040",
    glow: "rgba(220,229,202,0.9)",
    cx: 84,
    h: 105,
  },
  {
    id: "simulate",
    label: "Simulate",
    sublabel: "AI Attack Simulation",
    color: "#DFB2A9",
    deep: "#b87060",
    glow: "rgba(223,178,169,0.9)",
    cx: 131,
    h: 118,
  },
  {
    id: "comply",
    label: "Comply",
    sublabel: "Compliance Frameworks",
    color: "#6D91B3",
    deep: "#3e6a9a",
    glow: "rgba(109,145,179,0.9)",
    cx: 190,
    h: 120,
  },
  {
    id: "remediate",
    label: "Remediate",
    sublabel: "Auto-Remediation Engine",
    color: "#AC81AF",
    deep: "#865a8a",
    glow: "rgba(172,129,175,0.9)",
    cx: 249,
    h: 110,
  },
  {
    id: "hybrid",
    label: "Hybrid",
    sublabel: "Social + Technical OR",
    color: "#D4A476",
    deep: "#a07040",
    glow: "rgba(212,164,118,0.9)",
    cx: 297,
    h: 102,
  },
];

const STEP_LABELS = ["HYPOTHESIZE", "COMBINE", "MUTATE", "SIMULATE", "REMEDY"];

export function LockUI({
  selectedModes, // Set<string> — which modes are selected
  onModeToggle, // (id) => void — toggle a mode
  onUnlock, // () => void — called when keyhole clicked
  scanStep = -1, // -1 = idle, 0-4 = active step
  scanning = false, // is pipeline running
  size = 420,
}) {
  const [hovered, setHovered] = useState(null);
  const [pressed, setPressed] = useState(null);
  const [keyholePress, setKeyholePress] = useState(false);

  const VW = 380;
  const VH = 420;
  const bodyTop = 150;
  const bodyH = 240;
  const bodyBot = bodyTop + bodyH;
  const bodyL = 50;
  const bodyR = 330;
  const divX = 238;
  const baseH = 20;

  function handleArch(id) {
    if (scanning) return;
    setPressed(id);
    setTimeout(() => setPressed(null), 120);
    onModeToggle?.(id);
  }

  function handleKeyhole() {
    if (scanning) return;
    setKeyholePress(true);
    setTimeout(() => setKeyholePress(false), 200);
    onUnlock?.();
  }

  return (
    <div
      style={{ position: "relative", width: size, height: size * (VH / VW), userSelect: "none" }}
    >
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        width={size}
        height={size * (VH / VW)}
        style={{ overflow: "visible", display: "block" }}
      >
        <defs>
          <linearGradient id="lk-metal-v" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dce0ea" />
            <stop offset="20%" stopColor="#c8ccda" />
            <stop offset="55%" stopColor="#bbbfc8" />
            <stop offset="80%" stopColor="#c6cad6" />
            <stop offset="100%" stopColor="#b2b6c4" />
          </linearGradient>
          <linearGradient id="lk-metal-dark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#aeb2be" />
            <stop offset="50%" stopColor="#989cac" />
            <stop offset="100%" stopColor="#a6aab8" />
          </linearGradient>
          <linearGradient id="lk-divider" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#9ea2b0" />
            <stop offset="50%" stopColor="#b8bcc8" />
            <stop offset="100%" stopColor="#9ea2b0" />
          </linearGradient>
          <linearGradient id="lk-base" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b8bcc8" />
            <stop offset="100%" stopColor="#a4a8b4" />
          </linearGradient>

          {/* Arch tube gradients */}
          <linearGradient id="lk-arch-alum" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(0,0,0,0.2)" />
            <stop offset="35%" stopColor="#c8ccd8" />
            <stop offset="65%" stopColor="#c4c8d4" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.18)" />
          </linearGradient>

          {/* Panel textures */}
          <pattern id="lk-mesh" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <line x1="0" y1="10" x2="10" y2="0" stroke="rgba(80,100,130,0.45)" strokeWidth="0.9" />
            <line x1="0" y1="0" x2="10" y2="10" stroke="rgba(80,100,130,0.22)" strokeWidth="0.6" />
          </pattern>
          <pattern
            id="lk-squaremaze"
            x="0"
            y="0"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <rect
              x="1"
              y="1"
              width="22"
              height="22"
              fill="none"
              stroke="rgba(90,110,140,0.45)"
              strokeWidth="0.8"
            />
            <rect
              x="5"
              y="5"
              width="14"
              height="14"
              fill="none"
              stroke="rgba(90,110,140,0.40)"
              strokeWidth="0.8"
            />
            <rect
              x="9"
              y="9"
              width="6"
              height="6"
              fill="none"
              stroke="rgba(90,110,140,0.38)"
              strokeWidth="0.8"
            />
            <line x1="12" y1="1" x2="12" y2="5" stroke="rgba(90,110,140,0.45)" strokeWidth="0.8" />
            <line x1="5" y1="12" x2="1" y2="12" stroke="rgba(90,110,140,0.45)" strokeWidth="0.8" />
          </pattern>
          <pattern id="lk-rope" x="0" y="0" width="14" height="18" patternUnits="userSpaceOnUse">
            <ellipse
              cx="7"
              cy="5"
              rx="4.5"
              ry="2.5"
              fill="none"
              stroke="rgba(80,100,120,0.5)"
              strokeWidth="1"
            />
            <ellipse
              cx="7"
              cy="13"
              rx="4.5"
              ry="2.5"
              fill="none"
              stroke="rgba(80,100,120,0.5)"
              strokeWidth="1"
            />
            <line x1="7" y1="7.5" x2="7" y2="10.5" stroke="rgba(80,100,120,0.4)" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Drop shadow */}
        <ellipse
          cx="190"
          cy={bodyBot + baseH + 10}
          rx="120"
          ry="8"
          fill="rgba(0,0,0,0.12)"
          style={{ filter: "blur(8px)" }}
        />

        {/* ── ARCHES ── */}
        {SCAN_MODES.map((mode) => {
          const isSelected = selectedModes?.has(mode.id);
          const isHov = hovered === mode.id && !scanning;
          const isPress = pressed === mode.id;
          const isActiveStep =
            scanning && scanStep >= 0 && SCAN_MODES.indexOf(mode) === scanStep % 4;
          const glowing = isSelected || isActiveStep;
          const cx = mode.cx;
          const archTopY = bodyTop - mode.h;
          const outerW = 32;

          return (
            <g
              key={mode.id}
              style={{ cursor: scanning ? "default" : "pointer" }}
              onMouseEnter={() => !scanning && setHovered(mode.id)}
              onMouseLeave={() => setHovered(null)}
              onMouseDown={() => !scanning && setPressed(mode.id)}
              onMouseUp={() => handleArch(mode.id)}
              onTouchStart={(e) => {
                e.preventDefault();
                !scanning && setHovered(mode.id);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleArch(mode.id);
              }}
            >
              {/* Glow halo for selected/active */}
              {(glowing || isHov) && (
                <path
                  d={`M ${cx - outerW / 2} ${bodyTop - 4}
                      L ${cx - outerW / 2} ${archTopY + outerW * 0.6}
                      Q ${cx - outerW / 2} ${archTopY - 8} ${cx} ${archTopY - 8}
                      Q ${cx + outerW / 2} ${archTopY - 8} ${cx + outerW / 2} ${archTopY + outerW * 0.6}
                      L ${cx + outerW / 2} ${bodyTop - 4}`}
                  fill="none"
                  stroke={mode.glow}
                  strokeWidth="30"
                  strokeLinecap="round"
                  style={{
                    filter: `blur(${isActiveStep ? 14 : 10}px)`,
                    opacity: isActiveStep ? 0.7 : isSelected ? 0.55 : 0.35,
                    animation: isActiveStep ? "arch-pulse 1s ease-in-out infinite" : "none",
                  }}
                />
              )}

              {/* Outer tube */}
              <path
                d={`M ${cx - outerW / 2} ${bodyTop - 4}
                    L ${cx - outerW / 2} ${archTopY + outerW * 0.6}
                    Q ${cx - outerW / 2} ${archTopY - 8} ${cx} ${archTopY - 8}
                    Q ${cx + outerW / 2} ${archTopY - 8} ${cx + outerW / 2} ${archTopY + outerW * 0.6}
                    L ${cx + outerW / 2} ${bodyTop - 4}`}
                fill="none"
                stroke={glowing ? mode.color : "url(#lk-arch-alum)"}
                strokeWidth={isPress ? outerW - 4 : outerW}
                strokeLinecap="butt"
                style={{ transition: "stroke 0.15s" }}
              />
              {/* Inner depth */}
              <path
                d={`M ${cx - 11} ${bodyTop - 4}
                    L ${cx - 11} ${archTopY + 16 * 0.6}
                    Q ${cx - 11} ${archTopY - 2} ${cx} ${archTopY - 2}
                    Q ${cx + 11} ${archTopY - 2} ${cx + 11} ${archTopY + 16 * 0.6}
                    L ${cx + 11} ${bodyTop - 4}`}
                fill="none"
                stroke={glowing ? `${mode.deep}cc` : "rgba(0,0,0,0.30)"}
                strokeWidth={isPress ? 18 : 22}
                strokeLinecap="butt"
                style={{ transition: "stroke 0.15s" }}
              />
              {/* Highlight */}
              <path
                d={`M ${cx - outerW / 2 + 4} ${bodyTop - 4}
                    L ${cx - outerW / 2 + 4} ${archTopY + outerW * 0.6}
                    Q ${cx - outerW / 2 + 4} ${archTopY} ${cx} ${archTopY}
                    Q ${cx + outerW / 2 - 4} ${archTopY} ${cx + outerW / 2 - 4} ${archTopY + outerW * 0.6}
                    L ${cx + outerW / 2 - 4} ${bodyTop - 4}`}
                fill="none"
                stroke={glowing ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.28)"}
                strokeWidth="2"
                strokeLinecap="butt"
              />

              {/* Collar */}
              <rect
                x={cx - outerW / 2 - 3}
                y={bodyTop - 22}
                width={outerW + 6}
                height={22}
                rx="3"
                fill={glowing ? mode.color : "url(#lk-metal-dark)"}
                stroke="rgba(0,0,0,0.4)"
                strokeWidth="1"
                style={{ transition: "fill 0.15s" }}
              />
              <rect
                x={cx - outerW / 2 + 1}
                y={bodyTop - 19}
                width={outerW - 2}
                height={5}
                rx="2"
                fill="rgba(255,255,255,0.22)"
              />
              {/* LED indicator */}
              <circle
                cx={cx}
                cy={bodyTop - 11}
                r="4"
                fill={glowing ? mode.color : "rgba(170,175,192,0.8)"}
                stroke="rgba(0,0,0,0.25)"
                strokeWidth="0.5"
                style={{
                  filter: isActiveStep
                    ? `drop-shadow(0 0 8px ${mode.color}) drop-shadow(0 0 4px ${mode.color})`
                    : glowing
                      ? `drop-shadow(0 0 5px ${mode.color})`
                      : "none",
                  transition: "all 0.15s",
                  animation: isActiveStep ? "led-pulse 0.8s ease-in-out infinite" : "none",
                }}
              />
            </g>
          );
        })}

        {/* ── BODY SHADOW ── */}
        <rect
          x={bodyL + 3}
          y={bodyTop + 4}
          width={bodyR - bodyL}
          height={bodyH}
          rx="6"
          fill="rgba(0,0,0,0.18)"
          style={{ filter: "blur(7px)" }}
        />

        {/* ── BODY PLATES (depth effect) ── */}
        <rect
          x={bodyL + 10}
          y={bodyTop + 10}
          width={bodyR - bodyL - 20}
          height={bodyH}
          rx="5"
          fill="#b0b4c0"
        />
        <rect
          x={bodyL + 5}
          y={bodyTop + 5}
          width={bodyR - bodyL - 10}
          height={bodyH}
          rx="5"
          fill="#b8bcc8"
        />
        <rect
          x={bodyL}
          y={bodyTop}
          width={bodyR - bodyL}
          height={bodyH}
          rx="5"
          fill="url(#lk-metal-v)"
          stroke="rgba(0,0,0,0.30)"
          strokeWidth="1.5"
        />

        {/* Groove ridges at top of body */}
        {[bodyTop + 16, bodyTop + 24, bodyTop + 32].map((y) => (
          <g key={y}>
            <line
              x1={bodyL + 2}
              y1={y}
              x2={bodyR - 2}
              y2={y}
              stroke="rgba(255,255,255,0.30)"
              strokeWidth="1"
            />
            <line
              x1={bodyL + 2}
              y1={y + 1.5}
              x2={bodyR - 2}
              y2={y + 1.5}
              stroke="rgba(0,0,0,0.14)"
              strokeWidth="0.6"
            />
          </g>
        ))}

        {/* ── LEFT PANEL: Labyrinth maze ── */}
        <rect
          x={bodyL + 8}
          y={bodyTop + 38}
          width={divX - bodyL - 16}
          height={bodyH - 48}
          rx="3"
          fill="rgba(0,0,0,0.07)"
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="1"
        />
        {/* Concentric maze rings */}
        {(() => {
          const mx = bodyL + 8;
          const my = bodyTop + 38;
          const mw = divX - bodyL - 16;
          const mh = bodyH - 48;
          const gaps = [
            { inset: 4, gap: "right", gapSize: 28 },
            { inset: 16, gap: "bottom", gapSize: 24 },
            { inset: 28, gap: "left", gapSize: 20 },
            { inset: 40, gap: "top", gapSize: 18 },
            { inset: 52, gap: "right", gapSize: 16 },
          ];
          const s = "rgba(90,108,130,0.52)";
          const w = 1.2;
          return gaps.map(({ inset, gap, gapSize }, idx) => {
            const x1 = mx + inset,
              y1 = my + inset;
            const x2 = mx + mw - inset,
              y2 = my + mh - inset;
            const midX = (x1 + x2) / 2,
              midY = (y1 + y2) / 2;
            const half = gapSize / 2;
            let d = "";
            if (gap === "right")
              d = `M ${x1} ${y2} H ${x1} V ${y1} H ${x2} V ${midY - half} M ${x2} ${midY + half} V ${y2} H ${x1}`;
            if (gap === "bottom")
              d = `M ${midX + half} ${y2} H ${x2} V ${y1} H ${x1} V ${y2} H ${midX - half}`;
            if (gap === "left")
              d = `M ${x1} ${midY - half} V ${y1} H ${x2} V ${y2} H ${x1} V ${midY + half}`;
            if (gap === "top")
              d = `M ${midX - half} ${y1} H ${x1} V ${y2} H ${x2} V ${y1} H ${midX + half}`;
            return <path key={idx} d={d} fill="none" stroke={s} strokeWidth={w} />;
          });
        })()}

        {/* Scanning progress fill on maze */}
        {scanning && scanStep >= 0 && (
          <rect
            x={bodyL + 8}
            y={bodyTop + 38}
            width={divX - bodyL - 16}
            height={((scanStep + 1) / 5) * (bodyH - 48)}
            rx="3"
            fill="rgba(109,145,179,0.10)"
            style={{ transition: "height 0.5s ease" }}
          />
        )}

        {/* Center pivot */}
        <circle
          cx={(bodyL + 8 + divX - 8) / 2}
          cy={bodyTop + 38 + (bodyH - 48) / 2}
          r="5"
          fill="rgba(0,0,0,0.18)"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="1"
        />

        {/* ── DIVIDER ── */}
        <rect
          x={divX}
          y={bodyTop}
          width="10"
          height={bodyH}
          fill="url(#lk-divider)"
          stroke="rgba(0,0,0,0.22)"
          strokeWidth="0.5"
        />
        {[bodyTop + bodyH * 0.25, bodyTop + bodyH * 0.5, bodyTop + bodyH * 0.75].map((sy) => (
          <circle
            key={sy}
            cx={divX + 5}
            cy={sy}
            r="3.5"
            fill="url(#lk-metal-v)"
            stroke="rgba(0,0,0,0.35)"
            strokeWidth="0.8"
          />
        ))}

        {/* ── RIGHT PANELS ── */}
        {[
          {
            label: "SURFACE\nSCAN",
            pattern: "lk-mesh",
            accent: "#DCE5CA",
            modeId: "surface",
            y: bodyTop + 8,
          },
          {
            label: "AI\nSIMULATE",
            pattern: "lk-squaremaze",
            accent: "#AC81AF",
            modeId: "simulate",
            y: bodyTop + 88,
          },
          {
            label: "COMPLY\n& FIX",
            pattern: "lk-rope",
            accent: "#6D91B3",
            modeId: "comply",
            y: bodyTop + 168,
          },
        ].map(({ label, pattern, accent, modeId, y }, pi) => {
          const px = divX + 10;
          const pw = bodyR - px - 8;
          const ph = 72;
          const isActive = selectedModes?.has(modeId);
          return (
            <g key={pi}>
              <rect
                x={px - 2}
                y={y - 2}
                width={pw + 4}
                height={ph + 4}
                rx="4"
                fill="rgba(0,0,0,0.15)"
                stroke="rgba(0,0,0,0.2)"
                strokeWidth="1"
              />
              <rect
                x={px}
                y={y}
                width={pw}
                height={ph}
                rx="3"
                fill={isActive ? `${accent}18` : "rgba(180,185,200,0.45)"}
                style={{ transition: "fill 0.2s" }}
              />
              <rect
                x={px}
                y={y}
                width={pw}
                height={ph}
                rx="3"
                fill={`url(#${pattern})`}
                opacity="0.85"
              />
              <rect x={px} y={y} width={pw} height={18} rx="3" fill="rgba(0,0,0,0.10)" />
              {label.split("\n").map((line, li) => (
                <text
                  key={li}
                  x={px + pw / 2}
                  y={y + 7 + li * 9}
                  textAnchor="middle"
                  fontSize="5.5"
                  fontWeight="800"
                  letterSpacing="0.1em"
                  fill={isActive ? accent : `${accent}88`}
                  style={{ transition: "fill 0.2s", pointerEvents: "none" }}
                >
                  {line}
                </text>
              ))}
              {/* Status dots */}
              {[0, 1, 2, 3].map((di) => (
                <circle
                  key={di}
                  cx={px + 10 + di * 14}
                  cy={y + ph - 14}
                  r="4"
                  fill={isActive && di < 3 ? accent : "rgba(140,150,170,0.3)"}
                  style={{
                    filter: isActive && di < 3 ? `drop-shadow(0 0 3px ${accent}99)` : "none",
                    transition: "all 0.2s",
                  }}
                />
              ))}
              <rect x={px} y={y} width={pw} height="1.5" rx="1" fill="rgba(255,255,255,0.35)" />
            </g>
          );
        })}

        {/* ── BASE PLATE ── */}
        <rect
          x={bodyL - 10}
          y={bodyBot}
          width={bodyR - bodyL + 20}
          height={baseH}
          rx="4"
          fill="url(#lk-base)"
          stroke="rgba(0,0,0,0.35)"
          strokeWidth="1.5"
        />
        <rect
          x={bodyL - 8}
          y={bodyBot + 2}
          width={bodyR - bodyL + 16}
          height="3"
          rx="2"
          fill="rgba(255,255,255,0.18)"
        />
        {[bodyL + 4, bodyR - 4].map((bx) => (
          <g key={bx}>
            <circle
              cx={bx}
              cy={bodyBot + baseH / 2}
              r="5.5"
              fill="url(#lk-metal-v)"
              stroke="rgba(0,0,0,0.4)"
              strokeWidth="1"
            />
            <line
              x1={bx - 3}
              y1={bodyBot + baseH / 2}
              x2={bx + 3}
              y2={bodyBot + baseH / 2}
              stroke="rgba(0,0,0,0.3)"
              strokeWidth="1.2"
            />
            <line
              x1={bx}
              y1={bodyBot + baseH / 2 - 3}
              x2={bx}
              y2={bodyBot + baseH / 2 + 3}
              stroke="rgba(0,0,0,0.3)"
              strokeWidth="1.2"
            />
          </g>
        ))}

        {/* ── KEYHOLE ── */}
        <g
          onClick={handleKeyhole}
          onMouseEnter={() => !scanning && setHovered("keyhole")}
          onMouseLeave={() => setHovered(null)}
          onTouchStart={(e) => {
            e.preventDefault();
            setHovered("keyhole");
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleKeyhole();
          }}
          style={{ cursor: scanning ? "wait" : "pointer" }}
        >
          {/* Keyhole ring glow */}
          {(hovered === "keyhole" || keyholePress) && (
            <circle
              cx="190"
              cy={bodyBot + baseH / 2}
              r="18"
              fill="none"
              stroke="#6D91B3"
              strokeWidth="6"
              style={{ filter: "blur(8px)", opacity: 0.6 }}
            />
          )}
          <circle
            cx="190"
            cy={bodyBot + baseH / 2}
            r="9"
            fill={
              hovered === "keyhole" || keyholePress ? "rgba(109,145,179,0.4)" : "rgba(0,0,0,0.28)"
            }
            stroke={hovered === "keyhole" || keyholePress ? "#6D91B3" : "rgba(0,0,0,0.5)"}
            strokeWidth="1.5"
            style={{
              transition: "all 0.18s",
              filter: hovered === "keyhole" ? "drop-shadow(0 0 7px #6D91B3)" : "none",
            }}
          />
          <circle
            cx="190"
            cy={bodyBot + baseH / 2 - 2.5}
            r="3.5"
            fill={hovered === "keyhole" || keyholePress ? "#6D91B3" : "rgba(0,0,0,0.45)"}
            style={{ transition: "fill 0.18s" }}
          />
          <path
            d="M 187 173 H 193 L 192 176 H 188 Z"
            transform={`translate(0, ${bodyBot + baseH / 2 - 2})`}
            fill={hovered === "keyhole" || keyholePress ? "#6D91B3" : "rgba(0,0,0,0.40)"}
            style={{ transition: "fill 0.18s" }}
          />
        </g>

        {/* ── KEYHOLE LABEL ── */}
        {!scanning && (hovered === "keyhole" || keyholePress) && (
          <text
            x="190"
            y={bodyBot + baseH + 18}
            textAnchor="middle"
            fontSize="7"
            fill="#6D91B3"
            fontWeight="800"
            letterSpacing="0.16em"
          >
            UNLOCK & SCAN
          </text>
        )}
        {scanning && (
          <text
            x="190"
            y={bodyBot + baseH + 18}
            textAnchor="middle"
            fontSize="7"
            fill="#6D91B3"
            fontWeight="800"
            letterSpacing="0.14em"
          >
            {scanStep >= 0 ? STEP_LABELS[scanStep] + "…" : "SCANNING…"}
          </text>
        )}

        {/* ── ARCH LABELS (rendered last, on top) ── */}
        {SCAN_MODES.map((mode) => {
          const isSelected = selectedModes?.has(mode.id);
          return (
            <text
              key={`lbl-${mode.id}`}
              x={mode.cx}
              y={bodyTop + 26}
              textAnchor="middle"
              fontSize="5.5"
              fontWeight="800"
              letterSpacing="0.1em"
              fill={isSelected ? mode.deep : "rgba(70,85,110,0.65)"}
              style={{ transition: "fill 0.15s", pointerEvents: "none" }}
            >
              {mode.label.toUpperCase()}
            </text>
          );
        })}

        {/* ── MOUNTING PLATE ── */}
        <rect
          x={bodyL - 6}
          y={bodyTop - 12}
          width={bodyR - bodyL + 12}
          height="14"
          rx="3"
          fill="url(#lk-metal-dark)"
          stroke="rgba(0,0,0,0.28)"
          strokeWidth="1"
        />
        {[85, 135, 190, 245, 295].map((sx) => (
          <rect
            key={sx}
            x={sx - 9}
            y={bodyTop - 10}
            width="18"
            height="5"
            rx="2"
            fill="rgba(0,0,0,0.22)"
          />
        ))}
      </svg>

      {/* CSS for LED/arch pulse animations */}
      <style>{`
        @keyframes arch-pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes led-pulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.85)} }
      `}</style>
    </div>
  );
}
