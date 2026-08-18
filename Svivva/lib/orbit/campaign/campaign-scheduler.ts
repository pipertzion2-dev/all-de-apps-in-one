import type { OrbitCampaign } from "@/lib/orbit/schema";

export class CampaignWindowError extends Error {
  code = "campaign_outside_window";
  constructor(message: string) {
    super(message);
  }
}

export function isCampaignInWindow(
  campaign: Pick<OrbitCampaign, "startsAt" | "endsAt">,
  now = new Date(),
): boolean {
  if (campaign.startsAt && now < new Date(campaign.startsAt)) return false;
  if (campaign.endsAt && now > new Date(campaign.endsAt)) return false;
  return true;
}

export function assertCampaignInWindow(
  campaign: Pick<OrbitCampaign, "startsAt" | "endsAt" | "name">,
  now = new Date(),
): void {
  if (!isCampaignInWindow(campaign, now)) {
    throw new CampaignWindowError(
      `Campaign "${campaign.name}" is outside its scheduled window`,
    );
  }
}

export function deriveCampaignSchedule(input: {
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
  durationDays?: number;
}): { startsAt?: Date; endsAt?: Date } {
  const startsAt = input.startsAt ? new Date(input.startsAt) : undefined;
  let endsAt = input.endsAt ? new Date(input.endsAt) : undefined;
  if (startsAt && !endsAt && input.durationDays) {
    endsAt = new Date(startsAt.getTime() + input.durationDays * 24 * 60 * 60 * 1000);
  }
  return { startsAt, endsAt };
}
