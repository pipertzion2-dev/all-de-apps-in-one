"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Zap,
  ChevronDown,
  ChevronUp,
  Download,
  Upload,
  X,
  Sparkles,
  FlaskConical,
  Layers,
  Cpu,
  Waves,
  Droplets,
  Volume2,
  Beaker,
  GitBranch,
  Network,
  TreePine,
  Circle,
  Triangle,
  Star,
  Leaf,
  Bug,
  Info,
} from "lucide-react";

type Domain =
  | "thermal"
  | "electrical"
  | "mechanical"
  | "rf"
  | "optical"
  | "fluidic"
  | "acoustic"
  | "chemical";
type Topology = "star" | "mesh" | "tree" | "ring" | "hierarchical";
type HybridizationMode = "complementary" | "antagonistic" | "emergent" | "biomimetic";
type ScientificDepth = "prototype" | "research" | "production";

interface PhysicalProperties {
  material: string;
  operatingTemp: string;
  powerDensity: string;
  dimensions: string;
  frequencyRange: string;
}

interface SchematicState {
  name: string;
  domain: Domain;
  topology: Topology;
  coreComponents: string[];
  physicalProperties: PhysicalProperties;
  constraints: string[];
  imageBase64: string;
  componentInput: string;
  constraintInput: string;
  showPhysicalProps: boolean;
}

interface HybridResult {
  name: string;
  scientificBasis: string;
  topologyDescription: string;
  coreComponents: string[];
  emergentProperties: string[];
  performanceGains: Record<string, string>;
  biomimeticAnalogue: string;
  manufacturingPathway: string;
  challenges: string[];
  noveltyScore: number;
  patentLandscape: string;
  estimatedRnDMonths: number;
  trlLevel: number;
}

interface HybridizeResponse {
  topologicalBridge: string;
  domainBridgingPrinciple: string;
  materialCompatibilityNote: string;
  hybrids: HybridResult[];
  optimalHybridIndex: number;
  requiredCharacterizationTests: string[];
  referenceDesigns: string[];
  nextSteps: string[];
}

const DOMAIN_ICONS: Record<Domain, React.ReactNode> = {
  thermal: <Layers className="w-4 h-4" />,
  electrical: <Cpu className="w-4 h-4" />,
  mechanical: <Triangle className="w-4 h-4" />,
  rf: <Waves className="w-4 h-4" />,
  optical: <Star className="w-4 h-4" />,
  fluidic: <Droplets className="w-4 h-4" />,
  acoustic: <Volume2 className="w-4 h-4" />,
  chemical: <Beaker className="w-4 h-4" />,
};

const TOPOLOGY_ICONS: Record<Topology, React.ReactNode> = {
  star: <Star className="w-4 h-4" />,
  mesh: <Network className="w-4 h-4" />,
  tree: <TreePine className="w-4 h-4" />,
  ring: <Circle className="w-4 h-4" />,
  hierarchical: <GitBranch className="w-4 h-4" />,
};

const DOMAIN_LABELS: Record<Domain, string> = {
  thermal: "Thermal",
  electrical: "Electrical",
  mechanical: "Mechanical",
  rf: "RF / Microwave",
  optical: "Optical",
  fluidic: "Fluidic",
  acoustic: "Acoustic",
  chemical: "Chemical",
};

const MODE_DESCRIPTIONS: Record<HybridizationMode, string> = {
  complementary: "Each system fills the other's weaknesses — strengths compensate limits",
  antagonistic:
    "Systems work in opposition to create equilibrium — competing forces yield stability",
  emergent: "Combination creates a completely new functional domain — phase transition point",
  biomimetic: "Biological structures serve as the merger template — nature already solved it",
};

const PRESETS: Record<
  string,
  Omit<SchematicState, "componentInput" | "constraintInput" | "showPhysicalProps">
