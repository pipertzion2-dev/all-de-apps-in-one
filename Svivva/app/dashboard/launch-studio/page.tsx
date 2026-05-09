"use client";

import { useState } from "react";
import { authFetch } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sparkles,
  Rocket,
  Copy,
  Check,
  Loader2,
  Target,
  Layout,
  Share2,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  Globe,
  Zap,
} from "lucide-react";

type MarketingPlan = {
  tagline: string;
  valueProps: string[];
  channels: { name: string; strategy: string; priority: string }[];
  launchChecklist: string[];
  contentIdeas: { type: string; title: string; description: string }[];
  miniAppIdeas: { name: string; description: string; purpose: string }[];
};

type LandingPage = {
  heroHeadline: string;
  heroSubheadline: string;
  ctaText: string;
  features: { title: string; description: string; icon: string }[];
  socialProofHeadline: string;
  testimonials: { quote: string; author: string; role: string }[];
  faqItems: { question: string; answer: string }[];
  footerCta: string;
};

type SocialPost = {
  platform: string;
  content: string;
  title?: string;
  tagline?: string;
  hashtags?: string[];
  subreddit?: string;
};

export default function LaunchStudioPage() {
  const [appName, setAppName] = useState("");
  const [appDescription, setAppDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");

  const [activeTab, setActiveTab] = useState("plan");
  const [loading, setLoading] = useState<string | null>(null);
  const [plan, setPlan] = useState<MarketingPlan | null>(null);
  const [landingPage, setLandingPage] = useState<LandingPage | null>(null);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const hasInput = appName.trim() && appDescription.trim();

  async function generate(action: string) {
    if (!hasInput) return;
    setLoading(action);
    try {
      const res = await authFetch("/api/launch-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, appName, appDescription, targetAudience }),
      });
      if (!res.ok) {
        console.error("Launch Studio API error", res.status);
        return;
      }
      const data = await res.json();
      if (action === "marketing-plan" && data.plan) {
        const p = data.plan;
        setPlan({
          tagline: p.tagline || "",
          valueProps: Array.isArray(p.valueProps) ? p.valueProps : [],
          channels: Array.isArray(p.channels) ? p.channels : [],
          launchChecklist: Array.isArray(p.launchChecklist) ? p.launchChecklist : [],
          contentIdeas: Array.isArray(p.contentIdeas) ? p.contentIdeas : [],
          miniAppIdeas: Array.isArray(p.miniAppIdeas) ? p.miniAppIdeas : [],
        });
        setActiveTab("plan");
      }
      if (action === "landing-page" && data.page) {
        const pg = data.page;
        setLandingPage({
          heroHeadline: pg.heroHeadline || appName,
          heroSubheadline: pg.heroSubheadline || "",
          ctaText: pg.ctaText || "Get Started",
          features: Array.isArray(pg.features) ? pg.features : [],
          socialProofHeadline: pg.socialProofHeadline || "",
          testimonials: Array.isArray(pg.testimonials) ? pg.testimonials : [],
          faqItems: Array.isArray(pg.faqItems) ? pg.faqItems : [],
          footerCta: pg.footerCta || "",
        });
        setActiveTab("landing");
      }
      if (action === "social-posts") {
        setSocialPosts(Array.isArray(data.posts) ? data.posts : []);
        setActiveTab("social");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedIndex(key);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => copyText(text, id)}
      className="p-1.5 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
      data-testid={`button-copy-${id}`}
    >
      {copiedIndex === id ? (
        <Check className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );

  const priorityColor: Record<string, string> = {
    high: "bg-red-500/20 text-red-400 border-red-500/30",
    medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  const platformIcon: Record<string, string> = {
    twitter: "𝕏",
    linkedin: "in",
    reddit: "⬡",
    producthunt: "🚀",
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8" data-testid="page-launch-studio">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Launch Studio</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">AI-powered marketing toolkit</p>
          </div>
        </div>
      </div>

      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Tell us about your app
          </CardTitle>
          <CardDescription>
            The more detail you provide, the better your marketing materials will be
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">App Name</label>
              <Input
                placeholder="My Awesome App"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                data-testid="input-app-name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Audience</label>
              <Input
                placeholder="Developers, designers, small businesses..."
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                data-testid="input-target-audience"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">App Description</label>
            <Textarea
              placeholder="Describe what your app does, its key features, and the problem it solves..."
              value={appDescription}
              onChange={(e) => setAppDescription(e.target.value)}
              rows={3}
              data-testid="input-app-description"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={() => generate("marketing-plan")}
              disabled={!hasInput || loading !== null}
              className="gap-2"
              data-testid="button-generate-plan"
            >
              {loading === "marketing-plan" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Rocket className="w-4 h-4" />
              )}
              Generate Marketing Plan
            </Button>
            <Button
              variant="outline"
              onClick={() => generate("landing-page")}
              disabled={!hasInput || loading !== null}
              className="gap-2"
              data-testid="button-generate-landing"
            >
              {loading === "landing-page" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Layout className="w-4 h-4" />
              )}
              Generate Landing Page
            </Button>
            <Button
              variant="outline"
              onClick={() => generate("social-posts")}
              disabled={!hasInput || loading !== null}
              className="gap-2"
              data-testid="button-generate-social"
            >
              {loading === "social-posts" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              Generate Social Posts
            </Button>
          </div>
        </CardContent>
      </Card>

      {(plan || landingPage || socialPosts.length > 0) && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50">
            {plan && (
              <TabsTrigger value="plan" data-testid="tab-plan" className="gap-2">
                <Rocket className="w-4 h-4" />
                Plan
              </TabsTrigger>
            )}
            {landingPage && (
              <TabsTrigger value="landing" data-testid="tab-landing" className="gap-2">
                <Layout className="w-4 h-4" />
                Landing Page
              </TabsTrigger>
            )}
            {socialPosts.length > 0 && (
              <TabsTrigger value="social" data-testid="tab-social" className="gap-2">
                <Share2 className="w-4 h-4" />
                Social
              </TabsTrigger>
            )}
          </TabsList>

          {plan && (
            <TabsContent value="plan" className="space-y-6">
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                        Tagline
                      </p>
                      <p className="text-xl font-semibold">{plan.tagline}</p>
                    </div>
                    <CopyBtn text={plan.tagline} id="tagline" />
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-3">
                {plan.valueProps.map((vp, i) => (
                  <Card key={i} className="bg-card/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-2">
                        <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <p className="text-sm">{vp}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    Marketing Channels
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {plan.channels.map((ch, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <Badge variant="outline" className={priorityColor[ch.priority] || ""}>
                          {ch.priority}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{ch.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{ch.strategy}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    Launch Checklist
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {plan.launchChecklist.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5 font-medium">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      Content Ideas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {plan.contentIdeas.map((idea, i) => (
                        <div key={i} className="p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-[10px]">
                              {idea.type}
                            </Badge>
                            <span className="text-sm font-medium">{idea.title}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{idea.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-primary" />
                      Mini App Ideas
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Small tools to drive traffic to your main app
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {plan.miniAppIdeas.map((idea, i) => (
                        <div key={i} className="p-3 rounded-lg bg-muted/30">
                          <p className="text-sm font-medium">{idea.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{idea.description}</p>
                          <p className="text-xs text-primary/80 mt-1 flex items-center gap-1">
                            <ArrowRight className="w-3 h-3" />
                            {idea.purpose}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {landingPage && (
            <TabsContent value="landing" className="space-y-6">
              <Card className="overflow-hidden border-primary/20">
                <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 text-center space-y-4">
                  <h2 className="text-3xl font-bold tracking-tight">{landingPage.heroHeadline}</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    {landingPage.heroSubheadline}
                  </p>
                  <Button size="lg" className="gap-2" data-testid="button-landing-cta">
                    {landingPage.ctaText}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
                <CardContent className="pt-6">
                  <div className="flex justify-end mb-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const html = `<html><head><title>${appName}</title></head><body>
<section style="text-align:center;padding:4rem 2rem"><h1>${landingPage.heroHeadline}</h1><p>${landingPage.heroSubheadline}</p><button>${landingPage.ctaText}</button></section>
<section style="padding:2rem;display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1rem">${landingPage.features.map((f) => `<div><h3>${f.icon} ${f.title}</h3><p>${f.description}</p></div>`).join("")}</section>
<section style="padding:2rem;text-align:center"><h2>${landingPage.socialProofHeadline}</h2>${landingPage.testimonials.map((t) => `<blockquote><p>"${t.quote}"</p><cite>— ${t.author}, ${t.role}</cite></blockquote>`).join("")}</section>
</body></html>`;
                        copyText(html, "landing-html");
                      }}
                      className="gap-2"
                      data-testid="button-copy-landing-html"
                    >
                      {copiedIndex === "landing-html" ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      Copy as HTML
                    </Button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                    {landingPage.features.map((f, i) => (
                      <div key={i} className="p-4 rounded-xl bg-muted/30 border border-border/50">
                        <span className="text-2xl mb-2 block">{f.icon}</span>
                        <h3 className="font-semibold text-sm">{f.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{f.description}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4 mb-8">
                    <h3 className="font-semibold text-center">{landingPage.socialProofHeadline}</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {landingPage.testimonials.map((t, i) => (
                        <div
                          key={i}
                          className="p-4 rounded-xl bg-muted/20 border border-border/30 italic"
                        >
                          <p className="text-sm mb-3">"{t.quote}"</p>
                          <p className="text-xs text-muted-foreground not-italic">
                            — {t.author}, {t.role}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Accordion type="single" collapsible className="mb-6">
                    {landingPage.faqItems.map((faq, i) => (
                      <AccordionItem key={i} value={`faq-${i}`}>
                        <AccordionTrigger className="text-sm">{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  <div className="text-center p-6 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="font-semibold">{landingPage.footerCta}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {socialPosts.length > 0 && (
            <TabsContent value="social" className="space-y-4">
              {socialPosts.map((post, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm font-bold">
                          {platformIcon[post.platform] || post.platform[0].toUpperCase()}
                        </span>
                        <div>
                          <p className="text-sm font-medium capitalize">{post.platform}</p>
                          {post.subreddit && (
                            <p className="text-xs text-muted-foreground">r/{post.subreddit}</p>
                          )}
                        </div>
                      </div>
                      <CopyBtn text={post.content || post.tagline || ""} id={`social-${i}`} />
                    </div>
                    {post.title && <p className="font-semibold text-sm mb-2">{post.title}</p>}
                    {post.tagline && (
                      <p className="text-sm italic text-primary mb-2">{post.tagline}</p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {post.hashtags.map((tag, j) => (
                          <Badge key={j} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          )}
        </Tabs>
      )}

      {!plan && !landingPage && socialPosts.length === 0 && (
        <div className="text-center py-16 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Ready to launch?</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Enter your app details above and let AI create a complete marketing strategy, landing
            page copy, and social media posts for you.
          </p>
        </div>
      )}
    </div>
  );
}
