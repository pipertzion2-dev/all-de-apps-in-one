"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/hooks/use-auth";
import { CamoThreeOverlay } from "@/components/camo-three-overlay";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePlatform } from "@/lib/platform-context";
import Link from "next/link";
import Image from "next/image";
import svivvaLogo from "@/attached_assets/SVIVVA_OFFICIAL_LOGO_1769201341308.png";
import softwareFlowerLogo from "@/attached_assets/Svivva_print_2_1769474625495.png";
import hardwareFlowerLogo from "@/attached_assets/Svivva_official_3_1769474625495.png";
import seedsLogo from "@/attached_assets/Svivva_Seeds_6_1771888740460.png";
import musicNoteIcon from "@/attached_assets/5C21F641-65DD-4255-A832-F60282E2CBF0_1771895543298.png";
import introImage from "@/attached_assets/IMG_1493_1770509047497.png";
import {
  Shield,
  Code2,
  GitBranch,
  Zap,
  BarChart3,
  Globe,
  Check,
  ArrowRight,
  Terminal,
  Sparkles,
  Layers,
  Database,
  RefreshCw,
  Wrench,
  Box,
  Ruler,
  Palette,
  Settings2,
  Music,
  Sprout,
  TrendingUp,
  Lock,
} from "lucide-react";
import dynamic from "next/dynamic";

const SvivvaArtifact = dynamic(
  () => import("@/components/svivva-artifact").then((m) => m.SvivvaArtifact),
  { ssr: false },
);
const FeatureSection = dynamic(
  () => import("@/components/svivva-artifact").then((m) => m.FeatureSection),
  { ssr: false },
);
import { ARTIFACT_FEATURES } from "@/components/svivva-artifact";
const features = [
  {
    icon: Shield,
    title: "Your AI Lies. We Catch It.",
    description:
      "JSON Schema validation with automatic repair. When the model hallucinates a field or returns a string where you wanted a number, Svivva fixes it — or retries until it doesn't. Zero negotiation.",
    code: "outputSchema: { type: 'object' }",
    highlight: "0 malformed outputs",
  },
  {
    icon: Sparkles,
    title: "100 QA Engineers. No Salaries.",
    description:
      "The moment you save a prompt, Svivva writes up to 200 test cases for it — edge cases, adversarial inputs, multilingual chaos, boundary conditions. It finds what your users would have found first.",
    code: "generateEvals({ count: 100 })",
    highlight: "Up to 200 evals, free",
  },
  {
    icon: GitBranch,
    title: "Time Travel for Prompts.",
    description:
      "Every edit is an immutable version. When evals fail at 3am, Svivva rolls back before you wake up — and files a report. Full history. One click. No incidents.",
    code: "rollback({ version: 'v2' })",
    highlight: "Rolls back at 3am",
  },
  {
    icon: BarChart3,
    title: "Know Before Your Users Complain.",
    description:
      "Live latency, success rates, and token spend — all visible before the support tickets arrive. Custom alerts fire the moment something drifts. Your users never see the chaos.",
    code: "metrics.avgLatency: 230ms",
    highlight: "Pre-complaint alerts",
  },
  {
    icon: Zap,
    title: "Zero to Endpoint. Seriously.",
    description:
      "Write the prompt. Deploy the API. That's it. Auto-scaling handles everything from 10 beta users to the Hacker News front page. Zero YAML. Zero ops. Zero regrets.",
    code: "status: 'deployed'",
    highlight: "HN-proof scaling",
  },
  {
    icon: Code2,
    title: "Looks Like a Real API. Is a Real API.",
    description:
      "TypeScript-first SDK, full type safety, auto-generated OpenAPI spec, Python and Node clients. Your users integrate in minutes and never suspect the backend is mostly words.",
    code: "import { PromptAPI } from 'svivva'",
    highlight: "TypeScript-first",
  },
];

const pricingTiers = [
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "Full platform access",
    features: [
      "Digital + Physical unlimited",
      "Unlimited API endpoints",
      "Unlimited hardware projects",
      "100,000 API requests/month",
      "AI material sourcing",
      "Hardware layout preview & optional AI sketches",
      "Svivva Play — full access",
      "Svivva Seeds — multi-app builder",
      "Auto-rollback & versioning",
      "Priority support",
    ],
    cta: "Subscribe to Pro",
    popular: true,
    hasSeeds: true,
    href: "/dashboard/checkout?tier=pro",
  },
  {
    name: "Enterprise",
    price: "$299",
    period: "/month",
    description: "For teams at scale",
    features: [
      "Everything in Pro",
      "Unlimited API requests",
      "Dedicated supplier network",
      "Svivva Play — full access",
      "Svivva Seeds — unlimited builds",
      "SSO & SAML",
      "Custom integrations",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    popular: false,
    hasSeeds: true,
    href: "mailto:hello@svivva.com?subject=Enterprise%20Plan%20Inquiry",
  },
];

