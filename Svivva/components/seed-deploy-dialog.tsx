"use client";

import { useState } from "react";
import { authFetch } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Download,
  Rocket,
  Globe,
  ExternalLink,
  Loader2,
  CheckCircle,
  Copy,
  Terminal,
  Cloud,
  Zap,
} from "lucide-react";

interface SeedDeployDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seedId: string;
  appName: string;
  hasCode: boolean;
}

export function SeedDeployDialog({
  open,
  onOpenChange,
  seedId,
  appName,
  hasCode,
}: SeedDeployDialogProps) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const appSlug = appName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const handleDownloadZip = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      const res = await authFetch("/api/seeds/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Download failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${appSlug}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setDownloaded(true);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Download failed";
      setDownloadError(msg);
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setDownloaded(false);
      setDownloadError(null);
    }
    onOpenChange(next);
  };

  const copyCommand = (cmd: string, label: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCommand(label);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const deployTargets = [
    {
      name: "Vercel (recommended)",
      icon: Zap,
      color: "#000000",
      steps: [
        "Push your code to GitHub",
        "Open vercel.com/new → Import Git Repository",
        "Root directory: set to your app folder if this monorepo is not the Next root",
        "Add env vars from your old host, then Deploy",
      ],
      command: `cd ${appSlug} && npx vercel`,
      url: "https://vercel.com/new",
    },
    {
      name: "Replit (legacy)",
      icon: Cloud,
      color: "#F26207",
      steps: [
        "Open Replit → New Repl → Import from ZIP",
        "Upload the downloaded ZIP",
        "Click Run — your app is live on a .replit.app URL",
      ],
      command: null,
      url: "https://replit.com/new",
    },
    {
      name: "Railway",
      icon: Terminal,
      color: "#0B0D0E",
      steps: ["Install Railway CLI", "Unzip and deploy"],
      command: `cd ${appSlug} && npx @railway/cli up`,
      url: "https://railway.app/new",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #6B2C4A, #5BA8A0)",
              }}
            >
              <Rocket className="w-4 h-4 text-white" />
            </div>
            Deploy {appName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Download className="w-4 h-4 text-[#5BA8A0]" />
              Step 1: Download your project
            </div>
            <Button
              className="w-full gap-2 h-12 text-base"
              style={{
                background: hasCode ? "linear-gradient(135deg, #5BA8A0, #4A9890)" : undefined,
              }}
              disabled={!hasCode || downloading}
              onClick={handleDownloadZip}
              data-testid="button-deploy-download-zip"
            >
              {downloading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : downloaded ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              {downloading
                ? "Packaging..."
                : downloaded
                  ? "Downloaded — ready to deploy"
                  : `Download ${appSlug}.zip`}
            </Button>
            {!hasCode && (
              <p className="text-xs text-muted-foreground text-center">
                Build this seed first to generate deployable code.
              </p>
            )}
            {downloadError && (
              <p className="text-xs text-red-500 text-center" data-testid="text-deploy-error">
                {downloadError}
              </p>
            )}
          </div>

          <div className="h-px bg-border" />

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Globe className="w-4 h-4 text-[#6B2C4A]" />
              Step 2: Pick a platform & deploy
            </div>

            <div className="space-y-3">
              {deployTargets.map((target) => (
                <div
                  key={target.name}
                  className="rounded-xl border border-border p-4 space-y-3 hover:border-[#5BA8A0]/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${target.color}15` }}
                      >
                        <target.icon className="w-4 h-4" style={{ color: target.color }} />
                      </div>
                      <span className="font-semibold text-sm">{target.name}</span>
                    </div>
                    <a
                      href={target.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`link-deploy-${target.name.toLowerCase()}`}
                    >
                      <Badge
                        variant="outline"
                        className="gap-1 cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        Open
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Badge>
                    </a>
                  </div>

                  <ol className="text-xs text-muted-foreground space-y-1 pl-1">
                    {target.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#5BA8A0] font-bold flex-shrink-0">{i + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ol>

                  {target.command && (
                    <button
                      onClick={() => copyCommand(target.command!, target.name)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left group"
                      data-testid={`button-copy-deploy-${target.name.toLowerCase()}`}
                    >
                      <Terminal className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <code className="text-xs font-mono text-foreground flex-1 truncate">
                        {target.command}
                      </code>
                      {copiedCommand === target.name ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-border" />

          <div
            className="rounded-xl p-4 space-y-2"
            style={{ background: "linear-gradient(135deg, #6B2C4A08, #5BA8A008)" }}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <Rocket className="w-4 h-4 text-[#6B2C4A]" />
              Step 3: Connect to marketing
            </div>
            <p className="text-xs text-muted-foreground">
              Once deployed, use the Seeds Marketing Funnel to auto-generate SEO landing pages,
              comparison articles, and social content for your live app.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs mt-1"
              onClick={() => {
                onOpenChange(false);
                setTimeout(() => {
                  document
                    .getElementById("seeds-marketing")
                    ?.scrollIntoView({ behavior: "smooth" });
                }, 300);
              }}
              data-testid="button-deploy-open-marketing"
            >
              <Globe className="w-3.5 h-3.5" />
              Open Marketing Funnel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
