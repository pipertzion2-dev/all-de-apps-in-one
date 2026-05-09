"use client";

import { useMemo } from "react";

interface SchematicViewerProps {
  productName: string;
  productCategory: string;
  materials: string[];
  requirements: string[];
  className?: string;
}

function getDimensions(category: string, requirements: string[]) {
  const isCompact = requirements.includes("Compact size");
  const cat = category.toLowerCase();

  if (
    cat.includes("electron") ||
    cat.includes("device") ||
    cat.includes("phone") ||
    cat.includes("tablet") ||
    cat.includes("gadget")
  ) {
    return {
      w: isCompact ? 120 : 160,
      h: isCompact ? 8 : 12,
      d: isCompact ? 65 : 80,
      unit: "mm",
      type: "device",
    };
  }
  if (cat.includes("home") || cat.includes("appliance") || cat.includes("kitchen")) {
    return {
      w: isCompact ? 180 : 250,
      h: isCompact ? 280 : 380,
      d: isCompact ? 180 : 250,
      unit: "mm",
      type: "appliance",
    };
  }
  if (
    cat.includes("industrial") ||
    cat.includes("tool") ||
    cat.includes("machine") ||
    cat.includes("equipment")
  ) {
    return {
      w: isCompact ? 400 : 600,
      h: isCompact ? 350 : 500,
      d: isCompact ? 300 : 450,
      unit: "mm",
      type: "industrial",
    };
  }
  if (
    cat.includes("wear") ||
    cat.includes("watch") ||
    cat.includes("fitness") ||
    cat.includes("health")
  ) {
    return {
      w: isCompact ? 38 : 44,
      h: isCompact ? 10 : 13,
      d: isCompact ? 38 : 44,
      unit: "mm",
      type: "wearable",
    };
  }
  return {
    w: isCompact ? 200 : 300,
    h: isCompact ? 150 : 200,
    d: isCompact ? 120 : 180,
    unit: "mm",
    type: "generic",
  };
}

