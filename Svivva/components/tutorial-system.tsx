"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ChevronRight, ChevronLeft, GraduationCap, Lightbulb } from "lucide-react";

const TUTORIAL_KEY = "svivva_tutorials_disabled";
const TUTORIAL_SEEN_KEY = "svivva_tutorials_seen";
const TUTORIAL_ASKED_KEY = "svivva_tutorial_asked";

interface TutorialStep {
  title: string;
  description: string;
  highlight?: string;
}

interface TutorialConfig {
  id: string;
  pageName: string;
  steps: TutorialStep[];
}

const tutorials: Record<string, TutorialConfig> = {
  "/dashboard": {
    id: "dashboard",
    pageName: "Dashboard",
    steps: [
      {
        title: "Welcome to your Dashboard",
        description:
          "This is your home base. From here you can see your recent projects and access all of Svivva's tools.",
      },
      {
        title: "Tool Cards",
        description:
          "Each card represents a tool you can use. Click any card to jump straight into that feature.",
      },
      {
        title: "Your Projects",
        description: "Your recent projects appear below the tools. Click any project to open it.",
      },
    ],
  },
  "/dashboard/api-builder": {
    id: "api-builder",
    pageName: "API Builder",
    steps: [
      {
        title: "Describe Your API",
        description:
          "Type what you want your API to do in plain English. The AI will handle the rest.",
      },
      {
        title: "AI Generation",
        description:
          "Once you submit, AI generates the endpoint, schema, and documentation automatically.",
      },
      {
        title: "Test & Deploy",
        description: "Preview your API response, test it live, then deploy with one click.",
      },
    ],
  },
  "/dashboard/hardware-builder": {
    id: "hardware-builder",
    pageName: "Hardware Builder",
    steps: [
      {
        title: "The BUILD System",
        description:
          "Follow 5 simple steps: Bring your vision → define Users → select materials (Into) → generate designs (Logical) → Delivery.",
      },
      {
        title: "AI Sketches & Schematics",
        description:
          "In the design step, AI generates reference sketches and technical schematics for your product.",
      },
      {
        title: "Manufacturer Research",
        description:
          "On the final step, AI finds real manufacturers, suppliers, and generates a professional PDF blueprint.",
      },
    ],
  },
  "/dashboard/hypothesis": {
    id: "hypothesis-lab",
    pageName: "Hypothesis Lab",
    steps: [
      {
        title: "Register Your APIs",
        description:
          "Start by adding API endpoints you want to test. Include the URL, input schema, and a sample response.",
      },
      {
        title: "Generate Hypotheses",
        description:
          "Select APIs and ask a question. AI runs a 5-stage pipeline to discover relationships.",
      },
      {
        title: "Insight Memory",
        description: "Confirmed insights are saved and used to make future discoveries smarter.",
      },
    ],
  },
  "/dashboard/idea-engine": {
    id: "idea-engine",
    pageName: "Idea Engine",
    steps: [
      {
        title: "Pick an Industry",
        description: "Select an industry or describe your own niche to focus the AI's research.",
      },
      {
        title: "AI Discovery Pipeline",
        description:
          "The engine scans markets, identifies gaps, and generates 6 novel ideas ranked by potential.",
      },
      {
        title: "Act on Ideas",
        description:
          "Send any idea directly to the API Builder or Hardware Builder to start building immediately.",
      },
    ],
  },
  "/dashboard/launch-studio": {
    id: "launch-studio",
    pageName: "Launch Studio",
    steps: [
      {
        title: "Describe Your App",
        description:
          "Tell the AI about your app or product. It generates a complete marketing toolkit.",
      },
      {
        title: "Marketing Plan",
        description:
          "Get a tagline, value propositions, channel strategies, and a launch checklist.",
      },
      {
        title: "Landing Page & Social",
        description:
          "Generate landing page copy and platform-specific social media posts ready to publish.",
      },
    ],
  },
  "/dashboard/collaborate": {
    id: "collaborate",
    pageName: "Collaboration",
    steps: [
      {
        title: "Invite Your Team",
        description: "Add team members by email. They'll get access to your shared workspace.",
      },
      {
        title: "Real-Time Activity",
        description: "See who's online and what they're working on in real time.",
      },
      {
        title: "Comments & Threads",
        description: "Leave feedback on any project, API, or design. Tag teammates to notify them.",
      },
    ],
  },
};

