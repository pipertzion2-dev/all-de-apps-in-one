"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    const det = params.get("detail");
    if (err) {
      setError(err);
      setDetail(det);
    } else {
      const redirect = params.get("redirect") || "/dashboard";
      window.location.href = `/api/auth/login?redirect=${encodeURIComponent(redirect)}`;
    }
  }, []);

  const handleRetry = () => {
    window.location.href = "/api/auth/login?redirect=/dashboard";
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0f14] flex flex-col items-center justify-center gap-6 p-4">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-8 h-8 rounded-lg"
            style={{ background: "linear-gradient(135deg, #5BA8A0, #6B2C4A)" }}
          />
          <span className="font-bold text-xl text-white tracking-tight">Svivva</span>
        </div>

        <div className="w-full max-w-sm rounded-2xl border border-red-500/30 bg-red-950/20 p-8 flex flex-col items-center gap-5 text-center">
          <div>
            <div className="text-2xl mb-2">⚠️</div>
            <h1 className="text-lg font-bold text-white mb-1">Sign-in failed</h1>
            <p className="text-sm text-white/50 mb-1">
              Your identity provider could not finish sign-in.
            </p>
            {detail && <p className="text-xs text-red-400 mt-2 break-words">{detail}</p>}
          </div>

          <button
            onClick={handleRetry}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #5BA8A0, #6B2C4A)" }}
          >
            Try again
          </button>

          <Link href="/" className="text-xs text-white/30 hover:text-white/60 transition-colors">
            Back to homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f14] flex flex-col items-center justify-center gap-6 p-4">
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-8 h-8 rounded-lg"
          style={{ background: "linear-gradient(135deg, #5BA8A0, #6B2C4A)" }}
        />
        <span className="font-bold text-xl text-white tracking-tight">Svivva</span>
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col items-center gap-5 text-center">
        <div>
          <h1 className="text-xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-sm text-white/50">Signing you in…</p>
        </div>
        <div className="w-8 h-8 border-2 border-[#5BA8A0] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-white/30">
          Not redirecting?{" "}
          <a href="/api/auth/login" className="text-[#5BA8A0] hover:underline">
            Click here
          </a>
        </p>
      </div>

      <p className="text-xs text-white/30">
        New to Svivva?{" "}
        <Link href="/signup" className="text-[#5BA8A0] hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
