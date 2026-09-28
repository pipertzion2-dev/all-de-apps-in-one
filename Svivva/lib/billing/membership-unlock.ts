import { getPublicMembershipAccessCode } from "@/lib/auth/membership-access";

/** Cash App plan activation — separate from Orbit / urrthang (owner tools). */
export function getMembershipUnlockInfo(): {
  instructions: string;
  code: string;
} {
  const code = getPublicMembershipAccessCode();
  return {
    instructions:
      "Set up monthly recurring in Cash App (Repeat → Monthly), then enter this access code to activate Starter or Pro for 30 days. Re-enter after each renewal if needed.",
    code,
  };
}