> = {
  "iPhone Vapor Chamber": {
    name: "iPhone Vapor Chamber",
    domain: "thermal",
    topology: "mesh",
    coreComponents: ["sintered copper wick", "vapor core", "copper wall", "TIM layer"],
    physicalProperties: {
      material: "Copper",
      operatingTemp: "0°C to 85°C",
      powerDensity: "50 W/cm²",
      dimensions: "70mm × 40mm × 0.4mm",
      frequencyRange: "",
    },
    constraints: ["<0.5mm Z-height", "flexible geometry"],
    imageBase64: "",
  },
  "Traditional Heat Pipe": {
    name: "Traditional Heat Pipe",
    domain: "thermal",
    topology: "tree",
    coreComponents: ["evaporator", "adiabatic section", "condenser", "copper wick"],
    physicalProperties: {
      material: "Copper / Water",
      operatingTemp: "20°C to 150°C",
      powerDensity: "30 W/cm²",
      dimensions: "6mm dia × 200mm",
      frequencyRange: "",
    },
    constraints: ["round cross-section", "gravity sensitive"],
    imageBase64: "",
  },
  "PCB Power Plane": {
    name: "PCB Power Plane",
    domain: "electrical",
    topology: "mesh",
    coreComponents: ["copper plane", "via array", "bypass capacitors", "FR4 substrate"],
    physicalProperties: {
      material: "Copper / FR4",
      operatingTemp: "-40°C to 125°C",
      powerDensity: "5 W/cm²",
      dimensions: "200mm × 150mm × 1.6mm",
      frequencyRange: "DC to 6 GHz",
    },
    constraints: ["standard PCB stack-up", "RoHS compliant"],
    imageBase64: "",
  },
  "Fractal Antenna": {
    name: "Fractal Antenna",
    domain: "rf",
    topology: "hierarchical",
    coreComponents: ["Koch snowflake elements", "ground plane", "feed network", "matching network"],
    physicalProperties: {
      material: "Copper on Rogers 4003",
      operatingTemp: "-55°C to 125°C",
      powerDensity: "0.1 W/cm²",
      dimensions: "50mm × 50mm",
      frequencyRange: "700 MHz to 6 GHz",
    },
    constraints: ["multiband", "compact form factor"],
    imageBase64: "",
  },
};

const LOADING_PHASES = [
  "Analyzing topology...",
  "Bridging domains...",
  "Predicting emergent properties...",
  "Generating hybrid architectures...",
];

function defaultSchematic(): SchematicState {
  return {
    name: "",
    domain: "thermal",
    topology: "star",
    coreComponents: [],
    physicalProperties: {
      material: "",
      operatingTemp: "",
      powerDensity: "",
      dimensions: "",
      frequencyRange: "",
    },
    constraints: [],
    imageBase64: "",
    componentInput: "",
    constraintInput: "",
    showPhysicalProps: false,
  };
}

function trlColor(trl: number): string {
  if (trl <= 2) return "#ef4444";
  if (trl <= 4) return "#f97316";
  if (trl <= 6) return "#eab308";
  if (trl <= 8) return "#22c55e";
  return "#3b82f6";
}

function noveltyGradient(score: number): string {
  const hue = Math.round(score * 1.2);
  return `hsl(${hue}, 70%, 50%)`;
}

interface SchematicPanelProps {
  label: string;
  accentColor: string;
  state: SchematicState;
  onChange: (update: Partial<SchematicState>) => void;
}

