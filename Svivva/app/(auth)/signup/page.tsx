"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [redirectTo, setRedirectTo] = useState("/dashboard");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("redirect");
    if (r && r.startsWith("/")) setRedirectTo(r);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Account creation failed.");
        return;
      }

      window.location.href = `${redirectTo}${data.token ? `?session_token=${data.token}` : ""}`;
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f14] flex flex-col items-center justify-center gap-6 p-4">
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-8 h-8 rounded-lg"
          style={{ background: "linear-gradient(135deg, #5BA8A0, #6B2C4A)" }}
        />
        <span className="font-bold text-xl text-white tracking-tight">Svivva</span>
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col gap-5">
        <div className="text-center">
          <h1 className="text-xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-sm text-white/50">Join Svivva today</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/50 uppercase tracking-wider">Name</label>
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#5BA8A0]/60 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/50 uppercase tracking-wider">Email</label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#5BA8A0]/60 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/50 uppercase tracking-wider">
              Password <span className="normal-case text-white/25">(min. 8 characters)</span>
            </label>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#5BA8A0]/60 transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center rounded-lg border border-red-500/20 bg-red-950/20 px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 mt-1"
            style={{ background: "linear-gradient(135deg, #5BA8A0, #6B2C4A)" }}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
      </div>

      <p className="text-xs text-white/30">
        Already have an account?{" "}
        <Link href="/login" className="text-[#5BA8A0] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
