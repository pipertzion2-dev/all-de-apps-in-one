"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { loadStripe, Stripe as StripeType } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { authFetch } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Check,
  Shield,
  Lock,
  CreditCard,
  ArrowLeft,
  Sparkles,
  Zap,
  Building2,
  Star,
  Infinity,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import svivvaLogo from "@/attached_assets/SVIVVA_OFFICIAL_LOGO_1769201341308.png";

const plans: Record<string, {
  name: string;
  price: string;
  period: string;
  icon: typeof Sparkles;
  features: string[];
  color: string;
  glow: string;
  badge: string;
}> = {
  pro: {
    name: "Pro",
    price: "$49",
    period: "/month",
    icon: Zap,
    features: [
      "10 projects",
      "10,000 API calls/month",
      "Full eval suite with auto-rollback",
      "Priority support",
      "Custom training data",
      "Version history",
    ],
    color: "#5BA8A0",
    glow: "rgba(91,168,160,0.25)",
    badge: "Most Popular",
  },
  enterprise: {
    name: "Enterprise",
    price: "$299",
    period: "/month",
    icon: Building2,
    features: [
      "Unlimited projects",
      "Unlimited API calls",
      "SLA guarantee",
      "Dedicated support",
      "Custom integrations",
      "On-premise option",
    ],
    color: "#6B2C4A",
    glow: "rgba(107,44,74,0.3)",
    badge: "Full Power",
  },
};

