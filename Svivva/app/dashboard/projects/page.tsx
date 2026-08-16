"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  Plus,
  FolderOpen,
  MoreVertical,
  Play,
  Settings,
  Trash2,
  GitBranch,
  CheckCircle2,
  Clock,
  Rocket,
  ExternalLink,
  Share2,
  Copy,
  Check,
  Zap,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  createdAt: string;
}

function DeployButton({ project }: { project: Project }) {
  const [deploying, setDeploying] = useState(false);
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleDeploy = async () => {
    setDeploying(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/deploy`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setLiveUrl(data.liveUrl);
        setCardUrl(data.cardUrl);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeploying(false);
    }
  };

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (liveUrl) {
    return (
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 animate-pulse" />
          <span className="text-[11px] text-green-400 font-medium flex-1 truncate">{liveUrl}</span>
          <button
            onClick={() => copyUrl(liveUrl)}
            className="flex-shrink-0 text-green-400 hover:text-green-300"
            data-testid={`button-copy-live-url-${project.id}`}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
        <div className="flex gap-1.5">
          <Link href={cardUrl!} target="_blank" className="flex-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1 text-[11px] border-[#5BA8A0]/30 text-[#5BA8A0] hover:bg-[#5BA8A0]/10"
              data-testid={`button-view-card-${project.id}`}
            >
              <Share2 className="w-3 h-3" /> API Card
            </Button>
          </Link>
          <Link href={cardUrl!} target="_blank" className="flex-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1 text-[11px]"
              data-testid={`button-open-live-${project.id}`}
            >
              <ExternalLink className="w-3 h-3" /> Open
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      className="mt-3 w-full gap-1.5 bg-gradient-to-r from-[#5BA8A0] to-[#6B2C4A] text-white text-[11px] hover:opacity-90"
      onClick={handleDeploy}
      disabled={deploying}
      data-testid={`button-deploy-${project.id}`}
    >
      {deploying ? (
        <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
      ) : (
        <Rocket className="w-3 h-3" />
      )}
      {deploying ? "Deploying…" : project.status === "deployed" ? "Re-deploy" : "Deploy"}
    </Button>
  );
}

export default function ProjectsPage() {
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-60" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const projectList = projects || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage your projects</p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button
            className="bg-[#7BA3AC] hover:bg-[#6B939C] gap-2"
            data-testid="button-new-project"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </Link>
      </div>

      {projectList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-4">Create your first project to get started</p>
            <Link href="/dashboard/projects/new">
              <Button
                className="bg-[#7BA3AC] hover:bg-[#6B939C] gap-2"
                data-testid="button-create-first-project"
              >
                <Plus className="w-4 h-4" />
                Create Project
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projectList.map((project) => (
            <Card
              key={project.id}
              className="hover-elevate"
              data-testid={`card-project-${project.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      <Link href={`/dashboard/projects/${project.id}`} className="hover:underline">
                        {project.name}
                      </Link>
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description || "No description"}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`button-project-menu-${project.id}`}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/projects/${project.id}`}>
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/projects/${project.id}/evals`}>
                          <Play className="w-4 h-4 mr-2" />
                          Run Evals
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/projects/${project.id}/versions`}>
                          <GitBranch className="w-4 h-4 mr-2" />
                          Versions
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/api-card/${project.id}`} target="_blank">
                          <Share2 className="w-4 h-4 mr-2" />
                          Share API Card
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant={project.status === "deployed" ? "default" : "secondary"}>
                    {project.status === "deployed" ? (
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                    ) : (
                      <Clock className="w-3 h-3 mr-1" />
                    )}
                    {project.status}
                  </Badge>
                  {project.status === "deployed" && (
                    <Link href={`/api-card/${project.id}`} target="_blank">
                      <Badge
                        variant="outline"
                        className="gap-1 cursor-pointer hover:bg-muted border-[#5BA8A0]/40 text-[#5BA8A0]"
                      >
                        <Share2 className="w-3 h-3" /> API Card
                      </Badge>
                    </Link>
                  )}
                  <Link href={`/dashboard/projects/${project.id}/apex`}>
                    <Badge
                      variant="outline"
                      className="gap-1 cursor-pointer hover:bg-muted border-purple-500/40 text-purple-400"
                    >
                      <Zap className="w-3 h-3" /> APEX
                    </Badge>
                  </Link>
                </div>
                <DeployButton project={project} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
