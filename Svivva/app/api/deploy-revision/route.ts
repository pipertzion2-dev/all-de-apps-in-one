import { NextResponse } from "next/server";

/** Public deploy fingerprint — used by CI to confirm production matches this commit. */
export async function GET() {
  return NextResponse.json(
    {
      sha: process.env.VERCEL_GIT_COMMIT_SHA?.trim() || null,
      ref: process.env.VERCEL_GIT_COMMIT_REF?.trim() || null,
      builtAt: process.env.VERCEL_GIT_COMMIT_SHA ? new Date().toISOString() : null,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