function CheckoutForm({ tier, onSuccess }: { tier: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError(null);
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || "Validation failed");
      setProcessing(false);
      return;
    }
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/dashboard/billing?success=true` },
    });
    if (confirmError) {
      setError(confirmError.message || "Payment failed");
      setProcessing(false);
    } else {
      onSuccess();
    }
  };

  const plan = plans[tier] || plans.pro;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" data-testid="form-checkout">
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${plan.color}30`, background: "rgba(0,0,0,0.3)" }}>
        <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ borderColor: `${plan.color}20`, background: `${plan.color}08` }}>
          <CreditCard className="w-4 h-4" style={{ color: plan.color }} />
          <span className="text-sm font-medium">Payment Details</span>
          <div className="ml-auto flex items-center gap-1.5">
            {["visa", "mc", "amex"].map((c) => (
              <div key={c} className="w-8 h-5 rounded bg-white/10 border border-white/10 flex items-center justify-center">
                <div className="w-4 h-2.5 rounded-sm bg-white/30" />
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 min-h-[200px]">
          <PaymentElement
            onReady={() => setReady(true)}
            options={{ layout: "tabs", defaultValues: { billingDetails: { name: "", email: "" } } }}
          />
          {!ready && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: plan.color }} />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400" data-testid="text-checkout-error">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || !elements || processing || !ready}
        className="w-full h-13 text-base font-bold gap-2 rounded-2xl relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`, boxShadow: `0 4px 24px ${plan.glow}` }}
        data-testid="button-confirm-payment"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
        {processing ? (
          <><Loader2 className="w-5 h-5 animate-spin" />Processing...</>
        ) : (
          <><Lock className="w-4 h-4" />Subscribe — {plan.price}{plan.period}</>
        )}
      </Button>

      <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground/60">
        <span className="flex items-center gap-1"><Shield className="w-3 h-3" />256-bit SSL</span>
        <span>·</span>
        <span>Cancel anytime</span>
        <span>·</span>
        <span>Powered by Stripe</span>
      </div>
    </form>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tierParam = searchParams.get("tier") || "pro";
  const priceIdParam = searchParams.get("priceId") || "";

  const [stripePromise, setStripePromise] = useState<Promise<StripeType | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const plan = plans[tierParam] || plans.pro;
  const PlanIcon = plan.icon;

  useEffect(() => {
    fetch("/api/stripe/publishable-key")
      .then((r) => r.json())
      .then((data) => { if (data.publishableKey) setStripePromise(loadStripe(data.publishableKey)); else setError("Payment system unavailable"); })
      .catch(() => setError("Failed to load payment configuration"));
  }, []);

  useEffect(() => {
    if (!priceIdParam) { setLoading(false); return; }
    authFetch("/api/stripe/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId: priceIdParam, tier: tierParam }),
    })
      .then((r) => r.json())
      .then((data) => { if (data.clientSecret) setClientSecret(data.clientSecret); else setError(data.error || "Failed to initialize payment"); })
      .catch(() => setError("Failed to initialize payment"))
      .finally(() => setLoading(false));
  }, [priceIdParam, tierParam]);

  const showDemoMode = !priceIdParam;

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(91,168,160,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(107,44,74,0.1) 0%, transparent 60%), hsl(var(--background))" }}>

      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: `radial-gradient(circle, ${plan.color}, transparent 70%)` }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-15 blur-3xl" style={{ background: `radial-gradient(circle, ${plan.color}, transparent 70%)` }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl" style={{ background: `radial-gradient(circle, ${plan.color}, transparent 70%)` }} />
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: 4 + (i % 3) * 3,
              height: 4 + (i % 3) * 3,
              background: plan.color,
              left: `${15 + i * 14}%`,
              top: `${20 + (i % 3) * 20}%`,
              animation: `floatY ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8" data-testid="page-checkout">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/dashboard/billing" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-back-billing">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <Image src={svivvaLogo} alt="Svivva" width={90} height={30} className="h-7 w-auto object-contain opacity-80" />
          <Badge variant="outline" className="text-xs gap-1" style={{ borderColor: `${plan.color}40`, color: plan.color }}>
            <Shield className="w-3 h-3" />
            Secure Checkout
          </Badge>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr,400px]">

          {/* Left — Payment form */}
          <div className="order-2 lg:order-1">
            <div className="rounded-3xl overflow-hidden" style={{ border: `1px solid ${plan.color}20`, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(20px)", boxShadow: `0 0 60px ${plan.glow}, 0 20px 60px rgba(0,0,0,0.4)` }}>

              {/* Card header bar */}
              <div className="h-1 w-full" style={{ background: `linear-gradient(to right, ${plan.color}, ${plan.color}60, transparent)` }} />

              <div className="p-6 md:p-8">
                <div className="mb-6">
                  <h1 className="text-xl font-bold">Complete your order</h1>
                  <p className="text-sm text-muted-foreground mt-1">You're upgrading to <span style={{ color: plan.color }} className="font-medium">{plan.name}</span> — cancel anytime.</p>
                </div>

                {showDemoMode ? (
                  <div className="space-y-5">
                    <div className="rounded-2xl p-4" style={{ border: `1px solid ${plan.color}25`, background: `${plan.color}08` }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Sparkles className="w-4 h-4" style={{ color: plan.color }} />
                        <p className="font-semibold text-sm">Preview Mode</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Click Upgrade from the billing page to activate the live payment form.</p>
                    </div>
                    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${plan.color}20`, background: "rgba(0,0,0,0.2)" }}>
                      <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ borderColor: `${plan.color}15` }}>
                        <CreditCard className="w-4 h-4" style={{ color: plan.color }} />
                        <span className="text-sm font-medium">Payment Details</span>
                      </div>
                      <div className="p-4 space-y-4 opacity-50">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Card number</label>
                          <div className="h-11 rounded-xl border border-border bg-muted/20 flex items-center px-3">
                            <span className="text-sm text-muted-foreground/50">4242 4242 4242 4242</span>
                            <div className="ml-auto flex gap-1.5">
                              <div className="w-8 h-5 rounded bg-muted border border-border/30" />
                              <div className="w-8 h-5 rounded bg-muted border border-border/30" />
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Expiry</label>
                            <div className="h-11 rounded-xl border border-border bg-muted/20 flex items-center px-3">
                              <span className="text-sm text-muted-foreground/50">MM / YY</span>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">CVC</label>
                            <div className="h-11 rounded-xl border border-border bg-muted/20 flex items-center px-3">
                              <span className="text-sm text-muted-foreground/50">···</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button disabled className="w-full h-12 rounded-2xl font-bold gap-2 opacity-50" style={{ background: plan.color }} data-testid="button-confirm-payment-preview">
                      <Lock className="w-4 h-4" />
                      Subscribe — {plan.price}{plan.period}
                    </Button>
                    <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground/50">
                      <span className="flex items-center gap-1"><Shield className="w-3 h-3" />256-bit SSL</span>
                      <span>·</span><span>Cancel anytime</span>
                      <span>·</span><span>Powered by Stripe</span>
                    </div>
                  </div>
                ) : loading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${plan.color}15`, border: `1px solid ${plan.color}30` }}>
                      <Loader2 className="w-6 h-6 animate-spin" style={{ color: plan.color }} />
                    </div>
                    <p className="text-sm text-muted-foreground">Preparing secure payment…</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-12 space-y-4">
                    <p className="text-red-400 text-sm">{error}</p>
                    <Link href="/dashboard/billing">
                      <Button variant="outline" data-testid="button-back-billing-error">Return to Billing</Button>
                    </Link>
                  </div>
                ) : clientSecret && stripePromise ? (
                  <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "night", variables: { colorPrimary: plan.color, colorBackground: "hsl(240 10% 6%)", colorText: "hsl(0 0% 95%)", colorTextSecondary: "hsl(240 5% 55%)", colorDanger: "#ef4444", fontFamily: "system-ui, -apple-system, sans-serif", borderRadius: "14px", spacingUnit: "4px", fontSizeBase: "14px" }, rules: { ".Input": { border: `1px solid rgba(255,255,255,0.08)`, backgroundColor: "hsl(240 10% 8%)", padding: "12px", boxShadow: "none" }, ".Input:focus": { border: `1px solid ${plan.color}`, boxShadow: `0 0 0 3px ${plan.color}20` }, ".Label": { color: "hsl(240 5% 50%)", fontSize: "12px", fontWeight: "500", letterSpacing: "0.04em", textTransform: "uppercase" }, ".Tab": { border: `1px solid rgba(255,255,255,0.08)`, backgroundColor: "hsl(240 10% 8%)" }, ".Tab--selected": { border: `1px solid ${plan.color}50`, backgroundColor: `${plan.color}12` } } } }}>
                    <CheckoutForm tier={tierParam} onSuccess={() => router.push("/dashboard/billing?success=true")} />
                  </Elements>
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <p className="text-muted-foreground text-sm">Unable to load payment form</p>
                    <Link href="/dashboard/billing"><Button variant="outline">Return to Billing</Button></Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right — Plan summary */}
          <div className="order-1 lg:order-2">
            <div className="lg:sticky lg:top-8 space-y-4">

              {/* Main plan card */}
              <div className="rounded-3xl overflow-hidden relative" style={{ border: `1px solid ${plan.color}30`, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(20px)", boxShadow: `0 0 40px ${plan.glow}` }}>
                <div className="h-px w-full" style={{ background: `linear-gradient(to right, transparent, ${plan.color}, transparent)` }} />

                {/* Plan hero */}
                <div className="p-6 relative">
                  <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(ellipse at top right, ${plan.color}30, transparent 70%)` }} />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${plan.color}20`, border: `1px solid ${plan.color}40` }}>
                        <PlanIcon className="w-6 h-6" style={{ color: plan.color }} />
                      </div>
                      <Badge className="text-xs font-semibold" style={{ background: `${plan.color}20`, color: plan.color, border: `1px solid ${plan.color}40` }}>
                        {plan.badge}
                      </Badge>
                    </div>

                    <h2 className="text-lg font-bold mb-1">{plan.name} Plan</h2>

                    {/* Price with holographic shimmer */}
                    <div className="flex items-baseline gap-1 mb-5">
                      <span className="text-5xl font-black" style={{ background: `linear-gradient(135deg, #fff 30%, ${plan.color}, #fff 70%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                        {plan.price}
                      </span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>

                    {/* Features */}
                    <div className="space-y-2.5">
                      {plan.features.map((f) => (
                        <div key={f} className="flex items-center gap-2.5">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: `${plan.color}20`, border: `1px solid ${plan.color}40` }}>
                            <Check className="w-3 h-3" style={{ color: plan.color }} />
                          </div>
                          <span className="text-sm text-muted-foreground">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="h-px mx-6" style={{ background: `linear-gradient(to right, transparent, ${plan.color}30, transparent)` }} />

                {/* Billing summary */}
                <div className="p-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{plan.name} plan</span>
                    <span className="font-medium">{plan.price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Billing</span>
                    <span className="font-medium">Monthly</span>
                  </div>
                  <div className="h-px" style={{ background: `${plan.color}20` }} />
                  <div className="flex justify-between font-bold">
                    <span>Total today</span>
                    <span style={{ color: plan.color }}>{plan.price}</span>
                  </div>
                </div>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Shield, label: "SSL Secure" },
                  { icon: Star, label: "Cancel anytime" },
                  { icon: Infinity, label: "Instant access" },
                ].map((b) => (
                  <div key={b.label} className="rounded-2xl p-3 text-center" style={{ border: `1px solid ${plan.color}15`, background: `${plan.color}05` }}>
                    <b.icon className="w-4 h-4 mx-auto mb-1" style={{ color: plan.color }} />
                    <p className="text-[10px] text-muted-foreground leading-tight">{b.label}</p>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes floatY {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}
