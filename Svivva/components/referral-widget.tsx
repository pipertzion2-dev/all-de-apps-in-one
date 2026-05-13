"use client";

import { useState, useEffect } from "react";
import { Copy, Gift, Users, TrendingUp, Share2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ReferralWidgetProps {
  userId?: string;
  compact?: boolean;
  variant?: "default" | "minimal" | "prominent";
}

export function ReferralWidget({
  userId,
  compact = false,
  variant = "default",
}: ReferralWidgetProps) {
  const [referralCode, setReferralCode] = useState("");
  const [referralUrl, setReferralUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ referrals: 0, earnings: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      const code = generateReferralCode(userId);
      setReferralCode(code);
      setReferralUrl(`https://svivva.com?ref=${code}`);
      fetchStats();
    }
  }, [userId]);

  const generateReferralCode = (uid: string): string => {
    const hash = btoa(uid.substring(0, 8)).substring(0, 8).toLowerCase();
    return hash;
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/referrals/track");
      if (res.ok) {
        const data = await res.json();
        setStats({
          referrals: data.referrals?.length || 0,
          earnings: data.totalEarnings || 0,
          pending: data.pendingCount || 0,
        });
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: `${label} copied!`, duration: 2000 });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Svivva - AI-Powered Development Platform",
          text: "Check out Svivva - build AI apps faster with our powerful platform. Use my referral link for bonuses!",
          url: referralUrl,
        });
      } catch {
        copyToClipboard(referralUrl, "Referral link");
      }
    } else {
      copyToClipboard(referralUrl, "Referral link");
    }
  };

  if (variant === "minimal") {
    return (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => copyToClipboard(referralUrl, "Referral link")}
          className="text-xs"
        >
          <Share2 className="w-3 h-3 mr-1" />
          {copied ? "Copied!" : "Share & Earn"}
        </Button>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="rounded-xl border border-[#5BA8A0]/30 bg-[#5BA8A0]/5 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4" style={{ color: "#5BA8A0" }} />
            <span className="text-xs font-bold">Referral Program</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Earn up to 10%</span>
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => copyToClipboard(referralUrl, "Link")}
            className="flex-1 text-xs"
          >
            <Copy className="w-3 h-3 mr-1" /> Copy Link
          </Button>
          <Button
            size="sm"
            onClick={shareLink}
            className="flex-1 text-xs"
            style={{ background: "#5BA8A0" }}
          >
            <Share2 className="w-3 h-3 mr-1" /> Share
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-[#5BA8A0]/40 bg-gradient-to-br from-[#5BA8A0]/5 to-[#6B2C4A]/5 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#5BA8A0]/15 border border-[#5BA8A0]/30 flex items-center justify-center">
          <Gift className="w-5 h-5" style={{ color: "#5BA8A0" }} />
        </div>
        <div>
          <h3 className="font-bold text-sm">Invite & Earn</h3>
          <p className="text-xs text-muted-foreground">Multi-level referral rewards</p>
        </div>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-background/50">
            <div className="text-lg font-black" style={{ color: "#5BA8A0" }}>
              {stats.referrals}
            </div>
            <div className="text-[10px] text-muted-foreground">Referrals</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/50">
            <div className="text-lg font-black" style={{ color: "#5BA8A0" }}>
              ${(stats.earnings / 100).toFixed(2)}
            </div>
            <div className="text-[10px] text-muted-foreground">Earned</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/50">
            <div className="text-lg font-black" style={{ color: "#5BA8A0" }}>
              ${(stats.pending / 100).toFixed(2)}
            </div>
            <div className="text-[10px] text-muted-foreground">Pending</div>
          </div>
        </div>
      )}

      {/* Compensation Tiers */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Level 1 (Direct)</span>
          <span className="font-bold" style={{ color: "#5BA8A0" }}>
            10%
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Level 2 (Indirect)</span>
          <span className="font-bold" style={{ color: "#5BA8A0" }}>
            5%
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Level 3 (Network)</span>
          <span className="font-bold" style={{ color: "#5BA8A0" }}>
            2%
          </span>
        </div>
      </div>

      {/* Referral Link */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={referralUrl}
            readOnly
            className="flex-1 text-xs bg-background border border-border rounded-lg px-3 py-2"
          />
          <Button size="sm" variant="outline" onClick={() => copyToClipboard(referralUrl, "Link")}>
            {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        <Button
          size="sm"
          onClick={shareLink}
          className="w-full font-bold"
          style={{ background: "#5BA8A0" }}
        >
          <Share2 className="w-4 h-4 mr-2" /> Share to Social Media
        </Button>
      </div>

      {/* Benefits */}
      <div className="space-y-1.5">
        <div className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-500" />
          <span className="text-[11px] text-muted-foreground">
            Earn commission on all subscription revenue
          </span>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-500" />
          <span className="text-[11px] text-muted-foreground">
            Multi-level earnings from your network
          </span>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-500" />
          <span className="text-[11px] text-muted-foreground">
            Instant signup bonuses for new users
          </span>
        </div>
      </div>
    </div>
  );
}
