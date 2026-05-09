"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { usePlatform } from "@/lib/platform-context";
import { authFetch } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import type { IdeaResult } from "@/lib/schema";
import {
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  ArrowRight,
  Search,
  Brain,
  Layers,
  Star,
  ChevronDown,
  ChevronUp,
  Clock,
  Radar,
  Gem,
} from "lucide-react";

interface IdeaSession {
  id: string;
  mode: string;
  industry: string | null;
  context: string | null;
  stage: string;
  ideas: IdeaResult[];
  marketGaps: string[];
  competitorInsights: string[];
  score: number | null;
  createdAt: string;
}

const PIPELINE_STAGES = [
  {
    id: "scanning",
    label: "Market Scan",
    icon: Radar,
    description: "Scanning for gaps and opportunities",
  },
  {
    id: "analyzing",
    label: "Gap Analysis",
    icon: Search,
    description: "Identifying underserved niches",
  },
  {
    id: "generating",
    label: "Idea Generation",
    icon: Brain,
    description: "Crafting novel concepts",
  },
  { id: "scoring", label: "Scoring", icon: Star, description: "Rating feasibility and potential" },
  { id: "complete", label: "Complete", icon: Gem, description: "Ideas ready to explore" },
];

const DIGITAL_INDUSTRIES = [
  "FinTech",
  "HealthTech",
  "EdTech",
  "E-Commerce",
  "DevTools",
  "AI/ML",
  "Cybersecurity",
  "Real Estate",
  "Legal Tech",
  "Climate Tech",
  "Gaming",
  "Social Media",
  "Supply Chain",
  "HR Tech",
  "IoT",
];

const PHYSICAL_INDUSTRIES = [
  "Consumer Electronics",
  "Wearables",
  "Home & Living",
  "Outdoor Gear",
  "Fitness",
  "Audio",
  "Sustainability",
  "Fashion Tech",
  "Kitchen",
  "Pet Tech",
  "Kids & Education",
  "Workspace",
  "Travel",
  "Health Devices",
  "Art & Craft",
];

