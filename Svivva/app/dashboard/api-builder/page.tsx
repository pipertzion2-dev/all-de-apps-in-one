"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
const FeatureThreeBg = dynamic(
  () =>
    import("@/components/feature-three-background").then((m) => ({
      default: m.FeatureThreeBackground,
    })),
  { ssr: false },
);
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  Building2,
  Layers,
  Palette,
  Rocket,
  ArrowRight,
  ArrowLeft,
  Check,
  Lightbulb,
  Package,
  Wand2,
  RefreshCw,
  Plus,
  X,
  Crown,
  Target,
  Zap,
  Users,
  Globe,
  Star,
} from "lucide-react";

interface SuggestedAPI {
  name: string;
  description: string;
  purpose: string;
  selected: boolean;
}

interface BrandSuggestion {
  name: string;
  tagline: string;
  colorScheme: string[];
  logoDescription: string;
}

interface BusinessAnalysis {
  industry: string;
  targetAudience: string;
  coreValue: string;
  suggestedAPIs: SuggestedAPI[];
  brandSuggestions: BrandSuggestion[];
}

export default function APIBuilderPage() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingBrand, setIsGeneratingBrand] = useState(false);

  // Step 1: Business Context
  const [companyDescription, setCompanyDescription] = useState("");
  const [primaryAPIPrompt, setPrimaryAPIPrompt] = useState("");
  const [goals, setGoals] = useState("");

  useEffect(() => {
    const prefill = searchParams.get("prefill");
    if (prefill) setPrimaryAPIPrompt(decodeURIComponent(prefill));
  }, [searchParams]);

  // Step 2: Analysis Results
  const [analysis, setAnalysis] = useState<BusinessAnalysis | null>(null);

  // Step 3: Brand Selection
  const [selectedBrand, setSelectedBrand] = useState<BrandSuggestion | null>(null);
  const [customBrandName, setCustomBrandName] = useState("");

  // Step 4: Final Bundle
  const [bundleName, setBundleName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const totalSteps = 4;
  const progress = step >= 5 ? 100 : (step / totalSteps) * 100;
  const displayStep = step >= 5 ? totalSteps : step;

  const analyzeAndSuggest = async () => {
    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/combo-builder/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          companyDescription,
          primaryAPIPrompt,
          goals,
        }),
      });

      if (!response.ok) throw new Error("Analysis failed");

      const data = await response.json();
      setAnalysis(data);
      setStep(2);
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateMoreBrands = async () => {
    setIsGeneratingBrand(true);

    try {
      const selectedAPIs = analysis?.suggestedAPIs.filter((api) => api.selected) || [];
      const response = await fetch("/api/combo-builder/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          companyDescription,
          selectedAPIs: selectedAPIs.map((api) => api.name),
          goals,
        }),
      });

      if (!response.ok) throw new Error("Brand generation failed");

      const data = await response.json();
      if (analysis) {
        setAnalysis({
          ...analysis,
          brandSuggestions: [...analysis.brandSuggestions, ...data.brandSuggestions],
        });
      }
    } catch (error) {
      console.error("Brand generation error:", error);
    } finally {
      setIsGeneratingBrand(false);
    }
  };

  const toggleAPI = (index: number) => {
    if (!analysis) return;
    const updated = [...analysis.suggestedAPIs];
    updated[index].selected = !updated[index].selected;
    setAnalysis({ ...analysis, suggestedAPIs: updated });
  };

  const createBundle = async () => {
    setIsCreating(true);

    try {
      const selectedAPIs = analysis?.suggestedAPIs.filter((api) => api.selected) || [];
      const response = await fetch("/api/combo-builder/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          bundleName: bundleName || selectedBrand?.name || "My API Bundle",
          brand: selectedBrand || { name: customBrandName },
          apis: selectedAPIs,
          companyDescription,
          goals,
        }),
      });

      if (!response.ok) throw new Error("Bundle creation failed");

      const data = await response.json();
      setStep(5); // Success step
    } catch (error) {
      console.error("Creation error:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const selectedCount = analysis?.suggestedAPIs.filter((api) => api.selected).length || 0;

  return (
    <div className="space-y-5 sm:space-y-6 max-w-4xl mx-auto relative">
      <FeatureThreeBg variant="api" />
      {/* Header */}
      <div className="text-center space-y-3 sm:space-y-4">
        <div className="flex items-center justify-center gap-2">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#5BA8A0] to-[#D782B2] flex items-center justify-center">
            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-builder-title">
          Combo API Builder
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
          Build a complete branded API product suite for your business.
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-muted-foreground">
            {step >= 5 ? "Complete" : `Step ${displayStep} of ${totalSteps}`}
          </span>
          <span className="text-[#5BA8A0] font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between">
          {[
            { full: "Business Context", short: "Context" },
            { full: "API Suggestions", short: "APIs" },
            { full: "Brand Identity", short: "Brand" },
            { full: "Launch Bundle", short: "Launch" },
          ].map(({ full, short }, i) => (
            <div
              key={full}
              className={`text-[10px] sm:text-xs ${step > i ? "text-[#5BA8A0]" : step === i + 1 ? "text-foreground" : "text-muted-foreground"}`}
            >
              <span className="hidden sm:inline">{full}</span>
              <span className="sm:hidden">{short}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Business Context */}
      {step === 1 && (
        <Card className="border-[#5BA8A0]/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#5BA8A0]/15 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#5BA8A0]" />
              </div>
              <div>
                <CardTitle>Tell us about your business</CardTitle>
                <CardDescription>
                  Help us understand your company so we can suggest the perfect API suite
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="company">What does your company do?</Label>
              <Textarea
                id="company"
                placeholder="e.g., We're a fitness app that helps users track workouts, nutrition, and sleep. We want to add AI-powered features to personalize recommendations..."
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                className="min-h-[100px]"
                data-testid="input-company-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary-api">What's your primary API idea?</Label>
              <Textarea
                id="primary-api"
                placeholder="e.g., An API that analyzes workout performance and suggests personalized exercise modifications based on user progress and goals..."
                value={primaryAPIPrompt}
                onChange={(e) => setPrimaryAPIPrompt(e.target.value)}
                className="min-h-[100px]"
                data-testid="input-primary-api"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goals">What are your business goals?</Label>
              <Textarea
                id="goals"
                placeholder="e.g., Increase user engagement, reduce churn, monetize our API for other fitness apps, expand into corporate wellness..."
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                className="min-h-[80px]"
                data-testid="input-goals"
              />
            </div>

            <div className="bg-[#5BA8A0]/10 rounded-lg p-4 border border-[#5BA8A0]/20">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-[#5BA8A0] mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-[#5BA8A0]">AI-Powered Analysis</p>
                  <p className="text-muted-foreground">
                    Our AI will analyze your business context to suggest complementary APIs that
                    work together, along with brand identity suggestions to create a market-ready
                    product.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={analyzeAndSuggest}
                disabled={!companyDescription || !primaryAPIPrompt || isAnalyzing}
                className="bg-[#5BA8A0] w-full sm:w-auto"
                data-testid="button-analyze"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze & Suggest
                    <Sparkles className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: API Suggestions */}
      {step === 2 && analysis && (
        <div className="space-y-6">
          {/* Business Analysis Summary */}
          <Card className="border-[#D782B2]/30 bg-gradient-to-br from-[#D782B2]/5 to-transparent">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#D782B2]/15 flex items-center justify-center">
                  <Target className="w-5 h-5 text-[#D782B2]" />
                </div>
                <div>
                  <CardTitle>Business Analysis</CardTitle>
                  <CardDescription>We've analyzed your business context</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-card rounded-lg p-4 border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Industry
                  </p>
                  <p className="font-medium">{analysis.industry}</p>
                </div>
                <div className="bg-card rounded-lg p-4 border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Target Audience
                  </p>
                  <p className="font-medium">{analysis.targetAudience}</p>
                </div>
                <div className="bg-card rounded-lg p-4 border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Core Value
                  </p>
                  <p className="font-medium">{analysis.coreValue}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Suggested APIs */}
          <Card className="border-[#5BA8A0]/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#5BA8A0]/15 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-[#5BA8A0]" />
                  </div>
                  <div>
                    <CardTitle>Suggested API Suite</CardTitle>
                    <CardDescription>
                      Select the APIs you want to include in your product bundle
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-[#5BA8A0]/20 text-[#5BA8A0] border-[#5BA8A0]/30">
                  {selectedCount} selected
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysis.suggestedAPIs.map((api, index) => (
                <div
                  key={index}
                  onClick={() => toggleAPI(index)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    api.selected
                      ? "border-[#5BA8A0] bg-[#5BA8A0]/10"
                      : "border-border hover:border-[#5BA8A0]/50"
                  }`}
                  data-testid={`card-api-suggestion-${index}`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        api.selected ? "border-[#5BA8A0] bg-[#5BA8A0]" : "border-muted-foreground"
                      }`}
                    >
                      {api.selected && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{api.name}</h4>
                        {index === 0 && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-[#D782B2]/20 text-[#D782B2]"
                          >
                            Primary
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{api.description}</p>
                      <p className="text-xs text-[#5BA8A0]">
                        <span className="font-medium">Purpose:</span> {api.purpose}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="order-2 sm:order-1"
              data-testid="button-back-step1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={selectedCount === 0}
              className="bg-[#5BA8A0] order-1 sm:order-2"
              data-testid="button-continue-brand"
            >
              Continue to Branding
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Brand Identity */}
      {step === 3 && analysis && (
        <div className="space-y-6">
          <Card className="border-[#D782B2]/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#D782B2]/15 flex items-center justify-center">
                    <Palette className="w-5 h-5 text-[#D782B2]" />
                  </div>
                  <div>
                    <CardTitle>Brand Identity</CardTitle>
                    <CardDescription>
                      Choose a brand identity for your API product or create your own
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateMoreBrands}
                  disabled={isGeneratingBrand}
                  data-testid="button-generate-brands"
                >
                  {isGeneratingBrand ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate More
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.brandSuggestions.map((brand, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setSelectedBrand(brand);
                    setBundleName(brand.name);
                    setCustomBrandName("");
                  }}
                  className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedBrand === brand
                      ? "border-[#D782B2] bg-[#D782B2]/10"
                      : "border-border hover:border-[#D782B2]/50"
                  }`}
                  data-testid={`card-brand-${index}`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedBrand === brand
                          ? "border-[#D782B2] bg-[#D782B2]"
                          : "border-muted-foreground"
                      }`}
                    >
                      {selectedBrand === brand && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-xl font-bold">{brand.name}</h4>
                        <div className="flex gap-1">
                          {brand.colorScheme.map((color, i) => (
                            <div
                              key={i}
                              className="w-5 h-5 rounded-full border border-white/20"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground italic mb-3">
                        &quot;{brand.tagline}&quot;
                      </p>
                      <div className="bg-card rounded-lg p-3 border">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Logo Concept
                        </p>
                        <p className="text-sm">{brand.logoDescription}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Custom Brand Option */}
              <div className="border-t pt-4 mt-4">
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Or enter your own brand name:
                </Label>
                <Input
                  placeholder="Enter your brand name..."
                  value={customBrandName}
                  onChange={(e) => {
                    setCustomBrandName(e.target.value);
                    setSelectedBrand(null);
                    setBundleName(e.target.value);
                  }}
                  data-testid="input-custom-brand"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
              className="order-2 sm:order-1"
              data-testid="button-back-step2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={() => setStep(4)}
              disabled={!selectedBrand && !customBrandName}
              className="bg-[#D782B2] order-1 sm:order-2"
              data-testid="button-continue-launch"
            >
              Review & Launch
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Launch Bundle */}
      {step === 4 && analysis && (
        <div className="space-y-6">
          <Card className="border-[#5BA8A0]/30 bg-gradient-to-br from-[#5BA8A0]/5 via-transparent to-[#D782B2]/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#5BA8A0] to-[#D782B2] flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle>Launch Your API Bundle</CardTitle>
                  <CardDescription>
                    Review your selections and create your branded API product
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Brand Preview */}
              <div className="bg-card rounded-xl p-6 border">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#5BA8A0] to-[#D782B2] flex items-center justify-center">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{bundleName || "Your API Bundle"}</h3>
                    {selectedBrand && (
                      <p className="text-muted-foreground italic">
                        &quot;{selectedBrand.tagline}&quot;
                      </p>
                    )}
                  </div>
                </div>
                {selectedBrand && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-muted-foreground">Brand Colors:</span>
                    {selectedBrand.colorScheme.map((color, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full border border-white/20"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Selected APIs */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#5BA8A0]" />
                  Included APIs ({selectedCount})
                </h4>
                <div className="space-y-2">
                  {analysis.suggestedAPIs
                    .filter((api) => api.selected)
                    .map((api, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                      >
                        <Zap className="w-4 h-4 text-[#5BA8A0]" />
                        <span className="font-medium">{api.name}</span>
                        <span className="text-sm text-muted-foreground">- {api.purpose}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* What's Included */}
              <div className="bg-[#5BA8A0]/10 rounded-xl p-4 border border-[#5BA8A0]/20">
                <h4 className="font-medium mb-3 text-[#5BA8A0]">What You&apos;ll Get:</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    { icon: Layers, text: `${selectedCount} Production-Ready APIs` },
                    { icon: Globe, text: "Auto-Generated Documentation" },
                    { icon: Users, text: "SDK for Python & Node.js" },
                    { icon: Star, text: "Marketplace-Ready Listing" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-[#5BA8A0]" />
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setStep(3)}
              className="order-2 sm:order-1"
              data-testid="button-back-step3"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={createBundle}
              disabled={isCreating}
              className="bg-gradient-to-r from-[#5BA8A0] to-[#D782B2] order-1 sm:order-2"
              data-testid="button-create-bundle"
            >
              {isCreating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating Bundle...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Create API Bundle
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: Success */}
      {step === 5 && (
        <Card className="border-[#5BA8A0]/30 text-center py-12">
          <CardContent className="space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#5BA8A0] to-[#D782B2] flex items-center justify-center">
              <Check className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Bundle Created Successfully!</h2>
              <p className="text-muted-foreground">
                Your API bundle &quot;{bundleName}&quot; has been created with {selectedCount} APIs.
              </p>
            </div>
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/dashboard")}
                data-testid="button-view-dashboard"
              >
                View Dashboard
              </Button>
              <Button
                className="bg-[#5BA8A0]"
                onClick={() => {
                  setStep(1);
                  setCompanyDescription("");
                  setPrimaryAPIPrompt("");
                  setGoals("");
                  setAnalysis(null);
                  setSelectedBrand(null);
                  setBundleName("");
                }}
                data-testid="button-create-another"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Another Bundle
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