export function TutorialProvider({ pathname }: { pathname: string }) {
  const [isDisabled, setIsDisabled] = useState(true);
  const [hasBeenAsked, setHasBeenAsked] = useState(true);
  const [showAskPrompt, setShowAskPrompt] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [seenPages, setSeenPages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const disabled = localStorage.getItem(TUTORIAL_KEY) === "true";
    const asked = localStorage.getItem(TUTORIAL_ASKED_KEY) === "true";
    let seen: string[] = [];
    try {
      seen = JSON.parse(localStorage.getItem(TUTORIAL_SEEN_KEY) || "[]");
    } catch {
      seen = [];
    }
    setIsDisabled(disabled);
    setHasBeenAsked(asked);
    setSeenPages(new Set(seen));
  }, []);

  const basePath = pathname.replace(/\/$/, "") || "/dashboard";
  const tutorial = tutorials[basePath];

  useEffect(() => {
    if (isDisabled || !tutorial) {
      setShowTutorial(false);
      setShowAskPrompt(false);
      return;
    }

    if (!hasBeenAsked) {
      const timer = setTimeout(() => setShowAskPrompt(true), 1500);
      return () => clearTimeout(timer);
    }

    if (!seenPages.has(tutorial.id)) {
      setCurrentStep(0);
      setShowTutorial(true);
    } else {
      setShowTutorial(false);
    }
  }, [basePath, isDisabled, hasBeenAsked, tutorial, seenPages]);

  const handleAcceptTutorials = useCallback(() => {
    localStorage.setItem(TUTORIAL_ASKED_KEY, "true");
    setHasBeenAsked(true);
    setShowAskPrompt(false);
  }, []);

  const handleDeclineTutorials = useCallback(() => {
    localStorage.setItem(TUTORIAL_ASKED_KEY, "true");
    localStorage.setItem(TUTORIAL_KEY, "true");
    setHasBeenAsked(true);
    setIsDisabled(true);
    setShowAskPrompt(false);
  }, []);

  const handleDismiss = useCallback(() => {
    if (!tutorial) return;
    const newSeen = new Set(seenPages);
    newSeen.add(tutorial.id);
    setSeenPages(newSeen);
    localStorage.setItem(TUTORIAL_SEEN_KEY, JSON.stringify([...newSeen]));
    setShowTutorial(false);
  }, [tutorial, seenPages]);

  const handleDisablePermanently = useCallback(() => {
    localStorage.setItem(TUTORIAL_KEY, "true");
    setIsDisabled(true);
    setShowTutorial(false);
    setShowAskPrompt(false);
  }, []);

  const handleNext = () => {
    if (!tutorial) return;
    if (currentStep < tutorial.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleDismiss();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  if (showAskPrompt) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-500">
        <Card className="w-80 border-[#5BA8A0]/30 shadow-lg">
          <CardContent className="pt-4 pb-4 px-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#5BA8A0]/10 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5 text-[#5BA8A0]" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="font-medium text-sm">Want a quick tour?</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Short tips on each page to help you get started. You can turn them off anytime.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAcceptTutorials}
                    className="text-xs h-7 px-3"
                    style={{ background: "#5BA8A0" }}
                    data-testid="button-accept-tutorials"
                  >
                    Yes, show me
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDeclineTutorials}
                    className="text-xs h-7 px-3"
                    data-testid="button-decline-tutorials"
                  >
                    No thanks
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!showTutorial || !tutorial || isDisabled) return null;

  const step = tutorial.steps[currentStep];
  const isLast = currentStep === tutorial.steps.length - 1;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <Card className="w-80 border-[#5BA8A0]/30 shadow-lg overflow-hidden">
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-[#5BA8A0] transition-all duration-300"
            style={{ width: `${((currentStep + 1) / tutorial.steps.length) * 100}%` }}
          />
        </div>
        <CardContent className="pt-3 pb-3 px-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[#5BA8A0]" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {tutorial.pageName} · {currentStep + 1}/{tutorial.steps.length}
              </span>
            </div>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-dismiss-tutorial"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <h4 className="font-medium text-sm mb-1">{step.title}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30">
            <button
              onClick={handleDisablePermanently}
              className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              data-testid="button-disable-tutorials-permanently"
            >
              Turn off tutorials
            </button>
            <div className="flex gap-1.5">
              {currentStep > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleBack}
                  className="h-7 w-7 p-0"
                  data-testid="button-tutorial-back"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleNext}
                className="h-7 text-xs px-3"
                style={{ background: "#5BA8A0" }}
                data-testid="button-tutorial-next"
              >
                {isLast ? (
                  "Got it"
                ) : (
                  <>
                    <span>Next</span>
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function TutorialToggle() {
  const [isDisabled, setIsDisabled] = useState(false);

  useEffect(() => {
    setIsDisabled(localStorage.getItem(TUTORIAL_KEY) === "true");
  }, []);

  const toggle = () => {
    const newVal = !isDisabled;
    setIsDisabled(newVal);
    localStorage.setItem(TUTORIAL_KEY, String(newVal));
    if (!newVal) {
      localStorage.removeItem(TUTORIAL_SEEN_KEY);
      localStorage.setItem(TUTORIAL_ASKED_KEY, "true");
    }
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      data-testid="button-toggle-tutorials"
    >
      <GraduationCap className="w-4 h-4" />
      <span>{isDisabled ? "Enable tutorials" : "Disable tutorials"}</span>
    </button>
  );
}