export default function LandingPage() {
  const { mode, toggleMode } = usePlatform();
  const { data: meData } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/auth/me"],
    queryFn: () => authFetch("/api/auth/me").then((r) => r.json()),
    retry: false,
  });
  const userIsAdmin = meData?.isAdmin ?? false;

  const [flipProgress, setFlipProgress] = useState(0);
  const [flipComplete, setFlipComplete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const lastProgressRef = useRef(0);
  const [vpHeight, setVpHeight] = useState(0);
  const [stats, setStats] = useState<{
    projects: number;
    developers: number;
    apiCalls: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/public-stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});
  }, []);

  const handleStartBuilding = () => {
    const destination =
      mode === "digital" ? "/dashboard/api-builder" : "/dashboard/hardware-builder";
    window.location.href = `/api/auth/login?redirect=${encodeURIComponent(destination)}`;
  };

  const virtualScrollRef = useRef(0);

  useEffect(() => {
    const updateHeight = () => setVpHeight(window.innerHeight);
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  useEffect(() => {
    if (flipComplete) return;

    document.body.style.overflow = "hidden";

    const flipZone = window.innerHeight * 0.7;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      virtualScrollRef.current = Math.max(0, virtualScrollRef.current + e.deltaY);
      const progress = Math.min(virtualScrollRef.current / flipZone, 1);
      if (Math.abs(progress - lastProgressRef.current) > 0.001) {
        lastProgressRef.current = progress;
        setFlipProgress(progress);
        if (progress >= 1) {
          setFlipComplete(true);
          document.body.style.overflow = "";
          window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
        }
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const delta = touchStartY - e.touches[0].clientY;
      touchStartY = e.touches[0].clientY;
      virtualScrollRef.current = Math.max(0, virtualScrollRef.current + delta);
      const progress = Math.min(virtualScrollRef.current / flipZone, 1);
      if (Math.abs(progress - lastProgressRef.current) > 0.001) {
        lastProgressRef.current = progress;
        setFlipProgress(progress);
        if (progress >= 1) {
          setFlipComplete(true);
          document.body.style.overflow = "";
          window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
        }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [flipComplete]);

  const cubeAngle = flipProgress * 90;
  const halfH = vpHeight / 2;

  return (
    <div ref={containerRef}>
      {!flipComplete && (
        <div
          className="fixed inset-0"
          style={{
            zIndex: 60,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          <div className="absolute inset-0" style={{ zIndex: 0, backgroundColor: "transparent" }}>
            <CamoThreeOverlay preset="hero" className="intro-flowers" isIntro />
          </div>

          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              perspective: "3000px",
              perspectiveOrigin: "center center",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                position: "relative",
                transformStyle: "preserve-3d",
                transform: `translateZ(${-halfH}px) rotateX(${cubeAngle}deg)`,
                willChange: "transform",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  backfaceVisibility: "hidden",
                  transform: `translateZ(${halfH}px)`,
                  willChange: "transform",
                  opacity: flipProgress < 0.3 ? 1 : 1 - (flipProgress - 0.3) * 1.1,
                }}
              >
                <div
                  className="w-full h-full overflow-hidden"
                  style={{
                    backgroundColor: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    alignItems: "center",
                  }}
                >
                  <Image
                    src={introImage}
                    alt="Svivva"
                    width={1024}
                    height={1024}
                    sizes="100vw"
                    style={{
                      width: "100%",
                      maxHeight: "100%",
                      height: "auto",
                      objectFit: "contain",
                      objectPosition: "bottom center",
                      display: "block",
                    }}
                    priority
                  />
                </div>
              </div>

              <div
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  backfaceVisibility: "hidden",
                  transform: `rotateX(-90deg) translateZ(${halfH}px)`,
                  willChange: "transform",
                }}
              >
                <div className="w-full h-full bg-background flex flex-col overflow-hidden">
                  <nav className="h-14 sm:h-16 border-b border-white/10 backdrop-blur-xl bg-background/80 flex-shrink-0">
                    <div className="max-w-7xl mx-auto px-3 sm:px-6 h-full flex items-center justify-between gap-2 relative">
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="relative flex items-center gap-0.5 p-0.5 rounded-lg bg-muted/30">
                          <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-md overflow-hidden opacity-100 ring-2 ring-foreground/20">
                            <Image
                              src={hardwareFlowerLogo}
                              alt="Digital"
                              fill
                              sizes="32px"
                              className="object-cover"
                              priority
                            />
                          </div>
                          <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-md overflow-hidden opacity-40">
                            <Image
                              src={softwareFlowerLogo}
                              alt="Physical"
                              fill
                              sizes="32px"
                              className="object-cover"
                              priority
                            />
                          </div>
                        </div>
                        <Image
                          src={svivvaLogo}
                          alt="Svivva Logo"
                          width={140}
                          height={44}
                          className="h-6 sm:h-8 lg:h-9 w-auto object-contain"
                          priority
                        />
                      </div>
                      <div className="absolute left-1/2 -translate-x-1/2">
                        <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden">
                          <Image
                            src={seedsLogo}
                            alt="Svivva Seeds"
                            fill
                            sizes="40px"
                            className="object-cover"
                            priority
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        <span className="flex items-center gap-1 px-2 py-1">
                          <span className="seeds-holo-text text-base leading-none">&#9835;</span>
                          <span className="seeds-holo-text text-xs font-bold tracking-wide">
                            Play
                          </span>
                        </span>
                        <Button
                          size="sm"
                          className="bg-[#5BA8A0] text-xs px-2.5 sm:px-3 whitespace-nowrap"
                        >
                          Start Free
                        </Button>
                      </div>
                    </div>
                  </nav>
                  <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background via-background to-[#5BA8A0]/10">
                    <div className="text-center space-y-6 sm:space-y-8 max-w-4xl mx-auto px-4 sm:px-6">
                      <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
                        From seed{" "}
                        <span
                          style={{
                            backgroundImage:
                              "linear-gradient(to right, #6B2C4A, #5B7BA8, #8B6B9B, #5A6B4A, #D4A5B8, #8B6B5A)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                          }}
                        >
                          to symphony.
                        </span>
                      </h1>
                      <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                        Describe your API in plain English. Svivva writes 100 test cases for it,
                        deploys it with a real endpoint, and rolls back silently if it ever drifts.
                        No DevOps. No babysitting.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {flipProgress < 0.08 && (
            <div
              className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none"
              style={{
                zIndex: 10,
                opacity: 1 - flipProgress * 15,
                animation: "scrollBounce 1.5s ease-in-out 0s infinite",
              }}
            >
              <span
                className="text-sm font-medium text-gray-500 dark:text-gray-400"
                style={{ fontFamily: "'Zc', sans-serif" }}
              >
                Scroll to enter
              </span>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-500 dark:text-gray-400"
              >
                <path d="M10 4v12M5 11l5 5 5-5" />
              </svg>
            </div>
          )}
        </div>
      )}

      <div className="min-h-screen bg-background">
        <nav
          className="fixed top-0 left-0 right-0 z-50 h-14 sm:h-16 border-b border-white/10 backdrop-blur-xl bg-background/80"
          style={{ opacity: flipComplete ? 1 : 0, pointerEvents: flipComplete ? "auto" : "none" }}
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-6 h-full flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={toggleMode}
                className="relative flex items-center gap-0.5 p-0.5 rounded-lg bg-muted/30 cursor-pointer focus:outline-none"
                title={`Switch to ${mode === "digital" ? "Physical" : "Digital"} mode`}
                data-testid="button-platform-toggle"
              >
                <div
                  className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-md overflow-hidden transition-all duration-300 ${mode === "digital" ? "opacity-100 ring-2 ring-foreground/20" : "opacity-40"}`}
                >
                  <Image
                    src={hardwareFlowerLogo}
                    alt="Digital"
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </div>
                <div
                  className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-md overflow-hidden transition-all duration-300 ${mode === "physical" ? "opacity-100 ring-2 ring-foreground/20" : "opacity-40"}`}
                >
                  <Image
                    src={softwareFlowerLogo}
                    alt="Physical"
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </div>
              </button>
              <Image
                src={svivvaLogo}
                alt="Svivva Logo"
                width={140}
                height={44}
                className="h-6 sm:h-8 lg:h-9 w-auto object-contain"
              />
            </div>

            <Link
              href="/seeds"
              className="group absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-muted/30 transition-all"
              data-testid="link-svivva-seeds-header"
            >
              <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden group-hover:scale-110 transition-transform">
                <Image
                  src={seedsLogo}
                  alt="Svivva Seeds"
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
              <span className="seeds-holo-text text-xs sm:text-sm font-bold tracking-wide hidden sm:inline">
                Seeds
              </span>
            </Link>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <Link
                href="/play"
                className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted/50 transition-colors"
                data-testid="link-svivva-play-mobile"
              >
                <span className="seeds-holo-text text-base leading-none">&#9835;</span>
                <span className="seeds-holo-text text-xs font-bold tracking-wide">Play</span>
              </Link>
              <a href="/api/auth/login" className="hidden md:block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2 text-xs"
                  data-testid="button-signin"
                >
                  Sign In
                </Button>
              </a>
              <a href="/api/auth/login">
                <Button
                  size="sm"
                  className="bg-[#5BA8A0] text-xs px-2.5 sm:px-3 whitespace-nowrap"
                  data-testid="button-start-free"
                >
                  Start Free
                </Button>
              </a>
            </div>
          </div>
        </nav>

        <section
          className={`relative min-h-screen flex items-center justify-center pt-16 sm:pt-20 overflow-visible transition-[background-image,background-color] duration-700 ease-in-out-strong ${mode === "digital" ? "bg-gradient-to-br from-background via-background to-[#5BA8A0]/10" : "bg-gradient-to-br from-background via-[#6B2C4A]/5 to-background"}`}
        >
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <div className="text-center space-y-6 sm:space-y-8 max-w-4xl mx-auto">
              {mode === "digital" ? (
                <>
                  <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
                    From seed{" "}
                    <span
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, #6B2C4A, #5B7BA8, #8B6B9B, #5A6B4A, #D4A5B8, #8B6B5A)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      to symphony.
                    </span>
                  </h1>
                  <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                    Build and ship production backends, hardware prototypes, or full app suites from
                    a plain-English description. Svivva writes the test cases, deploys the endpoint,
                    validates every response, and auto-rolls back if anything breaks. No DevOps, no
                    backend code, no babysitting.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                    <Button
                      size="lg"
                      className="gap-2 bg-[#5BA8A0]"
                      onClick={handleStartBuilding}
                      data-testid="button-hero-start"
                    >
                      Start building
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    <a href="#how-it-works">
                      <Button
                        size="lg"
                        variant="outline"
                        className="gap-2"
                        data-testid="button-hero-demo"
                      >
                        <Terminal className="w-4 h-4" />
                        See how it works
                      </Button>
                    </a>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm text-muted-foreground pt-4">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>Free tier — no credit card</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>OpenAI, Claude &amp; Gemini support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>Ship with confidence</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
                    From seed{" "}
                    <span
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, #C4B8D6, #F5C6D6, #F5F0B8, #8DB87D)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      to symphony.
                    </span>
                  </h1>
                  <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                    Describe your hardware idea. Svivva generates the schematics, sources the
                    components, tracks the budget, and connects you to manufacturers — so the only
                    thing between you and a real product is a description.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                    <Button
                      size="lg"
                      className="gap-2 bg-[#5BA8A0]"
                      onClick={handleStartBuilding}
                      data-testid="button-hero-start"
                    >
                      Start a project
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    <a href="#how-it-works">
                      <Button
                        size="lg"
                        variant="outline"
                        className="gap-2"
                        data-testid="button-hero-demo"
                      >
                        <Box className="w-4 h-4" />
                        Browse examples
                      </Button>
                    </a>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm text-muted-foreground pt-4">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>Full technical specs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>Supplier sourcing built in</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>Real-time budget tracking</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <div
          className="relative h-32 sm:h-48 -mt-1"
          style={{
            background:
              "linear-gradient(to bottom, hsl(var(--background)) 0%, rgba(0,0,0,0.95) 100%)",
          }}
          aria-hidden="true"
        />

        <section
          id="platforms"
          className="py-16 sm:py-24 relative overflow-hidden bg-black/95 -mt-1"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center space-y-4 mb-16">
              <Badge variant="secondary" className="px-4 py-1.5">
                The BUILD System
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                {mode === "digital" ? (
                  <span
                    style={{
                      backgroundImage:
                        "linear-gradient(to right, #6B2C4A, #5B7BA8, #8B6B9B, #5A6B4A, #D4A5B8, #8B6B5A)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    5 steps
                  </span>
                ) : (
                  <span
                    style={{
                      backgroundImage:
                        "linear-gradient(to right, #C4B8D6, #F5C6D6, #F5F0B8, #8DB87D)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    5 steps
                  </span>
                )}{" "}
                to delivery
              </h2>

              <div className="flex justify-center mt-6 px-4">
                <div className="inline-flex flex-row items-center gap-2 p-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <button
                    onClick={() => mode !== "digital" && toggleMode()}
                    className={`relative flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 rounded-md transition-[background-color,box-shadow,opacity,transform] duration-200 ease-out-strong active:scale-[0.98] whitespace-nowrap ${mode === "digital" ? "bg-background shadow-sm" : "opacity-60 hover:opacity-80"}`}
                    data-testid="button-build-toggle-digital"
                  >
                    <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-md overflow-hidden flex-shrink-0">
                      <Image
                        src={hardwareFlowerLogo}
                        alt="Digital"
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    </div>
                    <div className="text-left">
                      <div
                        className={`text-sm sm:text-base font-medium transition-colors ${mode === "digital" ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        Digital
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">
                        Prompt to API
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => mode !== "physical" && toggleMode()}
                    className={`relative flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 rounded-md transition-[background-color,box-shadow,opacity,transform] duration-200 ease-out-strong active:scale-[0.98] whitespace-nowrap ${mode === "physical" ? "bg-background shadow-sm" : "opacity-60 hover:opacity-80"}`}
                    data-testid="button-build-toggle-physical"
                  >
                    <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-md overflow-hidden flex-shrink-0">
                      <Image
                        src={softwareFlowerLogo}
                        alt="Physical"
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    </div>
                    <div className="text-left">
                      <div
                        className={`text-sm sm:text-base font-medium transition-colors ${mode === "physical" ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        Physical
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">
                        Manufacturing
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto mt-6">
                Bring Users Into Logical Delivery — our guided process takes you from concept to
                completion.
              </p>
            </div>

            <div className="mt-12 text-center">
              <a href="/api/auth/login">
                <Button size="lg" className="gap-2 bg-[#5BA8A0]" data-testid="button-platforms-cta">
                  {mode === "digital" ? "Start Building APIs" : "Start Manufacturing"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20 relative overflow-hidden bg-black/95 -mt-1">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div
              className="relative rounded-2xl overflow-hidden border border-white/10"
              style={{
                background:
                  "linear-gradient(135deg, rgba(91,168,160,0.08) 0%, rgba(107,44,74,0.08) 50%, rgba(91,168,160,0.05) 100%)",
              }}
            >
              <div className="absolute inset-0 opacity-20">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 20% 50%, rgba(91,168,160,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(107,44,74,0.3) 0%, transparent 50%)",
                  }}
                />
              </div>
              <div className="relative flex flex-col md:flex-row items-center gap-6 sm:gap-8 p-6 sm:p-10">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden flex-shrink-0 ring-2 ring-white/10">
                  <Image
                    src={seedsLogo}
                    alt="Svivva Seeds"
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 text-center md:text-left space-y-3">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="seeds-holo-text text-xl sm:text-2xl font-bold tracking-wide">
                      Svivva Seeds
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      Pro & Enterprise
                    </Badge>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground max-w-lg">
                    Generate multiple production-ready applications from a single structured
                    document. One spec in, entire product suites out — frontend, backend, database,
                    auth, and deployment configs all built in parallel.
                  </p>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                    {[
                      "Multi-app generation",
                      "Parallel builds",
                      "Full-stack output",
                      "Auto documentation",
                    ].map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="pt-2 flex flex-wrap gap-2">
                    <Link href="/seeds">
                      <Button
                        size="sm"
                        className="gap-2 bg-[#5BA8A0]"
                        data-testid="button-seeds-cta"
                      >
                        Explore Seeds <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                    <Link href="/seeds#seeds-marketing">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 border-white/20 text-white hover:bg-white/10"
                        data-testid="button-seeds-marketing-cta"
                      >
                        <TrendingUp className="w-3.5 h-3.5" /> Seeds Marketing
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div
          className="relative h-32 sm:h-48 -mt-1"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.95) 0%, hsl(var(--background)) 100%)",
          }}
          aria-hidden="true"
        />

        {/* ── Live Traction Bar ─────────────────────────────────────────────── */}
        <section className="py-8 border-y border-border/40 bg-background/60 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                {
                  label: "APIs Built",
                  value: stats ? (stats.projects > 0 ? stats.projects.toLocaleString() : "—") : "…",
                  suffix: stats && stats.projects > 0 ? "+" : "",
                },
                {
                  label: "Developers",
                  value: stats
                    ? stats.developers > 0
                      ? stats.developers.toLocaleString()
                      : "—"
                    : "…",
                  suffix: stats && stats.developers > 0 ? "+" : "",
                },
                {
                  label: "API Calls Served",
                  value: stats ? (stats.apiCalls > 0 ? stats.apiCalls.toLocaleString() : "—") : "…",
                  suffix: stats && stats.apiCalls > 0 ? "+" : "",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center gap-1"
                  data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <span
                    className="text-2xl sm:text-3xl font-black tracking-tight"
                    style={{
                      background: "linear-gradient(135deg, #5BA8A0, #6B2C4A)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {stat.value}
                    {stat.suffix}
                  </span>
                  <span className="text-[11px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
        {/* ── End Traction Bar ──────────────────────────────────────────────── */}

        {/* ── Svivva Artifact ───────────────────────────────────────────────── */}
        <div className="bg-background">
          <SvivvaArtifact />
        </div>

        {/* ── Artwork-driven Feature Sections ───────────────────────────────── */}
        <div id="feature-world" className="bg-background">
          {ARTIFACT_FEATURES.map((f, i) => (
            <FeatureSection key={f.id} feature={f} index={i} reverse={i % 2 === 1} />
          ))}
        </div>

        <section
          id="features"
          className="py-16 sm:py-24 min-h-[600px] relative overflow-hidden -mt-1"
        >
          <div className="absolute inset-0 opacity-60 md:opacity-50">
            <CamoThreeOverlay preset="features" />
          </div>
          <div
            className="absolute inset-x-0 top-0 h-32 sm:h-40 z-[1] pointer-events-none"
            style={{
              background: "linear-gradient(to bottom, hsl(var(--background)) 0%, transparent 100%)",
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-32 sm:h-40 z-[1] pointer-events-none"
            style={{
              background: "linear-gradient(to top, hsl(var(--background)) 0%, transparent 100%)",
            }}
          />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="text-center space-y-4 mb-12 sm:mb-16 bg-background/80 backdrop-blur-lg rounded-2xl p-5 sm:p-8 max-w-3xl mx-auto">
              <Badge variant="secondary" className="px-4 py-1.5">
                Features
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                {mode === "digital" ? (
                  <>
                    Everything you need for{" "}
                    <span
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, #6B2C4A, #5B7BA8, #8B6B9B, #5A6B4A, #D4A5B8, #8B6B5A)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      production
                    </span>
                  </>
                ) : (
                  <>
                    Everything you need to{" "}
                    <span
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, #C4B8D6, #F5C6D6, #F5F0B8, #8DB87D)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      manufacture
                    </span>
                  </>
                )}
              </h2>
              <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                {mode === "digital"
                  ? "From prompt to production in minutes. Built-in evaluation, versioning, and rollback."
                  : "From concept to production-ready. AI-powered schematics, materials, and budgets."}
              </p>
            </div>

            {mode === "digital" ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <Card
                    key={index}
                    className="rounded-2xl p-6 hover-elevate active-elevate-2 group backdrop-blur-xl bg-card/95 border-border/50"
                    data-testid={`card-feature-${index}`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-10 h-10 rounded-lg bg-[#5BA8A0]/15 flex items-center justify-center">
                          <feature.icon className="w-5 h-5 text-[#5BA8A0]" />
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-xs bg-[#5BA8A0]/10 text-[#5BA8A0] border-[#5BA8A0]/20 invisible group-hover:visible"
                        >
                          {feature.highlight}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-semibold">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {feature.description}
                      </p>
                      <div className="pt-2">
                        <code className="inline-block px-2.5 py-1.5 rounded-md bg-muted/80 text-xs font-mono text-[#5BA8A0]">
                          {feature.code}
                        </code>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    icon: Layers,
                    title: "Smart Project Briefs",
                    description:
                      "AI interprets your vision and creates comprehensive project outlines with all requirements.",
                    highlight: "AI-Powered",
                    code: "brief.generate()",
                  },
                  {
                    icon: Box,
                    title: "Material Discovery",
                    description:
                      "Automatically scout and compare materials from multiple suppliers with real-time pricing.",
                    highlight: "Live Pricing",
                    code: "materials.scout()",
                  },
                  {
                    icon: Ruler,
                    title: "Dimensional preview",
                    description:
                      "See illustrative dimensions inferred from your product category and requirements — a planning aid, not engineering drawings.",
                    highlight: "From your brief",
                    code: "layout.preview()",
                  },
                  {
                    icon: Palette,
                    title: "Optional reference images",
                    description:
                      "Generate 2D reference sketches from prompts (DALL-E 3) when your deployment has OpenAI configured — not CAD or mesh output.",
                    highlight: "DALL-E 3",
                    code: "images.generate()",
                  },
                  {
                    icon: Settings2,
                    title: "Budget Optimization",
                    description:
                      "Real-time cost tracking with AI suggestions for cost-effective alternatives.",
                    highlight: "Save Money",
                    code: "budget.optimize()",
                  },
                  {
                    icon: Database,
                    title: "Supplier Network",
                    description:
                      "Access vetted suppliers with verified lead times and quality ratings.",
                    highlight: "Verified",
                    code: "suppliers.find()",
                  },
                ].map((feature, index) => (
                  <Card
                    key={index}
                    className="rounded-2xl p-6 hover-elevate active-elevate-2 group backdrop-blur-xl bg-card/95 border-border/50"
                    data-testid={`card-feature-physical-${index}`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-10 h-10 rounded-lg bg-[#6B2C4A]/15 flex items-center justify-center">
                          <feature.icon className="w-5 h-5 text-[#6B2C4A]" />
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-xs bg-[#6B2C4A]/10 text-[#6B2C4A] border-[#6B2C4A]/20 invisible group-hover:visible"
                        >
                          {feature.highlight}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-semibold">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {feature.description}
                      </p>
                      <div className="pt-2">
                        <code className="inline-block px-2.5 py-1.5 rounded-md bg-muted/80 text-xs font-mono text-[#6B2C4A]">
                          {feature.code}
                        </code>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Founder Story */}
        <section className="py-16 sm:py-24 relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-10 sm:gap-16 items-center">
              {/* Image */}
              <div className="relative order-2 lg:order-1 pb-8">
                <div className="rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 max-w-sm mx-auto lg:max-w-none">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/founder-son.jpeg"
                    alt="Svivva founder working with his 6-year-old son on the app design"
                    className="w-full h-auto object-cover block"
                  />
                </div>
                {/* Floating caption */}
                <div className="absolute bottom-0 right-2 sm:right-0 bg-card border border-border/60 rounded-2xl px-4 py-3 shadow-xl backdrop-blur-xl max-w-[200px]">
                  <p className="text-xs font-semibold text-foreground leading-snug">
                    Studying flower color palettes
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Age 6 · Lead color designer
                  </p>
                </div>
              </div>

              {/* Text */}
              <div className="order-1 lg:order-2 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#5BA8A0]/30 bg-[#5BA8A0]/5 text-xs font-medium text-[#5BA8A0]">
                  <span>🌸</span> Founder Story
                </div>

                <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
                  Built by a father and son,{" "}
                  <span
                    style={{
                      backgroundImage: "linear-gradient(to right, #6B2C4A, #5BA8A0)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    one petal at a time
                  </span>
                </h2>

                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    I homeschool my six-year-old son, and somewhere between math lessons and
                    afternoon walks, he developed a quiet obsession with flowers, plants, and herbs
                    — the way they grow, the way they smell, and above everything else, the way they
                    hold color.
                  </p>
                  <p>
                    He studies flower color palettes the way most kids study cartoons. He'll spend
                    an hour noting exactly how a rose shifts from deep burgundy at its center to
                    soft blush at the tips, or how lavender pairs with sage. When I started
                    designing Svivva, he was right there next to me. The teal and burgundy you see
                    throughout the app? His picks. He pointed at a flower and said,{" "}
                    <em>"that one and that one, Dad."</em>
                  </p>
                  <p>
                    The Svivva logo — the bouquet of flowers — isn't a designer's creation. He built
                    it himself from scratch, using things he found around the house. Pipe cleaners,
                    paper scraps, fabric. He arranged them into a small flower sculpture, handed it
                    to me, and said that was the logo. He was right.
                  </p>
                  <p className="text-foreground/80 font-medium">
                    We're building Svivva to last. Not just as a platform for developers, but as
                    something a six-year-old can one day point to and say he helped make beautiful.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="py-16 sm:py-24 min-h-[600px] relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-60 md:opacity-50">
            <CamoThreeOverlay preset="howItWorks" />
          </div>
          <div
            className="absolute inset-x-0 top-0 h-32 sm:h-40 z-[1] pointer-events-none"
            style={{
              background: "linear-gradient(to bottom, hsl(var(--background)) 0%, transparent 100%)",
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-32 sm:h-40 z-[1] pointer-events-none"
            style={{
              background: "linear-gradient(to top, hsl(var(--background)) 0%, transparent 100%)",
            }}
          />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="text-center space-y-4 mb-12 sm:mb-16 bg-background/80 backdrop-blur-lg rounded-2xl p-5 sm:p-8 max-w-3xl mx-auto">
              <Badge variant="secondary" className="px-4 py-1.5">
                How it Works
              </Badge>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
                {mode === "digital" ? (
                  <>
                    Prompt to{" "}
                    <span
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, #6B2C4A, #5B7BA8, #8B6B9B, #5A6B4A, #D4A5B8, #8B6B5A)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      product
                    </span>
                  </>
                ) : (
                  <>
                    Idea to{" "}
                    <span
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, #C4B8D6, #F5C6D6, #F5F0B8, #8DB87D)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      invoice
                    </span>
                  </>
                )}
              </h2>
              <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                {mode === "digital"
                  ? "Write what you want. Get a tested, versioned, rollback-ready API. No YAML. No boilerplate. No surprises."
                  : "Describe your product. Get specs, suppliers, and a budget. No CAD skills needed. No guessing at costs."}
              </p>
            </div>

            {mode === "digital" ? (
              <div className="grid lg:grid-cols-3 gap-6 mb-12">
                <Card className="bg-slate-900/90 backdrop-blur-xl border-[#5BA8A0]/30 rounded-2xl overflow-visible hover-elevate active-elevate-2">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-[#5BA8A0]/20 bg-[#5BA8A0]/10">
                    <Terminal className="w-5 h-5 text-[#5BA8A0]" />
                    <span className="font-semibold text-[#5BA8A0]">1. Your Prompt</span>
                  </div>
                  <div className="p-5 space-y-4">
                    <p className="text-sm text-gray-300">
                      Describe what your API should do in plain English:
                    </p>
                    <div className="bg-black/40 rounded-lg p-4 border border-white/10">
                      <p className="text-sm text-gray-200 italic">
                        &quot;Analyze customer feedback to extract sentiment, identify key topics,
                        and provide a confidence score. Handle multiple languages.&quot;
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      <span>Intent detected: Sentiment Analysis</span>
                    </div>
                  </div>
                </Card>

                <Card className="bg-slate-900/90 backdrop-blur-xl border-[#D782B2]/30 rounded-2xl overflow-visible hover-elevate active-elevate-2">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-[#D782B2]/20 bg-[#D782B2]/10">
                    <Layers className="w-5 h-5 text-[#D782B2]" />
                    <span className="font-semibold text-[#D782B2]">2. Generated Schema</span>
                  </div>
                  <div className="p-5 font-mono text-xs space-y-1">
                    <div>
                      <span className="text-[#6B3A67]">interface</span>{" "}
                      <span className="text-[#425884]">Response</span> {"{"}
                    </div>
                    <div className="pl-3">
                      <span className="text-[#6B7B59]">sentiment</span>:{" "}
                      <span className="text-[#D782B2]">&quot;positive&quot;</span> |{" "}
                      <span className="text-[#D782B2]">&quot;negative&quot;</span>;
                    </div>
                    <div className="pl-3">
                      <span className="text-[#6B7B59]">topics</span>:{" "}
                      <span className="text-[#425884]">string[]</span>;
                    </div>
                    <div className="pl-3">
                      <span className="text-[#6B7B59]">confidence</span>:{" "}
                      <span className="text-[#425884]">number</span>;
                    </div>
                    <div className="pl-3">
                      <span className="text-[#6B7B59]">language</span>:{" "}
                      <span className="text-[#425884]">string</span>;
                    </div>
                    <div>{"}"}</div>
                    <div className="pt-3 flex items-center gap-2 text-gray-400 font-sans">
                      <Shield className="w-3.5 h-3.5 text-[#D782B2]" />
                      <span>Schema validated</span>
                    </div>
                  </div>
                </Card>

                <Card className="bg-slate-900/90 backdrop-blur-xl border-[#63B3A6]/30 rounded-2xl overflow-visible hover-elevate active-elevate-2">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-[#63B3A6]/20 bg-[#63B3A6]/10">
                    <Globe className="w-5 h-5 text-[#63B3A6]" />
                    <span className="font-semibold text-[#63B3A6]">3. Live API</span>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="bg-black/40 rounded-lg p-3 border border-white/10">
                      <div className="flex items-center gap-2 text-xs mb-2">
                        <Badge className="bg-green-500/20 text-green-400 text-[10px]">POST</Badge>
                        <span className="text-gray-300 font-mono text-[10px]">
                          api.svivva.ai/v1/sentiment
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">200 OK • 124ms</div>
                    </div>
                    <div className="bg-black/40 rounded-lg p-3 border border-white/10 font-mono text-xs">
                      <div className="text-gray-400">{"{"}</div>
                      <div className="pl-2">
                        <span className="text-[#6B7B59]">&quot;sentiment&quot;</span>:{" "}
                        <span className="text-[#D782B2]">&quot;positive&quot;</span>,
                      </div>
                      <div className="pl-2">
                        <span className="text-[#6B7B59]">&quot;confidence&quot;</span>:{" "}
                        <span className="text-[#425884]">0.94</span>
                      </div>
                      <div className="text-gray-400">{"}"}</div>
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-6 mb-12">
                <Card className="bg-slate-900/90 backdrop-blur-xl border-[#6B2C4A]/30 rounded-2xl overflow-visible hover-elevate active-elevate-2">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-[#6B2C4A]/20 bg-[#6B2C4A]/10">
                    <Layers className="w-5 h-5 text-[#6B2C4A]" />
                    <span className="font-semibold text-[#6B2C4A]">1. Your Vision</span>
                  </div>
                  <div className="p-5 space-y-4">
                    <p className="text-sm text-gray-300">Describe what you want to build:</p>
                    <div className="bg-black/40 rounded-lg p-4 border border-white/10">
                      <p className="text-sm text-gray-200 italic">
                        &quot;A modular desk organizer with 3 compartments, made from sustainable
                        bamboo, fits standard office supplies.&quot;
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      <span>Category: Home Office Furniture</span>
                    </div>
                  </div>
                </Card>

                <Card className="bg-slate-900/90 backdrop-blur-xl border-[#D782B2]/30 rounded-2xl overflow-visible hover-elevate active-elevate-2">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-[#D782B2]/20 bg-[#D782B2]/10">
                    <Ruler className="w-5 h-5 text-[#D782B2]" />
                    <span className="font-semibold text-[#D782B2]">2. Layout preview</span>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Dimensions</span>
                      <span className="text-gray-200">300 x 200 x 120mm</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Material</span>
                      <span className="text-gray-200">Bamboo (FSC)</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Components</span>
                      <span className="text-gray-200">7 pieces</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Assembly</span>
                      <span className="text-gray-200">Snap-fit joints</span>
                    </div>
                    <div className="pt-3 flex items-center gap-2 text-gray-400 font-sans text-xs">
                      <Ruler className="w-3.5 h-3.5 text-[#D782B2]" />
                      <span>Preview updates from your brief</span>
                    </div>
                  </div>
                </Card>

                <Card className="bg-slate-900/90 backdrop-blur-xl border-[#63B3A6]/30 rounded-2xl overflow-visible hover-elevate active-elevate-2">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-[#63B3A6]/20 bg-[#63B3A6]/10">
                    <Settings2 className="w-5 h-5 text-[#63B3A6]" />
                    <span className="font-semibold text-[#63B3A6]">3. Production Ready</span>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Unit cost</span>
                        <span className="text-green-400 font-mono">$12.40</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Lead time</span>
                        <span className="text-gray-200">14 days</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">MOQ</span>
                        <span className="text-gray-200">100 units</span>
                      </div>
                    </div>
                    <div className="pt-2 flex flex-wrap gap-1">
                      <Badge className="bg-purple-500/20 text-purple-400 text-[10px]">
                        PDF blueprint
                      </Badge>
                      <Badge className="bg-blue-500/20 text-blue-400 text-[10px]">Sourcing</Badge>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            <div className="flex justify-center px-4">
              <div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 px-5 sm:px-6 py-3 bg-black/50 backdrop-blur-md rounded-2xl sm:rounded-full border border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-300">
                    {mode === "digital"
                      ? "All responses validated against schema"
                      : "All specs verified for manufacturability"}
                  </span>
                </div>
                <div className="hidden sm:block w-px h-4 bg-white/20" />
                <div className="flex items-center gap-2">
                  <RefreshCw
                    className={`w-4 h-4 flex-shrink-0 ${mode === "digital" ? "text-[#5BA8A0]" : "text-[#6B2C4A]"}`}
                  />
                  <span className="text-xs sm:text-sm text-gray-300">
                    {mode === "digital"
                      ? "Auto-retry on validation failure"
                      : "Real-time cost updates"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24 min-h-[600px] relative overflow-hidden">
          <div className="absolute inset-0 opacity-60 md:opacity-50">
            <CamoThreeOverlay preset="evals" />
          </div>
          <div
            className="absolute inset-x-0 top-0 h-32 sm:h-40 z-[1] pointer-events-none"
            style={{
              background: "linear-gradient(to bottom, hsl(var(--background)) 0%, transparent 100%)",
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-32 sm:h-40 z-[1] pointer-events-none"
            style={{
              background: "linear-gradient(to top, hsl(var(--background)) 0%, transparent 100%)",
            }}
          />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            {mode === "digital" ? (
              <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
                <div className="space-y-6 bg-background/85 backdrop-blur-xl rounded-2xl p-5 sm:p-8">
                  <Badge variant="secondary" className="px-4 py-1.5">
                    Evaluation Engine
                  </Badge>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                    We break it{" "}
                    <span
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, #6B2C4A, #5B7BA8, #8B6B9B, #5A6B4A, #D4A5B8, #8B6B5A)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      so you don't
                    </span>
                  </h2>
                  <p className="text-base sm:text-xl text-muted-foreground">
                    Every endpoint gets 50+ AI-generated test cases—edge cases, adversarial inputs,
                    malformed data. When pass rates drop, we roll back automatically. You sleep
                    soundly.
                  </p>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Edge case detection</h3>
                        <p className="text-muted-foreground text-sm">
                          AI identifies boundary conditions your tests would miss
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Adversarial testing</h3>
                        <p className="text-muted-foreground text-sm">
                          Tests malicious inputs and injection attempts
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Instant rollback</h3>
                        <p className="text-muted-foreground text-sm">
                          Automatically reverts to last passing version on failures
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Card className="rounded-2xl p-8 backdrop-blur-xl bg-card/95 border-border/50">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-semibold">Eval Results</h3>
                      <Badge className="bg-green-500/20 text-green-400">Passing</Badge>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-muted-foreground">Pass Rate</span>
                        <span className="font-mono text-green-400">94.2%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10">
                        <div className="w-[94%] h-full rounded-full bg-[#5BA8A0]" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                      <div className="text-center">
                        <div className="text-2xl font-bold">156</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">147</div>
                        <div className="text-xs text-muted-foreground">Passed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-400">9</div>
                        <div className="text-xs text-muted-foreground">Failed</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
                <div className="space-y-6 bg-background/85 backdrop-blur-xl rounded-2xl p-5 sm:p-8">
                  <Badge variant="secondary" className="px-4 py-1.5">
                    Quality Assurance
                  </Badge>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                    Find the problems{" "}
                    <span
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, #C4B8D6, #F5C6D6, #F5F0B8, #8DB87D)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      on screen
                    </span>
                  </h2>
                  <p className="text-base sm:text-xl text-muted-foreground">
                    AI stress-tests your design for manufacturability before you spend a dime on
                    materials. Material conflicts, tolerance issues, cost overruns—caught early,
                    fixed fast.
                  </p>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Manufacturability check</h3>
                        <p className="text-muted-foreground text-sm">
                          AI verifies your design can be produced with available methods
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Structural analysis</h3>
                        <p className="text-muted-foreground text-sm">
                          Validates load-bearing capacity and material stress points
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Cost optimization</h3>
                        <p className="text-muted-foreground text-sm">
                          Suggests material alternatives to reduce costs without quality loss
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Card className="rounded-2xl p-8 backdrop-blur-xl bg-card/95 border-border/50">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-semibold">Design Validation</h3>
                      <Badge className="bg-green-500/20 text-green-400">Approved</Badge>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-muted-foreground">Validation Score</span>
                        <span className="font-mono text-green-400">96.8%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10">
                        <div className="w-[97%] h-full rounded-full bg-[#6B2C4A]" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                      <div className="text-center">
                        <div className="text-2xl font-bold">12</div>
                        <div className="text-xs text-muted-foreground">Checks</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">11</div>
                        <div className="text-xs text-muted-foreground">Passed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">1</div>
                        <div className="text-xs text-muted-foreground">Warning</div>
                      </div>
                    </div>
                    <div className="space-y-2 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span>Structural</span>
                        <Badge className="bg-green-500/20 text-green-400 text-[10px]">Pass</Badge>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span>Material</span>
                        <Badge className="bg-green-500/20 text-green-400 text-[10px]">Pass</Badge>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span>Assembly</span>
                        <Badge className="bg-yellow-500/20 text-yellow-400 text-[10px]">
                          Review
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span>Cost</span>
                        <Badge className="bg-green-500/20 text-green-400 text-[10px]">
                          Optimized
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </section>

        <section id="pricing" className="py-16 sm:py-24 min-h-[600px] relative overflow-hidden">
          <div className="absolute inset-0 opacity-60 md:opacity-50">
            <CamoThreeOverlay preset="pricing" />
          </div>
          <div
            className="absolute inset-x-0 top-0 h-32 sm:h-40 z-[1] pointer-events-none"
            style={{
              background: "linear-gradient(to bottom, hsl(var(--background)) 0%, transparent 100%)",
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-32 sm:h-40 z-[1] pointer-events-none"
            style={{
              background: "linear-gradient(to top, hsl(var(--background)) 0%, transparent 100%)",
            }}
          />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="text-center space-y-4 mb-12 sm:mb-16 bg-background/80 backdrop-blur-lg rounded-2xl p-5 sm:p-8 max-w-3xl mx-auto">
              <Badge variant="secondary" className="px-4 py-1.5">
                Pricing
              </Badge>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                Simple, transparent <span className="solid-accent">pricing</span>
              </h2>
              <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                Start free, scale as you grow. No hidden fees.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {pricingTiers.map((tier, index) => (
                <div
                  key={index}
                  className={`relative ${tier.popular ? "p-[3px] rounded-2xl" : ""}`}
                  style={
                    tier.popular
                      ? {
                          background:
                            "linear-gradient(135deg, #3F2A2C 0%, #7A4F3A 14%, #6B3A67 28%, #425884 42%, #D782B2 56%, #F3AFC4 70%, #6B7B59 85%, #4A5A3D 100%)",
                        }
                      : undefined
                  }
                >
                  <Card
                    className={`rounded-2xl p-6 relative backdrop-blur-xl bg-card h-full ${tier.popular ? "border-0" : "border-border/50"}`}
                    data-testid={`card-pricing-${tier.name.toLowerCase()}`}
                  >
                    {tier.popular && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#5BA8A0] text-white">
                        Most Popular
                      </Badge>
                    )}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-semibold">{tier.name}</h3>
                        <p className="text-sm text-muted-foreground">{tier.description}</p>
                      </div>
                      {tier.hasSeeds && (
                        <div className="flex items-center gap-2">
                          <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={seedsLogo}
                              alt="Svivva Seeds"
                              fill
                              sizes="32px"
                              className="object-cover"
                            />
                          </div>
                          <span className="seeds-holo-text text-[10px] font-bold tracking-widest uppercase">
                            Includes Seeds
                          </span>
                        </div>
                      )}
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">{tier.price}</span>
                        <span className="text-muted-foreground">{tier.period}</span>
                      </div>
                      <ul className="space-y-3">
                        {tier.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <a href={tier.href} className="block">
                        <Button
                          className={`w-full ${tier.popular ? "bg-[#5BA8A0] text-white" : ""}`}
                          variant={tier.popular ? "default" : "outline"}
                          data-testid={`button-pricing-${tier.name.toLowerCase()}`}
                        >
                          {tier.cta}
                        </Button>
                      </a>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-8">
              Want to explore first?{" "}
              <a
                href="/api/auth/login"
                className="underline hover:text-foreground transition-colors"
              >
                Start free
              </a>{" "}
              — no credit card required.
            </p>
          </div>
        </section>

        <section className="py-24 relative bg-gradient-to-b from-transparent to-background/50">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="rounded-3xl p-6 sm:p-8 md:p-12 space-y-6 sm:space-y-8 bg-card/95 backdrop-blur-xl border border-border/50">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                {mode === "digital" ? (
                  <>
                    Ready to build{" "}
                    <span
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, #6B2C4A, #5B7BA8, #8B6B9B, #5A6B4A, #D4A5B8, #8B6B5A)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      your next release
                    </span>
                    ?
                  </>
                ) : (
                  <>
                    Ready to manufacture{" "}
                    <span
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, #C4B8D6, #F5C6D6, #F5F0B8, #8DB87D)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      your next prototype
                    </span>
                    ?
                  </>
                )}
              </h2>
              <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                {mode === "digital"
                  ? "Join thousands of developers shipping AI-powered features faster and more reliably."
                  : "Join thousands of creators turning ideas into manufactured products with AI-powered tools."}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a href="/api/auth/login">
                  <Button size="lg" className="bg-[#5BA8A0] gap-2" data-testid="button-cta-start">
                    {mode === "digital" ? "Start Building Free" : "Start Creating Free"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
                <a href="/api/auth/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2"
                    data-testid="button-cta-demo"
                  >
                    Schedule Demo
                  </Button>
                </a>
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-6 text-sm text-muted-foreground pt-4">
                <span>Deploy in 60 seconds</span>
                <span>No credit card required</span>
                <span>SOC 2 compliant</span>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 py-8 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
              <div className="space-y-4 col-span-2 md:col-span-1">
                <Image
                  src={svivvaLogo}
                  alt="Svivva Logo"
                  width={120}
                  height={40}
                  className="h-8 w-auto object-contain"
                />
              </div>
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <a href="#features" className="hover:text-foreground transition-colors">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#pricing" className="hover:text-foreground transition-colors">
                      Pricing
                    </a>
                  </li>
                  <li>
                    <Link href="/play" className="hover:text-foreground transition-colors">
                      Svivva Play
                    </Link>
                  </li>
                  <li>
                    <Link href="/seeds" className="hover:text-foreground transition-colors">
                      Svivva Seeds
                    </Link>
                  </li>
                  <li>
                    <Link href="/tools" className="hover:text-foreground transition-colors">
                      Free AI Tools
                    </Link>
                  </li>
                  <li>
                    <Link href="/ai-tools-hub" className="hover:text-foreground transition-colors">
                      AI Tools Hub
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/cyber-security-mini-apps"
                      className="hover:text-foreground transition-colors"
                    >
                      Security Tools (Clutety)
                    </Link>
                  </li>
                  <li>
                    <Link href="/seo-pack" className="hover:text-foreground transition-colors">
                      SEO Pack
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog" className="hover:text-foreground transition-colors">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link href="/orbit" className="hover:text-foreground transition-colors">
                      Orbit Growth
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Developers</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link href="/docs" className="hover:text-foreground transition-colors">
                      Documentation
                    </Link>
                  </li>
                  <li>
                    <Link href="/docs" className="hover:text-foreground transition-colors">
                      API Reference
                    </Link>
                  </li>
                  <li>
                    <Link href="/docs" className="hover:text-foreground transition-colors">
                      SDK
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link href="/about" className="hover:text-foreground transition-colors">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="hover:text-foreground transition-colors">
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
              <p>2026 Svivva. All rights reserved.</p>
              <div className="flex items-center gap-6">
                {userIsAdmin && (
                  <Link href="/dashboard/traffic">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 border-[#5BA8A0]/40 text-[#5BA8A0] hover:bg-[#5BA8A0]/10"
                      data-testid="button-homepage-traffic"
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                      Traffic & Analytics
                    </Button>
                  </Link>
                )}
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy
                </Link>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Terms
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