function SchematicPanel({ label, accentColor, state, onChange }: SchematicPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addComponent = () => {
    const val = state.componentInput.trim();
    if (!val || state.coreComponents.includes(val)) return;
    onChange({ coreComponents: [...state.coreComponents, val], componentInput: "" });
  };

  const removeComponent = (c: string) =>
    onChange({ coreComponents: state.coreComponents.filter((x) => x !== c) });

  const addConstraint = () => {
    const val = state.constraintInput.trim();
    if (!val || state.constraints.includes(val)) return;
    onChange({ constraints: [...state.constraints, val], constraintInput: "" });
  };

  const removeConstraint = (c: string) =>
    onChange({ constraints: state.constraints.filter((x) => x !== c) });

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const base64 = dataUrl.split(",")[1] ?? "";
      onChange({ imageBase64: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) handleImageUpload(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const applyPreset = (presetName: string) => {
    const preset = PRESETS[presetName];
    if (!preset) return;
    onChange({ ...preset, componentInput: "", constraintInput: "", showPhysicalProps: false });
  };

  return (
    <div
      className="flex flex-col gap-4 p-4 rounded-xl border"
      style={{ borderColor: `${accentColor}40`, background: `${accentColor}08` }}
    >
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ background: accentColor }} />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Quick-Fill Preset</Label>
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(PRESETS).map((p) => (
            <button
              key={p}
              onClick={() => applyPreset(p)}
              className="text-[10px] px-2 py-1 rounded border hover:bg-muted/50 transition-colors text-muted-foreground"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">System Name *</Label>
        <Input
          placeholder="e.g., iPhone Vapor Chamber"
          value={state.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="text-sm h-8"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Domain *</Label>
        <div className="grid grid-cols-4 gap-1">
          {(Object.keys(DOMAIN_LABELS) as Domain[]).map((d) => (
            <button
              key={d}
              onClick={() => onChange({ domain: d })}
              title={DOMAIN_LABELS[d]}
              className={`flex flex-col items-center gap-0.5 p-1.5 rounded text-[9px] font-medium transition-all border ${
                state.domain === d
                  ? "border-current text-current"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
              }`}
              style={state.domain === d ? { color: accentColor, borderColor: accentColor } : {}}
            >
              {DOMAIN_ICONS[d]}
              <span className="truncate w-full text-center">{DOMAIN_LABELS[d].split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Topology *</Label>
        <div className="flex gap-1 flex-wrap">
          {(Object.keys(TOPOLOGY_ICONS) as Topology[]).map((t) => (
            <button
              key={t}
              onClick={() => onChange({ topology: t })}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all border ${
                state.topology === t
                  ? "border-current"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
              }`}
              style={state.topology === t ? { color: accentColor, borderColor: accentColor } : {}}
            >
              {TOPOLOGY_ICONS[t]}
              <span className="capitalize">{t}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Core Components *</Label>
        <div className="flex gap-1">
          <Input
            placeholder="Add component..."
            value={state.componentInput}
            onChange={(e) => onChange({ componentInput: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addComponent())}
            className="text-xs h-7 flex-1"
          />
          <Button size="sm" variant="outline" className="h-7 px-2" onClick={addComponent}>
            +
          </Button>
        </div>
        {state.coreComponents.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {state.coreComponents.map((c) => (
              <span
                key={c}
                className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border"
                style={{ borderColor: `${accentColor}60`, color: accentColor }}
              >
                {c}
                <button onClick={() => removeComponent(c)} className="hover:opacity-70">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <button
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => onChange({ showPhysicalProps: !state.showPhysicalProps })}
        >
          Physical Properties
          {state.showPhysicalProps ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
        {state.showPhysicalProps && (
          <div className="grid grid-cols-2 gap-1.5 mt-1">
            {(
              [
                ["material", "Material"],
                ["operatingTemp", "Operating Temp"],
                ["powerDensity", "Power Density"],
                ["dimensions", "Dimensions"],
                ["frequencyRange", "Frequency Range"],
              ] as [keyof PhysicalProperties, string][]
            ).map(([key, placeholder]) => (
              <Input
                key={key}
                placeholder={placeholder}
                value={state.physicalProperties[key]}
                onChange={(e) =>
                  onChange({
                    physicalProperties: { ...state.physicalProperties, [key]: e.target.value },
                  })
                }
                className="text-[10px] h-7 col-span-1"
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Constraints</Label>
        <div className="flex gap-1">
          <Input
            placeholder="Add constraint..."
            value={state.constraintInput}
            onChange={(e) => onChange({ constraintInput: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addConstraint())}
            className="text-xs h-7 flex-1"
          />
          <Button size="sm" variant="outline" className="h-7 px-2" onClick={addConstraint}>
            +
          </Button>
        </div>
        {state.constraints.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {state.constraints.map((c) => (
              <span
                key={c}
                className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground"
              >
                {c}
                <button onClick={() => removeConstraint(c)} className="hover:opacity-70">
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Schematic Image (optional)</Label>
        <div
          className="border-2 border-dashed rounded-lg p-3 text-center cursor-pointer hover:bg-muted/20 transition-colors"
          style={{ borderColor: state.imageBase64 ? accentColor : undefined }}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          {state.imageBase64 ? (
            <div className="flex items-center justify-between">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/jpeg;base64,${state.imageBase64}`}
                alt="Schematic preview"
                className="h-12 w-auto object-contain rounded"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChange({ imageBase64: "" });
                }}
                className="ml-2 hover:opacity-70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Upload className="w-5 h-5" />
              <span className="text-[10px]">Drag & drop or click to upload</span>
              <span className="text-[9px] opacity-60">GPT-4o Vision will analyze it</span>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
          }}
        />
      </div>
    </div>
  );
}

function HybridCard({
  hybrid,
  isOptimal,
  index,
}: {
  hybrid: HybridResult;
  isOptimal: boolean;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-xl border p-4 space-y-3 transition-all ${
        isOptimal ? "border-yellow-500/60 shadow-lg shadow-yellow-500/10" : "border-border/50"
      }`}
      style={
        isOptimal
          ? { background: "rgba(234,179,8,0.04)" }
          : { background: "rgba(255,255,255,0.02)" }
      }
    >
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {isOptimal && (
            <Badge className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
              ★ Optimal
            </Badge>
          )}
          <h3 className="font-semibold text-sm">{hybrid.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className="text-[10px] font-mono"
            style={{
              background: `${trlColor(hybrid.trlLevel)}20`,
              color: trlColor(hybrid.trlLevel),
            }}
          >
            TRL {hybrid.trlLevel}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            ~{hybrid.estimatedRnDMonths}mo R&D
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
          <span>Novelty Score</span>
          <span className="font-mono" style={{ color: noveltyGradient(hybrid.noveltyScore) }}>
            {hybrid.noveltyScore}/100
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-muted/40 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${hybrid.noveltyScore}%`,
              background: `linear-gradient(90deg, #3b82f6, ${noveltyGradient(hybrid.noveltyScore)})`,
            }}
          />
        </div>
      </div>

      {hybrid.emergentProperties.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Emergent Properties
          </p>
          <div className="flex flex-wrap gap-1.5">
            {hybrid.emergentProperties.map((ep, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8" }}
              >
                ⚡ {ep}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? "Hide" : "Show"} scientific details
      </button>

      {expanded && (
        <div className="space-y-3 pt-1 border-t border-border/30">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Scientific Basis
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {hybrid.scientificBasis}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Topology
            </p>
            <p className="text-xs text-muted-foreground">{hybrid.topologyDescription}</p>
          </div>

          {hybrid.coreComponents.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Core Components
              </p>
              <div className="flex flex-wrap gap-1">
                {hybrid.coreComponents.map((c, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px]">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {Object.keys(hybrid.performanceGains).length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Performance Gains
              </p>
              <div className="rounded-lg overflow-hidden border border-border/30">
                {Object.entries(hybrid.performanceGains).map(([metric, value], i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 px-2 py-1.5 text-[11px] ${
                      i % 2 === 0 ? "bg-muted/20" : "bg-transparent"
                    }`}
                  >
                    <span className="font-medium text-foreground capitalize min-w-[90px]">
                      {metric.replace(/_/g, " ")}
                    </span>
                    <span className="text-muted-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hybrid.biomimeticAnalogue && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-green-500/5 border border-green-500/20">
              <Leaf className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-semibold text-green-400 mb-0.5">
                  Biomimetic Analogue
                </p>
                <p className="text-[11px] text-muted-foreground">{hybrid.biomimeticAnalogue}</p>
              </div>
            </div>
          )}

          {hybrid.manufacturingPathway && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Manufacturing Pathway
              </p>
              <p className="text-xs text-muted-foreground">{hybrid.manufacturingPathway}</p>
            </div>
          )}

          {hybrid.challenges.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Challenges
              </p>
              <ul className="space-y-0.5">
                {hybrid.challenges.map((c, i) => (
                  <li
                    key={i}
                    className="text-[11px] text-muted-foreground flex items-start gap-1.5"
                  >
                    <span className="text-amber-500 shrink-0 mt-0.5">▸</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hybrid.patentLandscape && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-semibold text-blue-400 mb-0.5">Patent Landscape</p>
                <p className="text-[11px] text-muted-foreground">{hybrid.patentLandscape}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function HardwareSchematicHybridizer() {
  const [schematicA, setSchematicA] = useState<SchematicState>(defaultSchematic());
  const [schematicB, setSchematicB] = useState<SchematicState>(defaultSchematic());
  const [mode, setMode] = useState<HybridizationMode>("complementary");
  const [targetApplication, setTargetApplication] = useState("");
  const [scientificDepth, setScientificDepth] = useState<ScientificDepth>("research");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [results, setResults] = useState<HybridizeResponse | null>(null);
  const [error, setError] = useState("");

  const updateA = (update: Partial<SchematicState>) =>
    setSchematicA((prev) => ({ ...prev, ...update }));
  const updateB = (update: Partial<SchematicState>) =>
    setSchematicB((prev) => ({ ...prev, ...update }));

  const canHybridize =
    schematicA.name.trim() &&
    schematicB.name.trim() &&
    schematicA.coreComponents.length > 0 &&
    schematicB.coreComponents.length > 0 &&
    targetApplication.trim();

  const handleHybridize = async () => {
    if (!canHybridize) return;
    setIsLoading(true);
    setError("");
    setResults(null);
    setLoadingPhase(0);

    const phaseInterval = setInterval(() => {
      setLoadingPhase((p) => Math.min(p + 1, LOADING_PHASES.length - 1));
    }, 2200);

    try {
      const payload = {
        schematicA: {
          name: schematicA.name,
          domain: schematicA.domain,
          topology: schematicA.topology,
          coreComponents: schematicA.coreComponents,
          physicalProperties: schematicA.physicalProperties,
          constraints: schematicA.constraints,
          imageBase64: schematicA.imageBase64 || undefined,
        },
        schematicB: {
          name: schematicB.name,
          domain: schematicB.domain,
          topology: schematicB.topology,
          coreComponents: schematicB.coreComponents,
          physicalProperties: schematicB.physicalProperties,
          constraints: schematicB.constraints,
          imageBase64: schematicB.imageBase64 || undefined,
        },
        hybridizationMode: mode,
        targetApplication,
        scientificDepth,
      };

      const r = await fetch("/api/hardware/hybridize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Hybridization failed");
      setResults(data as HybridizeResponse);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Hybridization failed");
    } finally {
      clearInterval(phaseInterval);
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (!results) return;
    const blob = new Blob(
      [
        JSON.stringify(
          {
            schematicA: { name: schematicA.name, domain: schematicA.domain },
            schematicB: { name: schematicB.name, domain: schematicB.domain },
            mode,
            targetApplication,
            scientificDepth,
            results,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hybrid_${schematicA.name.replace(/\s+/g, "_")}_x_${schematicB.name.replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SchematicPanel
          label="Schematic A"
          accentColor="#5BA8A0"
          state={schematicA}
          onChange={updateA}
        />
        <SchematicPanel
          label="Schematic B"
          accentColor="#9B6BCC"
          state={schematicB}
          onChange={updateB}
        />
      </div>

      <Card className="border-[#6B2C4A]/30" style={{ background: "rgba(107,44,74,0.05)" }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#6B2C4A]" />
            Hybridization Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Hybridization Mode</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                ["complementary", "antagonistic", "emergent", "biomimetic"] as HybridizationMode[]
              ).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  title={MODE_DESCRIPTIONS[m]}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-[11px] font-medium capitalize transition-all ${
                    mode === m
                      ? "border-[#6B2C4A] bg-[#6B2C4A]/15 text-[#c084a0]"
                      : "border-border text-muted-foreground hover:border-[#6B2C4A]/40 hover:text-foreground"
                  }`}
                >
                  {m === "complementary" && <Layers className="w-4 h-4" />}
                  {m === "antagonistic" && <Waves className="w-4 h-4" />}
                  {m === "emergent" && <Sparkles className="w-4 h-4" />}
                  {m === "biomimetic" && <Bug className="w-4 h-4" />}
                  {m}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground italic">{MODE_DESCRIPTIONS[mode]}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Target Application *</Label>
              <Input
                placeholder="e.g., Next-gen smartphone thermal management"
                value={targetApplication}
                onChange={(e) => setTargetApplication(e.target.value)}
                className="text-sm h-9"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Scientific Depth</Label>
              <div className="flex gap-1.5">
                {(["prototype", "research", "production"] as ScientificDepth[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setScientificDepth(d)}
                    className={`flex-1 px-2 py-1.5 rounded text-[11px] font-medium capitalize border transition-all ${
                      scientificDepth === d
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {d === "prototype" && "🔧 "}
                    {d === "research" && "🔬 "}
                    {d === "production" && "🏭 "}
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button
            onClick={handleHybridize}
            disabled={isLoading || !canHybridize}
            className="w-full h-11 text-sm font-semibold gap-2"
            style={{
              background: canHybridize ? "linear-gradient(135deg, #6B2C4A, #5BA8A0)" : undefined,
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="animate-pulse">{LOADING_PHASES[loadingPhase]}</span>
              </>
            ) : (
              <>
                <FlaskConical className="w-4 h-4" />
                Hybridize Schematics
              </>
            )}
          </Button>

          {!canHybridize && (
            <p className="text-[10px] text-muted-foreground text-center">
              Both schematics need a name, at least one core component, and a target application
            </p>
          )}

          {error && <p className="text-xs text-red-400 text-center">{error}</p>}
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card className="border-indigo-500/20" style={{ background: "rgba(99,102,241,0.05)" }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center gap-2 text-indigo-400">
                  <Network className="w-3.5 h-3.5" />
                  Topological Bridge
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {results.topologicalBridge}
                </p>
              </CardContent>
            </Card>

            <Card className="border-cyan-500/20" style={{ background: "rgba(6,182,212,0.05)" }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center gap-2 text-cyan-400">
                  <Waves className="w-3.5 h-3.5" />
                  Domain Bridging Principle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {results.domainBridgingPrinciple}
                </p>
                {results.materialCompatibilityNote && (
                  <p className="text-[10px] text-muted-foreground mt-2 italic border-t border-border/30 pt-2">
                    {results.materialCompatibilityNote}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-primary" />
              Hybrid Architectures
              <Badge variant="secondary" className="text-[10px]">
                {results.hybrids.length} designs
              </Badge>
            </h3>
            <div className="space-y-3">
              {results.hybrids.map((hybrid, i) => (
                <HybridCard
                  key={i}
                  hybrid={hybrid}
                  isOptimal={i === (results.optimalHybridIndex ?? 0)}
                  index={i}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {results.requiredCharacterizationTests?.length > 0 && (
              <Card className="border-orange-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-orange-400">Characterization Tests</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {results.requiredCharacterizationTests.map((t, i) => (
                      <li
                        key={i}
                        className="text-[10px] text-muted-foreground flex items-start gap-1.5"
                      >
                        <span className="text-orange-500 shrink-0">◉</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {results.referenceDesigns?.length > 0 && (
              <Card className="border-green-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-green-400">Reference Designs</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {results.referenceDesigns.map((r, i) => (
                      <li
                        key={i}
                        className="text-[10px] text-muted-foreground flex items-start gap-1.5"
                      >
                        <span className="text-green-500 shrink-0">▸</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {results.nextSteps?.length > 0 && (
              <Card className="border-blue-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-blue-400">Next Steps</CardTitle>
                  <CardDescription className="text-[9px]">Recommended actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-1">
                    {results.nextSteps.map((s, i) => (
                      <li
                        key={i}
                        className="text-[10px] text-muted-foreground flex items-start gap-1.5"
                      >
                        <span className="text-blue-500 font-mono shrink-0">{i + 1}.</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={handleExport}>
              <Download className="w-3.5 h-3.5" />
              Export Results (JSON)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
