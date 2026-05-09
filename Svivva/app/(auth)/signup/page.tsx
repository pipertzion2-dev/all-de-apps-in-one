"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function SignupPage() {
  useEffect(() => {
    window.location.href = "/api/auth/login?redirect=/dashboard";
  }, []);

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
          <h1 className="text-xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-sm text-white/50">Connecting you to Svivva via Replit…</p>
        </div>
        <div className="w-8 h-8 border-2 border-[#5BA8A0] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-white/30">
          Not redirecting?{" "}
          <a href="/api/auth/login?redirect=/dashboard" className="text-[#5BA8A0] hover:underline">
            Click here
          </a>
        </p>
      </div>

      <p className="text-xs text-white/30">
        Already have an account?{" "}
        <Link href="/login" className="text-[#5BA8A0] hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
