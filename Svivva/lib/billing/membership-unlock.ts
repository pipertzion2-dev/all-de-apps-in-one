import { getPublicMembershipAccessCode } from "@/lib/auth/membership-access";

/** Shown via /api/billing/plans — not hardcoded in client source. */
export function getMembershipUnlockInfo(): {
  instructions: string;
  code: string;
} {
  const code = getPublicMembershipAccessCode();
  return {
    instructions:
      "After you pay on Cash App, enter this access code to run urrthang only — not Orbit admin.",
    code,
  };
}
