"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { ApiCreatorPanel } from "@/components/api-creator-panel";
import { trackAppCreation } from "@/lib/analytics";

export default function NewProjectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const createProject = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      prompt: string;
      branding?: {
        name: string;
        icon: string;
        palette: { primary: string; secondary: string; accent: string };
      };
    }) => {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create project");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      trackAppCreation(data.name);
      toast({
        title: "Project created",
        description: "Your endpoint is ready to use",
      });
      router.push(`/dashboard/projects/${data.id}`);
    },
    onError: (error: Error) => {
      setIsCreating(false);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleComplete = (data: {
    prompt: string;
    name: string;
    icon: string;
    palette: { primary: string; secondary: string; accent: string };
  }) => {
    setIsCreating(true);
    createProject.mutate({
      name: data.name,
      description: `API created with ${data.icon} icon`,
      prompt: data.prompt,
      branding: {
        name: data.name,
        icon: data.icon,
        palette: data.palette,
      },
    });
  };

  if (isCreating) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-[#5BA8A0]" />
          <p className="text-lg text-muted-foreground">Creating your API...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/projects">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create New API</h1>
          <p className="text-muted-foreground text-sm">Interact to define your API</p>
        </div>
      </div>

      <ApiCreatorPanel onComplete={handleComplete} />
    </div>
  );
}
