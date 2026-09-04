import { formatCents } from "./splits";
import type { PaymentMethod, PaymentProfile, ShowAttendee, ShowEvent } from "./types";
import {
  buildPaymentLink,
  PAYMENT_METHOD_LABEL,
  zellePayInstructions,
} from "./payments";
import type { SettlementTransfer } from "./types";

export type GuestInvitePayload = {
  v: 1;
  eventId: string;
  guestId: string;
  title: string;
  venue?: string;
  eventDate: string;
  notes?: string;
  guestName: string;
  fairShareCents: number;
  paidCents: number;
  owesCents: number;
  payToName: string;
  payToHandle: string;
  payMethod: PaymentMethod;
  transferAmountCents: number;
};

export function encodeInvitePayload(payload: GuestInvitePayload): string {
  const json = JSON.stringify(payload);
  if (typeof btoa !== "undefined") {
    return btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  return Buffer.from(json, "utf8").toString("base64url");
}

export function decodeInvitePayload(encoded: string): GuestInvitePayload | null {
  try {
    let b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const json =
      typeof atob !== "undefined"
        ? atob(b64)
        : Buffer.from(b64, "base64").toString("utf8");
    const parsed = JSON.parse(json) as GuestInvitePayload;
    if (parsed.v !== 1 || !parsed.eventId || !parsed.guestId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildGuestInvitePayload(input: {
  event: ShowEvent;
  guest: ShowAttendee;
  transfer: SettlementTransfer | null;
  recipientProfile: PaymentProfile;
  fairShareCents: number;
}): GuestInvitePayload {
  const owes = Math.max(0, input.fairShareCents - input.guest.paidCents);
  return {
    v: 1,
    eventId: input.event.id,
    guestId: input.guest.id,
    title: input.event.title,
    venue: input.event.venue,
    eventDate: input.event.eventDate,
    notes: input.event.notes,
    guestName: input.guest.name,
    fairShareCents: input.fairShareCents,
    paidCents: input.guest.paidCents,
    owesCents: input.transfer?.amountCents ?? owes,
    payToName: input.transfer?.toName ?? input.recipientProfile.handle,
    payToHandle: input.recipientProfile.handle,
    payMethod: input.recipientProfile.method,
    transferAmountCents: input.transfer?.amountCents ?? owes,
  };
}

export function invitePageUrl(payload: GuestInvitePayload, origin = "https://zzaizzai.com"): string {
  return `${origin}/dashboard/zzai-show/invite?d=${encodeInvitePayload(payload)}`;
}

export function buildGuestEventMessage(payload: GuestInvitePayload, origin?: string): string {
  const lines = [
    `You're on the list for ${payload.title}`,
    payload.eventDate ? `Date: ${payload.eventDate}` : "",
    payload.venue ? `Venue: ${payload.venue}` : "",
    `Your share: ${formatCents(payload.fairShareCents)}`,
    payload.transferAmountCents > 0
      ? `Please send ${formatCents(payload.transferAmountCents)} to ${payload.payToName} (${PAYMENT_METHOD_LABEL[payload.payMethod]}: ${payload.payToHandle})`
      : "You're even — no payment needed.",
    payload.notes ? `Notes: ${payload.notes}` : "",
    invitePageUrl(payload, origin),
  ].filter(Boolean);
  return lines.join("\n");
}

export { PAYMENT_METHOD_LABEL };

export function mailtoGuestLink(payload: GuestInvitePayload, email: string): string {
  const subject = encodeURIComponent(`${payload.title} — your share & payment`);
  const body = encodeURIComponent(buildGuestEventMessage(payload));
  return `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
}

export function smsGuestLink(payload: GuestInvitePayload, phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const body = encodeURIComponent(buildGuestEventMessage(payload));
  return `sms:${digits}?body=${body}`;
}

export function paymentLinkForInvite(payload: GuestInvitePayload): string | null {
  if (payload.transferAmountCents <= 0) return null;
  return buildPaymentLink({
    profile: { method: payload.payMethod, handle: payload.payToHandle },
    amountCents: payload.transferAmountCents,
    note: payload.title,
  });
}

export function zelleInstructionsForInvite(payload: GuestInvitePayload): string | null {
  if (payload.payMethod !== "zelle" || payload.transferAmountCents <= 0) return null;
  return zellePayInstructions({
    profile: { method: "zelle", handle: payload.payToHandle },
    amountCents: payload.transferAmountCents,
    note: payload.title,
  });
}

export async function shareGuestInvite(payload: GuestInvitePayload): Promise<boolean> {
  const text = buildGuestEventMessage(payload);
  const url = invitePageUrl(payload, typeof window !== "undefined" ? window.location.origin : undefined);
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: payload.title, text, url });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
