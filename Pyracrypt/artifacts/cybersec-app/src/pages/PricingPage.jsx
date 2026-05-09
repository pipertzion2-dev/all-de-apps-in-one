import { useState, useEffect } from "react";
import { useLocation } from "wouter";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const PLANS = [
  {
    key: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    color: "#DCE5CA",
    deep: "#3a6030",
    features: [
      "1 scan per day",
      "Surface & simulate modes",
      "Basic threat report",
      "Community support",
    ],
    cta: "Start Free",
    highlight: false,
    priceId: null,
  },
  {
    key: "pro",
    name: "Pro",
    price: "$19",
    period: "/ month",
    color: "#6D91B3",
    deep: "#3e6a9a",
    features: [
      "Unlimited scans",
      "All 5 scan modes",
      "Full AI dashboard",
      "Auto-patch generation",
      "Compliance reports (NIST, SOC 2, OWASP)",
      "Priority support",
    ],
    cta: "Start Pro",
    highlight: true,
    priceId: "price_1TNZGzIJKuN7htOqcyCemvgX",
  },
  {
    key: "team",
    name: "Team",
    price: "$49",
    period: "/ month",
    color: "#AC81AF",
    deep: "#865a8a",
    features: [
      "Everything in Pro",
      "Up to 5 team seats",
      "Shared scan history",
      "API access",
      "Custom integrations",
      "Slack alerts",
    ],
    cta: "Start Team",
    highlight: false,
    priceId: "price_1TNZH0IJKuN7htOqfhXDYngc",
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: "$149",
    period: "/ month",
    color: "#D4A476",
    deep: "#a07040",
    features: [
      "Everything in Team",
      "Unlimited seats",
      "Dedicated AI model",
      "On-prem deployment option",
      "SLA guarantee",
      "White-label reports",
    ],
    cta: "Contact Us",
    highlight: false,
    priceId: "price_1TNZH0IJKuN7htOqE8YnAmdZ",
  },
];

