"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, Target, Sparkles, Rocket, Brain, Cpu, ChevronRight, Check } from "lucide-react";

interface ApiCreatorProps {
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
  options: string[];
}

interface BrandSuggestion {
  names: string[];
  icons: string[];
  palettes: { name: string; colors: { primary: string; secondary: string; accent: string } }[];
}

const iconMap: Record<string, React.ReactNode> = {
  Zap: <Zap className="w-5 h-5" />,
  Target: <Target className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
  Rocket: <Rocket className="w-5 h-5" />,
  Brain: <Brain className="w-5 h-5" />,
  Cpu: <Cpu className="w-5 h-5" />,
};

export function ApiCreator({ onComplete }: ApiCreatorProps) {
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<"prompt" | "questions" | "brand">("prompt");
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
    await new Promise(r => setTimeout(r, 600));
    
    const words = userPrompt.toLowerCase();
    const questions: TailoredQuestion[] = [];
    
    if (words.includes("analyz") || words.includes("review") || words.includes("sentiment")) {
      questions.push({ id: "depth", question: "How deep should the analysis go?", options: ["Quick scan", "Standard", "Deep dive", "Exhaustive"] });
    } else if (words.includes("generat") || words.includes("creat") || words.includes("write")) {
      questions.push({ id: "creativity", question: "How creative should the output be?", options: ["Conservative", "Balanced", "Creative", "Experimental"] });
    } else {
      questions.push({ id: "style", question: "How should it process requests?", options: ["Fast", "Balanced", "Thorough", "Maximum"] });
    }
    
    questions.push({ id: "output", question: "How detailed should responses be?", options: ["Brief", "Standard", "Detailed", "Comprehensive"] });
    questions.push({ id: "tone", question: "What tone should it use?", options: ["Professional", "Friendly", "Technical", "Casual"] });
    
    setTailoredQuestions(questions);
    setPhase("questions");
    setIsGenerating(false);
  }, []);

  const generateBrandSuggestions = useCallback(async () => {
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 500));
    
    const words = prompt.split(" ");
    const keyword = words.find(w => w.length > 3) || "API";
    const cap = keyword.charAt(0).toUpperCase() + keyword.slice(1, 6).toLowerCase();
    
    const mock: BrandSuggestion = {
      names: [`${cap}AI`, `${cap}Pro`, `Smart${cap}`],
      icons: ["Zap", "Target", "Sparkles", "Rocket", "Brain", "Cpu"],
      palettes: [
        { name: "Svivva", colors: { primary: "#5BA8A0", secondary: "#4a9890", accent: "#6B2C4A" } },
        { name: "Ocean", colors: { primary: "#0ea5e9", secondary: "#0284c7", accent: "#06b6d4" } },
        { name: "Violet", colors: { primary: "#8b5cf6", secondary: "#7c3aed", accent: "#a855f7" } },
        { name: "Ember", colors: { primary: "#f97316", secondary: "#ea580c", accent: "#fbbf24" } },
      ],
    };
    
    setSuggestions(mock);
    setSelectedName(mock.names[0]);
    setSelectedIcon(mock.icons[0]);
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
    }, 200);
  }, [currentQuestionIndex, tailoredQuestions.length, generateBrandSuggestions]);

  const handleCreate = () => {
    if (selectedName && selectedIcon && selectedPalette) {
      onComplete({ prompt, name: selectedName, icon: selectedIcon, palette: selectedPalette.colors });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${phase === "prompt" ? "bg-[#5BA8A0] text-white" : "bg-[#5BA8A0]/20 text-[#5BA8A0]"}`}>
          {phase !== "prompt" ? <Check className="w-4 h-4" /> : "1"}
        </div>
        <div className={`h-0.5 flex-1 ${phase !== "prompt" ? "bg-[#5BA8A0]" : "bg-border"}`} />
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${phase === "questions" ? "bg-[#5BA8A0] text-white" : phase === "brand" ? "bg-[#5BA8A0]/20 text-[#5BA8A0]" : "bg-muted text-muted-foreground"}`}>
          {phase === "brand" ? <Check className="w-4 h-4" /> : "2"}
        </div>
        <div className={`h-0.5 flex-1 ${phase === "brand" ? "bg-[#5BA8A0]" : "bg-border"}`} />
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${phase === "brand" ? "bg-[#5BA8A0] text-white" : "bg-muted text-muted-foreground"}`}>
          3
        </div>
      </div>

      {phase === "prompt" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-1">Define your API</h2>
            <p className="text-muted-foreground text-sm">Describe what you want your AI API to do</p>
          </div>
          
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Analyze customer sentiment from support tickets and categorize by urgency..."
            className="min-h-[120px] text-base"
            data-testid="input-prompt"
          />
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {prompt.length} characters {prompt.length < 10 && "(min 10)"}
            </span>
            <Button 
              onClick={() => generateTailoredQuestions(prompt)}
              disabled={prompt.length < 10 || isGenerating}
              className="bg-[#5BA8A0] hover:bg-[#4a9890]"
              data-testid="button-next"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {phase === "questions" && tailoredQuestions[currentQuestionIndex] && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-1">{tailoredQuestions[currentQuestionIndex].question}</h2>
            <p className="text-muted-foreground text-sm">
              Question {currentQuestionIndex + 1} of {tailoredQuestions.length}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {tailoredQuestions[currentQuestionIndex].options.map((opt) => {
              const isSelected = answers[tailoredQuestions[currentQuestionIndex].id] === opt;
              return (
                <button
                  key={opt}
                  onClick={() => handleOptionSelect(tailoredQuestions[currentQuestionIndex].id, opt)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    isSelected 
                      ? "border-[#5BA8A0] bg-[#5BA8A0]/10" 
                      : "border-border hover:border-[#5BA8A0]/50 hover:bg-muted/50"
                  }`}
                  data-testid={`button-option-${opt.toLowerCase().replace(/\s/g, "-")}`}
                >
                  <span className={`font-medium ${isSelected ? "text-[#5BA8A0]" : ""}`}>{opt}</span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-1">
            {tailoredQuestions.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full ${
                  i < currentQuestionIndex ? "bg-[#5BA8A0]" : i === currentQuestionIndex ? "bg-[#5BA8A0]/50" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {phase === "brand" && suggestions && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-1">Brand your API</h2>
            <p className="text-muted-foreground text-sm">Choose a name, icon, and color palette</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Name</label>
              <div className="flex flex-wrap gap-2">
                {suggestions.names.map((name) => (
                  <Badge
                    key={name}
                    variant={selectedName === name ? "default" : "outline"}
                    className={`cursor-pointer text-sm py-1.5 px-3 ${selectedName === name ? "bg-[#5BA8A0] hover:bg-[#4a9890]" : ""}`}
                    onClick={() => setSelectedName(name)}
                    data-testid={`badge-name-${name.toLowerCase()}`}
                  >
                    {name}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Icon</label>
              <div className="flex flex-wrap gap-2">
                {suggestions.icons.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setSelectedIcon(icon)}
                    className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
                      selectedIcon === icon 
                        ? "border-[#5BA8A0] bg-[#5BA8A0]/10 text-[#5BA8A0]" 
                        : "border-border hover:border-[#5BA8A0]/50"
                    }`}
                    data-testid={`button-icon-${icon.toLowerCase()}`}
                  >
                    {iconMap[icon]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Color Palette</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                    <div className="flex gap-1 mb-2">
                      <div className="w-6 h-6 rounded" style={{ backgroundColor: palette.colors.primary }} />
                      <div className="w-6 h-6 rounded" style={{ backgroundColor: palette.colors.accent }} />
                    </div>
                    <span className="text-xs font-medium">{palette.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button 
            onClick={handleCreate}
            disabled={!selectedName || !selectedIcon || !selectedPalette}
            className="w-full bg-[#5BA8A0] hover:bg-[#4a9890]"
            size="lg"
            data-testid="button-create-api"
          >
            Create API
          </Button>
        </div>
      )}

      {isGenerating && phase !== "prompt" && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#5BA8A0]" />
        </div>
      )}
    </div>
  );
}
