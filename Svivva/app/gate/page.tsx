"use client";

import { useState } from "react";
import Image from "next/image";
import { Delete } from "lucide-react";
import svivvaLogo from "@/attached_assets/SVIVVA_OFFICIAL_LOGO_1769201341308.png";

export default function GatePage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const maxLength = 5;

  const handlePress = (digit: string) => {
    if (code.length < maxLength) {
      setCode((prev) => prev + digit);
      setError("");
    }
  };

  const handleDelete = () => {
    setCode((prev) => prev.slice(0, -1));
    setError("");
  };

  const handleSubmit = async () => {
    if (!code) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/gate/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: code }),
      });

      if (res.ok) {
        window.location.href = "/";
      } else {
        setError("Incorrect code");
        setCode("");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-xs text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <Image src={svivvaLogo} alt="Svivva" fill sizes="80px" className="object-contain" />
        </div>

        <h1 className="text-xl font-semibold text-gray-900 mb-1" data-testid="text-gate-title">
          Enter Passcode
        </h1>
        <p className="text-gray-400 mb-6 text-xs">Enter your access code to continue</p>

        <div className="flex justify-center gap-2 mb-2 h-10" data-testid="display-code">
          {Array.from({ length: maxLength }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all ${
                i < code.length ? "bg-[#5BA8A0] scale-110" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {error && (
          <p data-testid="text-gate-error" className="text-red-500 text-xs mb-2">
            {error}
          </p>
        )}
        {!error && <div className="h-5 mb-2" />}

        <div className="grid grid-cols-3 gap-3 mb-4">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button
              key={d}
              onClick={() => handlePress(d)}
              className="h-16 rounded-xl bg-gray-100 text-gray-900 text-2xl font-medium transition-all active:scale-95 active:bg-gray-200"
              data-testid={`button-key-${d}`}
            >
              {d}
            </button>
          ))}
          <button
            onClick={handleDelete}
            className="h-16 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center transition-all active:scale-95 active:bg-gray-200"
            data-testid="button-key-delete"
          >
            <Delete className="w-6 h-6" />
          </button>
          <button
            onClick={() => handlePress("0")}
            className="h-16 rounded-xl bg-gray-100 text-gray-900 text-2xl font-medium transition-all active:scale-95 active:bg-gray-200"
            data-testid="button-key-0"
          >
            0
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !code}
            className="h-16 rounded-xl bg-[#5BA8A0] text-white text-sm font-semibold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-40"
            data-testid="button-gate-submit"
          >
            {loading ? "..." : "Go"}
          </button>
        </div>
      </div>
    </div>
  );
}