export default function PricingPage() {
  const [, navigate] = useLocation();
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [email, setEmail] = useState("");
  const [toast, setToast] = useState(null);

  // Check for checkout return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "cancel") {
      setToast({ msg: "Checkout cancelled. No charge was made.", ok: false });
      window.history.replaceState(null, "", "/pricing");
    }
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function handleCheckout(plan) {
    if (plan.key === "free") {
      navigate("/lock");
      return;
    }
    if (plan.key === "enterprise") {
      navigate("/contact");
      return;
    }

    setCheckoutLoading(plan.key);
    try {
      const res = await fetch(`${API_BASE}/api/stripe/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: plan.priceId, email: email || undefined }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setToast({ msg: data.error || "Something went wrong. Try again.", ok: false });
      }
    } catch {
      setToast({ msg: "Network error. Please try again.", ok: false });
    }
    setCheckoutLoading(null);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(155deg, #E8EDF5 0%, #EEF2F8 55%, #E2E9F2 100%)",
        padding: "0 0 80px",
        position: "relative",
      }}
    >
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 80,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 999,
            padding: "12px 24px",
            borderRadius: 8,
            background: toast.ok ? "rgba(90,144,64,0.95)" : "rgba(180,80,60,0.95)",
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.05em",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Header nav */}
      <div
        style={{
          padding: "20px 32px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderBottom: "1px solid rgba(0,0,0,0.07)",
          background: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)",
        }}
      >
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "6px 16px",
            borderRadius: 20,
            cursor: "pointer",
            background: "transparent",
            border: "1px solid rgba(0,0,0,0.15)",
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#606870",
          }}
        >
          ← Home
        </button>
        <div style={{ flex: 1 }} />
        <div
          style={{
            fontSize: 8,
            fontWeight: 800,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#6D91B3",
          }}
        >
          Pyracrypt Pricing
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 20px 0" }}>
        {/* Hero text */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div
            style={{
              fontSize: 7.5,
              fontWeight: 800,
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              color: "#6D91B3",
              marginBottom: 12,
            }}
          >
            — Choose your plan —
          </div>
          <h1
            style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              fontWeight: 900,
              color: "#1e2228",
              letterSpacing: "-0.02em",
              margin: "0 0 16px",
              textTransform: "uppercase",
              lineHeight: 1.1,
            }}
          >
            Security without compromise
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "#606870",
              maxWidth: 480,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Start free. Upgrade when you need more power. All plans include the full AI security
            engine — no features locked behind paywalls you'll hit on day one.
          </p>
        </div>

        {/* Email pre-fill (optional) */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 40 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.6)",
              border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: 8,
              padding: "8px 14px",
              maxWidth: 340,
              width: "100%",
            }}
          >
            <span
              style={{
                fontSize: 7.5,
                fontWeight: 800,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#808890",
                flexShrink: 0,
              }}
            >
              Email
            </span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="optional — pre-fills checkout"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 11.5,
                color: "#1e2228",
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>

        {/* Plan cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {PLANS.map((plan) => {
            return (
              <div
                key={plan.key}
                style={{
                  borderRadius: 14,
                  background: plan.highlight
                    ? `linear-gradient(145deg, rgba(109,145,179,0.12) 0%, rgba(172,129,175,0.10) 100%)`
                    : "rgba(255,255,255,0.55)",
                  border: plan.highlight
                    ? `1.5px solid ${plan.color}88`
                    : "1px solid rgba(0,0,0,0.09)",
                  padding: "28px 24px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                  boxShadow: plan.highlight
                    ? `0 4px 32px ${plan.color}22`
                    : "0 2px 12px rgba(0,0,0,0.05)",
                  position: "relative",
                }}
              >
                {plan.highlight && (
                  <div
                    style={{
                      position: "absolute",
                      top: -12,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: plan.color,
                      color: "#fff",
                      fontSize: 7,
                      fontWeight: 900,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      padding: "4px 14px",
                      borderRadius: 20,
                    }}
                  >
                    Most popular
                  </div>
                )}

                {/* Color dot */}
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: plan.color,
                    boxShadow: `0 0 8px ${plan.color}`,
                    marginBottom: 14,
                  }}
                />

                {/* Plan name */}
                <div
                  style={{
                    fontSize: 8.5,
                    fontWeight: 900,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: plan.deep,
                    marginBottom: 8,
                  }}
                >
                  {plan.name}
                </div>

                {/* Price */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 4 }}>
                  <span
                    style={{
                      fontSize: 36,
                      fontWeight: 900,
                      color: "#1e2228",
                      lineHeight: 1,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {plan.price}
                  </span>
                  <span
                    style={{ fontSize: 10, color: "#808890", marginBottom: 6, fontWeight: 600 }}
                  >
                    {plan.period}
                  </span>
                </div>

                <div style={{ height: 1, background: "rgba(0,0,0,0.07)", margin: "14px 0" }} />

                {/* Features */}
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: "0 0 24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                        fontSize: 11,
                        color: "#404850",
                        lineHeight: 1.5,
                      }}
                    >
                      <div
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: plan.color,
                          flexShrink: 0,
                          marginTop: 4,
                        }}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleCheckout(plan)}
                  disabled={checkoutLoading === plan.key}
                  style={{
                    marginTop: "auto",
                    padding: "12px 20px",
                    borderRadius: 8,
                    cursor: "pointer",
                    background: plan.highlight
                      ? `linear-gradient(135deg, ${plan.color}33 0%, rgba(172,129,175,0.20) 100%)`
                      : `${plan.color}18`,
                    border: `1.5px solid ${plan.color}66`,
                    fontSize: 8.5,
                    fontWeight: 900,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: plan.deep,
                    transition: "all 0.15s",
                    opacity: checkoutLoading === plan.key ? 0.6 : 1,
                  }}
                >
                  {checkoutLoading === plan.key ? "Redirecting…" : plan.cta}
                  {checkoutLoading !== plan.key && (
                    <span style={{ marginLeft: 6, opacity: 0.7 }}>→</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div
          style={{
            textAlign: "center",
            marginTop: 48,
            fontSize: 10,
            color: "#909aaa",
            lineHeight: 1.7,
          }}
        >
          All plans are billed in USD. Cancel any time — no lock-in.
          <br />
          Payments are processed securely by Stripe. We never store card details.
        </div>
      </div>
    </div>
  );
}
