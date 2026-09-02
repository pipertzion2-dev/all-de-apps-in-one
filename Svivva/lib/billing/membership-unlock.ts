import { getPublicMembershipAccessCode } from "@/lib/auth/membership-access";

/** Cash App plan activation — separate from Orbit / urrthang (owner tools). */
export function getMembershipUnlockInfo(): {
  instructions: string;
  code: string;
} {
  const code = getPublicMembershipAccessCode();
  return {
    instructions:
      "After you pay on Cash App, enter this access code on the Billing page to activate your Starter or Pro plan.",
    code,
  };
}