function ScoreBar({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-medium">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function IdeaCard({ idea, index, mode }: { idea: IdeaResult; index: number; mode: string }) {
  const [expanded, setExpanded] = useState(false);
  const avgScore = Math.round((idea.novelty + idea.lucrativePotential + idea.feasibility) / 3);
  const tealColor = "#5BA8A0";
  const burgundyColor = "#6B2C4A";
  const accentColor = mode === "digital" ? tealColor : burgundyColor;

  return (
    <Card className="group transition-all duration-300">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-lg text-white font-bold text-lg flex-shrink-0"
              style={{ backgroundColor: accentColor }}
            >
              {index + 1}
            </div>
            <div className="min-w-0">
              <h3
                className="font-semibold text-base truncate"
                data-testid={`text-idea-title-${index}`}
              >
                {idea.title}
              </h3>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <Badge variant="secondary" className="text-[10px]">
                  {idea.category}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Star className="w-3 h-3" style={{ color: accentColor }} />
                  {avgScore}/100
                </span>
              </div>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            data-testid={`button-expand-idea-${index}`}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">{idea.description}</p>

        <div className="p-3 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0" style={{ color: accentColor }} />
            <span
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: accentColor }}
            >
              Unique Twist
            </span>
          </div>
          <p className="text-sm">{idea.uniqueTwist}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <ScoreBar value={idea.novelty} label="Novelty" color="#8B5CF6" />
          <ScoreBar value={idea.lucrativePotential} label="Revenue" color="#10B981" />
          <ScoreBar value={idea.feasibility} label="Feasibility" color="#F59E0B" />
        </div>

        {expanded && (
          <div className="space-y-4 pt-2 border-t border-border">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Market Gap
                </span>
              </div>
              <p className="text-sm">{idea.marketGap}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Next Steps
                </span>
              </div>
              <ul className="space-y-1.5">
                {idea.nextSteps.map((step, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span
                      className="text-xs font-mono mt-0.5 flex-shrink-0"
                      style={{ color: accentColor }}
                    >
                      {i + 1}.
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {idea.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PipelineStages({ currentStage }: { currentStage: string }) {
  const currentIndex = PIPELINE_STAGES.findIndex((s) => s.id === currentStage);

  return (
    <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2">
      {PIPELINE_STAGES.map((stage, i) => {
        const isActive = i <= currentIndex;
        const isCurrent = i === currentIndex;
        const Icon = stage.icon;

        return (
          <div key={stage.id} className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <div
              className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-500 ${
                isCurrent
                  ? "bg-primary text-primary-foreground"
                  : isActive
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{stage.label}</span>
            </div>
            {i < PIPELINE_STAGES.length - 1 && (
              <div
                className={`w-4 sm:w-8 h-0.5 rounded transition-all duration-500 ${
                  isActive ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function IdeaEnginePage() {
  const { mode } = usePlatform();
  const [industry, setIndustry] = useState("");
  const [context, setContext] = useState("");
  const [selectedSession, setSelectedSession] = useState<IdeaSession | null>(null);
  const [pipelineStage, setPipelineStage] = useState("scanning");

  const industries = mode === "digital" ? DIGITAL_INDUSTRIES : PHYSICAL_INDUSTRIES;

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery<{ sessions: IdeaSession[] }>({
    queryKey: ["/api/idea-engine"],
    queryFn: async () => {
      const res = await authFetch("/api/idea-engine");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      setPipelineStage("scanning");
      const stageTimer = setInterval(() => {
        setPipelineStage((prev) => {
          const stages = ["scanning", "analyzing", "generating", "scoring"];
          const idx = stages.indexOf(prev);
          if (idx < stages.length - 1) return stages[idx + 1];
          clearInterval(stageTimer);
          return prev;
        });
      }, 2500);

      const res = await authFetch("/api/idea-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          industry: industry || undefined,
          context: context || undefined,
        }),
      });

      clearInterval(stageTimer);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate ideas");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setPipelineStage("complete");
      setSelectedSession(data.session);
      queryClient.invalidateQueries({ queryKey: ["/api/idea-engine"] });
    },
    onError: () => {
      setPipelineStage("scanning");
    },
  });

  const sessions = sessionsData?.sessions || [];
  const activeSession = selectedSession;
  const isGenerating = generateMutation.isPending;
  const tealColor = "#5BA8A0";
  const burgundyColor = "#6B2C4A";
  const accentColor = mode === "digital" ? tealColor : burgundyColor;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold flex items-center gap-3"
            data-testid="text-page-title"
          >
            <Lightbulb className="w-7 h-7" style={{ color: accentColor }} />
            Idea Engine
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered discovery of untapped{" "}
            {mode === "digital" ? "API and software" : "product and hardware"} opportunities
          </p>
        </div>
        {activeSession && activeSession.score !== null && (
          <div className="text-right">
            <div className="text-3xl font-bold" style={{ color: accentColor }}>
              {activeSession.score}
            </div>
            <div className="text-xs text-muted-foreground">Avg Score</div>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5" style={{ color: accentColor }} />
            Generate New Ideas
          </CardTitle>
          <CardDescription>
            Tell us about your space and we will find what nobody else has thought of yet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Industry / Vertical</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {industries.map((ind) => (
                <Badge
                  key={ind}
                  variant={industry === ind ? "default" : "outline"}
                  className="cursor-pointer toggle-elevate text-xs"
                  onClick={() => setIndustry(industry === ind ? "" : ind)}
                  data-testid={`badge-industry-${ind.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                >
                  {ind}
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Or type a custom industry..."
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              data-testid="input-industry"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Additional Context (optional)</label>
            <Textarea
              placeholder={
                mode === "digital"
                  ? "e.g. I want to build APIs for the creator economy, focusing on things that don't exist yet..."
                  : "e.g. I'm interested in sustainable consumer electronics with modular designs..."
              }
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="resize-none"
              rows={3}
              data-testid="input-context"
            />
          </div>

          <Button
            onClick={() => generateMutation.mutate()}
            disabled={isGenerating}
            className="w-full gap-2"
            style={{ backgroundColor: isGenerating ? undefined : accentColor }}
            data-testid="button-generate-ideas"
          >
            {isGenerating ? (
              <>
                <Brain className="w-4 h-4 animate-pulse" />
                Discovering opportunities...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Find Untapped Ideas
              </>
            )}
          </Button>

          {isGenerating && (
            <div className="pt-2">
              <PipelineStages currentStage={pipelineStage} />
              <p className="text-xs text-muted-foreground text-center mt-3 animate-pulse">
                {PIPELINE_STAGES.find((s) => s.id === pipelineStage)?.description ||
                  "Processing..."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {activeSession && activeSession.stage === "error" && (
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <Lightbulb className="w-10 h-10 mx-auto mb-3 text-destructive" />
            <h3 className="font-semibold mb-1">Generation Failed</h3>
            <p className="text-sm text-muted-foreground">
              Something went wrong while generating ideas. Please try again.
            </p>
          </CardContent>
        </Card>
      )}

      {activeSession && activeSession.stage === "complete" && (
        <div className="space-y-6">
          <PipelineStages currentStage="complete" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4" style={{ color: accentColor }} />
                  <h3 className="font-semibold text-sm">Market Gaps Identified</h3>
                </div>
                <ul className="space-y-2">
                  {(activeSession.marketGaps || []).map((gap, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span
                        className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: accentColor }}
                      />
                      {gap}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4" style={{ color: accentColor }} />
                  <h3 className="font-semibold text-sm">Competitive Insights</h3>
                </div>
                <ul className="space-y-2">
                  {(activeSession.competitorInsights || []).map((insight, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span
                        className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: accentColor }}
                      />
                      {insight}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5" style={{ color: accentColor }} />
              Discovered Ideas
              <Badge variant="secondary">{activeSession.ideas?.length || 0}</Badge>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {(activeSession.ideas || []).map((idea, i) => (
                <IdeaCard key={i} idea={idea} index={i} mode={mode} />
              ))}
            </div>
          </div>
        </div>
      )}

      {generateMutation.isError && (
        <Card className="border-destructive">
          <CardContent className="p-4 text-sm text-destructive">
            {generateMutation.error?.message || "Something went wrong. Please try again."}
          </CardContent>
        </Card>
      )}

      {sessions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            Previous Sessions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sessions.map((session) => (
              <Card
                key={session.id}
                className="cursor-pointer hover-elevate"
                onClick={() => {
                  setSelectedSession(session);
                  setPipelineStage(session.stage);
                }}
                data-testid={`card-session-${session.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {session.mode === "digital" ? "Digital" : "Physical"}
                    </Badge>
                    {session.score !== null && (
                      <span className="text-sm font-bold" style={{ color: accentColor }}>
                        {session.score}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{session.industry || "General"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {session.ideas?.length || 0} ideas generated
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!activeSession && !isGenerating && sessions.length === 0 && !sessionsLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Lightbulb className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No ideas generated yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Select an industry and add context above to discover untapped{" "}
              {mode === "digital" ? "API" : "product"} opportunities that nobody else has thought
              of.
            </p>
          </CardContent>
        </Card>
      )}

      {sessionsLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      )}
    </div>
  );
}
