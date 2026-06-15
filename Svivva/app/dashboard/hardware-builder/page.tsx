"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { FeaturePageShell } from "@/components/feature-page-shell";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { SchematicViewer } from "@/components/schematic-viewer";
import {
  ArrowRight,
  ArrowLeft,
  DollarSign,
  CheckCircle2,
  Sparkles,
  Loader2,
  Package,
  Palette,
  Settings2,
  FileText,
  Download,
  ExternalLink,
  ImageIcon,
  RotateCcw,
  Globe,
  Factory,
  Merge,
  Zap,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { HardwareSchematicHybridizer } from "@/components/hardware-schematic-hybridizer";

interface BuildStep {
  id: string;
  letter: string;
  title: string;
  description: string;
  completed: boolean;
}

const buildSteps: BuildStep[] = [
  {
    id: "bring",
    letter: "B",
    title: "Bring",
    description: "Describe your product vision",
    completed: false,
  },
  {
    id: "users",
    letter: "U",
    title: "Users",
    description: "Define target users & requirements",
    completed: false,
  },
  {
    id: "into",
    letter: "I",
    title: "Into",
    description: "Material scouting & budget",
    completed: false,
  },
  {
    id: "logical",
    letter: "L",
    title: "Logical",
    description: "Layout preview & optional AI sketch",
    completed: false,
  },
  {
    id: "delivery",
    letter: "D",
    title: "Delivery",
    description: "Export & manufacturing checklist",
    completed: false,
  },
];

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  category: string;
}

const HW_PRODUCTS_KEY = "svivva_hardware_products";

interface SavedHardwareProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  targetUsers: string;
  useCases: string;
  requirements: string[];
  materials: string[];
  manufacturingMethod: string;
  budgetRange: number;
  createdAt: string;
}

function saveHardwareProduct(product: SavedHardwareProduct) {
  try {
    const existing: SavedHardwareProduct[] = JSON.parse(
      localStorage.getItem(HW_PRODUCTS_KEY) || "[]",
    );
    const updated = [product, ...existing.filter((p) => p.id !== product.id)].slice(0, 50);
    localStorage.setItem(HW_PRODUCTS_KEY, JSON.stringify(updated));
  } catch {}
}

