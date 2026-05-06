"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Zap, 
  Target, 
  Sparkles, 
  Rocket, 
  Brain, 
  Cpu, 
  ChevronRight, 
  Check,
  ArrowLeft,
  Settings2
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";


interface ApiCreatorPanelProps {
  onComplete: (data: {
    prompt: string;
    name: string;
    icon: string;
    palette: { primary: string; secondary: string; accent: string };
  }) => void;
}

interface TailoredQuestion {
  id: string;
  question: string;
  description: string;
  options: { value: string; label: string; description: string }[];
}

interface BrandSuggestion {
  names: string[];
  icons: { name: string; icon: React.ReactNode }[];
  palettes: { name: string; colors: { primary: string; secondary: string; accent: string } }[];
}

const iconOptions = [
  { name: "Zap", icon: <Zap className="w-5 h-5" /> },
  { name: "Target", icon: <Target className="w-5 h-5" /> },
  { name: "Sparkles", icon: <Sparkles className="w-5 h-5" /> },
  { name: "Rocket", icon: <Rocket className="w-5 h-5" /> },
  { name: "Brain", icon: <Brain className="w-5 h-5" /> },
  { name: "Cpu", icon: <Cpu className="w-5 h-5" /> },
];

export function ApiCreatorPanel({ onComplete }: ApiCreatorPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [outputFormat, setOutputFormat] = useState("");
  const [phase, setPhase] = useState<"prompt" | "questions" | "brand">("prompt");
  const [showTuner, setShowTuner] = useState(false);
  
  // API Tuner Settings
  const [creativity, setCreativity] = useState([50]);
  const [detailLevel, setDetailLevel] = useState([70]);
  const [strictness, setStrictness] = useState([60]);
  const [includeConfidence, setIncludeConfidence] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(false);
  const [tailoredQuestions, setTailoredQuestions] = useState<TailoredQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<BrandSuggestion | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [selectedPalette, setSelectedPalette] = useState<{ name: string; colors: { primary: string; secondary: string; accent: string } } | null>(null);

  const generateTailoredQuestions = useCallback(async (userPrompt: string) => {
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 800));
    
    const words = userPrompt.toLowerCase();
    const questions: TailoredQuestion[] = [];
    
    if (words.includes("analyz") || words.includes("review") || words.includes("sentiment") || words.includes("extract")) {
      questions.push({ 
        id: "depth", 
        question: "Analysis Depth",
        description: "How thorough should the analysis be?",
        options: [
          { value: "quick", label: "Quick", description: "Fast surface scan" },
          { value: "standard", label: "Standard", description: "Balanced analysis" },
          { value: "deep", label: "Deep", description: "Thorough examination" },
          { value: "exhaustive", label: "Exhaustive", description: "Leave no stone unturned" },
        ]
      });
    } else if (words.includes("generat") || words.includes("creat") || words.includes("write") || words.includes("compose")) {
      questions.push({ 
        id: "creativity", 
        question: "Creativity Level",
        description: "How creative should the output be?",
        options: [
          { value: "conservative", label: "Conservative", description: "Stick to the facts" },
          { value: "balanced", label: "Balanced", description: "Some creative freedom" },
          { value: "creative", label: "Creative", description: "Encourage originality" },
          { value: "experimental", label: "Experimental", description: "Push boundaries" },
        ]
      });
    } else {
      questions.push({ 
        id: "style", 
        question: "Processing Mode",
        description: "How should requests be handled?",
        options: [
          { value: "fast", label: "Fast", description: "Speed priority" },
          { value: "balanced", label: "Balanced", description: "Speed + quality" },
          { value: "thorough", label: "Thorough", description: "Quality priority" },
          { value: "maximum", label: "Maximum", description: "Best possible result" },
        ]
      });
    }
    
    questions.push({ 
      id: "output", 
      question: "Response Detail",
      description: "How much detail in responses?",
      options: [
        { value: "brief", label: "Brief", description: "Just the essentials" },
        { value: "standard", label: "Standard", description: "Good amount of detail" },
        { value: "detailed", label: "Detailed", description: "Comprehensive info" },
        { value: "comprehensive", label: "Full", description: "Everything included" },
      ]
    });
    
    questions.push({ 
      id: "tone", 
      question: "Response Tone",
      description: "What voice should the API use?",
      options: [
        { value: "professional", label: "Professional", description: "Formal & polished" },
        { value: "friendly", label: "Friendly", description: "Warm & approachable" },
        { value: "technical", label: "Technical", description: "Precise & detailed" },
        { value: "casual", label: "Casual", description: "Relaxed & natural" },
      ]
    });
    
    setTailoredQuestions(questions);
    setPhase("questions");
    setIsGenerating(false);
  }, []);

  const generateBrandSuggestions = useCallback(async () => {
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 600));
    
    const words = prompt.split(" ");
    const keyword = words.find(w => w.length > 3) || "API";
    const cap = keyword.charAt(0).toUpperCase() + keyword.slice(1, 6).toLowerCase();
    
    const mock: BrandSuggestion = {
      names: [`${cap}AI`, `${cap}Pro`, `Smart${cap}`, `${cap}Flow`],
      icons: iconOptions,
      palettes: [
        { name: "Svivva", colors: { primary: "#5BA8A0", secondary: "#4a9890", accent: "#6B2C4A" } },
        { name: "Ocean", colors: { primary: "#0ea5e9", secondary: "#0284c7", accent: "#06b6d4" } },
        { name: "Violet", colors: { primary: "#8b5cf6", secondary: "#7c3aed", accent: "#a855f7" } },
        { name: "Ember", colors: { primary: "#f97316", secondary: "#ea580c", accent: "#fbbf24" } },
        { name: "Forest", colors: { primary: "#22c55e", secondary: "#16a34a", accent: "#84cc16" } },
      ],
    };
    
    setSuggestions(mock);
    setSelectedName(mock.names[0]);
    setSelectedIcon(mock.icons[0].name);
    setSelectedPalette(mock.palettes[0]);
    setPhase("brand");
    setIsGenerating(false);
  }, [prompt]);

  const handleOptionSelect = useCallback((questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setTimeout(() => {
      if (currentQuestionIndex < tailoredQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        generateBrandSuggestions();
      }
    }, 300);
  }, [currentQuestionIndex, tailoredQuestions.length, generateBrandSuggestions]);

  const handleCreate = () => {
    if (selectedName && selectedIcon && selectedPalette) {
      onComplete({ prompt, name: selectedName, icon: selectedIcon, palette: selectedPalette.colors });
    }
  };

  const handleBack = () => {
    if (phase === "questions") {
      if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(prev => prev - 1);
      } else {
        setPhase("prompt");
        setTailoredQuestions([]);
      }
    } else if (phase === "brand") {
      setPhase("questions");
      setCurrentQuestionIndex(tailoredQuestions.length - 1);
    }
  };

  const canGoNext = prompt.length >= 10;
  const canCreate = selectedName && selectedIcon && selectedPalette;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Main Panel */}
      <div className="bg-card border border-border rounded-xl shadow-sm">
        {/* Header */}
        <div className="p-4 border-b border-border">
          {/* Step Indicators */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {[
              { key: "prompt", label: "DEFINE" },
              { key: "questions", label: "CONFIGURE" },
              { key: "brand", label: "FINISH" }
            ].map((step, i, arr) => (
              <div key={step.key} className="flex items-center">
                <div 
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    phase === step.key 
                      ? "bg-[#5BA8A0] text-white" 
                      : (arr.findIndex(s => s.key === phase) > i 
                        ? "bg-[#5BA8A0]/20 text-[#5BA8A0]" 
                        : "bg-muted text-muted-foreground")
                  }`}
                >
                  {step.label}
                </div>
                {i < arr.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 ${
                    arr.findIndex(s => s.key === phase) > i 
                      ? "bg-[#5BA8A0]/40" 
                      : "bg-muted"
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {phase !== "prompt" && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleBack}
                  data-testid="button-back-step"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <div>
                <h2 className="font-semibold">
                  {phase === "prompt" && "Create New API"}
                  {phase === "questions" && tailoredQuestions[currentQuestionIndex]?.question}
                  {phase === "brand" && "Final Touches"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {phase === "prompt" && "Define your AI-powered endpoint"}
                  {phase === "questions" && tailoredQuestions[currentQuestionIndex]?.description}
                  {phase === "brand" && "Choose name, icon & colors"}
                </p>
              </div>
            </div>
          {phase === "prompt" && (
            <Button 
              variant={showTuner ? "default" : "outline"} 
              size="sm" 
              onClick={() => setShowTuner(!showTuner)}
              className={showTuner ? "bg-[#5BA8A0] hover:bg-[#4a9890]" : ""}
              data-testid="button-tuner"
            >
              <Settings2 className="w-4 h-4 mr-1.5" />
              Tune
            </Button>
          )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <Loader2 className="w-8 h-8 animate-spin text-[#5BA8A0] mb-3" />
                <p className="text-muted-foreground">Generating...</p>
              </motion.div>
            ) : phase === "prompt" ? (
              <motion.div
                key="prompt"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Prompt Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">What should your API do?</label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Analyze customer reviews and return sentiment scores with confidence levels"
                    className="min-h-[120px] resize-none"
                    data-testid="textarea-prompt"
                  />
                </div>
                
                {/* Expected Output Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Expected output format</label>
                  <Input
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                    placeholder="e.g., JSON with sentiment, score, and keywords"
                    className="h-11"
                    data-testid="input-output-format"
                  />
                  <p className="text-xs text-muted-foreground">Describe the structure you want returned</p>
                </div>
                
                {/* API Tuner Panel */}
                <AnimatePresence>
                  {showTuner && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 rounded-lg border border-[#5BA8A0]/30 bg-[#5BA8A0]/5 space-y-5">
                        <div className="flex items-center gap-2 mb-2">
                          <Settings2 className="w-4 h-4 text-[#5BA8A0]" />
                          <span className="text-sm font-semibold text-[#5BA8A0]">API Tuner</span>
                        </div>
                        
                        {/* Sliders */}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">Creativity</span>
                              <span className="text-muted-foreground">{creativity[0]}%</span>
                            </div>
                            <Slider
                              value={creativity}
                              onValueChange={setCreativity}
                              max={100}
                              step={5}
                              className="[&_[role=slider]]:bg-[#5BA8A0]"
                              data-testid="slider-creativity"
                            />
                            <p className="text-xs text-muted-foreground">
                              {creativity[0] < 30 ? "Conservative & predictable" : creativity[0] < 70 ? "Balanced approach" : "Creative & experimental"}
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">Detail Level</span>
                              <span className="text-muted-foreground">{detailLevel[0]}%</span>
                            </div>
                            <Slider
                              value={detailLevel}
                              onValueChange={setDetailLevel}
                              max={100}
                              step={5}
                              className="[&_[role=slider]]:bg-[#5BA8A0]"
                              data-testid="slider-detail"
                            />
                            <p className="text-xs text-muted-foreground">
                              {detailLevel[0] < 30 ? "Minimal & concise" : detailLevel[0] < 70 ? "Standard detail" : "Comprehensive & thorough"}
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">Schema Strictness</span>
                              <span className="text-muted-foreground">{strictness[0]}%</span>
                            </div>
                            <Slider
                              value={strictness}
                              onValueChange={setStrictness}
                              max={100}
                              step={5}
                              className="[&_[role=slider]]:bg-[#5BA8A0]"
                              data-testid="slider-strictness"
                            />
                            <p className="text-xs text-muted-foreground">
                              {strictness[0] < 30 ? "Flexible output format" : strictness[0] < 70 ? "Moderately strict" : "Strict JSON schema enforcement"}
                            </p>
                          </div>
                        </div>
                        
                        {/* Toggles */}
                        <div className="pt-3 border-t border-border/50 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Include Confidence Scores</p>
                              <p className="text-xs text-muted-foreground">Add certainty levels to outputs</p>
                            </div>
                            <Switch
                              checked={includeConfidence}
                              onCheckedChange={setIncludeConfidence}
                              data-testid="switch-confidence"
                            />
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Include Metadata</p>
                              <p className="text-xs text-muted-foreground">Add processing info & timestamps</p>
                            </div>
                            <Switch
                              checked={includeMetadata}
                              onCheckedChange={setIncludeMetadata}
                              data-testid="switch-metadata"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Status */}
                <div className="flex items-center gap-2 pt-2">
                  <div className={`w-2 h-2 rounded-full ${canGoNext ? "bg-[#5BA8A0]" : "bg-muted-foreground/30"}`} />
                  <span className="text-sm text-muted-foreground">
                    {canGoNext ? "Ready to continue" : `${10 - prompt.length} more characters needed`}
                  </span>
                </div>
              </motion.div>
            ) : phase === "questions" && tailoredQuestions[currentQuestionIndex] ? (
              <motion.div
                key={`question-${currentQuestionIndex}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {tailoredQuestions[currentQuestionIndex].options.map((opt) => {
                    const isSelected = answers[tailoredQuestions[currentQuestionIndex].id] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleOptionSelect(tailoredQuestions[currentQuestionIndex].id, opt.value)}
                        className={`group relative p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                          isSelected 
                            ? "border-[#5BA8A0] bg-[#5BA8A0]/10" 
                            : "border-border hover:border-[#5BA8A0]/50 hover:bg-muted/50"
                        }`}
                        data-testid={`button-option-${opt.value}`}
                      >
                        <div className={`font-semibold mb-1 ${isSelected ? "text-[#5BA8A0]" : ""}`}>
                          {opt.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {opt.description}
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <Check className="w-4 h-4 text-[#5BA8A0]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Progress */}
                <div className="flex items-center gap-2 pt-4">
                  {tailoredQuestions.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        i < currentQuestionIndex 
                          ? "bg-[#5BA8A0]" 
                          : i === currentQuestionIndex 
                            ? "bg-[#5BA8A0]/50" 
                            : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            ) : phase === "brand" && suggestions ? (
              <motion.div
                key="brand"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Name Selection */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">NAME</label>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.names.map((name) => (
                      <Badge
                        key={name}
                        variant={selectedName === name ? "default" : "outline"}
                        className={`cursor-pointer text-sm py-1.5 px-4 transition-all ${
                          selectedName === name 
                            ? "bg-[#5BA8A0] hover:bg-[#4a9890] border-[#5BA8A0]" 
                            : "hover:border-[#5BA8A0]/50"
                        }`}
                        onClick={() => setSelectedName(name)}
                        data-testid={`badge-name-${name.toLowerCase()}`}
                      >
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Icon Selection */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">ICON</label>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.icons.map((icon) => (
                      <button
                        key={icon.name}
                        onClick={() => setSelectedIcon(icon.name)}
                        className={`w-11 h-11 rounded-lg border-2 flex items-center justify-center transition-all ${
                          selectedIcon === icon.name 
                            ? "border-[#5BA8A0] bg-[#5BA8A0]/10 text-[#5BA8A0]" 
                            : "border-border hover:border-[#5BA8A0]/50 text-muted-foreground hover:text-foreground"
                        }`}
                        data-testid={`button-icon-${icon.name.toLowerCase()}`}
                      >
                        {icon.icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Palette Selection */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">PALETTE</label>
                  <div className="flex flex-wrap gap-3">
                    {suggestions.palettes.map((palette) => (
                      <button
                        key={palette.name}
                        onClick={() => setSelectedPalette(palette)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedPalette?.name === palette.name 
                            ? "border-[#5BA8A0] bg-[#5BA8A0]/5" 
                            : "border-border hover:border-[#5BA8A0]/50"
                        }`}
                        data-testid={`button-palette-${palette.name.toLowerCase()}`}
                      >
                        <div className="flex gap-1.5 mb-2">
                          <div 
                            className="w-7 h-7 rounded-md" 
                            style={{ backgroundColor: palette.colors.primary }} 
                          />
                          <div 
                            className="w-7 h-7 rounded-md" 
                            style={{ backgroundColor: palette.colors.accent }} 
                          />
                        </div>
                        <span className="text-xs font-medium">{palette.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Brand Preview */}
                {selectedName && selectedIcon && selectedPalette && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 rounded-xl border border-border bg-background"
                  >
                    <label className="text-xs font-medium text-muted-foreground mb-3 block">PREVIEW</label>
                    <div className="flex items-center gap-4">
                      {/* Brand Icon */}
                      <div 
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-lg"
                        style={{ backgroundColor: selectedPalette.colors.primary }}
                      >
                        {iconOptions.find(i => i.name === selectedIcon)?.icon}
                      </div>
                      
                      {/* Brand Info */}
                      <div className="flex-1">
                        <h4 className="text-lg font-bold" style={{ color: selectedPalette.colors.primary }}>
                          {selectedName}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {prompt.slice(0, 60)}...
                        </p>
                      </div>
                      
                      {/* Color Bar */}
                      <div className="flex gap-1">
                        <div 
                          className="w-3 h-12 rounded-full"
                          style={{ backgroundColor: selectedPalette.colors.primary }}
                        />
                        <div 
                          className="w-3 h-12 rounded-full"
                          style={{ backgroundColor: selectedPalette.colors.secondary }}
                        />
                        <div 
                          className="w-3 h-12 rounded-full"
                          style={{ backgroundColor: selectedPalette.colors.accent }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-border bg-muted/30">
          {phase === "prompt" && (
            <Button 
              onClick={() => generateTailoredQuestions(prompt)}
              disabled={!canGoNext || isGenerating}
              className="bg-[#5BA8A0] hover:bg-[#4a9890]"
              data-testid="button-continue"
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
          
          {phase === "brand" && (
            <Button 
              onClick={handleCreate}
              disabled={!canCreate}
              className="bg-[#5BA8A0] hover:bg-[#4a9890]"
              data-testid="button-create-api"
            >
              Create API
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
