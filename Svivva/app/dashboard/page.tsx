"use client";

import { useAuth, authFetch } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { usePlatform } from "@/lib/platform-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  FolderOpen,
  Plus,
  Package,
  Box,
  Lightbulb,
  Sparkles,
  FlaskConical,
  HeartPulse,
  Users,
  BarChart2,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  createdAt: string;
}

function FloatingShape({
  shape,
  color,
  size,
  delay,
  duration,
  className,
}: {
  shape: "cube" | "sphere" | "ring" | "pyramid";
  color: string;
  size: number;
  delay: number;
  duration: number;
  className?: string;
}) {
  const baseStyle = {
    width: size,
    height: size,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  };

  if (shape === "cube") {
    return (
      <div
        className={`absolute ${className}`}
        style={{
          ...baseStyle,
          animation: `floatY ${duration}s ease-in-out infinite`,
          animationDelay: `${delay}s`,
        }}
      >
        <div
          className="w-full h-full relative"
          style={{
            transformStyle: "preserve-3d",
            animation: `spin3d ${duration}s linear infinite`,
            animationDelay: `${delay}s`,
          }}
        >
          <div
            className="absolute inset-0 rounded-md border"
            style={
              {
                background: `${color}15`,
                borderColor: `${color}40`,
                transform: "translateZ(calc(var(--s)/2))",
                "--s": `${size}px`,
              } as React.CSSProperties
            }
          />
          <div
            className="absolute inset-0 rounded-md border"
            style={
              {
                background: `${color}10`,
                borderColor: `${color}30`,
                transform: "rotateY(90deg) translateZ(calc(var(--s)/2))",
                "--s": `${size}px`,
              } as React.CSSProperties
            }
          />
          <div
            className="absolute inset-0 rounded-md border"
            style={
              {
                background: `${color}08`,
                borderColor: `${color}20`,
                transform: "rotateX(90deg) translateZ(calc(var(--s)/2))",
                "--s": `${size}px`,
              } as React.CSSProperties
            }
          />
        </div>
      </div>
    );
  }

  if (shape === "sphere") {
    return (
      <div
        className={`absolute rounded-full border ${className}`}
        style={{
          ...baseStyle,
          background: `radial-gradient(circle at 30% 30%, ${color}30, ${color}08)`,
          borderColor: `${color}30`,
          animation: `floatY ${duration}s ease-in-out infinite`,
          animationDelay: `${delay}s`,
        }}
      />
    );
  }

  if (shape === "ring") {
    return (
      <div
        className={`absolute rounded-full border-2 ${className}`}
        style={{
          ...baseStyle,
          borderColor: `${color}35`,
          background: "transparent",
          animation: `spin2d ${duration}s linear infinite`,
          animationDelay: `${delay}s`,
        }}
      />
    );
  }

  return (
    <div
      className={`absolute ${className}`}
      style={{
        ...baseStyle,
        animation: `floatY ${duration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: `${size / 2}px solid transparent`,
          borderRight: `${size / 2}px solid transparent`,
          borderBottom: `${size}px solid ${color}20`,
        }}
      />
    </div>
  );
}

function VisualCard({
  href,
  title,
  subtitle,
  icon: Icon,
  color,
  shapes,
  testId,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: typeof Package;
  color: string;
  shapes: {
    shape: "cube" | "sphere" | "ring" | "pyramid";
    size: number;
    x: string;
    y: string;
    delay: number;
    duration: number;
  }[];
  testId: string;
}) {
  return (
    <Link href={href}>
      <Card
        className="group h-full cursor-pointer border-border/40 hover:border-foreground/15 transition-all duration-300 overflow-hidden relative"
        data-testid={testId}
      >
        <CardContent className="p-0">
          <div
            className="relative h-24 sm:h-32 overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${color}08, ${color}03)` }}
          >
            {shapes.map((s, i) => (
              <FloatingShape
                key={i}
                shape={s.shape}
                color={color}
                size={s.size}
                delay={s.delay}
                duration={s.duration}
                className={`${s.x} ${s.y}`}
              />
            ))}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-sm transition-transform duration-300 group-hover:scale-110"
                style={{ background: `${color}15`, border: `1px solid ${color}25` }}
              >
                <Icon className="w-5 h-5 sm:w-7 sm:h-7" style={{ color }} />
              </div>
            </div>
          </div>
          <div className="px-3 py-3 sm:px-5 sm:py-4">
            <h3 className="font-semibold text-xs sm:text-sm">{title}</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2">
              {subtitle}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function NewUserWelcome({ onModeSet }: { onModeSet: (m: "digital" | "physical") => void }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] sm:min-h-[70vh]">
      <div className="max-w-2xl w-full text-center space-y-8 sm:space-y-10 px-4">
        <div className="space-y-3">
          <h1
            className="text-2xl sm:text-4xl font-bold tracking-tight"
            data-testid="text-welcome-title"
          >
            What have you been sitting on?
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto">
            You might not know what it looks like yet. That&apos;s the point.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 max-w-lg mx-auto">
          <Link href="/dashboard/api-builder" onClick={() => onModeSet("digital")}>
            <Card
              className="h-full cursor-pointer border-border/40 hover:border-[#5BA8A0]/40 transition-all duration-300 group overflow-hidden"
              data-testid="card-choose-software"
            >
              <CardContent className="p-0">
                <div
                  className="relative h-28 overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #5BA8A008, #5BA8A003)" }}
                >
                  <FloatingShape
                    shape="cube"
                    color="#5BA8A0"
                    size={28}
                    delay={0}
                    duration={8}
                    className="top-4 left-6"
                  />
                  <FloatingShape
                    shape="sphere"
                    color="#5BA8A0"
                    size={18}
                    delay={1}
                    duration={5}
                    className="bottom-6 right-8"
                  />
                  <FloatingShape
                    shape="ring"
                    color="#5BA8A0"
                    size={22}
                    delay={0.5}
                    duration={6}
                    className="top-8 right-12"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-xl bg-[#5BA8A0]/10 border border-[#5BA8A0]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Package className="w-6 h-6 text-[#5BA8A0]" />
                    </div>
                  </div>
                </div>
                <div className="px-5 py-4 text-center">
                  <h3 className="font-semibold">Software</h3>
                  <p className="text-xs text-muted-foreground mt-1">Digital. Deploys and scales.</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/hardware-builder" onClick={() => onModeSet("physical")}>
            <Card
              className="h-full cursor-pointer border-border/40 hover:border-[#6B2C4A]/40 transition-all duration-300 group overflow-hidden"
              data-testid="card-choose-hardware"
            >
              <CardContent className="p-0">
                <div
                  className="relative h-28 overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #6B2C4A08, #6B2C4A03)" }}
                >
                  <FloatingShape
                    shape="pyramid"
                    color="#6B2C4A"
                    size={24}
                    delay={0.3}
                    duration={7}
                    className="top-6 left-8"
                  />
                  <FloatingShape
                    shape="cube"
                    color="#6B2C4A"
                    size={20}
                    delay={0}
                    duration={9}
                    className="bottom-4 right-6"
                  />
                  <FloatingShape
                    shape="sphere"
                    color="#6B2C4A"
                    size={16}
                    delay={1.5}
                    duration={5}
                    className="top-3 right-10"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-xl bg-[#6B2C4A]/10 border border-[#6B2C4A]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Box className="w-6 h-6 text-[#6B2C4A]" />
                    </div>
                  </div>
                </div>
                <div className="px-5 py-4 text-center">
                  <h3 className="font-semibold">Hardware</h3>
                  <p className="text-xs text-muted-foreground mt-1">Physical. Ships and sells.</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="pt-2">
          <Link href="/dashboard/idea-engine">
            <Button
              variant="ghost"
              className="text-muted-foreground gap-2 text-sm"
              data-testid="button-explore-ideas"
            >
              <Lightbulb className="w-4 h-4" />
              Browse around first
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ReturningUserDashboard({
  user,
  mode,
  projects,
  isLoading,
  isAdmin,
}: {
  user: { firstName?: string | null } | null;
  mode: string;
  projects: Project[];
  isLoading: boolean;
  isAdmin?: boolean;
}) {
  const primaryColor = mode === "digital" ? "#5BA8A0" : "#6B2C4A";
  const builderHref = mode === "digital" ? "/dashboard/api-builder" : "/dashboard/hardware-builder";
  const builderLabel = mode === "digital" ? "New API" : "New Product";

  const digitalCards = [
    {
      href: "/dashboard/api-builder",
      title: "API Builder",
      subtitle: "Describe what you need, AI builds it",
      icon: Package,
      color: "#5BA8A0",
      shapes: [
        { shape: "cube" as const, size: 24, x: "left-4", y: "top-3", delay: 0, duration: 8 },
        { shape: "sphere" as const, size: 14, x: "right-6", y: "bottom-4", delay: 1, duration: 5 },
        { shape: "ring" as const, size: 18, x: "right-14", y: "top-6", delay: 0.5, duration: 6 },
      ],
    },
    {
      href: "/dashboard/hypothesis",
      title: "Hypothesis Lab",
      subtitle: "Test relationships between your APIs",
      icon: FlaskConical,
      color: "#7C3AED",
      shapes: [
        { shape: "sphere" as const, size: 20, x: "left-6", y: "top-4", delay: 0.3, duration: 6 },
        { shape: "cube" as const, size: 16, x: "right-8", y: "top-8", delay: 0, duration: 9 },
        {
          shape: "pyramid" as const,
          size: 18,
          x: "left-16",
          y: "bottom-3",
          delay: 1.2,
          duration: 7,
        },
      ],
    },
    {
      href: "/dashboard/idea-engine",
      title: "Idea Engine",
      subtitle: "AI finds untapped opportunities for you",
      icon: Lightbulb,
      color: "#F59E0B",
      shapes: [
        { shape: "sphere" as const, size: 22, x: "right-4", y: "top-3", delay: 0, duration: 5 },
        { shape: "ring" as const, size: 16, x: "left-8", y: "bottom-5", delay: 0.8, duration: 7 },
        { shape: "pyramid" as const, size: 14, x: "left-4", y: "top-8", delay: 1.5, duration: 6 },
      ],
    },
    {
      href: "/dashboard/launch-studio",
      title: "Launch Studio",
      subtitle: "Marketing and launch tools for your app",
      icon: Sparkles,
      color: "#EC4899",
      shapes: [
        { shape: "ring" as const, size: 20, x: "left-6", y: "top-5", delay: 0, duration: 6 },
        {
          shape: "sphere" as const,
          size: 12,
          x: "right-10",
          y: "bottom-6",
          delay: 0.5,
          duration: 5,
        },
        { shape: "cube" as const, size: 14, x: "right-4", y: "top-4", delay: 1, duration: 8 },
      ],
    },
    {
      href: "/dashboard/pulse",
      title: "Pulse",
      subtitle: "Automated intelligence about your account",
      icon: HeartPulse,
      color: "#EF4444",
      shapes: [
        { shape: "sphere" as const, size: 18, x: "left-4", y: "top-4", delay: 0, duration: 4 },
        { shape: "sphere" as const, size: 12, x: "right-6", y: "top-8", delay: 0.5, duration: 3 },
        { shape: "ring" as const, size: 20, x: "right-12", y: "bottom-3", delay: 1, duration: 5 },
      ],
    },
    {
      href: "/dashboard/collaborate",
      title: "Collaborate",
      subtitle: "Work with your team in real time",
      icon: Users,
      color: "#06B6D4",
      shapes: [
        { shape: "sphere" as const, size: 16, x: "left-6", y: "top-3", delay: 0, duration: 5 },
        { shape: "sphere" as const, size: 12, x: "right-4", y: "top-6", delay: 0.7, duration: 4 },
        { shape: "cube" as const, size: 14, x: "left-12", y: "bottom-4", delay: 1.2, duration: 7 },
      ],
    },
  ];

  const physicalCards = [
    {
      href: "/dashboard/hardware-builder",
      title: "Hardware Builder",
      subtitle: "Design a physical product with AI",
      icon: Box,
      color: "#6B2C4A",
      shapes: [
        { shape: "cube" as const, size: 26, x: "left-4", y: "top-3", delay: 0, duration: 9 },
        {
          shape: "pyramid" as const,
          size: 16,
          x: "right-8",
          y: "bottom-5",
          delay: 0.5,
          duration: 7,
        },
        { shape: "sphere" as const, size: 14, x: "right-4", y: "top-6", delay: 1, duration: 5 },
      ],
    },
    {
      href: "/dashboard/hypothesis-hardware",
      title: "Hypothesis Lab",
      subtitle: "Discover hardware innovations with AI",
      icon: FlaskConical,
      color: "#EA580C",
      shapes: [
        { shape: "sphere" as const, size: 20, x: "left-6", y: "top-4", delay: 0.3, duration: 6 },
        { shape: "cube" as const, size: 16, x: "right-8", y: "top-8", delay: 0, duration: 9 },
        { shape: "ring" as const, size: 18, x: "left-14", y: "bottom-3", delay: 1.2, duration: 7 },
      ],
    },
    {
      href: "/dashboard/idea-engine",
      title: "Idea Engine",
      subtitle: "Find untapped product opportunities",
      icon: Lightbulb,
      color: "#F59E0B",
      shapes: [
        { shape: "sphere" as const, size: 22, x: "right-4", y: "top-3", delay: 0, duration: 5 },
        { shape: "ring" as const, size: 16, x: "left-8", y: "bottom-5", delay: 0.8, duration: 7 },
        { shape: "pyramid" as const, size: 14, x: "left-4", y: "top-8", delay: 1.5, duration: 6 },
      ],
    },
    {
      href: "/dashboard/collaborate",
      title: "Collaborate",
      subtitle: "Work with your team in real time",
      icon: Users,
      color: "#06B6D4",
      shapes: [
        { shape: "sphere" as const, size: 16, x: "left-6", y: "top-3", delay: 0, duration: 5 },
        { shape: "sphere" as const, size: 12, x: "right-4", y: "top-6", delay: 0.7, duration: 4 },
        { shape: "cube" as const, size: 14, x: "left-12", y: "bottom-4", delay: 1.2, duration: 7 },
      ],
    },
  ];

  const cards = mode === "digital" ? digitalCards : physicalCards;

  return (
    <div className="space-y-8 sm:space-y-10 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold" data-testid="text-dashboard-title">
            {user?.firstName ? `Welcome back, ${user.firstName}` : "Welcome back"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">What are you working on today?</p>
        </div>
        <Link href={builderHref} className="w-full sm:w-auto">
          <Button
            className="gap-2 shrink-0 w-full sm:w-auto"
            style={{ background: primaryColor }}
            data-testid="button-new-project"
          >
            <Plus className="w-4 h-4" />
            {builderLabel}
          </Button>
        </Link>
      </div>

      <div>
        <h2 className="text-xs font-medium text-muted-foreground/50 uppercase tracking-widest mb-4">
          Tools
        </h2>
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <VisualCard
              key={c.href}
              {...c}
              testId={`card-tool-${c.title.toLowerCase().replace(/\s+/g, "-")}`}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-medium text-muted-foreground/50 uppercase tracking-widest">
            Recent Projects
          </h2>
          {projects.length > 0 && (
            <Link
              href="/dashboard/projects"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-view-all-projects"
            >
              View all
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-5 pb-5">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card className="border-dashed border-border/30">
            <CardContent className="py-10 text-center">
              <FolderOpen className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No projects yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Use the tools above to create your first one
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                <Card
                  className="h-full cursor-pointer border-border/30 hover:border-foreground/15 transition-colors"
                  data-testid={`card-project-${project.id}`}
                >
                  <CardContent className="pt-4 pb-4 px-5">
                    <h3 className="font-medium text-sm truncate">{project.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {project.description || "No description"}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="pt-2 border-t border-border/20">
          <Link href="/dashboard/traffic">
            <Button
              variant="outline"
              className="gap-2 w-full sm:w-auto"
              data-testid="button-traffic-analytics"
            >
              <BarChart2 className="h-4 w-4 text-teal-500" />
              View Traffic & Analytics
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const { mode, setMode } = usePlatform();

  const { data: meData } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/auth/me"],
    queryFn: () => authFetch("/api/auth/me").then((r) => r.json()),
    enabled: isAuthenticated,
  });
  const userIsAdmin = meData?.isAdmin ?? false;

  const {
    data: projectsData,
    isLoading: projectsLoading,
    isError,
  } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const res = await authFetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });

  const allProjects: Project[] = Array.isArray(projectsData)
    ? projectsData
    : projectsData?.projects || [];
  const recentProjects = allProjects.slice(0, 6);
  const isNewUser = !projectsLoading && !isError && allProjects.length === 0;

  if (projectsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="space-y-3 text-center">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    );
  }

  if (isNewUser) {
    return <NewUserWelcome onModeSet={(m) => setMode(m)} />;
  }

  return (
    <ReturningUserDashboard
      user={user ?? null}
      mode={mode}
      projects={recentProjects}
      isLoading={projectsLoading}
      isAdmin={userIsAdmin}
    />
  );
}