export default function HardwareBuilderPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [steps, setSteps] = useState<BuildStep[]>(buildSteps);

  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productCategory, setProductCategory] = useState("");

  const [targetUsers, setTargetUsers] = useState("");
  const [useCases, setUseCases] = useState("");
  const [requirements, setRequirements] = useState<string[]>([]);

  const [budgetRange, setBudgetRange] = useState([5000]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [manufacturingMethod, setManufacturingMethod] = useState("");

  const [generatedSketch, setGeneratedSketch] = useState(false);

  const [sketchPrompt, setSketchPrompt] = useState("");
  const [sketchGenerating, setSketchGenerating] = useState(false);
  const [sketchImageSrc, setSketchImageSrc] = useState("");
  const [sketchError, setSketchError] = useState("");
  const [sketchRevisedPrompt, setSketchRevisedPrompt] = useState("");

  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: "1", label: "Product specifications finalized", checked: false, category: "Planning" },
    { id: "2", label: "Material sourcing complete", checked: false, category: "Materials" },
    { id: "3", label: "Budget approved", checked: false, category: "Budget" },
    { id: "4", label: "Design references reviewed", checked: false, category: "Design" },
    {
      id: "5",
      label: "Manufacturing partner identified",
      checked: false,
      category: "Manufacturing",
    },
    { id: "6", label: "Prototype schedule set", checked: false, category: "Timeline" },
  ]);

  const [sourcingResults, setSourcingResults] = useState<{
    manufacturers: {
      name: string;
      website: string;
      specialty: string;
      fit?: string;
      estimatedCost: string;
      moq: string;
      location: string;
      leadTime: string;
    }[];
    materialSuppliers: {
      material: string;
      supplier: string;
      website: string;
      priceRange: string;
    }[];
    platforms: { name: string; website: string; type?: string; description: string }[];
    recommendation: string;
  } | null>(null);
  const [sourcingLoading, setSourcingLoading] = useState(false);

  const [showHybridizer, setShowHybridizer] = useState(false);
  const [systemAName, setSystemAName] = useState("");
  const [systemADesc, setSystemADesc] = useState("");
  const [systemBName, setSystemBName] = useState("");
  const [systemBDesc, setSystemBDesc] = useState("");
  const [hybridResults, setHybridResults] = useState<{
    hybrids: {
      title: string;
      description: string;
      fromSystemA: string;
      fromSystemB: string;
      emergentBehavior: string;
      noveltyScore: number;
      feasibility: string;
      potentialApplications: string[];
    }[];
    sharedRepresentation?: string;
    blendingStrategy?: string;
  } | null>(null);
  const [hybridLoading, setHybridLoading] = useState(false);

  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [expandedManufacturer, setExpandedManufacturer] = useState<number | null>(null);

  const requirementOptions = [
    "Durability",
    "Lightweight",
    "Waterproof",
    "Heat resistant",
    "Eco-friendly",
    "Modular design",
    "Easy assembly",
    "Compact size",
  ];

  const materialOptions = [
    "Aluminum",
    "Steel",
    "Plastic (ABS)",
    "Carbon fiber",
    "Wood",
    "Glass",
    "Silicone",
    "Titanium",
  ];

  const manufacturingMethods = [
    "3D Printing",
    "CNC Machining",
    "Injection Molding",
    "Laser Cutting",
    "Sheet Metal Fabrication",
    "Hand Assembly",
  ];

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setIsProcessing(true);
      await new Promise((resolve) => setTimeout(resolve, 800));

      const updatedSteps = [...steps];
      updatedSteps[currentStep].completed = true;
      setSteps(updatedSteps);

      setCurrentStep(currentStep + 1);
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerateSketch = useCallback(async () => {
    const text = sketchPrompt.trim();
    if (!text) return;
    setSketchGenerating(true);
    setSketchError("");
    setSketchImageSrc("");
    setSketchRevisedPrompt("");

    try {
      const contextPrefix = productName
        ? `Hardware product sketch for "${productName}"${productCategory ? ` (${productCategory})` : ""}${materials.length ? `, materials: ${materials.join(", ")}` : ""}: `
        : "Hardware product sketch: ";

      const r = await fetch("/api/hardware/sketch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: contextPrefix + text, quality: "standard" }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Generation failed");
      if (!data.imageBase64) throw new Error("No image returned");

      setSketchImageSrc(`data:${data.mimeType || "image/png"};base64,${data.imageBase64}`);
      if (data.revisedPrompt) setSketchRevisedPrompt(data.revisedPrompt);
      setGeneratedSketch(true);
    } catch (err: unknown) {
      setSketchError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setSketchGenerating(false);
    }
  }, [sketchPrompt, productName, productCategory, materials]);

  const handleDownloadSketch = useCallback(() => {
    if (!sketchImageSrc) return;
    const a = document.createElement("a");
    a.href = sketchImageSrc;
    a.download = `${productName || "sketch"}-reference.png`;
    a.click();
  }, [sketchImageSrc, productName]);

  const handleFindManufacturers = useCallback(async () => {
    setSourcingLoading(true);
    try {
      const r = await fetch("/api/hardware/manufacturers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: productName || "Hardware Product",
          productDescription: productDescription,
          category: productCategory,
          materials,
          manufacturingMethod,
          budgetRange: budgetRange[0],
          requirements,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Sourcing failed");
      setSourcingResults(data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setSourcingLoading(false);
    }
  }, [
    productName,
    productDescription,
    productCategory,
    materials,
    manufacturingMethod,
    budgetRange,
    requirements,
  ]);

  const handleHybridize = useCallback(async () => {
    if (!systemAName.trim() || !systemBName.trim()) return;
    setHybridLoading(true);
    try {
      const r = await fetch("/api/hardware/hybridize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemA: {
            name: systemAName,
            description: systemADesc,
            components: materials,
            properties: requirements,
          },
          systemB: { name: systemBName, description: systemBDesc },
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Hybridization failed");
      setHybridResults(data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setHybridLoading(false);
    }
  }, [systemAName, systemADesc, systemBName, systemBDesc, materials, requirements]);

  const handleDownloadBlueprint = useCallback(async () => {
    setPdfGenerating(true);
    try {
      const r = await fetch("/api/hardware/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: productName || "Hardware Product",
          productDescription,
          category: productCategory,
          targetUsers,
          useCases,
          requirements,
          materials,
          manufacturingMethod,
          budgetRange: budgetRange[0],
          manufacturers: sourcingResults?.manufacturers || [],
          materialSuppliers: sourcingResults?.materialSuppliers || [],
          platforms: sourcingResults?.platforms || [],
          recommendation: sourcingResults?.recommendation || "",
          hybrids: hybridResults?.hybrids || [],
        }),
      });
      if (!r.ok) throw new Error("PDF generation failed");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(productName || "product").replace(/[^a-zA-Z0-9]/g, "_")}_Blueprint.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setPdfGenerating(false);
    }
  }, [
    productName,
    productDescription,
    productCategory,
    targetUsers,
    useCases,
    requirements,
    materials,
    manufacturingMethod,
    budgetRange,
    sourcingResults,
    hybridResults,
  ]);

  const toggleRequirement = (req: string) => {
    if (requirements.includes(req)) {
      setRequirements(requirements.filter((r) => r !== req));
    } else {
      setRequirements([...requirements, req]);
    }
  };

  const toggleMaterial = (mat: string) => {
    if (materials.includes(mat)) {
      setMaterials(materials.filter((m) => m !== mat));
    } else {
      setMaterials([...materials, mat]);
    }
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist(
      checklist.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)),
    );
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                placeholder="Enter your product name..."
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                data-testid="input-product-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productDescription">Product Description</Label>
              <Textarea
                id="productDescription"
                placeholder="Describe your product vision in detail. What problem does it solve? What makes it unique?"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                className="min-h-[120px]"
                data-testid="input-product-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productCategory">Category</Label>
              <Input
                id="productCategory"
                placeholder="e.g., Consumer Electronics, Home Goods, Industrial Equipment..."
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                data-testid="input-product-category"
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="targetUsers">Target Users</Label>
              <Textarea
                id="targetUsers"
                placeholder="Who will use this product? Describe your target audience..."
                value={targetUsers}
                onChange={(e) => setTargetUsers(e.target.value)}
                className="min-h-[80px]"
                data-testid="input-target-users"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="useCases">Primary Use Cases</Label>
              <Textarea
                id="useCases"
                placeholder="How will users interact with this product? List the main scenarios..."
                value={useCases}
                onChange={(e) => setUseCases(e.target.value)}
                className="min-h-[80px]"
                data-testid="input-use-cases"
              />
            </div>
            <div className="space-y-3">
              <Label>Requirements (select all that apply)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {requirementOptions.map((req) => (
                  <Button
                    key={req}
                    variant={requirements.includes(req) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleRequirement(req)}
                    data-testid={`button-requirement-${req.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {req}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label>Budget Range</Label>
              <div className="flex items-center gap-4">
                <DollarSign className="w-5 h-5 text-primary" />
                <Slider
                  value={budgetRange}
                  onValueChange={setBudgetRange}
                  min={1000}
                  max={100000}
                  step={1000}
                  className="flex-1"
                />
                <span className="text-lg font-semibold min-w-[100px]">
                  ${budgetRange[0].toLocaleString()}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <Label>Preferred Materials</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {materialOptions.map((mat) => (
                  <Button
                    key={mat}
                    variant={materials.includes(mat) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleMaterial(mat)}
                    data-testid={`button-material-${mat.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {mat}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Label>Manufacturing Method</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {manufacturingMethods.map((method) => (
                  <Button
                    key={method}
                    variant={manufacturingMethod === method ? "default" : "outline"}
                    size="sm"
                    onClick={() => setManufacturingMethod(method)}
                    data-testid={`button-method-${method.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {method}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-primary/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Layout preview
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Illustrative dimensions from your brief — not a CAD export or AI 3D model.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square rounded-lg overflow-hidden mb-3">
                    <SchematicViewer
                      productName={productName}
                      productCategory={productCategory}
                      materials={materials}
                      requirements={requirements}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" />
                    AI Sketch
                    {generatedSketch && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 ml-auto" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-muted/50 relative">
                    {sketchImageSrc ? (
                      <Image
                        src={sketchImageSrc}
                        alt="AI-generated sketch"
                        fill
                        className="object-cover"
                        unoptimized
                        data-testid="img-generated-sketch"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3">
                        {sketchGenerating ? (
                          <>
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <span className="text-[10px] text-muted-foreground">
                              Generating with DALL-E 3...
                            </span>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground text-center">
                              Describe your product to generate a reference sketch
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {sketchError && (
                    <p
                      className="text-[10px] text-red-400 mb-2 px-1"
                      data-testid="text-sketch-error"
                    >
                      {sketchError}
                    </p>
                  )}
                  {sketchRevisedPrompt && (
                    <p
                      className="text-[9px] text-muted-foreground mb-2 px-1 line-clamp-2"
                      title={sketchRevisedPrompt}
                    >
                      {sketchRevisedPrompt}
                    </p>
                  )}
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Describe the product appearance..."
                      value={sketchPrompt}
                      onChange={(e) => setSketchPrompt(e.target.value)}
                      className="text-xs min-h-[44px] resize-none"
                      rows={2}
                      maxLength={4000}
                      data-testid="textarea-sketch-prompt"
                    />
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={handleGenerateSketch}
                        disabled={sketchGenerating || !sketchPrompt.trim()}
                        data-testid="button-generate-sketch"
                      >
                        {sketchGenerating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : generatedSketch ? (
                          <>
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Regenerate
                          </>
                        ) : (
                          "Generate"
                        )}
                      </Button>
                      {sketchImageSrc && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="px-2"
                          onClick={handleDownloadSketch}
                          data-testid="button-download-sketch"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-primary" />
                  Manufacturing Checklist
                </CardTitle>
                <CardDescription>
                  Complete all items before proceeding to manufacturing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {checklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                    >
                      <Checkbox
                        id={item.id}
                        checked={item.checked}
                        onCheckedChange={() => toggleChecklistItem(item.id)}
                        data-testid={`checkbox-${item.id}`}
                      />
                      <Label htmlFor={item.id} className="flex-1 cursor-pointer">
                        {item.label}
                      </Label>
                      <Badge variant="secondary" className="text-xs">
                        {item.category}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#5BA8A0]/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Factory className="w-5 h-5 text-[#5BA8A0]" />
                  Find Manufacturers & Suppliers
                </CardTitle>
                <CardDescription>
                  AI researches specific manufacturers, material suppliers, and platforms for your
                  product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleFindManufacturers}
                  disabled={sourcingLoading}
                  className="gap-2 w-full"
                  data-testid="button-find-manufacturers"
                >
                  {sourcingLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Researching manufacturers...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" /> Research Manufacturers & Suppliers
                    </>
                  )}
                </Button>

                {sourcingResults && (
                  <div className="space-y-4 mt-4">
                    {sourcingResults.recommendation && (
                      <div className="p-3 rounded-lg bg-[#5BA8A0]/10 border border-[#5BA8A0]/20">
                        <p className="text-sm flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-[#5BA8A0] shrink-0 mt-0.5" />
                          {sourcingResults.recommendation}
                        </p>
                      </div>
                    )}

                    {sourcingResults.manufacturers?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Factory className="w-4 h-4" /> Recommended Manufacturers
                        </h4>
                        <div className="space-y-2">
                          {sourcingResults.manufacturers.map((m, i) => (
                            <div key={i} className="border rounded-lg overflow-hidden">
                              <button
                                onClick={() =>
                                  setExpandedManufacturer(expandedManufacturer === i ? null : i)
                                }
                                className="w-full p-3 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
                                data-testid={`button-manufacturer-${i}`}
                              >
                                <div>
                                  <span className="font-medium text-sm">{m.name}</span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {m.location}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {m.estimatedCost}
                                  </Badge>
                                  {expandedManufacturer === i ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </div>
                              </button>
                              {expandedManufacturer === i && (
                                <div className="px-3 pb-3 space-y-1 text-xs text-muted-foreground border-t pt-2">
                                  <p>
                                    <span className="font-medium text-foreground">Specialty:</span>{" "}
                                    {m.specialty}
                                  </p>
                                  {m.fit && (
                                    <p>
                                      <span className="font-medium text-foreground">Why:</span>{" "}
                                      {m.fit}
                                    </p>
                                  )}
                                  <p>
                                    <span className="font-medium text-foreground">Min Order:</span>{" "}
                                    {m.moq}
                                  </p>
                                  <p>
                                    <span className="font-medium text-foreground">Lead Time:</span>{" "}
                                    {m.leadTime}
                                  </p>
                                  {m.website && (
                                    <a
                                      href={m.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[#5BA8A0] hover:underline flex items-center gap-1"
                                    >
                                      <Globe className="w-3 h-3" /> {m.website}
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {sourcingResults.materialSuppliers?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Package className="w-4 h-4" /> Material Suppliers
                        </h4>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {sourcingResults.materialSuppliers.map((s, i) => (
                            <div key={i} className="p-2.5 border rounded-lg text-xs space-y-0.5">
                              <p className="font-medium text-sm">{s.material}</p>
                              <p className="text-muted-foreground">{s.supplier}</p>
                              <p className="text-muted-foreground">{s.priceRange}</p>
                              {s.website && (
                                <a
                                  href={s.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#5BA8A0] hover:underline flex items-center gap-1"
                                >
                                  <Globe className="w-3 h-3" /> Visit
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {sourcingResults.platforms?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Globe className="w-4 h-4" /> Manufacturing Platforms
                        </h4>
                        <div className="grid gap-2 sm:grid-cols-3">
                          {sourcingResults.platforms.map((p, i) => (
                            <div key={i} className="p-2.5 border rounded-lg text-xs">
                              <p className="font-medium text-sm">{p.name}</p>
                              <p className="text-muted-foreground mt-0.5">{p.description}</p>
                              {p.website && (
                                <a
                                  href={p.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#5BA8A0] hover:underline flex items-center gap-1 mt-1"
                                >
                                  <ExternalLink className="w-3 h-3" /> Open
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-[#6B2C4A]/30">
              <CardHeader>
                <button
                  onClick={() => setShowHybridizer(!showHybridizer)}
                  className="flex items-center justify-between w-full text-left"
                  data-testid="button-toggle-hybridizer"
                >
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Merge className="w-5 h-5 text-[#6B2C4A]" />
                      Cross-Domain Hybridizer
                    </CardTitle>
                    <CardDescription>
                      Combine two systems to discover hybrid innovations
                    </CardDescription>
                  </div>
                  {showHybridizer ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              </CardHeader>
              {showHybridizer && (
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 p-3 rounded-lg border border-[#5BA8A0]/20 bg-[#5BA8A0]/5">
                      <Label className="text-xs font-medium text-[#5BA8A0]">System A</Label>
                      <Input
                        placeholder="e.g., Solar Panel Array"
                        value={systemAName}
                        onChange={(e) => setSystemAName(e.target.value)}
                        data-testid="input-system-a-name"
                      />
                      <Textarea
                        placeholder="Describe the system..."
                        value={systemADesc}
                        onChange={(e) => setSystemADesc(e.target.value)}
                        className="min-h-[60px] text-xs"
                        data-testid="input-system-a-desc"
                      />
                    </div>
                    <div className="space-y-2 p-3 rounded-lg border border-[#6B2C4A]/20 bg-[#6B2C4A]/5">
                      <Label className="text-xs font-medium text-[#6B2C4A]">System B</Label>
                      <Input
                        placeholder="e.g., Water Filtration System"
                        value={systemBName}
                        onChange={(e) => setSystemBName(e.target.value)}
                        data-testid="input-system-b-name"
                      />
                      <Textarea
                        placeholder="Describe the system..."
                        value={systemBDesc}
                        onChange={(e) => setSystemBDesc(e.target.value)}
                        className="min-h-[60px] text-xs"
                        data-testid="input-system-b-desc"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleHybridize}
                    disabled={hybridLoading || !systemAName.trim() || !systemBName.trim()}
                    className="gap-2 w-full"
                    style={{ background: "#6B2C4A" }}
                    data-testid="button-hybridize"
                  >
                    {hybridLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Generating hybrids...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" /> Generate Hybrid Systems
                      </>
                    )}
                  </Button>

                  {hybridResults && (
                    <div className="space-y-3 mt-2">
                      {hybridResults.blendingStrategy && (
                        <p className="text-xs text-muted-foreground italic p-2 rounded bg-muted/30">
                          {hybridResults.blendingStrategy}
                        </p>
                      )}
                      {hybridResults.hybrids?.map((h, i) => (
                        <Card key={i} className="border-[#6B2C4A]/20">
                          <CardContent className="pt-4 pb-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm">{h.title}</h4>
                              <div className="flex items-center gap-2">
                                {h.feasibility && (
                                  <Badge variant="outline" className="text-[10px]">
                                    {h.feasibility}
                                  </Badge>
                                )}
                                <Badge
                                  className="text-[10px]"
                                  style={{ background: `hsl(${h.noveltyScore * 1.2}, 60%, 45%)` }}
                                >
                                  {h.noveltyScore}% novel
                                </Badge>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">{h.description}</p>
                            <div className="grid gap-1 text-xs mt-1">
                              <p>
                                <span className="font-medium text-[#5BA8A0]">From A:</span>{" "}
                                {h.fromSystemA}
                              </p>
                              <p>
                                <span className="font-medium text-[#6B2C4A]">From B:</span>{" "}
                                {h.fromSystemB}
                              </p>
                              <p className="flex items-start gap-1">
                                <Zap className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                                <span>
                                  <span className="font-medium">Emergent:</span>{" "}
                                  {h.emergentBehavior}
                                </span>
                              </p>
                            </div>
                            {h.potentialApplications?.length > 0 && (
                              <div className="flex gap-1 flex-wrap mt-1">
                                {h.potentialApplications.map((app, j) => (
                                  <Badge key={j} variant="secondary" className="text-[10px]">
                                    {app}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            <Card className="bg-primary/10 border-primary/30">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
                  <h3 className="text-lg font-semibold">Ready for Manufacturing</h3>
                  <p className="text-sm text-muted-foreground">
                    Download your complete product blueprint as a PDF with all specs, manufacturers,
                    and recommendations.
                  </p>
                  <Button
                    onClick={handleDownloadBlueprint}
                    disabled={pdfGenerating}
                    className="gap-2"
                    size="lg"
                    data-testid="button-download-blueprint"
                  >
                    {pdfGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Generating PDF...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" /> Download Product Blueprint (PDF)
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <FeaturePageShell
      variant="hardware"
      subtitle="AI schematics, supplier matching, and tangible product workflows."
      className="pb-4"
    >
      <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6 px-4 pb-4 relative z-10">
        <Card className="border-[#5BA8A0]/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Merge className="w-5 h-5 text-[#5BA8A0]" />
              <div>
                <CardTitle className="text-lg">Schematic Hybridizer</CardTitle>
                <CardDescription>
                  Cross-domain AI analysis — discover novel hybrid architectures from any two
                  hardware schematics
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <HardwareSchematicHybridizer />
          </CardContent>
        </Card>

        <Card className="border-primary/30">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="space-y-1">
                <CardTitle className="text-lg">BUILD System</CardTitle>
                <CardDescription>Bring Users Into Logical Delivery</CardDescription>
              </div>
              <Badge variant="outline">
                Step {currentStep + 1} of {steps.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-2 justify-between">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex flex-col items-center gap-1 flex-1 ${
                    index <= currentStep ? "opacity-100" : "opacity-40"
                  }`}
                >
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-lg font-bold ${
                      step.completed
                        ? "bg-green-500 text-white"
                        : index === currentStep
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.completed ? <CheckCircle2 className="w-5 h-5" /> : step.letter}
                  </div>
                  <span className="text-xs text-center hidden sm:block">{step.title}</span>
                </div>
              ))}
            </div>

            <Progress value={progress} className="h-2" />

            <div className="pt-4">
              <h2 className="text-xl font-semibold mb-2">
                {steps[currentStep].letter}. {steps[currentStep].title}
              </h2>
              <p className="text-muted-foreground mb-6">{steps[currentStep].description}</p>

              {renderStepContent()}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || isProcessing}
            className="gap-2 order-2 sm:order-1"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={isProcessing}
              className="gap-2 order-1 sm:order-2"
              data-testid="button-next"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          ) : (
            <Button
              className="gap-2 order-1 sm:order-2"
              data-testid="button-complete"
              onClick={() => {
                if (productName.trim()) {
                  saveHardwareProduct({
                    id: `hwp_${Date.now()}`,
                    name: productName.trim(),
                    description: productDescription.trim(),
                    category: productCategory,
                    targetUsers: targetUsers.trim(),
                    useCases: useCases.trim(),
                    requirements,
                    materials,
                    manufacturingMethod,
                    budgetRange: budgetRange[0],
                    createdAt: new Date().toISOString(),
                  });
                }
                const updatedSteps = [...steps];
                updatedSteps[currentStep].completed = true;
                setSteps(updatedSteps);
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
              Complete Build
            </Button>
          )}
        </div>
      </div>
    </FeaturePageShell>
  );
}
