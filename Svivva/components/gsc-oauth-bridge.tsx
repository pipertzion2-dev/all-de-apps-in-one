"use client";

type Props = {
  googleUrl: string;
  label?: string;
};

/** Tap-to-continue bridge — required on iOS Safari (auto-redirects can trigger file downloads). */
export function GscOAuthBridge({ googleUrl, label = "Continue to Google sign-in" }: Props) {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#0b1220] text-[#e5e7eb] px-6 text-center">
      <p className="text-lg font-semibold mb-2">Connect Google Search Console</p>
      <p className="text-sm text-[#94a3b8] mb-8 max-w-sm">
        Tap the button below to open Google sign-in in your browser.
      </p>
      <a
        href={googleUrl}
        className="inline-block rounded-lg px-6 py-3 text-base font-bold text-white no-underline"
        style={{ background: "linear-gradient(135deg,#5B8DA8,#6B2C4E)" }}
      >
        {label}
      </a>
      <p className="text-xs text-[#64748b] mt-8 max-w-xs">
        If nothing happens, long-press the button and choose Open in Safari.
      </p>
    </div>
  );
}