export function SchematicViewer({
  productName,
  productCategory,
  materials,
  requirements,
  className,
}: SchematicViewerProps) {
  const dims = useMemo(
    () => getDimensions(productCategory, requirements),
    [productCategory, requirements],
  );
  const matLabel = materials.length > 0 ? materials.join(", ") : "TBD";
  const reqLabel = requirements.length > 0 ? requirements.slice(0, 3).join(" | ") : "Standard";

  const svgW = 340;
  const svgH = 300;
  const cx = svgW / 2;
  const cy = svgH / 2 - 10;

  const drawW = 140;
  const drawH = dims.type === "appliance" ? 120 : dims.type === "wearable" ? 60 : 80;
  const drawD = dims.type === "device" ? 8 : 50;

  return (
    <div className={`relative ${className || ""}`}>
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="w-full h-full"
        style={{ background: "#0d1117" }}
      >
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1a2332" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width={svgW} height={svgH} fill="url(#grid)" />

        <text
          x={cx}
          y={16}
          textAnchor="middle"
          fill="#5BA8A0"
          fontSize="8"
          fontFamily="monospace"
          fontWeight="bold"
        >
          {(productName || "PRODUCT").toUpperCase()} — ENGINEERING SCHEMATIC
        </text>

        <text x={10} y={svgH - 8} fill="#444" fontSize="6" fontFamily="monospace">
          REV A | SCALE 1:{dims.type === "wearable" ? "2" : dims.type === "industrial" ? "10" : "5"}{" "}
          | UNITS: {dims.unit}
        </text>
        <text
          x={svgW - 10}
          y={svgH - 8}
          textAnchor="end"
          fill="#444"
          fontSize="6"
          fontFamily="monospace"
        >
          SVIVVA CAD
        </text>

        <g>
          <text x={cx} y={32} textAnchor="middle" fill="#666" fontSize="6" fontFamily="monospace">
            FRONT VIEW
          </text>
          <rect
            x={cx - drawW / 2}
            y={cy - drawH / 2}
            width={drawW}
            height={drawH}
            fill="none"
            stroke="#5BA8A0"
            strokeWidth="1.2"
          />

          {dims.type === "device" && (
            <>
              <rect
                x={cx - drawW / 2 + 8}
                y={cy - drawH / 2 + 4}
                width={drawW - 16}
                height={drawH - 8}
                fill="none"
                stroke="#3a6a64"
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />
              <circle
                cx={cx + drawW / 2 - 8}
                cy={cy}
                r={3}
                fill="none"
                stroke="#6B2C4A"
                strokeWidth="0.8"
              />
              <rect
                x={cx - 10}
                y={cy + drawH / 2 - 2}
                width={20}
                height={3}
                fill="none"
                stroke="#6B2C4A"
                strokeWidth="0.6"
              />
            </>
          )}

          {dims.type === "appliance" && (
            <>
              <ellipse
                cx={cx}
                cy={cy - drawH / 2 + 15}
                rx={drawW / 3}
                ry={10}
                fill="none"
                stroke="#3a6a64"
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />
              <circle
                cx={cx}
                cy={cy - drawH / 2 + 5}
                r={4}
                fill="none"
                stroke="#6B2C4A"
                strokeWidth="0.8"
              />
              <rect
                x={cx - 15}
                y={cy + 10}
                width={30}
                height={15}
                rx={2}
                fill="none"
                stroke="#3a6a64"
                strokeWidth="0.5"
              />
            </>
          )}

          {dims.type === "wearable" && (
            <>
              <circle
                cx={cx}
                cy={cy}
                r={drawW / 2 - 5}
                fill="none"
                stroke="#3a6a64"
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />
              <rect
                x={cx - 3}
                y={cy - drawH / 2 - 20}
                width={6}
                height={20}
                rx={2}
                fill="none"
                stroke="#6B2C4A"
                strokeWidth="0.8"
              />
              <rect
                x={cx - 3}
                y={cy + drawH / 2}
                width={6}
                height={20}
                rx={2}
                fill="none"
                stroke="#6B2C4A"
                strokeWidth="0.8"
              />
            </>
          )}

          {dims.type === "industrial" && (
            <>
              <rect
                x={cx - drawW / 2 + 5}
                y={cy + drawH / 2 - 25}
                width={drawW - 10}
                height={20}
                fill="none"
                stroke="#3a6a64"
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />
              <line
                x1={cx - drawW / 4}
                y1={cy - drawH / 2}
                x2={cx - drawW / 4}
                y2={cy + drawH / 2}
                stroke="#3a6a64"
                strokeWidth="0.3"
                strokeDasharray="4,2"
              />
              <circle
                cx={cx + drawW / 4}
                cy={cy - drawH / 4}
                r={8}
                fill="none"
                stroke="#6B2C4A"
                strokeWidth="0.8"
              />
            </>
          )}

          {dims.type === "generic" && (
            <>
              <line
                x1={cx}
                y1={cy - drawH / 2}
                x2={cx}
                y2={cy + drawH / 2}
                stroke="#3a6a64"
                strokeWidth="0.3"
                strokeDasharray="4,2"
              />
              <line
                x1={cx - drawW / 2}
                y1={cy}
                x2={cx + drawW / 2}
                y2={cy}
                stroke="#3a6a64"
                strokeWidth="0.3"
                strokeDasharray="4,2"
              />
              <rect
                x={cx - 20}
                y={cy - 10}
                width={40}
                height={20}
                rx={3}
                fill="none"
                stroke="#6B2C4A"
                strokeWidth="0.6"
              />
            </>
          )}

          <line
            x1={cx - drawW / 2}
            y1={cy + drawH / 2 + 12}
            x2={cx + drawW / 2}
            y2={cy + drawH / 2 + 12}
            stroke="#888"
            strokeWidth="0.5"
          />
          <line
            x1={cx - drawW / 2}
            y1={cy + drawH / 2 + 9}
            x2={cx - drawW / 2}
            y2={cy + drawH / 2 + 15}
            stroke="#888"
            strokeWidth="0.5"
          />
          <line
            x1={cx + drawW / 2}
            y1={cy + drawH / 2 + 9}
            x2={cx + drawW / 2}
            y2={cy + drawH / 2 + 15}
            stroke="#888"
            strokeWidth="0.5"
          />
          <text
            x={cx}
            y={cy + drawH / 2 + 20}
            textAnchor="middle"
            fill="#aaa"
            fontSize="7"
            fontFamily="monospace"
          >
            {dims.w} {dims.unit}
          </text>

          <line
            x1={cx + drawW / 2 + 12}
            y1={cy - drawH / 2}
            x2={cx + drawW / 2 + 12}
            y2={cy + drawH / 2}
            stroke="#888"
            strokeWidth="0.5"
          />
          <line
            x1={cx + drawW / 2 + 9}
            y1={cy - drawH / 2}
            x2={cx + drawW / 2 + 15}
            y2={cy - drawH / 2}
            stroke="#888"
            strokeWidth="0.5"
          />
          <line
            x1={cx + drawW / 2 + 9}
            y1={cy + drawH / 2}
            x2={cx + drawW / 2 + 15}
            y2={cy + drawH / 2}
            stroke="#888"
            strokeWidth="0.5"
          />
          <text
            x={cx + drawW / 2 + 22}
            y={cy + 3}
            textAnchor="middle"
            fill="#aaa"
            fontSize="7"
            fontFamily="monospace"
            transform={`rotate(90, ${cx + drawW / 2 + 22}, ${cy + 3})`}
          >
            {dims.h} {dims.unit}
          </text>
        </g>

        <g>
          <rect
            x={10}
            y={svgH - 65}
            width={100}
            height={50}
            fill="#0d1117"
            stroke="#333"
            strokeWidth="0.5"
          />
          <text
            x={15}
            y={svgH - 54}
            fill="#5BA8A0"
            fontSize="5.5"
            fontFamily="monospace"
            fontWeight="bold"
          >
            SPECIFICATIONS
          </text>
          <text x={15} y={svgH - 45} fill="#888" fontSize="5" fontFamily="monospace">
            DIM: {dims.w}×{dims.h}×{dims.d} {dims.unit}
          </text>
          <text x={15} y={svgH - 37} fill="#888" fontSize="5" fontFamily="monospace">
            MAT: {matLabel.length > 18 ? matLabel.slice(0, 18) + "…" : matLabel}
          </text>
          <text x={15} y={svgH - 29} fill="#888" fontSize="5" fontFamily="monospace">
            REQ: {reqLabel.length > 18 ? reqLabel.slice(0, 18) + "…" : reqLabel}
          </text>
          <text x={15} y={svgH - 21} fill="#888" fontSize="5" fontFamily="monospace">
            DEPTH: {dims.d} {dims.unit}
          </text>
        </g>

        {requirements.includes("Waterproof") && (
          <g>
            <circle cx={svgW - 30} cy={40} r={8} fill="none" stroke="#5BA8A0" strokeWidth="0.6" />
            <text
              x={svgW - 30}
              y={43}
              textAnchor="middle"
              fill="#5BA8A0"
              fontSize="5"
              fontFamily="monospace"
            >
              IP67
            </text>
          </g>
        )}
        {requirements.includes("Heat resistant") && (
          <g>
            <circle cx={svgW - 30} cy={60} r={8} fill="none" stroke="#c44" strokeWidth="0.6" />
            <text
              x={svgW - 30}
              y={63}
              textAnchor="middle"
              fill="#c44"
              fontSize="4.5"
              fontFamily="monospace"
            >
              300°C
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
